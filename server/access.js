// Admin authentication with Cloudflare Access (Zero Trust).
// Access sits in front of /admin and /api/admin; this module ALSO verifies the signed JWT on every
// request, so the API stays protected even if the Access policy were misconfigured.
import { HttpError, isLocalRequest, now } from "./http.js";
import { b64urlDecode } from "./crypto.js";

let certCache = { at: 0, keys: [] };

async function accessKeys(teamDomain) {
  if (Date.now() - certCache.at < 10 * 60 * 1000 && certCache.keys.length) return certCache.keys;
  const res = await fetch(`${teamDomain.replace(/\/$/, "")}/cdn-cgi/access/certs`);
  if (!res.ok) throw new HttpError(503, "Could not verify staff sign-in right now.");
  const { keys } = await res.json();
  certCache = { at: Date.now(), keys: keys || [] };
  return certCache.keys;
}

async function verifyAccessJwt(env, token) {
  const parts = token.split(".");
  if (parts.length !== 3) return null;
  const header = JSON.parse(new TextDecoder().decode(b64urlDecode(parts[0])));
  const payload = JSON.parse(new TextDecoder().decode(b64urlDecode(parts[1])));
  const jwk = (await accessKeys(env.ACCESS_TEAM_DOMAIN)).find((k) => k.kid === header.kid);
  if (!jwk || header.alg !== "RS256") return null;
  const key = await crypto.subtle.importKey("jwk", jwk, { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" }, false, ["verify"]);
  const ok = await crypto.subtle.verify(
    "RSASSA-PKCS1-v1_5",
    key,
    b64urlDecode(parts[2]),
    new TextEncoder().encode(`${parts[0]}.${parts[1]}`),
  );
  if (!ok) return null;
  const aud = Array.isArray(payload.aud) ? payload.aud : [payload.aud];
  if (!aud.includes(env.ACCESS_AUD)) return null;
  if (!payload.exp || payload.exp < now()) return null;
  if (payload.iss && !String(payload.iss).startsWith(env.ACCESS_TEAM_DOMAIN.replace(/\/$/, ""))) return null;
  return payload.email ? String(payload.email).toLowerCase() : null;
}

export const PERMISSIONS = {
  owner: ["read", "tickets", "policy", "payments", "ai", "kb", "staff"],
  admin: ["read", "tickets", "policy", "payments", "ai", "kb"],
  support: ["read", "tickets"],
  viewer: ["read"],
};

/** Resolve the signed-in staff member and their role. Throws 401/403. */
export async function requireStaff(env, request) {
  let email = null;
  if (env.DEV_ADMIN_EMAIL && isLocalRequest(request)) {
    // Local development only (never reachable on a real hostname).
    email = env.DEV_ADMIN_EMAIL.toLowerCase();
  } else {
    if (!env.ACCESS_TEAM_DOMAIN || !env.ACCESS_AUD) throw new HttpError(503, "Staff sign-in (Cloudflare Access) is not configured yet.");
    const token = request.headers.get("cf-access-jwt-assertion");
    if (!token) throw new HttpError(401, "Staff sign-in required.");
    try {
      email = await verifyAccessJwt(env, token);
    } catch (e) {
      if (e instanceof HttpError) throw e;
      email = null;
    }
    if (!email) throw new HttpError(401, "Staff sign-in could not be verified.");
  }
  const owners = String(env.OWNER_EMAILS || "")
    .split(",")
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);
  let role = owners.includes(email) || (env.DEV_ADMIN_EMAIL && isLocalRequest(request)) ? "owner" : null;
  if (!role) {
    const row = await env.DB.prepare("SELECT role FROM admin_users WHERE email = ?").bind(email).first();
    role = row ? row.role : null;
  }
  if (!role) throw new HttpError(403, "Your account does not have Admin Panel access.");
  return { email, role, can: (perm) => PERMISSIONS[role].includes(perm) };
}

export function requirePerm(staff, perm) {
  if (!staff.can(perm)) throw new HttpError(403, "Your role does not allow this action.");
}
