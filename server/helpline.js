// Centralized 24/7 AI Helpline — one support desk for every Saif Tech Global platform.
import { HttpError, clientIp, json, now, oneOf, readJson, str } from "./http.js";
import { humanId, id } from "./crypto.js";
import { rateLimit } from "./ratelimit.js";
import { getCustomer, requireCustomer } from "./session.js";
import { AIUnavailable, runAI } from "./ai.js";
import { retrieve, formatDocs } from "./kb.js";
import { HELPLINE_PLATFORMS, platformFromHint, verifyPlatformContext } from "./platforms.js";

const TICKET_PROMPT = (platformName) => `You are the 24/7 support AI of SAIF TECH GLOBAL LLC, an AI-operated company, answering a support ticket about: ${platformName}.
Answer as the company ("we"). Use only the verified documentation and project context provided. Give clear, complete, step-by-step help.
Never claim you changed, fixed, refunded or accessed an account or system — you can only advise. Never ask for passwords or card numbers.
If something truly needs an account action you cannot take, say exactly what will happen next and that the ticket stays open.`;

const SUPPORT_PROMPT = (platformName) => `You are the 24/7 AI support agent of SAIF TECH GLOBAL LLC's Centralized Helpline, currently helping a user of: ${platformName}.
Rules:
- Use ONLY the verified documentation below. If the answer is not there, say so honestly and offer to open a support ticket for the human team.
- Explain features, limitations and step-by-step troubleshooting clearly. Never invent features, never claim you changed, fixed, refunded or accessed anything — you cannot act on accounts or systems.
- Never ask for passwords, card numbers or one-time codes.
- If the issue involves billing, account access, data loss, security, a bug, or the user is frustrated or the steps did not work, recommend a ticket.
- Finish EVERY reply with a final line exactly "TICKET: yes" or "TICKET: no" (whether a human ticket is recommended).
- Reply in the user's language; be concise and kind.

Verified documentation:
`;

async function loadSession(env, request, sessionId) {
  const s = await env.DB.prepare("SELECT * FROM helpline_sessions WHERE id = ?").bind(sessionId).first();
  if (!s) throw new HttpError(404, "Support session not found.");
  if (s.customer_id) {
    const c = await getCustomer(env, request);
    if (!c || c.id !== s.customer_id) throw new HttpError(404, "Support session not found.");
  }
  return s;
}

function platformInfo(pid) {
  return HELPLINE_PLATFORMS.find((p) => p.id === pid) || HELPLINE_PLATFORMS.find((p) => p.id === "company");
}

/** Lifetime member context: everything the AI needs to support the client's delivered projects in full. */
async function memberContext(env, customerId) {
  const member = await env.DB.prepare("SELECT token FROM members WHERE customer_id = ?").bind(customerId).first();
  if (!member) return null;
  const { results } = await env.DB.prepare(
    "SELECT id, title, brief_md, design_md, design_kind, delivered_build_id FROM engagements WHERE customer_id = ? AND stage = 'delivered' ORDER BY updated_at DESC LIMIT 5",
  ).bind(customerId).all();
  let text = `This user is a LIFETIME PRIORITY MEMBER of Saif Tech Global LLC (token ${member.token}). Give them complete, expert help.\n`;
  for (const e of results || []) {
    text += `\n## Delivered project ${e.id}: ${e.title}\n${(e.brief_md || "").slice(0, 2500)}\n`;
    if (e.design_md) text += `Solution outline:\n${e.design_md.slice(0, 1500)}\n`;
    if (e.delivered_build_id) {
      const { results: files } = await env.DB.prepare("SELECT path, content FROM build_files WHERE build_id = ? ORDER BY path").bind(e.delivered_build_id).all();
      text += `Delivered files: ${(files || []).map((f) => f.path).join(", ")}\n`;
      let budget = 9000;
      for (const f of files || []) {
        if (budget <= 0 || f.path.startsWith("tests/")) continue;
        const chunk = f.content.slice(0, Math.min(3500, budget));
        text += `--- ${f.path}\n${chunk}\n`;
        budget -= chunk.length;
      }
    }
  }
  return { token: member.token, text: text.slice(0, 24000) };
}

