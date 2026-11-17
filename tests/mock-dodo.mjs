// Local stand-in for the Dodo Payments API, used only by tests/acceptance.mjs.
// POST /checkouts -> creates a session; GET /payments/:id -> returns what /_test/pay recorded.
import http from "node:http";

const sessions = new Map();
const payments = new Map();
const refunds = new Map();

http
  .createServer(async (req, res) => {
    let body = "";
    for await (const chunk of req) body += chunk;
    const send = (code, obj) => {
      res.writeHead(code, { "content-type": "application/json" });
      res.end(JSON.stringify(obj));
    };
    if (req.headers.authorization !== "Bearer dodo_test_localmock" && !req.url.startsWith("/_test")) return send(401, { error: "auth" });
    if (req.method === "POST" && req.url === "/checkouts") {
      const b = JSON.parse(body);
      const sid = `cks_${sessions.size + 1}`;
      sessions.set(sid, b);
      return send(200, { session_id: sid, checkout_url: `https://test.checkout.local/${sid}` });
    }
    if (req.method === "POST" && req.url === "/_test/pay") {
      // simulate the customer paying the latest session for one of our payments: { stg_payment_id, payment_id, status, total_amount? }
      const b = JSON.parse(body);
      const s = [...sessions.values()].reverse().find((x) => x.metadata && x.metadata.stg_payment_id === b.stg_payment_id);
      if (!s) return send(404, { error: "no session" });
      const amount = b.total_amount ?? s.product_cart[0].amount;
      payments.set(b.payment_id, { payment_id: b.payment_id, status: b.status, total_amount: amount, currency: "USD", metadata: s.metadata });
      return send(200, { ok: true, metadata: s.metadata, total_amount: amount });
    }
    if (req.method === "POST" && req.url === "/refunds") {
      const b = JSON.parse(body);
      if (!payments.has(b.payment_id)) return send(404, { error: "unknown payment" });
      const refund_id = `ref_${refunds.size + 1}_${Date.now()}`;
      refunds.set(refund_id, { refund_id, payment_id: b.payment_id, status: "pending", reason: b.reason, metadata: b.metadata });
      return send(200, { refund_id, payment_id: b.payment_id, status: "pending", is_partial: false });
    }
    if (req.method === "GET" && req.url === "/_test/refunds") return send(200, [...refunds.values()]);
    const m = req.url.match(/^\/payments\/([^/]+)$/);
    if (req.method === "GET" && m) {
      const p = payments.get(decodeURIComponent(m[1]));
      return p ? send(200, p) : send(404, { error: "not found" });
    }
    send(404, { error: "unknown route" });
  })
  .listen(8799, "127.0.0.1", () => console.log("mock dodo on 8799"));
