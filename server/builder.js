// The company AI's build engine (runs inside the build runner Worker, never in the website request path).
// 1. QA writes acceptance tests FIRST (frozen; must fail on an empty project).
// 2. Developer plans + writes the implementation (cannot touch tests).
// 3. Tests run in an isolated sandbox. Pass → deliver + membership. Fail → retry with the failure output,
//    up to company_policy.build_retries more times → then automatic full refund.
import { now } from "./http.js";
import { id, humanId } from "./crypto.js";
import { AIUnavailable, runAI, runAIJson } from "./ai.js";
import { getSetting } from "./settings.js";
import { FINAL_REVIEW_PROMPT, FIX_FILE_PROMPT, PLAN_FILES_PROMPT, QA_CONTRACT_PROMPT, QA_TESTS_PROMPT, README_PROMPT, WRITE_FILE_PROMPT } from "./prompts.js";
import { refundEngagement } from "./payments.js";
import { audit } from "./audit.js";

const TEST_PATH = "tests/acceptance.test.mjs";
const TEST_COMMAND = `node --test ${TEST_PATH}`;
const MAX_FILE_CHARS = 80_000;

/** Pull the code out of a model reply: drop <think> blocks; if fenced, keep the largest fenced block. */
export function stripFences(text) {
  let t = String(text || "").replace(/<think>[\s\S]*?<\/think>/gi, "").trim();
  const blocks = [...t.matchAll(/```[a-zA-Z0-9_+-]*[ \t]*\r?\n([\s\S]*?)```/g)].map((m) => m[1]);
  if (blocks.length) t = blocks.sort((a, b) => b.length - a.length)[0];
  else t = t.replace(/^\s*```[a-zA-Z0-9]*\s*\n/, "").replace(/\n```\s*$/, "");
  return t.trimEnd() + "\n";
}

/** Keep the lines that explain a failure (errors, assertions, causes) instead of the noisy tail. */
export function keyErrors(output, max = 40) {
  const lines = String(output || "").split(/\r?\n/);
  const keep = [];
  const seen = new Set();
  for (const raw of lines) {
    const l = raw.trim();
    if (!l || seen.has(l)) continue;
    if (/(Error|ERR_|assert|Assertion|expected|actual|cause|not ok|✖|does not provide|is not a function|Cannot find|undefined)/i.test(l) && !/^at /.test(l) && !/node:internal/.test(l)) {
      keep.push(l.slice(0, 300));
      seen.add(l);
    }
    if (keep.length >= max) break;
  }
  return keep.join("\n") || String(output || "").slice(-2000);
}

/** Smoke check: syntax of every JS file, and that every ES module actually imports (catches invented APIs). */
function smokeFile(files) {
  const mods = files.filter((f) => /\.mjs$/.test(f.path) && !f.path.startsWith("tests/")).map((f) => f.path);
  return {
    path: "tests/_smoke.mjs",
    content: `const mods = ${JSON.stringify(mods)};
let bad = 0;
for (const m of mods) {
  try { await import("../" + m); } catch (e) { bad++; console.error("IMPORT_FAIL " + m + " :: " + (e && e.message)); }
}
process.exit(bad ? 1 : 0);
`,
  };
}

function safePath(p) {
  const clean = String(p || "").replace(/\\/g, "/").replace(/^\.?\/+/, "");
  if (!clean || clean.includes("..") || clean.startsWith("tests/") || /^readme\.md$/i.test(clean) || clean.length > 120) return null;
  if (!/^[a-zA-Z0-9._\-/]+$/.test(clean)) return null;
  return clean;
}

async function note(env, engagementId, content, kind = "build") {
  await env.DB.prepare("INSERT INTO engagement_messages (id, engagement_id, role, kind, content, created_at) VALUES (?, ?, 'notice', ?, ?, ?)")
    .bind(id("emg"), engagementId, kind, content, now())
    .run();
}