/** The company AI answers a ticket immediately (24/7). Best effort: the ticket stays open if AI is down. */
async function aiAnswerTicket(env, ticketId) {
  const tk = await env.DB.prepare("SELECT * FROM tickets WHERE id = ?").bind(ticketId).first();
  if (!tk) return;
  const { results: msgs } = await env.DB.prepare("SELECT author_type, content FROM ticket_messages WHERE ticket_id = ? AND internal = 0 ORDER BY created_at, rowid").bind(tk.id).all();
  const info = platformInfo(tk.platform);
  const scopes = tk.platform === "company" ? ["company", "services", ...HELPLINE_PLATFORMS.map((p) => p.id)] : [tk.platform, "company"];
  const docs = await retrieve(env, scopes, `${tk.subject} ${(msgs || []).map((m) => m.content).join(" ")}`.slice(-2000), 8);
  const mc = tk.member ? await memberContext(env, tk.customer_id) : null;
  try {
    const { text: raw, model } = await runAI(
      env,
      "ticket",
      [
        { role: "system", content: TICKET_PROMPT(info.name) + (mc ? `\n\n${mc.text}\n\n` : "") + formatDocs(docs) },
        { role: "user", content: `Ticket subject: ${tk.subject}\n\n${(msgs || []).map((m) => `${m.author_type === "customer" ? "Customer" : "Saif Tech Global"}: ${m.content}`).join("\n\n")}` },
      ],
      { maxTokens: 900, temperature: 0.3, long: !!mc, chain: "gemma_chat" },
    );
    const t = now();
    await env.DB.batch([
      env.DB.prepare("INSERT INTO ticket_messages (id, ticket_id, author_type, author, content, created_at) VALUES (?, ?, 'ai', ?, ?, ?)").bind(id("tkm"), tk.id, model, raw.trim(), t),
      env.DB.prepare("UPDATE tickets SET status = CASE WHEN status = 'escalated' THEN 'escalated' ELSE 'answered' END, updated_at = ? WHERE id = ?").bind(t, tk.id),
    ]);
  } catch (e) {
    if (!(e instanceof AIUnavailable)) console.error("ticket AI failed", e);
  }
}

async function platforms() {
  return json({ platforms: HELPLINE_PLATFORMS.map(({ id: pid, name, domain }) => ({ id: pid, name, domain })) });
}

async function createSession({ request, env }) {
  await rateLimit(env, "help-session", clientIp(request), 30, 3600);
  const body = await readJson(request);
  const verified = await verifyPlatformContext(env, body.ctx);
  const hinted = platformFromHint(body.project);
  const platform = verified ? verified.platform : hinted ? hinted.id : "company";
  const customer = await getCustomer(env, request);
  const member = customer ? await env.DB.prepare("SELECT token FROM members WHERE customer_id = ?").bind(customer.id).first() : null;
  const sid = id("hls");
  await env.DB.prepare("INSERT INTO helpline_sessions (id, customer_id, platform, platform_verified, platform_subject, member_token, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)")
    .bind(sid, customer ? customer.id : null, platform, verified ? 1 : 0, verified ? verified.subject : null, member ? member.token : null, now())
    .run();
  const info = platformInfo(platform);
  return json({ id: sid, platform: { id: info.id, name: info.name, domain: info.domain, verified: !!verified }, member: member ? member.token : null }, 201);
}

async function getSessionMessages({ request, env, params }) {
  const s = await loadSession(env, request, params.id);
  const { results } = await env.DB.prepare("SELECT role, content, created_at FROM helpline_messages WHERE session_id = ? ORDER BY created_at, rowid").bind(s.id).all();
  const info = platformInfo(s.platform);
  return json({ platform: { id: info.id, name: info.name, verified: !!s.platform_verified }, messages: results || [] });
}

