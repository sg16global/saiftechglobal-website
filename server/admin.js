// Company Admin Panel API — an OBSERVER window into the AI-operated company.
// Nothing here gates the AI: no approvals, no price setting. Owners can watch everything, pause new
// orders in an emergency, switch payments on/off, tune AI models, curate knowledge and manage staff.
import { HttpError, clientIp, json, now, oneOf, readJson, str } from "./http.js";
import { id } from "./crypto.js";
import { requirePerm, requireStaff } from "./access.js";
import { audit } from "./audit.js";
import { DEFAULTS, SETTING_KEYS, getSetting, putSetting } from "./settings.js";
import { modelHealth } from "./ai.js";
import { paymentsConfigured } from "./dodo.js";
import { refundEngagement, startBuild } from "./payments.js";

function admin(perm, fn) {
  return async (ctx) => {
    const staff = await requireStaff(ctx.env, ctx.request);
    requirePerm(staff, perm);
    return fn({ ...ctx, staff, ip: clientIp(ctx.request) });
  };
}
const q = (env, sql, ...args) => env.DB.prepare(sql).bind(...args);

const whoami = admin("read", async ({ staff }) => json({ email: staff.email, role: staff.role }));

const overview = admin("read", async ({ env }) => {
  const one = async (sql, ...a) => (await q(env, sql, ...a).first()) || {};
  const since = now() - 86400;
  const { results: stages } = await env.DB.prepare("SELECT stage, COUNT(*) AS n FROM engagements GROUP BY stage").all();
  const policy = await getSetting(env, "company_policy");
  const ai = await getSetting(env, "ai_config");
  return json({
    stages: Object.fromEntries((stages || []).map((r) => [r.stage, r.n])),
    revenue_cents: (await one("SELECT COALESCE(SUM(amount_cents),0) AS s FROM payments WHERE status = 'succeeded'")).s,
    refunded_cents: (await one("SELECT COALESCE(SUM(amount_cents),0) AS s FROM payments WHERE status IN ('refund_pending','refunded')")).s,
    builds_passed: (await one("SELECT COUNT(*) AS n FROM builds WHERE status = 'passed'")).n,
    builds_failed: (await one("SELECT COUNT(*) AS n FROM builds WHERE status = 'failed'")).n,
    members: (await one("SELECT COUNT(*) AS n FROM members")).n,
    open_tickets: (await one("SELECT COUNT(*) AS n FROM tickets WHERE status IN ('open','escalated')")).n,
    ai_calls_24h: (await one("SELECT COUNT(*) AS n FROM ai_usage WHERE created_at > ?", since)).n,
    ai_failures_24h: (await one("SELECT COUNT(*) AS n FROM ai_usage WHERE created_at > ? AND ok = 0", since)).n,
    accepting_orders: !!policy.accepting_orders,
    payments_enabled: !!policy.payments_enabled,
    payments_configured: paymentsConfigured(env),
    email_configured: !!env.RESEND_API_KEY,
    runner_configured: !!(env.RUNNER || env.RUNNER_URL),
    min_order_cents: policy.min_order_cents,
    build_retries: policy.build_retries,
    ai_layers: {
      gemma_chat: ai.gemma_chat_models,
      gemma_design: ai.gemma_design_models,
      mistral: ai.mistral_models,
      rescue_from_attempt: ai.rescue_from_attempt,
      rescue: ai.rescue_models,
    },
  });
});

const getSettings = admin("read", async ({ env }) => {
  const out = {};
  for (const k of SETTING_KEYS) out[k] = await getSetting(env, k);
  return json({ settings: out, defaults: DEFAULTS });
});

const putSettings = admin("read", async ({ env, request, params, staff, ip }) => {
  const key = oneOf(params.key, "Setting", SETTING_KEYS);
  requirePerm(staff, key === "ai_config" ? "ai" : "policy");
  const body = await readJson(request, 60_000);
  return json({ value: await putSetting(env, key, body.value, staff.email, ip) });
});

// ---------------------------------------------------------------- engagements (watch the AI work)
const listEngagements = admin("read", async ({ env, url }) => {
  const stage = url.searchParams.get("stage");
  const sql = `SELECT e.id, e.title, e.stage, e.price_cents, e.currency, e.build_attempts, e.build_state, e.updated_at, c.email AS customer_email
               FROM engagements e LEFT JOIN customers c ON c.id = e.customer_id ${stage ? "WHERE e.stage = ?" : ""} ORDER BY e.updated_at DESC LIMIT 300`;
  const { results } = await (stage ? q(env, sql, stage) : env.DB.prepare(sql)).all();
  return json({ engagements: results || [] });
});

