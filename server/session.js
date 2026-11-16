// Customer sessions (email one-time-code sign-in). Only a SHA-256 of the session token is stored.
import { HttpError, now, requireDb } from "./http.js";
import { b64url, randomBytes, sha256Hex } from "./crypto.js";

const COOKIE = "stg_session";
const MAX_AGE = 30 * 24 * 3600;

function readCookie(request, name) {
  const header = request.headers.get("cookie") || "";
  for (const part of header.split(";")) {
    const [k, ...v] = part.trim().split("=");
    if (k === name) return decodeURIComponent(v.join("="));
  }
  return null;
}

export async function createSession(env, customerId) {
  const token = b64url(randomBytes(32));
  const t = now();
  await requireDb(env)
    .prepare("INSERT INTO sessions (token_hash, customer_id, expires_at, created_at) VALUES (?, ?, ?, ?)")
    .bind(await sha256Hex(token), customerId, t + MAX_AGE, t)
    .run();
  return `${COOKIE}=${encodeURIComponent(token)}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=${MAX_AGE}`;
}

export async function getCustomer(env, request) {
  const token = readCookie(request, COOKIE);
  if (!token || !env.DB) return null;
  return env.DB.prepare(
    `SELECT c.id, c.email, c.name FROM sessions s JOIN customers c ON c.id = s.customer_id
     WHERE s.token_hash = ? AND s.expires_at > ?`,
  )
    .bind(await sha256Hex(token), now())
    .first();
}

export async function requireCustomer(env, request) {
  const c = await getCustomer(env, request);
  if (!c) throw new HttpError(401, "Please sign in with your email to continue.");
  return c;
}

export async function destroySession(env, request) {
  const token = readCookie(request, COOKIE);
  if (token && env.DB) await env.DB.prepare("DELETE FROM sessions WHERE token_hash = ?").bind(await sha256Hex(token)).run();
  return `${COOKIE}=; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0`;
}
