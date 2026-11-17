// Fixed-window rate limiting stored in D1 (abuse prevention for sign-in, chat and ticket endpoints).
import { HttpError, now, requireDb } from "./http.js";

export async function rateLimit(env, name, subject, max, windowSeconds) {
  const db = requireDb(env);
  const t = now();
  const bucket = Math.floor(t / windowSeconds);
  const key = `${name}:${subject}:${bucket}`;
  const row = await db
    .prepare(
      `INSERT INTO rate_limits (key, count, expires_at) VALUES (?, 1, ?)
       ON CONFLICT(key) DO UPDATE SET count = count + 1
       RETURNING count`,
    )
    .bind(key, (bucket + 1) * windowSeconds)
    .first();
  // opportunistic cleanup of expired buckets
  if (Math.random() < 0.02) await db.prepare("DELETE FROM rate_limits WHERE expires_at < ?").bind(t).run();
  if (row && row.count > max) {
    throw new HttpError(429, "Too many requests. Please wait a moment and try again.");
  }
}
