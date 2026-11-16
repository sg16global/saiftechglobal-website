// Edge guard: source code, migrations, config and backups in this repository must never be served publicly.
// (Cloudflare Pages `_redirects` cannot return 404, so this is enforced here; _routes.json sends these paths to Functions.)
const PRIVATE_DIR = /^\/(server|runner|migrations|tests|docs|scripts|_musa-react-src|_internal|\.wrangler|node_modules)(\/|$)/;
const PRIVATE_FILE = /^\/(wrangler\.toml|\.dev\.vars|\.gitignore|package\.json|package-lock\.json|_routes\.json)$/;

export async function onRequest({ request, next, env }) {
  let path = new URL(request.url).pathname;
  try {
    path = decodeURIComponent(path);
  } catch {
    /* keep raw */
  }
  path = path.toLowerCase().replace(/\/{2,}/g, "/");
  if (PRIVATE_DIR.test(path) || PRIVATE_FILE.test(path)) {
    const page = await env.ASSETS.fetch(new URL("/404.html", request.url));
    return new Response(page.body, { status: 404, headers: { "content-type": "text/html; charset=utf-8", "cache-control": "no-store" } });
  }
  return next();
}