async function emailCustomer(env, customerId, subject, text) {
  if (!env.RESEND_API_KEY || !customerId) return;
  try {
    const c = await env.DB.prepare("SELECT email FROM customers WHERE id = ?").bind(customerId).first();
    if (!c) return;
    await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${env.RESEND_API_KEY}`, "content-type": "application/json" },
      body: JSON.stringify({ from: env.EMAIL_FROM, to: [c.email], subject, text }),
    });
  } catch (e) {
    console.error("email failed", e && e.message);
  }
}

function designContext(e) {
  if (e.design_kind === "ui_mockup" && e.design_html) return `Approved visual mock-up (HTML reference — reproduce this look):\n${e.design_html.slice(0, 9000)}`;
  if (e.design_md) return `Approved solution outline:\n${e.design_md}`;
  return "";
}

/** Step 1 — frozen acceptance tests, validated in the sandbox. */
async function ensureTests(env, e, executor) {
  if (e.tests_json) return JSON.parse(e.tests_json);
  const brief = JSON.parse(e.brief_json);
  for (let i = 0; i < 2; i++) {
    const briefText = `Project brief:\n${JSON.stringify(brief)}\n\n${designContext(e)}`;
    const { text: contractText } = await runAI(env, "qa_contract", [
      { role: "system", content: QA_CONTRACT_PROMPT },
      { role: "user", content: briefText },
    ], { maxTokens: 1200, temperature: 0.1, long: true, chain: "mistral" });
    const contract = contractText.slice(0, 8000);
    const { text: testText } = await runAI(env, "qa_tests", [
      { role: "system", content: QA_TESTS_PROMPT },
      { role: "user", content: `${briefText}\n\nContract:\n${contract}` },
    ], { maxTokens: 3500, temperature: 0.1, long: true, chain: "mistral" });
    const testFile = stripFences(testText);
    if (!testFile.includes("node:test") || !contract) continue;
    const files = [{ path: TEST_PATH, content: testFile }];
    const syntax = await executor.run({ files, command: `node --check ${TEST_PATH}`, timeoutMs: 30000 });
    if (syntax.exitCode !== 0) continue;
    const empty = await executor.run({ files, command: TEST_COMMAND, timeoutMs: 60000 });
    if (empty.exitCode === 0) continue; // tests that pass with no implementation prove nothing
    const tests = { contract, files };
    await env.DB.prepare("UPDATE engagements SET tests_json = ?, updated_at = ? WHERE id = ?").bind(JSON.stringify(tests), now(), e.id).run();
    await note(env, e.id, "Acceptance tests are written and frozen. Building now.");
    return tests;
  }
  throw new AIUnavailable(); // transient: try again later
}

/** Step 2+3 — one build attempt. Returns { outcome: "passed"|"failed", buildId } or throws AIUnavailable (transient). */
async function attemptBuild(env, e, tests, executor, attempt) {
  const brief = JSON.parse(e.brief_json);
  const rescueFrom = (await getSetting(env, "ai_config")).rescue_from_attempt || 3;
  const prev = attempt > 1
    ? await env.DB.prepare("SELECT id, test_output FROM builds WHERE engagement_id = ? AND attempt = ?").bind(e.id, attempt - 1).first()
    : null;
  const prevFiles = new Map();
  if (prev) {
    const { results } = await env.DB.prepare("SELECT path, content FROM build_files WHERE build_id = ?").bind(prev.id).all();
    for (const f of results || []) if (!f.path.startsWith("tests/") && f.path !== "README.md") prevFiles.set(f.path, f.content);
  }
  const testText = tests.files.map((f) => f.content).join("\n");
  const failure = prev ? `\n\nThe previous attempt FAILED the acceptance tests. These are the exact errors — fix their root cause and do not repeat the same approach:\n${keyErrors(prev.test_output)}` : "";
  const baseContext = `Project brief:\n${JSON.stringify(brief)}\n\n${designContext(e)}\n\nContract:\n${tests.contract}\n\nFrozen acceptance tests (${TEST_PATH}):\n${testText.slice(0, 12000)}${failure}`;

  const { data: plan } = await runAIJson(env, "code_plan", [
    { role: "system", content: PLAN_FILES_PROMPT },
    { role: "user", content: baseContext + (prevFiles.size ? `\n\nFiles in the previous attempt: ${[...prevFiles.keys()].join(", ")}` : "") },
  ], { maxTokens: 900, chain: attempt >= rescueFrom ? "mistral_rescue" : "mistral" });
  const planned = (Array.isArray(plan.files) ? plan.files : [])
    .map((f) => ({ path: safePath(f && f.path), purpose: String((f && f.purpose) || "").slice(0, 300) }))
    .filter((f) => f.path)
    .slice(0, 15);
  if (!planned.length) throw new AIUnavailable();

  const written = [];
  let budget = 18000;
  for (const f of planned) {
    const others = written.map((w) => `--- ${w.path}\n${w.content.slice(0, Math.max(0, Math.min(6000, budget)))}`).join("\n");
    const previousVersion = prevFiles.has(f.path) ? `\n\nPrevious version of ${f.path} (failed the tests — fix it):\n${prevFiles.get(f.path).slice(0, 10000)}` : "";
    const { text, model } = await runAI(
      env,
      "code_file",
      [
        { role: "system", content: WRITE_FILE_PROMPT },
        {
          role: "user",
          content: `${baseContext}\n\nPlanned files:\n${planned.map((p) => `- ${p.path}: ${p.purpose}`).join("\n")}\n\nAlready written:\n${others || "(none)"}${previousVersion}\n\nWrite the complete content of: ${f.path}`,
        },
      ],
      { maxTokens: 4000, temperature: 0.2, long: true, chain: attempt >= rescueFrom ? "mistral_rescue" : "mistral" },
    );
    const content = stripFences(text).slice(0, MAX_FILE_CHARS);
    written.push({ path: f.path, content, model });
    budget -= Math.min(6000, content.length);
  }

  // Self-check before testing: syntax + real imports. Repair broken files (not counted as an attempt).
  const chainForAttempt = attempt >= rescueFrom ? "mistral_rescue" : "mistral";
  for (let round = 0; round < 2; round++) {
    const problems = [];
    for (const w of written) {
      if (!/\.mjs$/.test(w.path)) continue; // browser .js may be ES modules that node --check would misread
      const r = await executor.run({ files: [{ path: w.path, content: w.content }], command: `node --check ${w.path}`, timeoutMs: 20000 });
      if (r.exitCode !== 0) problems.push({ path: w.path, error: keyErrors(`${r.stdout}\n${r.stderr}`, 12) });
    }
    if (!problems.length) {
      const smoke = await executor.run({ files: [...written.map(({ path, content }) => ({ path, content })), smokeFile(written)], command: "node tests/_smoke.mjs", timeoutMs: 30000 });
      for (const m of `${smoke.stdout}\n${smoke.stderr}`.matchAll(/IMPORT_FAIL (\S+) :: (.*)/g)) problems.push({ path: m[1], error: m[2].slice(0, 400) });
    }
    if (!problems.length) break;
    for (const p of problems) {
      const w = written.find((x) => x.path === p.path);
      if (!w) continue;
      const { text } = await runAI(
        env,
        "code_fix",
        [
          { role: "system", content: FIX_FILE_PROMPT },
          { role: "user", content: `${baseContext}\n\nFile ${w.path}:\n${w.content.slice(0, 12000)}\n\nError when loading it:\n${p.error}\n\nReturn the corrected ${w.path}.` },
        ],
        { maxTokens: 4000, temperature: 0.1, long: true, chain: chainForAttempt },
      );
      w.content = stripFences(text).slice(0, MAX_FILE_CHARS);
    }
  }

  const files = [...written.map(({ path, content }) => ({ path, content })), ...tests.files];
  const buildId = id("bld");
  const t = now();
  await env.DB.prepare("INSERT INTO builds (id, engagement_id, attempt, status, model, started_at) VALUES (?, ?, ?, 'running', ?, ?)")
    .bind(buildId, e.id, attempt, written[0] ? written[0].model : null, t)
    .run();
  await env.DB.prepare("UPDATE engagements SET build_attempts = ?, build_state = 'running', updated_at = ? WHERE id = ?").bind(attempt, t, e.id).run();

  const result = await executor.run({ files, command: TEST_COMMAND, timeoutMs: 120000 });
  const passed = result.exitCode === 0;
  const output = `${result.stdout || ""}\n${result.stderr || ""}${result.timedOut ? "\n[timed out]" : ""}`.slice(-8000);
  const stmts = [
    env.DB.prepare("UPDATE builds SET status = ?, exit_code = ?, test_output = ?, finished_at = ? WHERE id = ?").bind(passed ? "passed" : "failed", result.exitCode, output, now(), buildId),
    ...files.map((f) => env.DB.prepare("INSERT INTO build_files (build_id, path, content) VALUES (?, ?, ?)").bind(buildId, f.path, f.content)),
  ];
  await env.DB.batch(stmts);
  return { outcome: passed ? "passed" : "failed", buildId, output };
}

async function deliver(env, e, buildId, output) {
  const brief = JSON.parse(e.brief_json);
  const passedLine = (output.match(/# pass (\d+)/) || [])[1];
  // Mistral layer: final quality verification + delivery documentation (best effort; the tests remain the gate).
  const { results: delivered } = await env.DB.prepare("SELECT path, content FROM build_files WHERE build_id = ? ORDER BY path").bind(buildId).all();
  const fileDigest = (delivered || []).map((f) => `--- ${f.path}\n${f.content.slice(0, 5000)}`).join("\n").slice(0, 30000);
  let verification = null;
  let aiReadme = null;
  try {
    const v = await runAI(env, "final_review", [
      { role: "system", content: FINAL_REVIEW_PROMPT },
      { role: "user", content: `Brief:\n${JSON.stringify(brief)}\n\nTest result: ${passedLine ? `${passedLine} tests passed` : "all tests passed"}\n\nDelivered files:\n${fileDigest}` },
    ], { maxTokens: 1500, temperature: 0.1, long: true, chain: "mistral" });
    verification = stripFences(v.text);
    const r = await runAI(env, "delivery_readme", [
      { role: "system", content: README_PROMPT },
      { role: "user", content: `Project ${e.id}\nBrief:\n${JSON.stringify(brief)}\n\nFiles: ${(delivered || []).map((f) => f.path).join(", ")}\nTests: node --test tests/acceptance.test.mjs (${passedLine || "all"} passed)` },
    ], { maxTokens: 1500, temperature: 0.2, long: true, chain: "mistral" });
    aiReadme = stripFences(r.text);
  } catch (err) {
    if (!(err instanceof AIUnavailable)) console.error("delivery docs failed", err);
  }
  if (verification) {
    await env.DB.prepare("INSERT INTO build_files (build_id, path, content) VALUES (?, 'VERIFICATION.md', ?) ON CONFLICT(build_id, path) DO UPDATE SET content = excluded.content")
      .bind(buildId, `# Final quality verification\n\n${verification}\n`)
      .run();
  }
  const readme = aiReadme && aiReadme.length > 200 ? `${aiReadme.trimEnd()}\n\n---\nVerified by acceptance tests (${passedLine ? `${passedLine} passed` : "all passed"}). Lifetime 24/7 priority support: https://saiftechglobal.com/helpline · Project ${e.id} · © 2026 Saif Tech Global LLC\n` : [
    `# ${brief.title}`,
    "",
    brief.summary,
    "",
    "## What is included",
    ...brief.features.map((f) => `- **${f.name}** — ${f.description}`),
    "",
    "## How to use",
    brief.has_ui ? "Open `index.html` (or the main HTML file) in a modern browser. No installation is required." : "Requires Node.js 24 or newer. No packages to install — only Node.js built-in modules are used.",
    "",
    "## Verification",
    `Delivered by Saif Tech Global LLC after passing its acceptance tests (${passedLine ? `${passedLine} tests passed` : "all tests passed"}).`,
    "Run them yourself with: `node --test tests/acceptance.test.mjs`",
    "",
    "## Support",
    "Your lifetime membership token gives you 24/7 priority support at https://saiftechglobal.com/helpline",
    "",
    `Project ${e.id} · © 2026 Saif Tech Global LLC`,
    "",
  ].join("\n");
  await env.DB.prepare("INSERT INTO build_files (build_id, path, content) VALUES (?, 'README.md', ?) ON CONFLICT(build_id, path) DO UPDATE SET content = excluded.content")
    .bind(buildId, readme)
    .run();
  await env.DB.prepare("UPDATE engagements SET stage = 'delivered', build_state = 'passed', delivered_build_id = ?, updated_at = ? WHERE id = ?").bind(buildId, now(), e.id).run();
  const member = await issueMembership(env, e.customer_id, e.id);
  await note(env, e.id, `Delivered. All acceptance tests passed. Your lifetime membership token is ${member.token} — it gives you 24/7 priority support across every Saif Tech Global project.`, "delivery");
  await emailCustomer(env, e.customer_id, `Your project ${e.id} is delivered`, `Your project "${brief.title}" passed its acceptance tests and is ready to download at https://saiftechglobal.com/working-mode/?project=${e.id}\n\nLifetime membership token: ${member.token}\n\nSaif Tech Global LLC`);
  await audit(env, { actor: "company-ai", action: "engagement.delivered", target: e.id, detail: { build: buildId, member: member.token } });
}

