# Musa premium — vanilla static export

Static **HTML + CSS + JS** version of the Musa Spark Arena landing (no React in the browser).

## Preview locally

The preview must run **on your PC** (Cursor’s agent cannot host a URL your browser can open).

**Easiest (Windows):** double‑click **`preview.cmd`** in the repo root, then open:

- **Musa premium:** http://127.0.0.1:3000/musa-premium/

Or in PowerShell from the repo root:

```powershell
npm run preview
```

Open:

- **Classic git homepage:** http://127.0.0.1:3000/
- **Musa premium (vanilla):** http://127.0.0.1:3000/musa-premium/

Do **not** double‑click `musa-premium/index.html` alone — use the server above so CSS/JS load.

Live status pills use the same **`/api/status`** Cloudflare function as the main site (works on Pages deploy; local `serve` will show “unavailable” unless you mock the API).

## Regenerate from Musa React source

1. Put the Musa Vite source in `_musa-react-src/` (or re-unzip from Downloads).
2. `cd _musa-react-src && npm install && npm run build`
3. From repo root: `node scripts/export-musa-vanilla.mjs` (requires `npm install -D playwright` once at root).

Outputs:

- `musa-premium/index.html` — prerendered markup
- `musa-premium/css/musa.css` — Tailwind bundle from build
- `musa-premium/js/musa.js` — mobile menu, FAQ, ads prefetch, `/api/status`

## Deploy on Cloudflare Pages

Same repo deploy as today. Optional paths:

- `/` — existing static site
- `/musa-premium/` — this export

To make Musa the homepage later, swap or redirect after you review content (testimonials, etc.).
