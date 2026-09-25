/**
 * Publishes musa-premium export as https://saiftechglobal.com/ (repo root index.html).
 * Backs up the previous homepage to _internal/backup/ (not a public URL).
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const musaDir = path.join(root, "musa-premium");
const musaIndex = path.join(musaDir, "index.html");

if (!fs.existsSync(musaIndex)) {
  console.error("Missing musa-premium/index.html — run export-musa-vanilla.mjs first.");
  process.exit(1);
}

const backupDir = path.join(root, "_internal", "backup");
const rootIndex = path.join(root, "index.html");
const backupIndex = path.join(backupDir, "homepage-classic.html");

if (fs.existsSync(rootIndex)) {
  const current = fs.readFileSync(rootIndex, "utf8");
  const isMusaHome = current.includes("/css/musa.css") || current.includes('href="css/musa.css"');
  if (!isMusaHome) {
    fs.mkdirSync(backupDir, { recursive: true });
    fs.copyFileSync(rootIndex, backupIndex);
    console.log("Backed up previous homepage → _internal/backup/homepage-classic.html");
  }
}

let html = fs.readFileSync(musaIndex, "utf8");
html = html
  .replace(/href="\.\.\/assets\//g, 'href="/assets/')
  .replace(/href="\.\.\/manifest\.webmanifest"/g, 'href="/manifest.webmanifest"')
  .replace(/href="css\/musa\.css"/g, 'href="/css/musa.css"')
  .replace(/src="js\/musa\.js"/g, 'src="/js/musa.js"')
  .replace(/src="\.\.\/js\/pwa\.js"/g, 'src="/js/pwa.js"')
  .replace(/src="assets\//g, 'src="/assets/');

fs.writeFileSync(rootIndex, html, "utf8");

fs.mkdirSync(path.join(root, "css"), { recursive: true });
fs.mkdirSync(path.join(root, "js"), { recursive: true });
fs.mkdirSync(path.join(root, "assets"), { recursive: true });

fs.copyFileSync(path.join(musaDir, "css", "musa.css"), path.join(root, "css", "musa.css"));
fs.copyFileSync(path.join(musaDir, "js", "musa.js"), path.join(root, "js", "musa.js"));

const musaAssets = path.join(musaDir, "assets");
if (fs.existsSync(musaAssets)) {
  for (const name of fs.readdirSync(musaAssets)) {
    fs.copyFileSync(path.join(musaAssets, name), path.join(root, "assets", name));
  }
}

const redirectHtml = `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta http-equiv="refresh" content="0; url=/" />
    <link rel="canonical" href="https://saiftechglobal.com/" />
    <title>Redirecting…</title>
  </head>
  <body>
    <p><a href="/">Saif Tech Global LLC</a></p>
  </body>
</html>
`;
fs.writeFileSync(path.join(musaDir, "index.html"), redirectHtml, "utf8");

const redirectsPath = path.join(root, "_redirects");
const redirectRules = `/musa-premium\t/\t301
/musa-premium/\t/\t301
/classic\t/404.html\t404
/classic/\t/404.html\t404
/classic/*\t/404.html\t404
/_internal/*\t/404.html\t404
`;
if (!fs.existsSync(redirectsPath) || !fs.readFileSync(redirectsPath, "utf8").includes("/_internal/")) {
  fs.writeFileSync(redirectsPath, redirectRules, "utf8");
}

console.log("Homepage is now Musa at / (index.html). /musa-premium/ → / redirect added.");