async function chat({ request, env, params }) {
  await rateLimit(env, "help-msg", clientIp(request), 60, 3600);
  const s = await loadSession(env, request, params.id);
  const body = await readJson(request);
  const text = str(body.message, "Message", { max: 3000 });
  await env.DB.prepare("INSERT INTO helpline_messages (id, session_id, role, content, created_at) VALUES (?, ?, 'user', ?, ?)").bind(id("hlm"), s.id, text, now()).run();
  const { results: history } = await env.DB.prepare("SELECT role, content FROM helpline_messages WHERE session_id = ? ORDER BY created_at, rowid").bind(s.id).all();
  const info = platformInfo(s.platform);
  const scopes = s.platform === "company" ? ["company", "services", ...HELPLINE_PLATFORMS.map((p) => p.id)] : [s.platform, "company"];
  const docs = await retrieve(env, scopes, history.map((m) => m.content).join(" ").slice(-2000), 8);
  const mc = s.member_token && s.customer_id ? await memberContext(env, s.customer_id) : null;
  try {
    const { text: raw, model } = await runAI(
      env,
      "helpline",
      [{ role: "system", content: SUPPORT_PROMPT(info.name) + (mc ? `\n\n${mc.text}\n\n` : "") + formatDocs(docs) }, ...history.slice(-20).map((m) => ({ role: m.role, content: m.content.slice(0, 3000) }))],
      { maxTokens: 900, temperature: 0.3, long: !!mc, chain: "gemma_chat" },
    );
    const m = raw.match(/\n?\s*TICKET:\s*(yes|no)\s*$/i);
    const suggest = m ? m[1].toLowerCase() === "yes" : false;
    const reply = m ? raw.slice(0, m.index).trim() : raw;
    await env.DB.prepare("INSERT INTO helpline_messages (id, session_id, role, content, model, created_at) VALUES (?, ?, 'assistant', ?, ?, ?)").bind(id("hlm"), s.id, reply, model, now()).run();
    return json({ reply, suggest_ticket: suggest });
  } catch (e) {
    // Helpline never goes dark: if AI is down the user can still open a ticket for the human team.
    if (e instanceof AIUnavailable) return json({ reply: null, ai_unavailable: true, suggest_ticket: true, error: e.message }, 503);
    throw e;
  }
}

// ---------------------------------------------------------------- tickets
async function createTicket({ request, env }) {
  const c = await requireCustomer(env, request);
  await rateLimit(env, "ticket-new", c.id, 10, 86400);
  const body = await readJson(request);
  const subject = str(body.subject, "Subject", { max: 160 });
  const description = str(body.description, "Description", { max: 5000 });
  const priority = body.priority ? oneOf(body.priority, "Priority", ["low", "normal", "high", "urgent"]) : "normal";
  let platform = "company";
  let verified = 0;
  let sessionId = null;
  if (body.session_id) {
    const s = await loadSession(env, request, String(body.session_id));
    sessionId = s.id;
    platform = s.platform;
    verified = s.platform_verified;
    if (!s.customer_id) await env.DB.prepare("UPDATE helpline_sessions SET customer_id = ? WHERE id = ?").bind(c.id, s.id).run();
  } else if (body.platform) {
    const hinted = platformFromHint(body.platform);
    if (hinted) platform = hinted.id;
  }
  const member = await env.DB.prepare("SELECT token FROM members WHERE customer_id = ?").bind(c.id).first();
  let engagementId = null;
  if (body.engagement_id) {
    const own = await env.DB.prepare("SELECT id FROM engagements WHERE id = ? AND customer_id = ?").bind(String(body.engagement_id), c.id).first();
    if (own) engagementId = own.id;
  }
  const effectivePriority = member && ["low", "normal"].includes(priority) ? "high" : priority; // lifetime priority for members
  const tid = humanId("TKT");
  const t = now();
  const stmts = [
    env.DB.prepare(
      "INSERT INTO tickets (id, customer_id, platform, platform_verified, engagement_id, member, subject, status, priority, session_id, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
    ).bind(tid, c.id, platform, verified, engagementId, member ? 1 : 0, subject, body.escalate ? "escalated" : "open", effectivePriority, sessionId, t, t),
    env.DB.prepare("INSERT INTO ticket_messages (id, ticket_id, author_type, author, content, created_at) VALUES (?, ?, 'customer', ?, ?, ?)").bind(id("tkm"), tid, c.email, description, t),
  ];
  if (sessionId) {
    const { results } = await env.DB.prepare("SELECT role, content FROM helpline_messages WHERE session_id = ? ORDER BY created_at, rowid").bind(sessionId).all();
    if (results && results.length) {
      const transcript = results.map((m) => `${m.role === "user" ? "Customer" : "AI agent"}: ${m.content}`).join("\n\n").slice(-12000);
      stmts.push(
        env.DB.prepare("INSERT INTO ticket_messages (id, ticket_id, author_type, author, content, internal, created_at) VALUES (?, ?, 'system', 'helpline', ?, 1, ?)")
          .bind(id("tkm"), tid, `AI conversation before the ticket:\n\n${transcript}`, t + 1),
      );
    }
  }
  await env.DB.batch(stmts);
  await aiAnswerTicket(env, tid);
  const fresh = await env.DB.prepare("SELECT status, priority FROM tickets WHERE id = ?").bind(tid).first();
  return json({ id: tid, status: fresh.status, priority: fresh.priority, member: member ? member.token : null }, 201);
}

