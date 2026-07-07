# Search engine verification (Google, Bing / Edge)

On **Cloudflare Pages**, this repo root is your **public HTML folder** (same as `public_html` on old hosting).

Files here are live at `https://saiftechglobal.com/FILENAME`

## Google Search Console

1. Open https://search.google.com/search-console
2. Add property → **URL prefix** → `https://saiftechglobal.com`
3. Choose verification method:

### Option A — HTML tag (easy with Git)

1. Google gives a meta tag like:
   `content="abc123..."`
2. Open `index.html` in this repo
3. Uncomment and paste your code in the `google-site-verification` line
4. Push to GitHub → Cloudflare auto-deploys
5. Click **Verify** in Search Console

### Option B — HTML file upload

1. Google gives a file name like `google1234567890abcdef.html`
2. Put that file in **this folder** (repo root, next to `index.html`)
3. Push to GitHub
4. Check it opens: `https://saiftechglobal.com/google1234567890abcdef.html`
5. Click **Verify** in Search Console

After verify, submit sitemap: `https://saiftechglobal.com/sitemap.xml`

## Bing Webmaster Tools (also used for Microsoft / Edge search)

1. Open https://www.bing.com/webmasters
2. Add site `https://saiftechglobal.com`
3. Verification:

### Option A — Meta tag

1. Uncomment `msvalidate.01` in `index.html` and paste Bing code
2. Push → verify in Bing

### Option B — XML file

1. Bing gives `BingSiteAuth.xml`
2. Put file in **this folder** (repo root)
3. Push → verify at `https://saiftechglobal.com/BingSiteAuth.xml`

## Already included for SEO

- `robots.txt` — allows all crawlers
- `sitemap.xml` — home + privacy pages
- Organization JSON-LD on home page
- Open Graph tags for sharing

## Send your codes to update the site

If you paste your Google and Bing verification codes, they can be added to `index.html` and pushed for you.