export async function issueMembership(env, customerId, engagementId) {
  const existing = await env.DB.prepare("SELECT token, issued_at FROM members WHERE customer_id = ?").bind(customerId).first();
  if (existing) return existing;
  const token = humanId("STG-M").replace(/^STG-M-\d{4}-/, "STG-M-"); // STG-M-XXXXXX
  const t = now();
  await env.DB.prepare("INSERT INTO members (token, customer_id, first_engagement_id, issued_at) VALUES (?, ?, ?, ?) ON CONFLICT(customer_id) DO NOTHING")
    .bind(token, customerId, engagementId, t)
    .run();
  return env.DB.prepare("SELECT token, issued_at FROM members WHERE customer_id = ?").bind(customerId).first();
}

async function giveUp(env, e, lastOutput) {
  await env.DB.prepare("UPDATE engagements SET stage = 'refunded', build_state = 'failed', updated_at = ? WHERE id = ?").bind(now(), e.id).run();
  const policy = await getSetting(env, "company_policy");
  const reason = `Saif Tech Global AI could not deliver work that passes the acceptance tests after ${e.build_attempts} attempts.`;
  const r = policy.auto_refund ? await refundEngagement(env, e.id, reason) : { ok: false };
  await note(
    env,
    e.id,
    `We're sorry — after ${e.build_attempts} build attempts our AI could not produce a version that passes every acceptance test, so we will not deliver unverified work. ${r.ok ? "A full refund has been issued automatically." : "A full refund is being processed automatically."}`,
    "refund",
  );
  await emailCustomer(env, e.customer_id, `Refund for project ${e.id}`, `${reason} A full refund has been started automatically.\n\nSaif Tech Global LLC`);
  await audit(env, { actor: "company-ai", action: "engagement.refunded", target: e.id, detail: { refund: r, tail: (lastOutput || "").slice(-500) } });
}

