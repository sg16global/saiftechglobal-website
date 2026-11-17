// End-to-end acceptance tests for the AI-operated company:
// chat-first → brief confirm → design (revise/approve) → AI price (≥ $10) → sign-in + pay → AI build with frozen tests
// → delivery + STG-M membership → member priority support; plus the automatic-refund path and security checks.
//
// Needs (see docs/working-mode/SETUP.md "Local development"):
//   node tests/mock-dodo.mjs · node tests/local-executor.mjs · wrangler dev -c runner/wrangler.dev.toml (8790)
//   wrangler pages dev . (BASE) — all sharing --persist-to ../wm-state. Uses REAL Workers AI.
import fs from "node:fs";
import crypto from "node:crypto";
import { execSync } from "node:child_process";

const BASE = process.env.BASE || "http://127.0.0.1:8798";
const RUNNER = "http://127.0.0.1:8790";
const MOCK = "http://127.0.0.1:8799";
const RUN = Date.now().toString(36);
const ROOT = new URL("..", import.meta.url);
const rootPath = decodeURIComponent(ROOT.pathname).replace(/^\/([A-Za-z]:)/, "$1");
const vars = Object.fromEntries(
  fs.readFileSync(new URL(".dev.vars", ROOT), "utf8").split(/\r?\n/).filter((l) => l.includes("=")).map((l) => [l.slice(0, l.indexOf("=")), l.slice(l.indexOf("=") + 1)]),
);

let passed = 0;
let failed = 0;
function check(name, cond, info = "") {
  cond ? passed++ : failed++;
  console.log(`${cond ? "PASS" : "FAIL"}  ${name}${cond || !info ? "" : `  -> ${typeof info === "string" ? info : JSON.stringify(info).slice(0, 700)}`}`);
}
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

function client() {
  let cookie = "";
  const keys = {};
  const call = async (method, path, body, { origin = true } = {}) => {
    const m = path.match(/engagements\/(STG-[^/]+)/);
    const res = await fetch(BASE + path, {
      method,
      headers: {
        ...(body !== undefined ? { "content-type": "application/json" } : {}),
        ...(origin ? { origin: BASE } : {}),
        ...(cookie ? { cookie } : {}),
        ...(m && keys[m[1]] ? { "x-engagement-key": keys[m[1]] } : {}),
      },
      body: body === undefined ? undefined : JSON.stringify(body),
      redirect: "manual",
    });
    const set = res.headers.get("set-cookie");
    if (set) cookie = set.split(";")[0];
    const type = res.headers.get("content-type") || "";
    const data = type.includes("json") ? await res.json() : await res.arrayBuffer();
    return { status: res.status, data, type };
  };
  call.keys = keys;
  return call;
}

async function signIn(call, email) {
  const r1 = await call("POST", "/api/auth/request-code", { email });
  return (await call("POST", "/api/auth/verify", { email, code: r1.data.dev_code })).status === 200;
}

function signedWebhook(obj, secret = vars.DODO_WEBHOOK_SECRET) {
  const raw = JSON.stringify(obj);
  const id = `msg_${crypto.randomUUID()}`;
  const ts = Math.floor(Date.now() / 1000);
  const sig = crypto.createHmac("sha256", Buffer.from(secret.replace(/^whsec_/, ""), "base64")).update(`${id}.${ts}.${raw}`).digest("base64");
  return fetch(`${BASE}/api/payments/dodo-webhook`, {
    method: "POST",
    headers: { "content-type": "application/json", "webhook-id": id, "webhook-timestamp": String(ts), "webhook-signature": `v1,${sig}` },
    body: raw,
  }).then(async (r) => ({ status: r.status, data: await r.json().catch(() => null) }));
}

/** Drive the conversation until the AI produces a brief. */
async function toBrief(call, first, followUps) {
  const r = await call("POST", "/api/wm/engagements", { message: first });
  call.keys[r.data.id] = r.data.key;
  let stage = r.data.stage;
  for (const msg of followUps) {
    if (stage === "brief") break;
    stage = (await call("POST", `/api/wm/engagements/${r.data.id}/messages`, { message: msg })).data.stage;
  }
  return { id: r.data.id, first: r, stage };
}

