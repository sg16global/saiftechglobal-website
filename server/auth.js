// Customer sign-in with an emailed one-time code.
import { HttpError, clientIp, json, now, readJson, requireDb, str } from "./http.js";
import { id, randomDigits, sha256Hex } from "./crypto.js";
import { rateLimit } from "./ratelimit.js";
import { sendEmail } from "./email.js";
import { createSession, destroySession, getCustomer } from "./session.js";

const EMAIL_RE = /^[^\s@]{1,64}@[^\s@]{1,190}\.[a-z]{2,24}$/i;
const CODE_TTL = 10 * 60;

async function requestCode({ request, env }) {
  const body = await readJson(request);
  const email = str(body.email, "Email", { max: 254 }).toLowerCase();
  if (!EMAIL_RE.test(email)) throw new HttpError(400, "Please enter a valid email address.");
  await rateLimit(env, "code-ip", clientIp(request), 10, 3600);
  await rateLimit(env, "code-email", email, 5, 3600);
  const code = randomDigits(6);
  const t = now();
  await requireDb(env)
    .prepare("INSERT INTO auth_codes (id, email, code_hash, expires_at, created_at) VALUES (?, ?, ?, ?, ?)")
    .bind(id("otp"), email, await sha256Hex(`${email}:${code}`), t + CODE_TTL, t)
    .run();
  const sent = await sendEmail(env, request, {
    to: email,
    subject: `${code} is your Saif Tech Global sign-in code`,
    text: `Your Saif Tech Global LLC sign-in code is ${code}. It expires in 10 minutes. If you did not request it, ignore this email.`,
    html: `<p>Your <strong>Saif Tech Global LLC</strong> sign-in code is:</p><p style="font-size:28px;letter-spacing:6px;font-weight:700">${code}</p><p>It expires in 10 minutes. If you did not request it, you can ignore this email.</p>`,
  });
  // dev_code is only ever returned on localhost when no email provider is configured.
  return json({ ok: true, ...(sent.dev ? { dev_code: code } : {}) });
}

async function verify({ request, env }) {
  const body = await readJson(request);
  const email = str(body.email, "Email", { max: 254 }).toLowerCase();
  const code = str(body.code, "Code", { min: 6, max: 6 });
  await rateLimit(env, "verify-ip", clientIp(request), 30, 3600);
  const db = requireDb(env);
  const row = await db
    .prepare("SELECT id, code_hash, attempts FROM auth_codes WHERE email = ? AND used = 0 AND expires_at > ? ORDER BY created_at DESC LIMIT 1")
    .bind(email, now())
    .first();
  if (!row) throw new HttpError(400, "That code has expired. Please request a new one.");
  if (row.attempts >= 5) throw new HttpError(429, "Too many wrong attempts. Please request a new code.");
  if ((await sha256Hex(`${email}:${code}`)) !== row.code_hash) {
    await db.prepare("UPDATE auth_codes SET attempts = attempts + 1 WHERE id = ?").bind(row.id).run();
    throw new HttpError(400, "That code is not correct.");
  }
  await db.prepare("UPDATE auth_codes SET used = 1 WHERE id = ?").bind(row.id).run();
  let customer = await db.prepare("SELECT id, email, name FROM customers WHERE email = ?").bind(email).first();
  if (!customer) {
    customer = { id: id("cus"), email, name: null };
    await db.prepare("INSERT INTO customers (id, email, created_at) VALUES (?, ?, ?)").bind(customer.id, email, now()).run();
  }
  const cookie = await createSession(env, customer.id);
  return json({ ok: true, customer: { email: customer.email, name: customer.name } }, 200, { "set-cookie": cookie });
}

async function me({ request, env }) {
  const c = await getCustomer(env, request);
  return json({ customer: c ? { email: c.email, name: c.name } : null });
}

async function updateProfile({ request, env }) {
  const c = await getCustomer(env, request);
  if (!c) throw new HttpError(401, "Please sign in.");
  const body = await readJson(request);
  const name = str(body.name, "Name", { max: 120 });
  await env.DB.prepare("UPDATE customers SET name = ? WHERE id = ?").bind(name, c.id).run();
  return json({ ok: true });
}

async function logout({ request, env }) {
  return json({ ok: true }, 200, { "set-cookie": await destroySession(env, request) });
}

export const authRoutes = [
  ["POST", "/request-code", requestCode],
  ["POST", "/verify", verify],
  ["GET", "/me", me],
  ["POST", "/profile", updateProfile],
  ["POST", "/logout", logout],
];