/**
 * Advance one engagement by one step. Called by the runner's alarm.
 * Returns "done" (delivered/refunded/nothing to do), "again" (next attempt) or "later" (transient AI/sandbox issue).
 */
export async function advanceBuild(env, engagementId, executor) {
  const e = await env.DB.prepare("SELECT * FROM engagements WHERE id = ?").bind(engagementId).first();
  if (!e || e.stage !== "building") return "done";
  const policy = await getSetting(env, "company_policy");
  const maxAttempts = 1 + policy.build_retries;
  try {
    const tests = await ensureTests(env, e, executor);
    const attempt = e.build_attempts + 1;
    if (attempt > maxAttempts) {
      await giveUp(env, e, "");
      return "done";
    }
    const { outcome, buildId, output } = await attemptBuild(env, e, tests, executor, attempt);
    if (outcome === "passed") {
      await deliver(env, { ...e, build_attempts: attempt }, buildId, output);
      return "done";
    }
    if (attempt >= maxAttempts) {
      await giveUp(env, { ...e, build_attempts: attempt }, output);
      return "done";
    }
    await note(env, e.id, `Attempt ${attempt} of ${maxAttempts} did not pass every test. The AI is fixing it and testing again.`);
    await env.DB.prepare("UPDATE engagements SET build_state = 'queued', updated_at = ? WHERE id = ?").bind(now(), e.id).run();
    return "again";
  } catch (err) {
    if (err instanceof AIUnavailable || (err && err.transient)) return "later";
    throw err;
  }
}

/** Find work that needs a nudge: builds that never started, refunds that need retrying. */
export async function sweep(env, startFn) {
  const stale = now() - 120;
  const { results } = await env.DB.prepare("SELECT id FROM engagements WHERE stage = 'building' AND build_state IN ('queued','running') AND updated_at < ? LIMIT 20").bind(stale).all();
  for (const r of results || []) await startFn(r.id);
  const { results: refunds } = await env.DB.prepare(
    "SELECT engagement_id FROM payments WHERE (status = 'refund_pending' AND refund_id IS NULL) OR status = 'refund_failed' LIMIT 20",
  ).all();
  for (const r of refunds || []) {
    await env.DB.prepare("UPDATE payments SET refund_id = NULL, status = 'refund_pending' WHERE engagement_id = ? AND status = 'refund_failed'").bind(r.engagement_id).run();
    await refundEngagement(env, r.engagement_id, "Automatic refund retry");
  }
}

/** Called when the build system stayed unavailable for too long: never keep a client's money for undelivered work. */
export async function abandonBuild(env, engagementId) {
  const e = await env.DB.prepare("SELECT * FROM engagements WHERE id = ?").bind(engagementId).first();
  if (e && e.stage === "building") await giveUp(env, e, "build system unavailable");
}
