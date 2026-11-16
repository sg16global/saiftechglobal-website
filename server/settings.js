// Company configuration stored in D1. The company AI runs Working Mode on its own; these are only the
// safety rails the owner decided (minimum order, retries, auto-refund) and operational switches.
import { HttpError, now, requireDb } from "./http.js";
import { audit } from "./audit.js";

export const DEFAULTS = {
  company_policy: {
    accepting_orders: true, // emergency pause for new orders (existing work continues)
    currency: "USD",
    min_order_cents: 1000, // owner decision: $10 minimum, no upper limit, no manual approval
    quote_valid_days: 14,
    build_retries: 3, // owner decision: on test failure retry up to 3 times, then refund
    auto_refund: true,
    max_design_revisions: 5,
    payments_enabled: false, // switch on after Dodo keys are configured
    terms_version: "2026-11",
  },
  // Two-tier AI (owner decision 2026-11-17): exactly two official Workers AI models, nothing else.
  //  Gemma layer   — customer chat, 24/7 support, project brief, design / mock-ups
  //  Mistral layer — pricing, acceptance tests, code generation & fixes, final verification, delivery docs
  //  Fallback      — build attempts 3 and 4 switch to Gemma before any automatic refund
  ai_config: {
    gemma_chat_models: ["@cf/google/gemma-4-26b-a4b-it"],
    gemma_design_models: ["@cf/google/gemma-4-26b-a4b-it"],
    mistral_models: ["@cf/mistralai/mistral-small-3.1-24b-instruct"],
    rescue_from_attempt: 3,
    rescue_models: ["@cf/google/gemma-4-26b-a4b-it"],
    timeout_ms: 45000,
    long_timeout_ms: 240000,
    retries_per_model: 1,
    gateway_id: "",
    gateway_cache: false,
    daily_request_limit: 5000,
  },
};

export const SETTING_KEYS = Object.keys(DEFAULTS);

/** The only two models the company AI may ever use (verified in the owner's Workers AI catalog). */
export const GEMMA_MODEL = "@cf/google/gemma-4-26b-a4b-it";
export const MISTRAL_MODEL = "@cf/mistralai/mistral-small-3.1-24b-instruct";
export const ALLOWED_MODELS = [GEMMA_MODEL, MISTRAL_MODEL];
export const isAllowedModel = (m) => ALLOWED_MODELS.includes(m);
export const MODEL_LISTS = ["gemma_chat_models", "gemma_design_models", "mistral_models", "rescue_models"];

function merge(base, override) {
  if (Array.isArray(base) || Array.isArray(override)) return override ?? base;
  if (base && typeof base === "object" && override && typeof override === "object") {
    const out = { ...base };
    for (const k of Object.keys(override)) out[k] = k in base ? merge(base[k], override[k]) : override[k];
    return out;
  }
  return override === undefined ? base : override;
}

export async function getSetting(env, key) {
  if (!(key in DEFAULTS)) throw new Error(`Unknown setting ${key}`);
  const row = await requireDb(env).prepare("SELECT value FROM settings WHERE key = ?").bind(key).first();
  if (!row) return structuredClone(DEFAULTS[key]);
  try {
    return merge(structuredClone(DEFAULTS[key]), JSON.parse(row.value));
  } catch {
    return structuredClone(DEFAULTS[key]);
  }
}

export async function putSetting(env, key, value, actor, ip) {
  if (!(key in DEFAULTS)) throw new HttpError(400, `Unknown setting ${key}.`);
  if (!value || typeof value !== "object" || Array.isArray(value)) throw new HttpError(400, "Setting must be an object.");
  // Partial updates change only the fields they mention (merge onto the CURRENT value, not the defaults).
  const merged = merge(await getSetting(env, key), value);
  if (key === "ai_config") {
    for (const list of MODEL_LISTS) {
      if (value[list] !== undefined) merged[list] = value[list]; // lists are replaced, not merged
      if (!Array.isArray(merged[list]) || !merged[list].length) throw new HttpError(400, `${list} needs at least one model.`);
      const bad = merged[list].filter((m) => !isAllowedModel(m));
      if (bad.length) throw new HttpError(400, `Only Gemma and Mistral models are allowed (${ALLOWED_MODELS.join(", ")}). Rejected: ${bad.join(", ")}`);
    }
    for (const legacy of ["primary_model", "fallback_models", "code_model", "code_fallback_models", "code_escalation_models"]) delete merged[legacy];
  }
  if (key === "company_policy") {
    // the owner's floor can be raised but never removed
    if (!Number.isInteger(merged.min_order_cents) || merged.min_order_cents < 1000) merged.min_order_cents = 1000;
    merged.build_retries = Math.max(0, Math.min(5, Number(merged.build_retries) || 0));
  }
  const text = JSON.stringify(merged);
  if (text.length > 50_000) throw new HttpError(413, "Setting is too large.");
  const t = now();
  const db = requireDb(env);
  await db.batch([
    db.prepare(
      `INSERT INTO settings (key, value, updated_at, updated_by) VALUES (?, ?, ?, ?)
       ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = excluded.updated_at, updated_by = excluded.updated_by`,
    ).bind(key, text, t, actor),
    db.prepare("INSERT INTO settings_history (key, value, updated_at, updated_by) VALUES (?, ?, ?, ?)").bind(key, text, t, actor),
  ]);
  await audit(env, { actor, action: `settings.update.${key}`, target: key, ip });
  return merged;
}
