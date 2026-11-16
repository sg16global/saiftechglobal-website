// Company AI orchestration on Cloudflare Workers AI (optionally through Cloudflare AI Gateway).
// Primary model → fallback models, per-request timeout, limited retries, usage logging and a daily cap.
// Independent of SG16 Central Brain: only the env.AI binding of THIS project is ever called.
import { HttpError, now } from "./http.js";
import { getSetting, isAllowedModel } from "./settings.js";

export class AIUnavailable extends HttpError {
  constructor() {
    super(503, "Our AI service is temporarily unavailable. Your request has been saved — please try again in a few minutes.", {
      ai_unavailable: true,
    });
  }
}

function withTimeout(promise, ms) {
  let timer;
  return Promise.race([
    promise.finally(() => clearTimeout(timer)),
    new Promise((_, reject) => {
      timer = setTimeout(() => reject(new Error(`timeout after ${ms} ms`)), ms);
    }),
  ]);
}

function extractText(res) {
  if (!res) return "";
  if (typeof res === "string") return res;
  if (typeof res.response === "string") return res.response;
  if (res.response && typeof res.response === "object") return JSON.stringify(res.response);
  if (res.choices && res.choices[0] && res.choices[0].message) return res.choices[0].message.content || "";
  if (typeof res.output_text === "string") return res.output_text;
  if (res.result && typeof res.result.response === "string") return res.result.response;
  return "";
}

async function logUsage(env, row) {
  try {
    await env.DB.prepare(
      "INSERT INTO ai_usage (task, model, ok, latency_ms, input_chars, output_chars, error, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
    )
      .bind(row.task, row.model, row.ok ? 1 : 0, row.latency, row.inputChars, row.outputChars, row.error || null, now())
      .run();
  } catch (e) {
    console.error("ai usage log failed", e);
  }
}

/**
 * Gemma (and some Mistral) chat templates require: one system message, then strictly alternating
 * user/assistant turns that START with the user. Leading assistant turns (our greeting) are folded into
 * the system prompt; consecutive same-role turns are merged.
 */
export function normalizeMessages(messages) {
  const system = messages.filter((m) => m.role === "system").map((m) => m.content).join("\n\n");
  const turns = [];
  for (const m of messages) {
    if (m.role === "system" || !m.content) continue;
    const role = m.role === "assistant" ? "assistant" : "user";
    const last = turns[turns.length - 1];
    if (last && last.role === role) last.content += `\n\n${m.content}`;
    else turns.push({ role, content: String(m.content) });
  }
  const lead = [];
  while (turns.length && turns[0].role === "assistant") lead.push(turns.shift().content);
  if (!turns.length) turns.push({ role: "user", content: "Please continue." });
  const sys = [system, lead.length ? `Earlier in this conversation you (the assistant) said:\n${lead.join("\n\n")}` : ""].filter(Boolean).join("\n\n");
  return [...(sys ? [{ role: "system", content: sys }] : []), ...turns];
}

/** Gemma 4 spends part of the budget on hidden reasoning — give it room so the answer is not empty. */
function tokenBudget(model, maxTokens) {
  return /gemma-4/i.test(model) ? Math.min(8000, Math.max(3000, maxTokens * 3)) : maxTokens;
}

/** Model order for each layer. Unknown chains use the Gemma chat layer. Only Gemma/Mistral ids pass the guard. */
export function chainModels(cfg, chain) {
  const lists = {
    gemma_chat: [...(cfg.gemma_chat_models || [])],
    gemma_design: [...(cfg.gemma_design_models || []), ...(cfg.gemma_chat_models || [])],
    mistral: [...(cfg.mistral_models || [])],
    mistral_rescue: [...(cfg.rescue_models || []), ...(cfg.mistral_models || [])],
  };
  return [...new Set(lists[chain] || lists.gemma_chat)].filter(isAllowedModel);
}

/**
 * Run a chat completion with fallback.
 * @returns {Promise<{text: string, model: string}>}
 */
export async function runAI(env, task, messages, { maxTokens = 1200, temperature = 0.4, long = false, chain = "gemma_chat" } = {}) {
  if (!env.AI) throw new AIUnavailable();
  const cfg = await getSetting(env, "ai_config");
  const since = now() - 86400;
  const used = await env.DB.prepare("SELECT COUNT(*) AS n FROM ai_usage WHERE created_at > ?").bind(since).first();
  if (cfg.daily_request_limit && used && used.n >= cfg.daily_request_limit) {
    console.error("AI daily request limit reached");
    throw new AIUnavailable();
  }
  const list = chainModels(cfg, chain);
  const models = list.filter((m, i, a) => m && a.indexOf(m) === i);
  messages = normalizeMessages(messages);
  const inputChars = messages.reduce((s, m) => s + (m.content || "").length, 0);
  // Long generations (documents) get a longer timeout and no same-model retry, so outages fail fast.
  const retries = long ? 0 : Math.max(0, Math.min(3, cfg.retries_per_model ?? 1));
  const timeoutMs = long ? cfg.long_timeout_ms || 90000 : cfg.timeout_ms || 25000;
  for (const model of models) {
    for (let attempt = 0; attempt <= retries; attempt++) {
      const started = Date.now();
      try {
        const options = cfg.gateway_id ? { gateway: { id: cfg.gateway_id, skipCache: !cfg.gateway_cache } } : undefined;
        const res = await withTimeout(env.AI.run(model, { messages, max_tokens: tokenBudget(model, maxTokens), temperature }, options), timeoutMs);
        const text = extractText(res).trim();
        if (!text) throw new Error("empty response");
        await logUsage(env, { task, model, ok: true, latency: Date.now() - started, inputChars, outputChars: text.length });
        return { text, model };
      } catch (e) {
        await logUsage(env, { task, model, ok: false, latency: Date.now() - started, inputChars, outputChars: 0, error: String(e && e.message).slice(0, 300) });
      }
    }
  }
  throw new AIUnavailable();
}

/** Ask for JSON and parse it robustly (first {...} block). Retries via the model chain on parse failure. */
export async function runAIJson(env, task, messages, opts = {}) {
  for (let i = 0; i < 2; i++) {
    const { text, model } = await runAI(env, task, messages, { temperature: 0, ...opts });
    const start = text.indexOf("{");
    const end = text.lastIndexOf("}");
    if (start >= 0 && end > start) {
      try {
        return { data: JSON.parse(text.slice(start, end + 1)), model };
      } catch {
        /* retry */
      }
    }
    messages = [...messages, { role: "assistant", content: text.slice(0, 2000) }, { role: "user", content: "That was not valid JSON. Reply with ONLY the JSON object." }];
  }
  throw new AIUnavailable();
}

/** Health check used by the Admin Panel: tries each configured model with a tiny prompt. */
export async function modelHealth(env) {
  const cfg = await getSetting(env, "ai_config");
  const models = [...new Set(["gemma_chat", "gemma_design", "mistral", "mistral_rescue"].flatMap((c) => chainModels(cfg, c)))];
  const out = [];
  for (const model of models) {
    const started = Date.now();
    try {
      const msgs = [{ role: "user", content: "Reply with the single word OK." }];
      const res = await withTimeout(env.AI.run(model, { messages: msgs, max_tokens: tokenBudget(model, 5) }), 60000);
      out.push({ model, ok: !!extractText(res), latency_ms: Date.now() - started });
    } catch (e) {
      out.push({ model, ok: false, latency_ms: Date.now() - started, error: String(e && e.message).slice(0, 200) });
    }
  }
  return out;
}