async function payAndStart(call, id) {
  const acc = await call("POST", `/api/wm/engagements/${id}/accept`, { agree: true });
  const st = await call("GET", `/api/wm/engagements/${id}`);
  const paymentId = st.data.payments[st.data.payments.length - 1].id;
  const pay = await fetch(`${MOCK}/_test/pay`, { method: "POST", body: JSON.stringify({ stg_payment_id: paymentId, payment_id: `pay_${id}_${RUN}`, status: "succeeded" }) }).then((x) => x.json());
  const wh = await signedWebhook({ type: "payment.succeeded", data: { payment_id: `pay_${id}_${RUN}`, metadata: pay.metadata } });
  return { acc, wh, paymentId };
}

async function waitForOutcome(call, id, maxMinutes) {
  const end = Date.now() + maxMinutes * 60_000;
  let last;
  while (Date.now() < end) {
    last = (await call("GET", `/api/wm/engagements/${id}`)).data;
    if (["delivered", "refunded"].includes(last.engagement.stage)) return last;
    await sleep(10_000);
  }
  return last;
}

function sql(statement) {
  const file = `${rootPath}../wm-test-${RUN}.sql`;
  fs.writeFileSync(file, statement);
  execSync(`npx --yes wrangler@4 d1 execute stg-company-db --local --persist-to ../wm-state --file "${file}"`, { cwd: rootPath, stdio: "pipe" });
  fs.unlinkSync(file);
}

const RUN_STARTED = Math.floor(Date.now() / 1000);
function sqlJson(statement) {
  const out = execSync(`npx --yes wrangler@4 d1 execute stg-company-db --local --persist-to ../wm-state --json --command "${statement.replace(/"/g, '\\"')}"`, { cwd: rootPath, stdio: "pipe" }).toString();
  return JSON.parse(out.slice(out.indexOf("[")))[0].results;
}

const admin = client();
const alice = client();
const bob = client();
const stranger = client();
console.log("Acceptance tests against", BASE);

// ---------------- website & private files ----------------
{
  const html = await (await fetch(BASE + "/")).text();
  check("Homepage: Working Mode button with tooltip", html.includes(">Working Mode") && html.includes("For Your Destination"));
  for (const p of ["/working-mode/", "/helpline/", "/admin/"]) check(`Page ${p} loads`, (await fetch(BASE + p)).status === 200);
  for (const p of ["/runner/index.js", "/server/builder.js", "/wrangler.toml", "/migrations/0001_company_service.sql"]) check(`Private ${p} is 404`, (await fetch(BASE + p)).status === 404);
  check("Runner rejects unauthenticated start", (await fetch(`${RUNNER}/start`, { method: "POST", body: "{}" })).status === 401);
}

// ---------------- owner rails ----------------
{
  const { DEFAULTS } = await import("../server/settings.js");
  check("Owner rule in code: $10 minimum, 3 retries, auto-refund by default", DEFAULTS.company_policy.min_order_cents === 1000 && DEFAULTS.company_policy.build_retries === 3 && DEFAULTS.company_policy.auto_refund === true);
  const r = await admin("PUT", "/api/admin/settings/company_policy", { value: { payments_enabled: true, build_retries: 3, min_order_cents: 100 } });
  check("Owner rail: $10 minimum cannot be lowered", r.status === 200 && r.data.value.min_order_cents === 1000, r.data);
  check("Partial policy update keeps other settings", r.data.value.build_retries === 3 && r.data.value.payments_enabled === true && r.data.value.auto_refund === true, r.data.value);
  const bad = await admin("PUT", "/api/admin/settings/ai_config", { value: { mistral_models: ["@cf/example/unapproved-model"] } });
  check("AI guard: non-Gemma/Mistral models are rejected", bad.status === 400 && /Only Gemma and Mistral/.test(bad.data.error || ""), bad.data);
  const cfg = (await admin("GET", "/api/admin/settings")).data.settings.ai_config;
  const all = [...cfg.gemma_chat_models, ...cfg.gemma_design_models, ...cfg.mistral_models, ...cfg.rescue_models];
  const G = "@cf/google/gemma-4-26b-a4b-it", M = "@cf/mistralai/mistral-small-3.1-24b-instruct";
  check("AI defaults: exactly Gemma 4 (chat/support/brief/design) + Mistral Small 3.1 (code), Gemma fallback on attempts 3-4", JSON.stringify(cfg.gemma_chat_models) === JSON.stringify([G]) && JSON.stringify(cfg.gemma_design_models) === JSON.stringify([G]) && JSON.stringify(cfg.mistral_models) === JSON.stringify([M]) && JSON.stringify(cfg.rescue_models) === JSON.stringify([G]) && cfg.rescue_from_attempt === 3 && all.every((m) => m === G || m === M), cfg);
  const sl = await admin("PUT", "/api/admin/settings/ai_config", { value: { gemma_chat_models: ["@cf/example/other-gemma-variant"] } });
  check("AI guard: other Gemma variants are rejected too", sl.status === 400, sl.data);
  check("Sign-in works (Alice)", await signIn(alice, `alice+${RUN}@example.com`));
  check("Sign-in works (Bob)", await signIn(bob, `bob+${RUN}@example.com`));
}

