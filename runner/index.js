// Saif Tech Global LLC — Build Runner Worker (stg-company-runner).
// Runs the company AI's build/test/retry/refund loop 24/7, isolated from the website.
//  • POST /start {engagement_id}  (service binding from the website, authenticated with RUNNER_SECRET)
//  • BuildJob Durable Object per engagement: one step per alarm, persistent, resumable after restarts
//  • Code runs in a Cloudflare Container sandbox with internet disabled (production) or a local
//    executor (development only, EXECUTOR_URL)
//  • Cron sweep restarts stalled builds and retries refunds
import { DurableObject } from "cloudflare:workers";
import { advanceBuild, abandonBuild, sweep } from "../server/builder.js";
import { safeEqual } from "../server/crypto.js";

const MAX_TRANSIENT = 12; // ~ several hours of AI/sandbox outage before the client is refunded

function b64utf8(text) {
  const bytes = new TextEncoder().encode(text);
  let s = "";
  for (let i = 0; i < bytes.length; i += 0x8000) s += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
  return btoa(s);
}

const SAFE_PATH = /^[a-zA-Z0-9._\-/]+$/;

/** Executor backed by this Durable Object's container (Cloudflare Containers, no internet). */
function containerExecutor(container) {
  const exec = async (argv, timeoutMs = 60000) => {
    const ac = new AbortController();
    const timer = setTimeout(() => ac.abort(), timeoutMs);
    try {
      const proc = await container.exec(argv, { signal: ac.signal });
      const out = await proc.output();
      const dec = new TextDecoder();
      return { exitCode: out.exitCode, stdout: dec.decode(out.stdout), stderr: dec.decode(out.stderr) };
    } finally {
      clearTimeout(timer);
    }
  };
  const ready = async () => {
    if (!container.running) {
      container.start({ image: container.images && container.images.workspace, enableInternet: false });
      await container.setInactivityTimeout(10 * 60 * 1000);
    }
    for (let i = 0; i < 90; i++) {
      try {
        if ((await exec(["true"], 5000)).exitCode === 0) return;
      } catch {
        /* still starting */
      }
      await new Promise((r) => setTimeout(r, 1000));
    }
    const err = new Error("sandbox did not become ready");
    err.transient = true;
    throw err;
  };
  return {
    async run({ files, command, timeoutMs }) {
      await ready();
      const dir = `/workspace/run-${crypto.randomUUID()}`;
      await exec(["mkdir", "-p", dir]);
      for (const f of files) {
        if (!SAFE_PATH.test(f.path) || f.path.includes("..")) continue;
        const target = `${dir}/${f.path}`;
        const r = await exec(["bash", "-c", `mkdir -p "$(dirname '${target}')" && echo '${b64utf8(f.content)}' | base64 -d > '${target}'`]);
        if (r.exitCode !== 0) throw Object.assign(new Error(`write failed: ${r.stderr}`), { transient: true });
      }
      const secs = Math.ceil(timeoutMs / 1000);
      let r;
      try {
        r = await exec(["bash", "-c", `cd '${dir}' && timeout ${secs}s ${command}`], timeoutMs + 15000);
      } catch (e) {
        r = { exitCode: 124, stdout: "", stderr: String(e && e.message) };
      }
      await exec(["rm", "-rf", dir]).catch(() => {});
      return { ...r, timedOut: r.exitCode === 124 };
    },
  };
}

/** Development executor: tests/local-executor.mjs on this machine. Never configured in production. */
function httpExecutor(env) {
  return {
    async run({ files, command, timeoutMs }) {
      const res = await fetch(`${env.EXECUTOR_URL}/run`, {
        method: "POST",
        headers: { "content-type": "application/json", "x-executor-secret": env.RUNNER_SECRET || "" },
        body: JSON.stringify({ files, command, timeoutMs }),
      });
      if (!res.ok) throw Object.assign(new Error(`executor ${res.status}`), { transient: true });
      return res.json();
    },
  };
}

export class BuildJob extends DurableObject {
  async fetch(request) {
    const { engagement_id } = await request.json();
    await this.ctx.storage.put("engagement_id", engagement_id);
    if (!(await this.ctx.storage.getAlarm())) await this.ctx.storage.setAlarm(Date.now() + 500);
    return new Response("scheduled", { status: 202 });
  }

  async alarm() {
    const eid = await this.ctx.storage.get("engagement_id");
    if (!eid) return;
    const executor = this.env.EXECUTOR_URL ? httpExecutor(this.env) : containerExecutor(this.ctx.container);
    let result;
    try {
      result = await advanceBuild(this.env, eid, executor);
    } catch (e) {
      console.error("build step failed", eid, e && e.stack);
      result = "later";
    }
    if (result === "again") {
      await this.ctx.storage.put("transient", 0);
      await this.ctx.storage.setAlarm(Date.now() + 1000);
    } else if (result === "later") {
      const n = ((await this.ctx.storage.get("transient")) || 0) + 1;
      await this.ctx.storage.put("transient", n);
      if (n > MAX_TRANSIENT) {
        await abandonBuild(this.env, eid);
        await this.finish();
      } else {
        await this.ctx.storage.setAlarm(Date.now() + Math.min(30 * 60_000, 30_000 * 2 ** Math.min(n, 6)));
      }
    } else {
      await this.finish();
    }
  }

  async finish() {
    await this.ctx.storage.deleteAll();
    try {
      if (this.ctx.container && this.ctx.container.running) await this.ctx.container.destroy("build finished");
    } catch {
      /* already stopped */
    }
  }
}

async function startJob(env, engagementId) {
  const stub = env.BUILD_JOB.get(env.BUILD_JOB.idFromName(engagementId));
  await stub.fetch("https://build-job/start", { method: "POST", body: JSON.stringify({ engagement_id: engagementId }) });
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (request.method === "POST" && url.pathname === "/start") {
      if (!env.RUNNER_SECRET || !safeEqual(request.headers.get("x-runner-secret") || "", env.RUNNER_SECRET)) return new Response("unauthorized", { status: 401 });
      const { engagement_id } = await request.json();
      if (typeof engagement_id !== "string" || !/^STG-\d{4}-[A-Z0-9]+$/.test(engagement_id)) return new Response("bad request", { status: 400 });
      await startJob(env, engagement_id);
      return new Response(JSON.stringify({ ok: true }), { status: 202, headers: { "content-type": "application/json" } });
    }
    if (request.method === "POST" && url.pathname === "/sweep") {
      if (!env.RUNNER_SECRET || !safeEqual(request.headers.get("x-runner-secret") || "", env.RUNNER_SECRET)) return new Response("unauthorized", { status: 401 });
      await sweep(env, (id) => startJob(env, id));
      return new Response("ok");
    }
    return new Response("Saif Tech Global build runner", { status: 404 });
  },
  async scheduled(event, env, ctx) {
    ctx.waitUntil(sweep(env, (id) => startJob(env, id)));
  },
};
