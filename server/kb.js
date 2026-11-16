// Company knowledge base retrieval (verified documents only).
// Lightweight keyword scoring over D1 — no external vector service required.

const STOP = new Set("the a an and or of to in on for with is are be it this that my our your i we you how what why can do does please".split(" "));

function tokens(text) {
  return (text || "")
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, " ")
    .split(/\s+/)
    .filter((t) => t.length > 2 && !STOP.has(t));
}

/** Return up to `k` verified docs from the given scopes, best keyword matches first. */
export async function retrieve(env, scopes, query, k = 6) {
  const placeholders = scopes.map(() => "?").join(",");
  const { results } = await env.DB.prepare(`SELECT id, scope, title, body FROM kb_docs WHERE verified = 1 AND scope IN (${placeholders})`)
    .bind(...scopes)
    .all();
  const q = new Set(tokens(query));
  const scored = (results || []).map((d) => {
    const words = tokens(`${d.title} ${d.title} ${d.body}`);
    let score = 0;
    for (const w of words) if (q.has(w)) score++;
    // always keep the core overview documents in play
    if (/overview/i.test(d.title)) score += 2;
    return { ...d, score };
  });
  return scored.sort((a, b) => b.score - a.score).slice(0, k);
}

export function formatDocs(docs, maxChars = 9000) {
  let out = "";
  for (const d of docs) {
    const block = `### ${d.title} [${d.scope}]\n${d.body}\n\n`;
    if (out.length + block.length > maxChars) break;
    out += block;
  }
  return out || "(no verified documentation found)";
}
