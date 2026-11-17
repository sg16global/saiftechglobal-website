// Minimal method + path router for catch-all Pages Functions ([[path]].js).
import { HttpError, handler } from "./http.js";

export function router(prefix, routes, options) {
  const compiled = routes.map(([method, pattern, fn]) => {
    const keys = [];
    const re = new RegExp(
      "^" +
        pattern.replace(/\//g, "\\/").replace(/:([a-zA-Z_]+)/g, (_, k) => {
          keys.push(k);
          return "([^/]+)";
        }) +
        "\\/?$",
    );
    return { method, re, keys, fn };
  });
  return handler(async (context) => {
    const url = new URL(context.request.url);
    const path = url.pathname.slice(prefix.length) || "/";
    let pathMatched = false;
    for (const r of compiled) {
      const m = path.match(r.re);
      if (!m) continue;
      pathMatched = true;
      if (r.method !== context.request.method) continue;
      const params = Object.fromEntries(r.keys.map((k, i) => [k, decodeURIComponent(m[i + 1])]));
      return r.fn({ ...context, params, url });
    }
    throw new HttpError(pathMatched ? 405 : 404, pathMatched ? "Method not allowed." : "Not found.");
  }, options);
}