async function listTickets({ request, env }) {
  const c = await requireCustomer(env, request);
  const { results } = await env.DB.prepare("SELECT id, platform, member, subject, status, priority, created_at, updated_at FROM tickets WHERE customer_id = ? ORDER BY updated_at DESC LIMIT 100")
    .bind(c.id)
    .all();
  return json({ tickets: results || [] });
}

async function getTicket({ request, env, params }) {
  const c = await requireCustomer(env, request);
  const tk = await env.DB.prepare("SELECT id, platform, platform_verified, member, engagement_id, subject, status, priority, created_at, updated_at FROM tickets WHERE id = ? AND customer_id = ?")
    .bind(params.id, c.id)
    .first();
  if (!tk) throw new HttpError(404, "Ticket not found.");
  const { results } = await env.DB.prepare("SELECT author_type, content, created_at FROM ticket_messages WHERE ticket_id = ? AND internal = 0 ORDER BY created_at, rowid").bind(tk.id).all();
  return json({ ticket: tk, messages: results || [] });
}

async function replyTicket({ request, env, params }) {
  const c = await requireCustomer(env, request);
  await rateLimit(env, "ticket-reply", c.id, 60, 3600);
  const tk = await env.DB.prepare("SELECT id, status FROM tickets WHERE id = ? AND customer_id = ?").bind(params.id, c.id).first();
  if (!tk) throw new HttpError(404, "Ticket not found.");
  if (tk.status === "closed") throw new HttpError(409, "This ticket is closed. Please open a new one.");
  const body = await readJson(request);
  const content = str(body.message, "Message", { max: 5000 });
  const t = now();
  await env.DB.batch([
    env.DB.prepare("INSERT INTO ticket_messages (id, ticket_id, author_type, author, content, created_at) VALUES (?, ?, 'customer', ?, ?, ?)").bind(id("tkm"), tk.id, c.email, content, t),
    env.DB.prepare("UPDATE tickets SET status = CASE WHEN status IN ('resolved','answered') THEN 'open' ELSE status END, updated_at = ? WHERE id = ?").bind(t, tk.id),
  ]);
  await aiAnswerTicket(env, tk.id);
  return json({ ok: true });
}

async function escalateTicket({ request, env, params }) {
  const c = await requireCustomer(env, request);
  const tk = await env.DB.prepare("SELECT id, status FROM tickets WHERE id = ? AND customer_id = ?").bind(params.id, c.id).first();
  if (!tk) throw new HttpError(404, "Ticket not found.");
  if (tk.status === "closed") throw new HttpError(409, "This ticket is closed.");
  await env.DB.prepare("UPDATE tickets SET status = 'escalated', priority = CASE WHEN priority IN ('low','normal') THEN 'high' ELSE priority END, updated_at = ? WHERE id = ?")
    .bind(now(), tk.id)
    .run();
  return json({ ok: true, status: "escalated" });
}

export const helplineRoutes = [
  ["GET", "/platforms", platforms],
  ["POST", "/sessions", createSession],
  ["GET", "/sessions/:id", getSessionMessages],
  ["POST", "/sessions/:id/messages", chat],
  ["GET", "/tickets", listTickets],
  ["POST", "/tickets", createTicket],
  ["GET", "/tickets/:id", getTicket],
  ["POST", "/tickets/:id/messages", replyTicket],
  ["POST", "/tickets/:id/escalate", escalateTicket],
];
