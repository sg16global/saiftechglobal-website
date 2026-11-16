// Small crypto helpers built on Web Crypto (available in Workers and Node 20+).

const enc = new TextEncoder();

export function randomBytes(n) {
  const b = new Uint8Array(n);
  crypto.getRandomValues(b);
  return b;
}

export function b64url(bytes) {
  let s = "";
  for (const x of bytes) s += String.fromCharCode(x);
  return btoa(s).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

export function b64urlDecode(str) {
  const s = str.replace(/-/g, "+").replace(/_/g, "/");
  const bin = atob(s + "===".slice((s.length + 3) % 4));
  return Uint8Array.from(bin, (c) => c.charCodeAt(0));
}

export function b64(bytes) {
  let s = "";
  for (const x of new Uint8Array(bytes)) s += String.fromCharCode(x);
  return btoa(s);
}

export function b64Decode(str) {
  return Uint8Array.from(atob(str), (c) => c.charCodeAt(0));
}

/** Prefixed random id, e.g. id("cns") -> "cns_k3J9…" */
export function id(prefix, bytes = 12) {
  return `${prefix}_${b64url(randomBytes(bytes))}`;
}

/** Human-friendly id such as STG-2026-7KQ4M9 (no ambiguous characters). */
export function humanId(prefix) {
  const alphabet = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";
  const bytes = randomBytes(6);
  let out = "";
  for (const b of bytes) out += alphabet[b % alphabet.length];
  return `${prefix}-${new Date().getUTCFullYear()}-${out}`;
}

/** Uniform 6-digit code (rejection sampling, no modulo bias). */
export function randomDigits(len = 6) {
  let out = "";
  while (out.length < len) {
    const [b] = randomBytes(1);
    if (b < 250) out += String(b % 10);
  }
  return out;
}

export async function sha256Hex(text) {
  const d = await crypto.subtle.digest("SHA-256", enc.encode(text));
  return [...new Uint8Array(d)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

export async function hmacSha256(keyBytes, message) {
  const key = await crypto.subtle.importKey("raw", keyBytes, { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  return new Uint8Array(await crypto.subtle.sign("HMAC", key, enc.encode(message)));
}

/** Constant-time comparison of two strings. */
export function safeEqual(a, b) {
  if (typeof a !== "string" || typeof b !== "string") return false;
  const ea = enc.encode(a);
  const eb = enc.encode(b);
  let diff = ea.length ^ eb.length;
  const n = Math.max(ea.length, eb.length);
  for (let i = 0; i < n; i++) diff |= (ea[i] || 0) ^ (eb[i] || 0);
  return diff === 0;
}