// ---------------- 1. chat-first → brief → design → price → pay → AI build → delivery ----------------
let delivered = null;
{
  const anon = client(); // visitor not signed in
  const conv = await toBrief(anon, "Hi! I need a small Node.js module with a function slugify(text) that turns any text into a clean URL slug.", [
    "Lowercase everything, replace spaces and any non-alphanumeric characters with single hyphens, remove accents (é → e), trim hyphens at both ends, and return an empty string for empty input. That's the whole scope — please prepare the brief.",
    "Yes, that covers everything. Please write the brief now.",
    "Correct. Nothing else is needed — go ahead with the brief.",
  ]);
  check("Chat-first: anonymous visitor answered by the company AI", conv.first.status === 201 && typeof conv.first.data.reply === "string", conv.first.data);
  check("AI wrote a project brief after the conversation", conv.stage === "brief", conv.stage);
  const id = conv.id;
  let st = await anon("GET", `/api/wm/engagements/${id}`);
  check("Brief asks the client to confirm", st.data.messages.some((m) => m.kind === "brief" && /what you had in mind/i.test(m.content)) && st.data.engagement.buildable === true, st.data.engagement);
  check("Security: a stranger cannot open the project without its key", (await stranger("GET", `/api/wm/engagements/${id}`)).status === 404);

  let r = await anon("POST", `/api/wm/engagements/${id}/brief/confirm`, {});
  st = await anon("GET", `/api/wm/engagements/${id}`);
  check("Client confirmed → design phase", r.status === 200 && st.data.engagement.stage === "design" && !!(st.data.engagement.design_md || st.data.engagement.design_html), st.data.engagement);
  r = await anon("POST", `/api/wm/engagements/${id}/design/revise`, { message: "Please also mention that numbers are kept, e.g. 'Top 10 Tips' → 'top-10-tips'." });
  st = await anon("GET", `/api/wm/engagements/${id}`);
  check("Client can request design changes (v2)", r.status === 200 && st.data.engagement.design_version === 2, st.data.engagement.design_version);
  r = await anon("POST", `/api/wm/engagements/${id}/design/approve`, {});
  st = await anon("GET", `/api/wm/engagements/${id}`);
  const e = st.data.engagement;
  check("AI priced the approved design (≥ $10, with rationale)", e.stage === "quoted" && e.price_cents >= 1000 && !!(e.price && e.price.rationale), e);
  console.log(`      AI price: $${e.price_cents / 100} — ${e.price && e.price.rationale}`);

  r = await anon("POST", `/api/wm/engagements/${id}/accept`, { agree: true });
  check("Paying requires sign-in", r.status === 401, r.status);
  alice.keys[id] = anon.keys[id];
  check("Signed-in client claims the anonymous project", (await alice("POST", `/api/wm/engagements/${id}/claim`, {})).status === 200);
  const { acc, wh } = await payAndStart(alice, id);
  check("Accept returns a secure checkout link", acc.status === 200 && /^https:\/\//.test(acc.data.checkout_url || ""), acc.data);
  check("Verified payment starts the AI build automatically", wh.status === 200 && wh.data.result === "payment-succeeded", wh);
  console.log("      … AI is writing tests and code (real Workers AI + real test runs). This can take several minutes.");
  delivered = await waitForOutcome(alice, id, 25);
  const ds = delivered.engagement;
  console.log(`      Outcome: ${ds.stage} after ${ds.build_attempts} attempt(s): ${delivered.builds.map((b) => `${b.attempt}:${b.status}`).join(", ")}`);
  check("Build loop reached a final outcome (delivered or auto-refunded)", ["delivered", "refunded"].includes(ds.stage), ds);
  check("Never more than 1 + 3 attempts", ds.build_attempts <= 4, ds.build_attempts);
  if (ds.stage === "delivered") {
    check("Delivery: tests passed and files listed", delivered.builds.some((b) => b.status === "passed") && !!delivered.delivery && delivered.delivery.files.length >= 2, delivered.delivery);
    check("Delivery: STG-M lifetime token issued", /^STG-M-[A-Z0-9]{6}$/.test((delivered.member || {}).token || ""), delivered.member);
    const zip = await alice("GET", `/api/wm/engagements/${id}/download`);
    check("Delivery: client downloads the zip", zip.status === 200 && zip.type.includes("zip") && zip.data.byteLength > 200, { status: zip.status, type: zip.type });
    check("Security: another customer cannot download it", (await bob("GET", `/api/wm/engagements/${id}/download`)).status === 404);
  } else {
    const p = delivered.payments[delivered.payments.length - 1];
    check("Auto-refund issued when tests kept failing", ["refund_pending", "refunded"].includes(p.status), p);
  }
}

// ---------------- 2. lifetime member priority support ----------------
if (delivered && delivered.engagement.stage === "delivered") {
  const s = await alice("POST", "/api/helpline/sessions", { project: "company" });
  check("Helpline recognises the lifetime member", s.status === 201 && s.data.member === delivered.member.token, s.data);
  const m = await alice("POST", `/api/helpline/sessions/${s.data.id}/messages`, { message: "How do I use the slugify function you delivered, and which file is it in?" });
  check("Member support knows the delivered project", m.status === 200 && /slugify/i.test(m.data.reply || "") && /\.mjs|src\//i.test(m.data.reply || ""), m.data);
  const t = await alice("POST", "/api/helpline/tickets", { subject: "Question about my delivery", description: "Can slugify handle emoji?", session_id: s.data.id });
  check("Member ticket gets lifetime priority and an instant AI answer", t.status === 201 && t.data.priority === "high" && t.data.status === "answered", t.data);
}

// ---------------- 3. everyone gets 24/7 support ----------------
{
  const anon = client();
  const s = await anon("POST", "/api/helpline/sessions", { project: "sg16-finance" });
  const m = await anon("POST", `/api/helpline/sessions/${s.data.id}/messages`, { message: "What does the SG16 Finance dashboard show?" });
  check("Any ecosystem user gets 24/7 AI support (no account)", m.status === 200 && (m.data.reply || "").length > 20, m.data);
  const t = await bob("POST", "/api/helpline/tickets", { subject: "Finance login help", description: "I cannot find the sign-in button.", platform: "sg16-finance" });
  check("Non-member ticket answered by AI at normal priority", t.status === 201 && t.data.priority === "normal" && t.data.status === "answered", t.data);
  check("Security: Alice cannot read Bob's ticket", (await alice("GET", `/api/helpline/tickets/${t.data.id}`)).status === 404);
}

// ---------------- 4. deterministic auto-refund path ----------------
{
  await admin("PUT", "/api/admin/settings/company_policy", { value: { build_retries: 1 } }); // speed: 2 attempts in this test
  const conv = await toBrief(bob, "I need a tiny Node.js module exporting add(a, b) that returns the sum of two numbers.", [
    "That's all: add(a, b) returns a + b for numbers. Please prepare the brief.",
    "Yes, exactly that. Write the brief.",
    "Confirmed, nothing else.",
  ]);
  const id = conv.id;
  await bob("POST", `/api/wm/engagements/${id}/brief/confirm`, {});
  await bob("POST", `/api/wm/engagements/${id}/design/approve`, {});
  // Freeze an impossible acceptance test so no implementation can pass it.
  const impossible = JSON.stringify({
    contract: "Create src/add.mjs exporting add(a, b).",
    files: [{ path: "tests/acceptance.test.mjs", content: 'import test from "node:test";\nimport assert from "node:assert/strict";\ntest("impossible requirement", () => { assert.equal(1, 2); });\n' }],
  });
  sql(`UPDATE engagements SET tests_json = '${impossible.replace(/'/g, "''")}' WHERE id = '${id}';`);
  const { wh } = await payAndStart(bob, id);
  check("Refund path: build started after payment", wh.status === 200 && wh.data.result === "payment-succeeded", wh);
  const out = await waitForOutcome(bob, id, 15);
  const p = out.payments[out.payments.length - 1];
  check("Failing tests → retried, then refunded automatically", out.engagement.stage === "refunded" && out.engagement.build_attempts === 2 && p.status === "refund_pending", { e: out.engagement, p });
  const refunds = await fetch(`${MOCK}/_test/refunds`).then((x) => x.json());
  const ref = refunds.find((x) => x.metadata && x.metadata.stg_payment_id === p.id);
  check("Refund sent to the payment provider", !!ref, refunds);
  const r = await signedWebhook({ type: "refund.succeeded", data: { refund_id: ref && ref.refund_id, payment_id: ref && ref.payment_id } });
  const after = await bob("GET", `/api/wm/engagements/${id}`);
  check("Refund webhook completes the refund", r.status === 200 && after.data.payments.at(-1).status === "refunded", { r, p: after.data.payments.at(-1) });
  await admin("PUT", "/api/admin/settings/company_policy", { value: { build_retries: 3 } });
}

// ---------------- 5. payment security & observer panel ----------------
{
  const raw = JSON.stringify({ type: "payment.succeeded", data: { payment_id: "x", metadata: { stg_payment_id: "pay_x" } } });
  const r = await fetch(`${BASE}/api/payments/dodo-webhook`, { method: "POST", headers: { "content-type": "application/json", "webhook-id": "m1", "webhook-timestamp": String(Math.floor(Date.now() / 1000)), "webhook-signature": "v1,AAAA" }, body: raw });
  check("Forged payment webhook rejected", r.status === 401);
  const ov = await admin("GET", "/api/admin/overview");
  check("Admin overview observes the AI's work (no approval queue)", ov.status === 200 && !!ov.data.stages && !("pending_approvals" in ov.data), ov.data);
}

// ---------------- 6. two-tier routing actually used ----------------
{
  const rows = sqlJson(`SELECT task, model, COUNT(*) AS n FROM ai_usage WHERE created_at >= ${RUN_STARTED} AND ok = 1 GROUP BY task, model`);
  const byTask = (re) => rows.filter((r) => re.test(r.task)).map((r) => r.model);
  const gemmaTasks = byTask(/^(representative|brief|design|helpline|ticket)$/);
  const mistralTasks = byTask(/^(pricing|qa_contract|qa_tests|code_plan|code_file|code_fix|final_review|delivery_readme)$/);
  console.log("      Models used this run:", rows.map((r) => `${r.task}→${r.model.split("/").pop()}×${r.n}`).join(", "));
  check("Gemma layer handled chat, brief, design and support", gemmaTasks.length > 0 && gemmaTasks.every((m) => m === "@cf/google/gemma-4-26b-a4b-it"), gemmaTasks);
  check("Mistral layer handled pricing, tests, code and delivery docs", mistralTasks.length > 0 && byTask(/^(pricing|qa_contract|qa_tests|final_review|delivery_readme)$/).every((m) => m === "@cf/mistralai/mistral-small-3.1-24b-instruct"), mistralTasks);
  check("Zero calls to any model other than the two approved IDs", rows.every((r) => r.model === "@cf/google/gemma-4-26b-a4b-it" || r.model === "@cf/mistralai/mistral-small-3.1-24b-instruct"), rows.filter((r) => r.model !== "@cf/google/gemma-4-26b-a4b-it" && r.model !== "@cf/mistralai/mistral-small-3.1-24b-instruct"));
}

console.log(`\n${passed} passed, ${failed} failed`);
process.exit(failed ? 1 : 0);
