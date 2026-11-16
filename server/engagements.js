// Working Mode — the AI-operated company's client journey.
// discovery (chat) → brief (client confirms) → design (client approves / revises) → quoted (AI price ≥ $10)
// → awaiting_payment → building (runner: tests first, build, retry ×3) → delivered (+ STG-M token) | refunded
import { HttpError, clientIp, json, now, readJson, requireDb, str } from "./http.js";
import { b64url, humanId, id, randomBytes, sha256Hex } from "./crypto.js";
import { rateLimit } from "./ratelimit.js";
import { getCustomer, requireCustomer } from "./session.js";
import { AIUnavailable, runAI, runAIJson } from "./ai.js";
import { retrieve, formatDocs } from "./kb.js";
import { getSetting } from "./settings.js";
import { BRIEF_PROMPT, MOCKUP_PROMPT, OUTLINE_PROMPT, PRICING_PROMPT, REPRESENTATIVE_PROMPT } from "./prompts.js";
import { startCheckout } from "./payments.js";
import { zipFiles } from "./zip.js";

const GREETING =
  "Welcome to Saif Tech Global LLC — I'm the company's AI, and I run Working Mode around the clock. Tell me about your idea or the problem you want solved, and we'll shape it into a project together.";

// ---------------------------------------------------------------- access
async function access(env, request, engagementId, { owner = false } = {}) {
  const e = await requireDb(env).prepare("SELECT * FROM engagements WHERE id = ?").bind(engagementId).first();
  if (!e) throw new HttpError(404, "Project not found.");
  const customer = await getCustomer(env, request);
  const key = request.headers.get("x-engagement-key");
  const keyOk = !!key && (await sha256Hex(key)) === e.access_hash;
  const ownerOk = !!customer && e.customer_id === customer.id;
  if (owner ? !ownerOk : !(keyOk || ownerOk)) {
    if (owner && keyOk) throw new HttpError(401, "Please sign in with your email to continue.");
    throw new HttpError(404, "Project not found.");
  }
  return { e, customer };
}

async function addMessage(env, engagementId, role, content, kind = "chat", model = null) {
  await env.DB.prepare("INSERT INTO engagement_messages (id, engagement_id, role, kind, content, model, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)")
    .bind(id("emg"), engagementId, role, kind, content, model, now())
    .run();
}

async function setEngagement(env, engagementId, fields) {
  const keys = Object.keys(fields);
  await env.DB.prepare(`UPDATE engagements SET ${keys.map((k) => `${k} = ?`).join(", ")}, updated_at = ? WHERE id = ?`)
    .bind(...keys.map((k) => fields[k]), now(), engagementId)
    .run();
}

async function history(env, engagementId) {
  const { results } = await env.DB.prepare("SELECT role, kind, content, created_at FROM engagement_messages WHERE engagement_id = ? ORDER BY created_at, rowid")
    .bind(engagementId)
    .all();
  return results || [];
}

export function briefMarkdown(b) {
  const lines = [`# ${b.title}`, "", b.summary, "", `**Problem:** ${b.problem}`, `**For:** ${b.users}`, `**Delivery:** ${b.deliverable_type.replace("_", " ")} · ${b.technology}`, "", "## Must-have features"];
  for (const f of b.features) lines.push(`- **${f.name}** — ${f.description}`);
  if (b.out_of_scope.length) {
    lines.push("", "## Not in this order (later phases)");
    for (const o of b.out_of_scope) lines.push(`- ${o}`);
  }
  return lines.join("\n");
}

function normalizeBrief(raw) {
  const r = raw && typeof raw === "object" ? raw : {};
  const s = (v, n = 600) => (typeof v === "string" ? v.trim().slice(0, n) : "");
  const types = ["website", "web_app", "api", "script", "library", "tool"];
  return {
    title: s(r.title, 120) || "Client project",
    summary: s(r.summary, 800),
    problem: s(r.problem, 600),
    users: s(r.users, 300),
    deliverable_type: types.includes(r.deliverable_type) ? r.deliverable_type : "tool",
    has_ui: !!r.has_ui,
    features: (Array.isArray(r.features) ? r.features : [])
      .slice(0, 10)
      .map((f) => ({ name: s(f && f.name, 120), description: s(f && f.description, 400), acceptance: s(f && f.acceptance, 400) }))
      .filter((f) => f.name),
    out_of_scope: (Array.isArray(r.out_of_scope) ? r.out_of_scope : []).map((x) => s(x, 200)).filter(Boolean).slice(0, 12),
    technology: s(r.technology, 120) || "JavaScript",
    buildable: r.buildable !== false,
    buildable_note: s(r.buildable_note, 600),
    size: ["tiny", "small", "medium", "large"].includes(r.size) ? r.size : "small",
  };
}

