import { now } from "./http.js";

/** Append-only audit log. Never throws (auditing must not break the action it records). */
export async function audit(env, { actor, action, target = null, detail = null, ip = null }) {
  try {
    await env.DB.prepare("INSERT INTO audit_log (actor, action, target, detail, ip, created_at) VALUES (?, ?, ?, ?, ?, ?)")
      .bind(actor, action, target, detail == null ? null : typeof detail === "string" ? detail : JSON.stringify(detail), ip, now())
      .run();
  } catch (e) {
    console.error("audit failed", e);
  }
}

export async function projectEvent(env, projectId, kind, message, actor, visibleToCustomer = true) {
  await env.DB.prepare(
    "INSERT INTO project_events (project_id, kind, message, actor, visible_to_customer, created_at) VALUES (?, ?, ?, ?, ?, ?)",
  )
    .bind(projectId, kind, message, actor, visibleToCustomer ? 1 : 0, now())
    .run();
}
