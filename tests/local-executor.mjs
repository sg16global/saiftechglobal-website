// LOCAL DEVELOPMENT ONLY — stands in for the Cloudflare Container sandbox so the build loop can be tested
// on a machine without Docker. Writes files to a fresh temp folder and runs `node` with a time limit.
// Production runs AI-generated code only inside the internet-disabled container (runner/index.js).
import http from "node:http";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawn } from "node:child_process";

const SECRET = process.env.RUNNER_SECRET || "";
const SAFE = /^[a-zA-Z0-9._\-/]+$/;

function run(cmd, cwd, timeoutMs) {
  // Only `node ...` commands are accepted (the build engine uses `node --check` and `node --test`).
  const args = cmd.trim().split(/\s+/);
  if (args[0] !== "node") return Promise.resolve({ exitCode: 126, stdout: "", stderr: "only node commands are allowed", timedOut: false });
  return new Promise((resolve) => {
    const child = spawn(process.execPath, args.slice(1), { cwd, env: { PATH: process.env.PATH, NODE_ENV: "test" } });
    let stdout = "";
    let stderr = "";
    let timedOut = false;
    const timer = setTimeout(() => {
      timedOut = true;
      child.kill("SIGKILL");
    }, timeoutMs);
    child.stdout.on("data", (d) => (stdout += d).length > 200000 && child.kill("SIGKILL"));
    child.stderr.on("data", (d) => (stderr += d).length > 200000 && child.kill("SIGKILL"));
    child.on("close", (code) => {
      clearTimeout(timer);
      resolve({ exitCode: timedOut ? 124 : code ?? 1, stdout, stderr, timedOut });
    });
  });
}

http
  .createServer(async (req, res) => {
    let body = "";
    for await (const c of req) body += c;
    const send = (code, obj) => {
      res.writeHead(code, { "content-type": "application/json" });
      res.end(JSON.stringify(obj));
    };
    if (req.method !== "POST" || req.url !== "/run") return send(404, { error: "not found" });
    if (SECRET && req.headers["x-executor-secret"] !== SECRET) return send(401, { error: "unauthorized" });
    const { files, command, timeoutMs } = JSON.parse(body);
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), "stg-build-"));
    try {
      for (const f of files || []) {
        if (!SAFE.test(f.path) || f.path.includes("..")) continue;
        const target = path.join(dir, f.path);
        fs.mkdirSync(path.dirname(target), { recursive: true });
        fs.writeFileSync(target, f.content);
      }
      const result = await run(command, dir, Math.min(timeoutMs || 60000, 180000));
      send(200, result);
    } finally {
      fs.rmSync(dir, { recursive: true, force: true });
    }
  })
  .listen(8791, "127.0.0.1", () => console.log("local executor on 8791"));