// ---------------------------------------------------------------- AI steps
async function representativeReply(env, e) {
  const msgs = (await history(env, e.id)).filter((m) => m.kind === "chat" || m.kind === "brief");
  const docs = await retrieve(env, ["company", "services"], msgs.map((m) => m.content).join(" ").slice(-3000), 6);
  const { text, model } = await runAI(
    env,
    "representative",
    [{ role: "system", content: REPRESENTATIVE_PROMPT + formatDocs(docs, 6000) }, ...msgs.slice(-24).map((m) => ({ role: m.role === "notice" ? "assistant" : m.role, content: m.content.slice(0, 4000) }))],
    { maxTokens: 700, chain: "gemma_chat" },
  );
  const m = text.match(/\n?\s*BRIEF_READY:\s*(yes|no)\s*$/i);
  const reply = (m ? text.slice(0, m.index) : text).trim();
  await addMessage(env, e.id, "assistant", reply, "chat", model);
  return { reply, ready: !!m && m[1].toLowerCase() === "yes" };
}

async function writeBrief(env, e) {
  const transcript = (await history(env, e.id))
    .filter((m) => m.kind === "chat")
    .map((m) => `${m.role === "user" ? "Client" : "Company AI"}: ${m.content}`)
    .join("\n\n")
    .slice(-14000);
  const { data } = await runAIJson(env, "brief", [{ role: "system", content: BRIEF_PROMPT }, { role: "user", content: transcript }], { maxTokens: 1600, chain: "gemma_design" });
  const brief = normalizeBrief(data);
  const md = briefMarkdown(brief);
  await setEngagement(env, e.id, { stage: "brief", title: brief.title, brief_json: JSON.stringify(brief), brief_md: md, buildable: brief.buildable ? 1 : 0 });
  await addMessage(
    env,
    e.id,
    "assistant",
    brief.buildable
      ? "Here is the project brief I prepared. Is this what you had in mind?"
      : `Here is the brief. Honestly, this exact delivery is outside what our automatic build system can build and verify. ${brief.buildable_note || ""} Tell me if you'd like the alternative, and I'll update the brief.`,
    "brief",
  );
  return brief;
}

async function writeDesign(env, e, brief, feedback = null) {
  const version = (e.design_version || 0) + 1;
  const base = `Project brief:\n${JSON.stringify(brief)}`;
  if (brief.has_ui) {
    const messages = [{ role: "system", content: MOCKUP_PROMPT }, { role: "user", content: base }];
    if (feedback && e.design_html) messages.push({ role: "assistant", content: e.design_html.slice(0, 12000) }, { role: "user", content: `Revise the mock-up with this client feedback: ${feedback}` });
    const { text } = await runAI(env, "design", messages, { maxTokens: 3500, temperature: 0.4, long: true, chain: "gemma_design" });
    let html = text.replace(/^```(?:html)?\s*/i, "").replace(/\s*```\s*$/, "");
    const start = html.search(/<!doctype html|<html/i);
    if (start > 0) html = html.slice(start);
    html = html.replace(/<script[\s\S]*?<\/script>/gi, ""); // mock-ups are static
    await setEngagement(env, e.id, { stage: "design", design_kind: "ui_mockup", design_html: html.slice(0, 120_000), design_md: null, design_version: version });
  } else {
    const messages = [{ role: "system", content: OUTLINE_PROMPT }, { role: "user", content: base }];
    if (feedback && e.design_md) messages.push({ role: "assistant", content: e.design_md }, { role: "user", content: `Revise the outline with this client feedback: ${feedback}` });
    const { text } = await runAI(env, "design", messages, { maxTokens: 1200, temperature: 0.3, long: true, chain: "gemma_design" });
    await setEngagement(env, e.id, { stage: "design", design_kind: "solution_outline", design_md: text.slice(0, 20000), design_html: null, design_version: version });
  }
  await addMessage(env, e.id, "assistant", version === 1 ? "Here is the design. Does it match what you want? Approve it, or tell me what to change." : `Design version ${version} is ready.`, "design");
}

