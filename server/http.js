// Shared HTTP helpers for the Company Service API (Cloudflare Pages Functions).

export class HttpError extends Error {
  constructor(status, message, extra) {
    super(message);
    this.status = status;
    this.extra = extra;
  }
}

export function json(data, status = 200, headers = {}) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "content-type": "application/json; charset=utf-8",
      "cache-control": "no-store",
      "x-content-type-options": "nosniff",
      ...headers,
    },
  });
}

/** Wrap a Pages Function handler: uniform errors, CSRF origin check on writes. */
export function handler(fn, { csrf = true } = {}) {
  return async (context) => {
    try {
      if (csrf) requireSameOrigin(context.request);
      return await fn(context);
    } catch (err) {
      if (err instanceof HttpError) return json({ error: err.message, ...(err.extra || {}) }, err.status);
      console.error("Unhandled error", err && err.stack ? err.stack : err);
      return json({ error: "Something went wrong on our side. Please try again." }, 500);
    }
  };
}

export function requireSameOrigin(request) {
  if (["GET", "HEAD", "OPTIONS"].includes(request.method)) return;
  const origin = request.headers.get("origin");
  const host = new URL(request.url).host;
  let ok = false;
  try {
    ok = !!origin && new URL(origin).host === host;
  } catch {
    ok = false;
  }
  if (!ok) throw new HttpError(403, "Cross-site request blocked.");
}

export async function readJson(request, maxBytes = 32_000) {
  const text = await request.text();
  if (text.length > maxBytes) throw new HttpError(413, "Request is too large.");
  if (!text) return {};
  try {
    const v = JSON.parse(text);
    if (!v || typeof v !== "object" || Array.isArray(v)) throw new Error("not an object");
    return v;
  } catch {
    throw new HttpError(400, "Invalid JSON body.");
  }
}

/** Validate a string field. */
export function str(value, name, { min = 1, max = 2000, optional = false } = {}) {
  if (value === undefined || value === null || value === "") {
    if (optional) return null;
    throw new HttpError(400, `${name} is required.`);
  }
  if (typeof value !== "string") throw new HttpError(400, `${name} must be text.`);
  const v = value.trim();
  if (v.length < min) throw new HttpError(400, `${name} is too short.`);
  if (v.length > max) throw new HttpError(400, `${name} is too long (max ${max} characters).`);
  return v;
}

export function oneOf(value, name, allowed) {
  if (!allowed.includes(value)) throw new HttpError(400, `${name} must be one of: ${allowed.join(", ")}.`);
  return value;
}

export function int(value, name, { min = 0, max = Number.MAX_SAFE_INTEGER, optional = false } = {}) {
  if (value === undefined || value === null || value === "") {
    if (optional) return null;
    throw new HttpError(400, `${name} is required.`);
  }
  const n = Number(value);
  if (!Number.isInteger(n) || n < min || n > max) throw new HttpError(400, `${name} must be a whole number between ${min} and ${max}.`);
  return n;
}

export const now = () => Math.floor(Date.now() / 1000);

export const clientIp = (request) => request.headers.get("cf-connecting-ip") || "local";

export function isLocalRequest(request) {
  const h = new URL(request.url).hostname;
  return h === "localhost" || h === "127.0.0.1" || h === "[::1]";
}

export function requireDb(env) {
  if (!env.DB) throw new HttpError(503, "Company database is not configured yet.");
  return env.DB;
}
