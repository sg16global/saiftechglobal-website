# Saif Tech Global — Company Website

Premium static company site for **https://saiftechglobal.com**, ready for **Cloudflare Pages**.

## Deploy on Cloudflare Pages

1. Push this folder to GitHub (new repo, e.g. `saiftechglobal-website`).
2. Cloudflare Dashboard → **Workers & Pages** → **Create** → **Pages** → **Connect to Git**.
3. Select the repo.
4. Build settings:
   - **Framework preset:** None
   - **Build command:** *(leave empty)*
   - **Build output directory:** `/` (repo root)
5. Deploy.

### Custom domain

1. Pages project → **Custom domains** → add `saiftechglobal.com` and `www.saiftechglobal.com`.
2. Cloudflare DNS should point to Pages automatically if the domain is on Cloudflare.

### Direct upload (no Git)

1. Cloudflare Dashboard → **Workers & Pages** → **Create** → **Pages** → **Upload assets**.
2. Zip the contents of this folder (not the parent folder name) and upload.

## Local preview

Open `index.html` in a browser, or run:

```powershell
npx --yes serve .
```

Then visit `http://localhost:3000`.

## Structure

- `index.html` — home page with products, about, contact
- `privacy.html` — updated privacy policy
- `css/site.css` — premium dark theme matching your logo
- `assets/logo.png` — company logo

## Search verification (Google / Bing / Edge)

See **`verification/README.md`**. Repo root = public web root on Cloudflare Pages.

Quick steps:
1. Google Search Console → verify with HTML tag or HTML file in repo root
2. Bing Webmaster → verify (covers Microsoft Edge search too)
3. Submit sitemap: `https://saiftechglobal.com/sitemap.xml`

## Add a new app later

Duplicate a `.product-card` block in `index.html` and change the name, description, and link.

Live products today:
- **SG16 AI Engine** → https://sg16engine.com
- **SaifGlobal16 Monitor** → https://www.saifglobal16.info