async function writePrice(env, e, brief) {
  const policy = await getSetting(env, "company_policy");
  const input = {
    title: brief.title,
    summary: brief.summary,
    deliverable_type: brief.deliverable_type,
    has_ui: brief.has_ui,
    size: brief.size,
    features: brief.features.map((f) => `${f.name}: ${f.description}`),
    design: e.design_kind,
  };
  const { data, model } = await runAIJson(env, "pricing", [{ role: "system", content: PRICING_PROMPT }, { role: "user", content: JSON.stringify(input) }], { maxTokens: 500, chain: "mistral" });
  const usd = Number(data.price_usd);
  if (!Number.isFinite(usd) || usd <= 0) throw new AIUnavailable();
  const cents = Math.max(policy.min_order_cents, Math.round(usd) * 100); // owner rule: $10 floor, no ceiling
  const priceJson = {
    price_usd: cents / 100,
    effort_hours: Number(data.effort_hours) || null,
    value_summary: String(data.value_summary || "").slice(0, 300),
    rationale: String(data.rationale || "").slice(0, 800),
    model,
    floor_applied: cents !== Math.round(usd) * 100,
  };
  await setEngagement(env, e.id, {
    stage: "quoted",
    price_cents: cents,
    currency: policy.currency || "USD",
    price_json: JSON.stringify(priceJson),
    quote_expires_at: now() + (policy.quote_valid_days || 14) * 86400,
  });
  await addMessage(env, e.id, "assistant", `Our price for this project is $${(cents / 100).toLocaleString("en-US")}. ${priceJson.rationale}`, "price", model);
}

// ---------------------------------------------------------------- routes
async function create({ request, env }) {
  const policy = await getSetting(env, "company_policy");
  if (!policy.accepting_orders) throw new HttpError(503, "Working Mode is paused for maintenance. Please come back shortly.");
  await rateLimit(env, "eng-new", clientIp(request), 15, 86400);
  const body = await readJson(request);
  const text = str(body.message, "Message", { max: 4000 });
  const customer = await getCustomer(env, request);
  const key = b64url(randomBytes(24));
  const eid = humanId("STG");
  const t = now();
  await env.DB.prepare("INSERT INTO engagements (id, access_hash, customer_id, stage, created_at, updated_at) VALUES (?, ?, ?, 'discovery', ?, ?)")
    .bind(eid, await sha256Hex(key), customer ? customer.id : null, t, t)
    .run();
  await addMessage(env, eid, "assistant", GREETING, "chat");
  await addMessage(env, eid, "user", text, "chat");
  const e = await env.DB.prepare("SELECT * FROM engagements WHERE id = ?").bind(eid).first();
  try {
    const { reply, ready } = await representativeReply(env, e);
    let brief = null;
    if (ready) brief = await writeBrief(env, e);
    return json({ id: eid, key, reply, stage: brief ? "brief" : "discovery" }, 201);
  } catch (err) {
    if (err instanceof AIUnavailable) return json({ id: eid, key, reply: null, ai_unavailable: true, error: err.message }, 201);
    throw err;
  }
}

async function message({ request, env, params }) {
  await rateLimit(env, "eng-msg", clientIp(request), 80, 3600);
  const { e } = await access(env, request, params.id);
  if (!["discovery", "brief"].includes(e.stage)) throw new HttpError(409, "The brief is already confirmed. Use the design step to request changes.");
  const body = await readJson(request);
  const text = str(body.message, "Message", { max: 4000 });
  await addMessage(env, e.id, "user", text, "chat");
  if (e.stage === "brief") await setEngagement(env, e.id, { stage: "discovery" });
  const { reply, ready } = await representativeReply(env, { ...e, stage: "discovery" });
  let stage = "discovery";
  if (ready) {
    await writeBrief(env, e);
    stage = "brief";
  }
  return json({ reply, stage });
}

async function retryReply({ request, env, params }) {
  const { e } = await access(env, request, params.id);
  const msgs = (await history(env, e.id)).filter((m) => m.kind === "chat");
  if (!msgs.length || msgs[msgs.length - 1].role !== "user") throw new HttpError(409, "There is no unanswered message.");
  const { reply, ready } = await representativeReply(env, e);
  if (ready) await writeBrief(env, e);
  return json({ reply, stage: ready ? "brief" : e.stage });
}

