// Payments for Working Mode: full price upfront via Dodo checkout, verified webhooks,
// automatic build start, automatic refunds when the AI cannot deliver.
import { HttpError, json, now } from "./http.js";
import { createCheckout, createRefund, getPayment, paymentsConfigured, verifyWebhook } from "./dodo.js";
import { audit } from "./audit.js";
import { id } from "./crypto.js";

async function note(env, engagementId, content, kind) {
  await env.DB.prepare("INSERT INTO engagement_messages (id, engagement_id, role, kind, content, created_at) VALUES (?, ?, 'notice', ?, ?, ?)")
    .bind(id("emg"), engagementId, kind, content, now())
    .run();
}

export async function startCheckout(env, request, paymentId, customer) {
  if (!paymentsConfigured(env)) throw new HttpError(503, "Online payment is not configured yet.");
  const p = await env.DB.prepare("SELECT * FROM payments WHERE id = ?").bind(paymentId).first();
  if (!p) throw new HttpError(404, "Payment not found.");
  if (!["USD", "EUR", "GBP"].includes(p.currency)) throw new HttpError(409, "This currency is not supported for online payment.");
  const origin = new URL(request.url).origin;
  const { sessionId, checkoutUrl } = await createCheckout(env, {
    amountCents: p.amount_cents,
    customer: { email: customer.email, name: customer.name },
    metadata: { stg_payment_id: p.id, stg_engagement_id: p.engagement_id },
    returnUrl: `${origin}/working-mode/?project=${encodeURIComponent(p.engagement_id)}&payment=return`,
    idempotencyKey: `${p.id}-${now()}`,
  });
  await env.DB.prepare("UPDATE payments SET status = 'pending', provider_session_id = ?, checkout_url = ?, updated_at = ? WHERE id = ?")
    .bind(sessionId, checkoutUrl, now(), p.id)
    .run();
  return { checkoutUrl };
}

/** Ask the build runner to start (service binding in production, URL locally). Never throws. */
export async function startBuild(env, engagementId) {
  try {
    const init = {
      method: "POST",
      headers: { "content-type": "application/json", "x-runner-secret": env.RUNNER_SECRET || "" },
      body: JSON.stringify({ engagement_id: engagementId }),
    };
    const res = env.RUNNER_URL ? await fetch(`${env.RUNNER_URL}/start`, init) : env.RUNNER ? await env.RUNNER.fetch("https://runner/start", init) : null;
    if (!res) throw new Error("no runner configured");
    if (!res.ok) throw new Error(`runner responded ${res.status}`);
    return true;
  } catch (e) {
    // The runner's scheduled sweep picks up queued builds, so a missed start is recovered automatically.
    console.error("startBuild failed", e && e.message);
    await audit(env, { actor: "system", action: "build.start_deferred", target: engagementId, detail: String(e && e.message) });
    return false;
  }
}

/** Full automatic refund (owner rule: if the AI cannot pass the tests after its retries). */
export async function refundEngagement(env, engagementId, reason) {
  const p = await env.DB.prepare("SELECT * FROM payments WHERE engagement_id = ? AND status IN ('succeeded','refund_pending') ORDER BY created_at DESC LIMIT 1")
    .bind(engagementId)
    .first();
  if (!p) return { ok: false, reason: "no-paid-payment" };
  if (p.refund_id) return { ok: true, refund_id: p.refund_id, already: true };
  await env.DB.prepare("UPDATE payments SET status = 'refund_pending', refund_reason = ?, updated_at = ? WHERE id = ?").bind(reason.slice(0, 500), now(), p.id).run();
  try {
    const r = await createRefund(env, { paymentId: p.provider_payment_id, reason, metadata: { stg_payment_id: p.id, stg_engagement_id: engagementId } });
    await env.DB.prepare("UPDATE payments SET refund_id = ?, status = ?, updated_at = ? WHERE id = ?")
      .bind(r.refund_id, r.status === "succeeded" ? "refunded" : "refund_pending", now(), p.id)
      .run();
    await audit(env, { actor: "company-ai", action: "refund.created", target: p.id, detail: { refund_id: r.refund_id, reason } });
    return { ok: true, refund_id: r.refund_id };
  } catch (e) {
    // stays refund_pending without refund_id → the runner's sweep retries it
    await audit(env, { actor: "company-ai", action: "refund.retry_needed", target: p.id, detail: String(e && e.message) });
    return { ok: false, reason: "provider-error" };
  }
}

const PAYMENT_EVENTS = { "payment.succeeded": "succeeded", "payment.failed": "failed", "payment.cancelled": "cancelled", "payment.processing": "pending" };

