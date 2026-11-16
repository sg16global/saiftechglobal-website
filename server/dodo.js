// Dodo Payments integration (plain fetch).
// Checkout: POST /checkouts with a one-time "pay what you want" product and a server-computed amount (cents).
// Webhooks: Standard Webhooks signature (webhook-id / webhook-timestamp / webhook-signature, HMAC-SHA256).
import { HttpError } from "./http.js";
import { b64, b64Decode, hmacSha256, safeEqual } from "./crypto.js";

// DODO_API_BASE is only for automated tests against a local mock; leave it unset in production.
const base = (env) => env.DODO_API_BASE || (env.DODO_MODE === "live" ? "https://live.dodopayments.com" : "https://test.dodopayments.com");

export function paymentsConfigured(env) {
  return !!(env.DODO_API_KEY && env.DODO_WEBHOOK_SECRET && env.DODO_PRODUCT_ID);
}

async function dodo(env, path, init = {}) {
  const res = await fetch(base(env) + path, {
    ...init,
    headers: { Authorization: `Bearer ${env.DODO_API_KEY}`, "content-type": "application/json", ...(init.headers || {}) },
  });
  const text = await res.text();
  let body;
  try {
    body = text ? JSON.parse(text) : {};
  } catch {
    body = { raw: text.slice(0, 300) };
  }
  if (!res.ok) {
    console.error("Dodo API error", res.status, text.slice(0, 500));
    throw new HttpError(502, "The payment provider could not process this request. Please try again shortly.");
  }
  return body;
}

export async function createCheckout(env, { amountCents, customer, metadata, returnUrl, idempotencyKey }) {
  if (!paymentsConfigured(env)) throw new HttpError(503, "Online payments are not configured yet.");
  const body = await dodo(env, "/checkouts", {
    method: "POST",
    headers: idempotencyKey ? { "Idempotency-Key": idempotencyKey } : {},
    body: JSON.stringify({
      product_cart: [{ product_id: env.DODO_PRODUCT_ID, quantity: 1, amount: amountCents }],
      customer: { email: customer.email, ...(customer.name ? { name: customer.name } : {}) },
      metadata,
      return_url: returnUrl,
    }),
  });
  if (!body.checkout_url || !body.session_id) throw new HttpError(502, "The payment provider did not return a checkout link.");
  return { sessionId: body.session_id, checkoutUrl: body.checkout_url };
}

/** Server-side re-check of a payment (never trust the browser or the webhook body alone). */
export async function getPayment(env, paymentId) {
  return dodo(env, `/payments/${encodeURIComponent(paymentId)}`, { method: "GET" });
}

/** Verify a Standard Webhooks signature. Returns true/false. */
export async function verifyWebhook(env, headers, rawBody, toleranceSeconds = 300) {
  const id = headers.get("webhook-id");
  const ts = headers.get("webhook-timestamp");
  const sigHeader = headers.get("webhook-signature");
  if (!id || !ts || !sigHeader || !env.DODO_WEBHOOK_SECRET) return false;
  const t = Number(ts);
  if (!Number.isFinite(t) || Math.abs(Date.now() / 1000 - t) > toleranceSeconds) return false;
  const secret = env.DODO_WEBHOOK_SECRET.startsWith("whsec_") ? env.DODO_WEBHOOK_SECRET.slice(6) : env.DODO_WEBHOOK_SECRET;
  let key;
  try {
    key = b64Decode(secret);
  } catch {
    return false;
  }
  const expected = b64(await hmacSha256(key, `${id}.${ts}.${rawBody}`));
  return sigHeader
    .split(" ")
    .map((s) => s.trim())
    .filter((s) => s.startsWith("v1,"))
    .some((s) => safeEqual(s.slice(3), expected));
}

/** Full refund of a payment (POST /refunds with only payment_id → whole payment). */
export async function createRefund(env, { paymentId, reason, metadata }) {
  if (!env.DODO_API_KEY) throw new HttpError(503, "Payments are not configured.");
  if (!paymentId) throw new HttpError(409, "No provider payment id to refund.");
  const body = await dodo(env, "/refunds", {
    method: "POST",
    body: JSON.stringify({ payment_id: paymentId, reason: String(reason || "").slice(0, 3000), metadata }),
  });
  if (!body.refund_id) throw new HttpError(502, "The payment provider did not return a refund id.");
  return { refund_id: body.refund_id, status: body.status };
}
