// Transactional email via Resend (https://resend.com). The API key is a Cloudflare secret.
import { HttpError, isLocalRequest } from "./http.js";

export async function sendEmail(env, request, { to, subject, text, html }) {
  if (!env.RESEND_API_KEY) {
    // Local development only: the caller may show the code on screen. Never in production.
    if (isLocalRequest(request)) return { delivered: false, dev: true };
    throw new HttpError(503, "Email sign-in is not configured yet. Please contact contact@saiftechglobal.com.");
  }
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${env.RESEND_API_KEY}`, "content-type": "application/json" },
    body: JSON.stringify({ from: env.EMAIL_FROM, to: [to], subject, text, html }),
  });
  if (!res.ok) {
    console.error("Resend error", res.status, (await res.text()).slice(0, 300));
    throw new HttpError(502, "We could not send the email right now. Please try again shortly.");
  }
  return { delivered: true };
}
