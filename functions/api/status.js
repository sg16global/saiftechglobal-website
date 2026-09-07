/**
 * Live health of the SG16 product network for the company homepage.
 * Server-side pings so the hero is not a row of fake "Live" badges.
 */
const TARGETS = [
  { id: 'brain', label: 'SG16 Mistral X', url: 'https://api.mistralbrain.com/api/v1/ping' },
  { id: 'engine', label: 'SG16 AI Engine', url: 'https://sg16engine.com/health/live' },
  { id: 'children', label: 'Children World', url: 'https://sg16children.com/api/sg16/health' },
  { id: 'finance', label: 'SG16 Finance', url: 'https://sg16finance.com/api/ticker' },
  { id: 'geo', label: 'Geo Monitor', url: 'https://saifglobal16.info/api/news' },
  { id: 'ads', label: 'Ads Network', url: 'https://ads.saiftechglobal.com/' },
];

async function probe(url) {
  const started = Date.now();
  try {
    const res = await fetch(url, {
      method: 'GET',
      redirect: 'follow',
      signal: AbortSignal.timeout(8000),
      headers: { Accept: 'application/json, text/html;q=0.8' },
    });
    return { ok: res.ok, latencyMs: Date.now() - started, status: res.status };
  } catch {
    return { ok: false, latencyMs: Date.now() - started, status: 0 };
  }
}

export async function onRequestGet() {
  const settled = await Promise.all(TARGETS.map(async (t) => ({ ...t, ...(await probe(t.url)) })));
  const live = settled.filter((s) => s.ok).length;
  return Response.json(
    { updated: Date.now(), live, total: settled.length, platforms: settled },
    {
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'public, max-age=30',
        'Access-Control-Allow-Origin': '*',
      },
    },
  );
}

export async function onRequestOptions() {
  return new Response(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}