async function confirmBrief({ request, env, params }) {
  await rateLimit(env, "eng-step", clientIp(request), 40, 3600);
  const { e } = await access(env, request, params.id);
  if (e.stage !== "brief") throw new HttpError(409, "There is no brief waiting for confirmation.");
  const brief = JSON.parse(e.brief_json);
  if (!brief.buildable) throw new HttpError(409, "This brief is outside what we can build and verify automatically. Please ask for the alternative in the chat.");
  await addMessage(env, e.id, "user", "Yes — this is what I had in mind.", "brief");
  await writeDesign(env, e, brief);
  return json({ stage: "design" });
}

async function reviseDesign({ request, env, params }) {
  await rateLimit(env, "eng-step", clientIp(request), 40, 3600);
  const { e } = await access(env, request, params.id);
  if (!["design", "quoted"].includes(e.stage)) throw new HttpError(409, "The design can no longer be changed.");
  const policy = await getSetting(env, "company_policy");
  if (e.design_version >= 1 + policy.max_design_revisions) throw new HttpError(409, "Maximum design revisions reached. Approve this design or start a new project.");
  const body = await readJson(request);
  const feedback = str(body.message, "Feedback", { max: 2000 });
  await addMessage(env, e.id, "user", feedback, "design");
  await writeDesign(env, e, JSON.parse(e.brief_json), feedback);
  return json({ stage: "design" });
}

async function approveDesign({ request, env, params }) {
  await rateLimit(env, "eng-step", clientIp(request), 40, 3600);
  const { e } = await access(env, request, params.id);
  if (e.stage !== "design") throw new HttpError(409, "There is no design waiting for approval.");
  await addMessage(env, e.id, "user", "I approve this design.", "design");
  await writePrice(env, e, JSON.parse(e.brief_json));
  return json({ stage: "quoted" });
}

async function reprice({ request, env, params }) {
  const { e } = await access(env, request, params.id);
  if (e.stage !== "quoted" || (e.quote_expires_at && e.quote_expires_at > now())) throw new HttpError(409, "The current price is still valid.");
  await writePrice(env, e, JSON.parse(e.brief_json));
  return json({ stage: "quoted" });
}

async function claim({ request, env, params }) {
  const customer = await requireCustomer(env, request);
  const e = await env.DB.prepare("SELECT id, access_hash, customer_id FROM engagements WHERE id = ?").bind(params.id).first();
  const key = request.headers.get("x-engagement-key");
  if (!e || !key || (await sha256Hex(key)) !== e.access_hash) throw new HttpError(404, "Project not found.");
  if (e.customer_id && e.customer_id !== customer.id) throw new HttpError(409, "This project belongs to another account.");
  await setEngagement(env, e.id, { customer_id: customer.id });
  return json({ ok: true });
}

async function accept({ request, env, params }) {
  const customer = await requireCustomer(env, request);
  const { e } = await access(env, request, params.id);
  if (e.customer_id && e.customer_id !== customer.id) throw new HttpError(404, "Project not found.");
  const body = await readJson(request);
  if (body.agree !== true) throw new HttpError(400, "Please confirm you accept the price and terms.");
  if (e.stage !== "quoted") throw new HttpError(409, "There is no price waiting for acceptance.");
  if (e.quote_expires_at && e.quote_expires_at < now()) throw new HttpError(409, "This price has expired. Ask for a fresh price.");
  const policy = await getSetting(env, "company_policy");
  if (!policy.payments_enabled) throw new HttpError(503, "Online payment is not switched on yet. Please try again later.");
  const pid = id("pay");
  const t = now();
  await env.DB.batch([
    env.DB.prepare("UPDATE engagements SET customer_id = ?, stage = 'awaiting_payment', updated_at = ? WHERE id = ?").bind(customer.id, t, e.id),
    env.DB.prepare(
      "INSERT INTO payments (id, engagement_id, customer_id, amount_cents, currency, status, provider, created_at, updated_at) VALUES (?, ?, ?, ?, ?, 'created', 'dodo', ?, ?)",
    ).bind(pid, e.id, customer.id, e.price_cents, e.currency, t, t),
  ]);
  await addMessage(env, e.id, "notice", `Price accepted (terms ${policy.terms_version}). Waiting for secure payment.`, "payment");
  const { checkoutUrl } = await startCheckout(env, request, pid, customer);
  return json({ checkout_url: checkoutUrl });
}

async function pay({ request, env, params }) {
  const customer = await requireCustomer(env, request);
  const { e } = await access(env, request, params.id, { owner: true });
  if (e.stage !== "awaiting_payment") throw new HttpError(409, "No payment is due for this project.");
  const p = await env.DB.prepare("SELECT id FROM payments WHERE engagement_id = ? AND status IN ('created','pending','failed','cancelled') ORDER BY created_at DESC LIMIT 1")
    .bind(e.id)
    .first();
  if (!p) throw new HttpError(409, "No payment is due for this project.");
  const { checkoutUrl } = await startCheckout(env, request, p.id, customer);
  return json({ checkout_url: checkoutUrl });
}