const getEngagement = admin("read", async ({ env, params }) => {
  const e = await q(env, "SELECT e.*, c.email AS customer_email FROM engagements e LEFT JOIN customers c ON c.id = e.customer_id WHERE e.id = ?", params.id).first();
  if (!e) throw new HttpError(404, "Not found.");
  const [msgs, builds, payments] = await Promise.all([
    q(env, "SELECT role, kind, content, model, created_at FROM engagement_messages WHERE engagement_id = ? ORDER BY created_at, rowid", e.id).all(),
    q(env, "SELECT id, attempt, status, exit_code, test_output, model, started_at, finished_at FROM builds WHERE engagement_id = ? ORDER BY attempt", e.id).all(),
    q(env, "SELECT * FROM payments WHERE engagement_id = ? ORDER BY created_at", e.id).all(),
  ]);
  delete e.access_hash;
  return json({ engagement: e, messages: msgs.results || [], builds: builds.results || [], payments: payments.results || [] });
});

const buildFiles = admin("read", async ({ env, params }) => {
  const { results } = await q(env, "SELECT path, content FROM build_files WHERE build_id = ? ORDER BY path", params.id).all();
  return json({ files: results || [] });
});

const nudgeBuild = admin("payments", async ({ env, params, staff, ip }) => {
  const e = await q(env, "SELECT id, stage FROM engagements WHERE id = ?", params.id).first();
  if (!e || e.stage !== "building") throw new HttpError(409, "Only projects that are building can be nudged.");
  const ok = await startBuild(env, e.id);
  await audit(env, { actor: staff.email, action: "build.nudge", target: e.id, ip });
  return json({ ok });
});

const emergencyRefund = admin("payments", async ({ env, request, params, staff, ip }) => {
  const body = await readJson(request);
  const reason = str(body.reason, "Reason", { max: 500 });
  const e = await q(env, "SELECT id, stage FROM engagements WHERE id = ?", params.id).first();
  if (!e) throw new HttpError(404, "Not found.");
  const r = await refundEngagement(env, e.id, reason);
  if (r.ok) await q(env, "UPDATE engagements SET stage = 'refunded', updated_at = ? WHERE id = ?", now(), e.id).run();
  await audit(env, { actor: staff.email, action: "refund.manual", target: e.id, detail: { reason, r }, ip });
  return json(r);
});

// ---------------------------------------------------------------- tickets
const listTickets = admin("read", async ({ env, url }) => {
  const status = url.searchParams.get("status");
  const sql = `SELECT t.id, t.platform, t.platform_verified, t.member, t.subject, t.status, t.priority, t.updated_at, c.email AS customer_email
               FROM tickets t JOIN customers c ON c.id = t.customer_id ${status ? "WHERE t.status = ?" : ""}
               ORDER BY t.member DESC, CASE t.priority WHEN 'urgent' THEN 0 WHEN 'high' THEN 1 WHEN 'normal' THEN 2 ELSE 3 END, t.updated_at DESC LIMIT 300`;
  const { results } = await (status ? q(env, sql, status) : env.DB.prepare(sql)).all();
  return json({ tickets: results || [] });
});

const getTicket = admin("read", async ({ env, params }) => {
  const tk = await q(env, "SELECT t.*, c.email AS customer_email FROM tickets t JOIN customers c ON c.id = t.customer_id WHERE t.id = ?", params.id).first();
  if (!tk) throw new HttpError(404, "Ticket not found.");
  const { results } = await q(env, "SELECT author_type, author, content, internal, created_at FROM ticket_messages WHERE ticket_id = ? ORDER BY created_at, rowid", tk.id).all();
  return json({ ticket: tk, messages: results || [] });
});

const replyTicket = admin("tickets", async ({ env, request, params, staff }) => {
  const body = await readJson(request);
  const content = str(body.message, "Message", { max: 5000 });
  const tk = await q(env, "SELECT id FROM tickets WHERE id = ?", params.id).first();
  if (!tk) throw new HttpError(404, "Ticket not found.");
  const t = now();
  await env.DB.batch([
    q(env, "INSERT INTO ticket_messages (id, ticket_id, author_type, author, content, internal, created_at) VALUES (?, ?, 'staff', ?, ?, ?, ?)", id("tkm"), tk.id, staff.email, content, body.internal ? 1 : 0, t),
    q(env, "UPDATE tickets SET updated_at = ? WHERE id = ?", t, tk.id),
  ]);
  return json({ ok: true });
});

const updateTicket = admin("tickets", async ({ env, request, params, staff, ip }) => {
  const body = await readJson(request);
  const status = body.status ? oneOf(body.status, "Status", ["open", "answered", "escalated", "resolved", "closed"]) : null;
  const priority = body.priority ? oneOf(body.priority, "Priority", ["low", "normal", "high", "urgent"]) : null;
  await q(env, "UPDATE tickets SET status = COALESCE(?, status), priority = COALESCE(?, priority), updated_at = ? WHERE id = ?", status, priority, now(), params.id).run();
  await audit(env, { actor: staff.email, action: "ticket.update", target: params.id, detail: { status, priority }, ip });
  return json({ ok: true });
});

