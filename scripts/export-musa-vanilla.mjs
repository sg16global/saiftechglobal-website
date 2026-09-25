/**
 * Renders Musa React dist once in headless Chromium and exports static HTML + CSS.
 * Run after: cd _musa-react-src && npm install && npm run build
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { chromium } from "playwright";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");
const distHtml = path.join(root, "_musa-react-src", "dist", "index.html");
const outDir = path.join(root, "musa-premium");

if (!fs.existsSync(distHtml)) {
  console.error("Missing build. Run: cd _musa-react-src && npm run build");
  process.exit(1);
}

const built = fs.readFileSync(distHtml, "utf8");
const styleBlocks = [...built.matchAll(/<style[^>]*>([\s\S]*?)<\/style>/gi)].map((m) => m[1].trim());
const css = styleBlocks.join("\n\n");

const fileUrl = "file:///" + distHtml.replace(/\\/g, "/");

const browser = await chromium.launch();
const page = await browser.newPage();
await page.goto(fileUrl, { waitUntil: "networkidle", timeout: 120_000 });
await page.waitForTimeout(3500);

const mainHtml = await page.locator("#root").innerHTML();

await browser.close();

fs.mkdirSync(path.join(outDir, "css"), { recursive: true });
fs.mkdirSync(path.join(outDir, "js"), { recursive: true });
fs.mkdirSync(path.join(outDir, "assets"), { recursive: true });
const musaPublicAssets = path.join(root, "_musa-react-src", "public", "assets");
if (fs.existsSync(musaPublicAssets)) {
  for (const name of fs.readdirSync(musaPublicAssets)) {
    fs.copyFileSync(path.join(musaPublicAssets, name), path.join(outDir, "assets", name));
  }
}
fs.writeFileSync(path.join(outDir, "css", "musa.css"), css, "utf8");

/** Point prerendered img tags at static files (avoid broken file:// URLs). */
const assetizedHtml = mainHtml.replace(
  /src="(?:file:\/\/[^"]*\/assets\/|\/assets\/)([^"]+)"/g,
  'src="assets/$1"',
);

const headMeta = built.match(/<head>([\s\S]*?)<\/head>/i)?.[1] ?? "";
const cleanedHead = headMeta
  .replace(/<script[\s\S]*?<\/script>/gi, "")
  .replace(/<style[\s\S]*?<\/style>/gi, "")
  .replace(/<link rel="icon"[^>]*data:image[^>]*>/i, "")
  .trim();

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: "Saif Tech Global LLC",
  url: "https://saiftechglobal.com",
  logo: "https://saiftechglobal.com/assets/logo-llc.jpg",
  email: "contact@saiftechglobal.com",
  address: {
    "@type": "PostalAddress",
    streetAddress: "8206 Louisiana Blvd NE, Ste A #10595",
    addressLocality: "Albuquerque",
    addressRegion: "NM",
    postalCode: "87113",
    addressCountry: "US",
  },
  sameAs: [
    "https://sg16engine.com",
    "https://sg16children.com",
    "https://sg16finance.com",
    "https://saifglobal16.info",
    "https://ads.saiftechglobal.com",
  ],
};

const html = `<!DOCTYPE html>
<html lang="en">
  <head>
${cleanedHead}
    <link rel="icon" type="image/png" sizes="192x192" href="../assets/icons/icon-192.png" />
    <link rel="apple-touch-icon" href="../assets/icons/icon-192.png" />
    <link rel="manifest" href="../manifest.webmanifest" />
    <link rel="stylesheet" href="css/musa.css" />
    <script type="application/ld+json">${JSON.stringify(jsonLd)}</script>
  </head>
  <body>
${assetizedHtml}
    <script src="js/musa.js" defer></script>
    <script src="../js/pwa.js" defer></script>
  </body>
</html>
`;

fs.writeFileSync(path.join(outDir, "index.html"), html, "utf8");
console.log("Wrote musa-premium/index.html + css/musa.css (" + Math.round(html.length / 1024) + " KB HTML)");