async function state({ request, env, params }) {
  const { e, customer } = await access(env, request, params.id);
  const [msgs, builds, payments] = await Promise.all([
    history(env, e.id),
    env.DB.prepare("SELECT attempt, status, exit_code, started_at, finished_at FROM builds WHERE engagement_id = ? ORDER BY attempt").bind(e.id).all(),
    env.DB.prepare("SELECT id, amount_cents, currency, status, created_at, updated_at FROM payments WHERE engagement_id = ? ORDER BY created_at").bind(e.id).all(),
  ]);
  const member = e.stage === "delivered" && customer ? await env.DB.prepare("SELECT token, issued_at FROM members WHERE customer_id = ?").bind(customer.id).first() : null;
  let files = [];
  if (e.delivered_build_id && customer && customer.id === e.customer_id) {
    const r = await env.DB.prepare("SELECT path, LENGTH(content) AS size FROM build_files WHERE build_id = ? ORDER BY path").bind(e.delivered_build_id).all();
    files = r.results || [];
  }
  const policy = await getSetting(env, "company_policy");
  let price = null;
  try {
    price = e.price_json ? JSON.parse(e.price_json) : null;
  } catch {
    price = null;
  }
  return json({
    engagement: {
      id: e.id,
      title: e.title,
      stage: e.stage,
      signed_in: !!customer,
      owned: !!customer && e.customer_id === customer.id,
      brief_md: e.brief_md,
      buildable: e.buildable === null ? null : !!e.buildable,
      design_kind: e.design_kind,
      design_html: e.design_html,
      design_md: e.design_md,
      design_version: e.design_version,
      price_cents: e.price_cents,
      currency: e.currency,
      price,
      quote_expires_at: e.quote_expires_at,
      build_attempts: e.build_attempts,
      build_state: e.build_state,
      max_attempts: 1 + policy.build_retries,
    },
    messages: msgs,
    builds: builds.results || [],
    payments: payments.results || [],
    delivery: files.length ? { files } : null,
    member,
  });
}

async function mine({ request, env }) {
  const c = await requireCustomer(env, request);
  const { results } = await env.DB.prepare("SELECT id, title, stage, updated_at FROM engagements WHERE customer_id = ? ORDER BY updated_at DESC LIMIT 100").bind(c.id).all();
  const member = await env.DB.prepare("SELECT token, issued_at FROM members WHERE customer_id = ?").bind(c.id).first();
  return json({ engagements: results || [], member });
}

async function download({ request, env, params }) {
  const { e } = await access(env, request, params.id, { owner: true });
  if (e.stage !== "delivered" || !e.delivered_build_id) throw new HttpError(409, "This project has not been delivered yet.");
  const paid = await env.DB.prepare("SELECT 1 AS ok FROM payments WHERE engagement_id = ? AND status = 'succeeded'").bind(e.id).first();
  if (!paid) throw new HttpError(409, "Delivery is released after verified payment.");
  const { results } = await env.DB.prepare("SELECT path, content FROM build_files WHERE build_id = ? ORDER BY path").bind(e.delivered_build_id).all();
  const zip = zipFiles(results.map((f) => ({ path: `${e.id}/${f.path}`, content: f.content })));
  return new Response(zip, {
    headers: {
      "content-type": "application/zip",
      "content-disposition": `attachment; filename="${e.id}.zip"`,
      "cache-control": "no-store",
    },
  });
}

export const engagementRoutes = [
  ["GET", "/engagements", mine],
  ["POST", "/engagements", create],
  ["GET", "/engagements/:id", state],
  ["POST", "/engagements/:id/messages", message],
  ["POST", "/engagements/:id/reply", retryReply],
  ["POST", "/engagements/:id/brief/confirm", confirmBrief],
  ["POST", "/engagements/:id/design/revise", reviseDesign],
  ["POST", "/engagements/:id/design/approve", approveDesign],
  ["POST", "/engagements/:id/reprice", reprice],
  ["POST", "/engagements/:id/claim", claim],
  ["POST", "/engagements/:id/accept", accept],
  ["POST", "/engagements/:id/pay", pay],
  ["GET", "/engagements/:id/download", download],
];