/** POST /api/payments/dodo-webhook */
export async function dodoWebhook({ request, env }) {
  const raw = await request.text();
  if (raw.length > 200_000) return json({ error: "too large" }, 413);
  if (!(await verifyWebhook(env, request.headers, raw))) return json({ error: "invalid signature" }, 401);
  const webhookId = request.headers.get("webhook-id");
  let event;
  try {
    event = JSON.parse(raw);
  } catch {
    return json({ error: "invalid json" }, 400);
  }
  const inserted = await env.DB.prepare("INSERT INTO webhook_events (id, provider, type, received_at) VALUES (?, 'dodo', ?, ?) ON CONFLICT(id) DO NOTHING RETURNING id")
    .bind(webhookId, String(event.type || "").slice(0, 60), now())
    .first();
  if (!inserted) {
    const prior = await env.DB.prepare("SELECT processed_at FROM webhook_events WHERE id = ?").bind(webhookId).first();
    if (prior && prior.processed_at) return json({ ok: true, duplicate: true });
  }
  let result;
  if (PAYMENT_EVENTS[event.type]) result = await onPaymentEvent(env, event);
  else if (event.type === "refund.succeeded" || event.type === "refund.failed") result = await onRefundEvent(env, event);
  else result = "ignored-type";
  if (result === "verification-failed") return json({ ok: false, result }, 409); // let Dodo retry
  await env.DB.prepare("UPDATE webhook_events SET processed_at = ?, result = ? WHERE id = ?").bind(now(), result, webhookId).run();
  return json({ ok: true, result });
}

async function onPaymentEvent(env, event) {
  const status = PAYMENT_EVENTS[event.type];
  const data = event.data || {};
  const ourId = data.metadata && data.metadata.stg_payment_id;
  if (!ourId || !data.payment_id) return "no-reference";
  const p = await env.DB.prepare("SELECT * FROM payments WHERE id = ?").bind(String(ourId)).first();
  if (!p) return "unknown-payment";
  if (["succeeded", "refund_pending", "refunded", "refund_failed"].includes(p.status)) return "already-final";
  if (status === "succeeded") {
    const remote = await getPayment(env, data.payment_id);
    const metaOk = remote.metadata && remote.metadata.stg_payment_id === p.id;
    const amountOk = Number.isInteger(remote.total_amount) && remote.total_amount >= p.amount_cents;
    const currencyOk = !remote.currency || String(remote.currency).toUpperCase() === p.currency;
    if (remote.status !== "succeeded" || !metaOk || !amountOk || !currencyOk) {
      await audit(env, { actor: "system", action: "payment.verification_failed", target: p.id, detail: { status: remote.status, metaOk, amountOk, currencyOk } });
      return "verification-failed";
    }
  }
  await env.DB.prepare("UPDATE payments SET status = ?, provider_payment_id = ?, updated_at = ? WHERE id = ?").bind(status, data.payment_id, now(), p.id).run();
  await audit(env, { actor: "dodo-webhook", action: `payment.${status}`, target: p.id });
  if (status === "succeeded") {
    await env.DB.prepare("UPDATE engagements SET stage = 'building', build_state = 'queued', updated_at = ? WHERE id = ? AND stage = 'awaiting_payment'")
      .bind(now(), p.engagement_id)
      .run();
    await note(env, p.engagement_id, "Payment verified. Our AI has started building and testing your project.", "payment");
    await startBuild(env, p.engagement_id);
  } else if (status === "failed" || status === "cancelled") {
    await note(env, p.engagement_id, `Payment ${status}. You can try again from this page.`, "payment");
  }
  return `payment-${status}`;
}

async function onRefundEvent(env, event) {
  const data = event.data || {};
  const refundId = data.refund_id;
  const ourId = data.metadata && data.metadata.stg_payment_id;
  const p = refundId
    ? await env.DB.prepare("SELECT * FROM payments WHERE refund_id = ?").bind(String(refundId)).first()
    : ourId
      ? await env.DB.prepare("SELECT * FROM payments WHERE id = ?").bind(String(ourId)).first()
      : null;
  if (!p) return "unknown-refund";
  const ok = event.type === "refund.succeeded";
  await env.DB.prepare("UPDATE payments SET status = ?, updated_at = ? WHERE id = ?").bind(ok ? "refunded" : "refund_failed", now(), p.id).run();
  await note(env, p.engagement_id, ok ? "Your refund has been completed by the payment provider." : "The refund attempt failed at the payment provider. We will retry automatically.", "refund");
  await audit(env, { actor: "dodo-webhook", action: ok ? "refund.succeeded" : "refund.failed", target: p.id });
  return ok ? "refund-succeeded" : "refund-failed";
}
