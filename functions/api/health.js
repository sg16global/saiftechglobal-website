// Public health of the Company Service Infrastructure (no secrets, no customer data).
import { json } from "../../server/http.js";

export async function onRequestGet({ env }) {
  let db = false;
  try {
    db = !!(await env.DB.prepare("SELECT 1 AS ok").first());
  } catch {
    db = false;
  }
  return json({ service: "saif-tech-global-company-ai", database: db, ai_binding: !!env.AI, time: new Date().toISOString() });
}
