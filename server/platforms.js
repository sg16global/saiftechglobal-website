// Ecosystem platforms served by the Centralized 24/7 Helpline, and signed platform context.
//
// A `?project=` URL parameter is only a HINT (used to pick public documentation). It is never trusted
// for anything private. A platform proves the visitor came from it by passing `?ctx=<token>` where
//   token = base64url(JSON {p: platformId, sub: userRef?, exp: unixSeconds}) + "." + base64url(HMAC-SHA256(secret, payloadPart))
// and the secret is that platform's key in the PLATFORM_SIGNING_KEYS secret: {"finance":"<random>", ...}.
import { b64url, b64urlDecode, hmacSha256, safeEqual } from "./crypto.js";

export const HELPLINE_PLATFORMS = [
  { id: "engine", name: "SG16 AI Engine", aliases: ["sg16-engine", "sg16-ai-engine", "engine"], domain: "sg16engine.com" },
  { id: "finance", name: "SG16 Finance", aliases: ["sg16-finance", "finance"], domain: "sg16finance.com" },
  { id: "children", name: "SG16 Children World", aliases: ["sg16-children", "sg16-children-world", "children"], domain: "sg16children.com" },
  { id: "geo", name: "SG16 Geopolitical Monitor", aliases: ["sg16-geo", "geo-monitor", "geo"], domain: "saifglobal16.info" },
  { id: "ads", name: "SG16 Ads Network", aliases: ["sg16-ads", "ads-network", "ads"], domain: "ads.saiftechglobal.com" },
  { id: "identifier", name: "SG16 Identifier", aliases: ["sg16-identifier", "identifier"], domain: "sg16identifier.com" },
  { id: "company", name: "Saif Tech Global LLC (general)", aliases: ["company", "general", "saiftechglobal"], domain: "saiftechglobal.com" },
];

export function platformFromHint(hint) {
  const h = String(hint || "").toLowerCase().trim();
  return HELPLINE_PLATFORMS.find((p) => p.id === h || p.aliases.includes(h)) || null;
}

export async function verifyPlatformContext(env, token) {
  if (!token || typeof token !== "string" || token.length > 2000) return null;
  const [payloadPart, sigPart] = token.split(".");
  if (!payloadPart || !sigPart) return null;
  let keys = {};
  try {
    keys = JSON.parse(env.PLATFORM_SIGNING_KEYS || "{}");
  } catch {
    return null;
  }
  let payload;
  try {
    payload = JSON.parse(new TextDecoder().decode(b64urlDecode(payloadPart)));
  } catch {
    return null;
  }
  const platform = platformFromHint(payload && payload.p);
  const secret = platform && keys[platform.id];
  if (!secret) return null;
  const expected = b64url(await hmacSha256(new TextEncoder().encode(secret), payloadPart));
  if (!safeEqual(expected, sigPart)) return null;
  if (!Number.isFinite(payload.exp) || payload.exp < Date.now() / 1000) return null;
  return { platform: platform.id, subject: typeof payload.sub === "string" ? payload.sub.slice(0, 200) : null };
}