// ---------------------------------------------------------------- knowledge base, AI, audit, staff
const listKb = admin("read", async ({ env }) => {
  const { results } = await env.DB.prepare("SELECT id, scope, title, body, verified, updated_at, updated_by FROM kb_docs ORDER BY scope, title").all();
  return json({ docs: results || [] });
});

const saveKb = admin("kb", async ({ env, request, params, staff, ip }) => {
  const body = await readJson(request, 60_000);
  const docId = params.id || id("kb");
  await q(env, `INSERT INTO kb_docs (id, scope, title, body, verified, updated_at, updated_by) VALUES (?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(id) DO UPDATE SET scope = excluded.scope, title = excluded.title, body = excluded.body, verified = excluded.verified, updated_at = excluded.updated_at, updated_by = excluded.updated_by`,
    docId, str(body.scope, "Scope", { max: 40 }), str(body.title, "Title", { max: 200 }), str(body.body, "Body", { max: 40000 }), body.verified ? 1 : 0, now(), staff.email).run();
  await audit(env, { actor: staff.email, action: "kb.save", target: docId, ip });
  return json({ ok: true, id: docId });
});

const deleteKb = admin("kb", async ({ env, params, staff, ip }) => {
  await q(env, "DELETE FROM kb_docs WHERE id = ?", params.id).run();
  await audit(env, { actor: staff.email, action: "kb.delete", target: params.id, ip });
  return json({ ok: true });
});

const aiUsage = admin("read", async ({ env }) => {
  const since = now() - 7 * 86400;
  const { results } = await q(env, `SELECT model, task, COUNT(*) AS calls, SUM(ok) AS ok, AVG(latency_ms) AS avg_latency_ms, SUM(input_chars) AS input_chars, SUM(output_chars) AS output_chars
    FROM ai_usage WHERE created_at > ? GROUP BY model, task ORDER BY calls DESC`, since).all();
  const { results: errors } = await q(env, "SELECT model, task, error, created_at FROM ai_usage WHERE ok = 0 AND created_at > ? ORDER BY id DESC LIMIT 20", since).all();
  return json({ usage: results || [], recent_errors: errors || [] });
});

const aiHealth = admin("ai", async ({ env }) => json({ models: await modelHealth(env) }));

const auditLog = admin("read", async ({ env }) => {
  const { results } = await env.DB.prepare("SELECT actor, action, target, detail, ip, created_at FROM audit_log ORDER BY id DESC LIMIT 300").all();
  return json({ entries: results || [] });
});

const listStaff = admin("staff", async ({ env }) => {
  const { results } = await env.DB.prepare("SELECT email, role, created_at, created_by FROM admin_users ORDER BY email").all();
  return json({ staff: results || [], owners_from_config: String(env.OWNER_EMAILS || "").split(",").map((s) => s.trim()).filter(Boolean) });
});

const saveStaff = admin("staff", async ({ env, request, staff, ip }) => {
  const body = await readJson(request);
  const email = str(body.email, "Email", { max: 254 }).toLowerCase();
  const role = oneOf(body.role, "Role", ["admin", "support", "viewer"]);
  await q(env, "INSERT INTO admin_users (email, role, created_at, created_by) VALUES (?, ?, ?, ?) ON CONFLICT(email) DO UPDATE SET role = excluded.role", email, role, now(), staff.email).run();
  await audit(env, { actor: staff.email, action: "staff.save", target: email, detail: { role }, ip });
  return json({ ok: true });
});

const removeStaff = admin("staff", async ({ env, params, staff, ip }) => {
  await q(env, "DELETE FROM admin_users WHERE email = ?", params.email.toLowerCase()).run();
  await audit(env, { actor: staff.email, action: "staff.remove", target: params.email, ip });
  return json({ ok: true });
});

export const adminRoutes = [
  ["GET", "/me", whoami],
  ["GET", "/overview", overview],
  ["GET", "/settings", getSettings],
  ["PUT", "/settings/:key", putSettings],
  ["GET", "/engagements", listEngagements],
  ["GET", "/engagements/:id", getEngagement],
  ["POST", "/engagements/:id/nudge", nudgeBuild],
  ["POST", "/engagements/:id/refund", emergencyRefund],
  ["GET", "/builds/:id/files", buildFiles],
  ["GET", "/tickets", listTickets],
  ["GET", "/tickets/:id", getTicket],
  ["POST", "/tickets/:id/messages", replyTicket],
  ["POST", "/tickets/:id", updateTicket],
  ["GET", "/kb", listKb],
  ["POST", "/kb", saveKb],
  ["PUT", "/kb/:id", saveKb],
  ["DELETE", "/kb/:id", deleteKb],
  ["GET", "/ai/usage", aiUsage],
  ["POST", "/ai/health", aiHealth],
  ["GET", "/audit", auditLog],
  ["GET", "/staff", listStaff],
  ["POST", "/staff", saveStaff],
  ["DELETE", "/staff/:email", removeStaff],
];
