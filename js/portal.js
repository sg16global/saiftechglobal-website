/* Shared helpers for the Working Mode, Helpline and Admin portals (vanilla JS, no build step). */
(function () {
  const $ = (sel, root = document) => root.querySelector(sel);

  /** Create an element. Text is always set with textContent (never innerHTML) to prevent XSS. */
  function h(tag, attrs = {}, ...children) {
    const el = document.createElement(tag);
    for (const [k, v] of Object.entries(attrs || {})) {
      if (v == null || v === false) continue;
      if (k === "class") el.className = v;
      else if (k === "text") el.textContent = v;
      else if (k.startsWith("on") && typeof v === "function") el.addEventListener(k.slice(2), v);
      else el.setAttribute(k, v === true ? "" : v);
    }
    for (const c of children.flat()) {
      if (c == null || c === false) continue;
      el.append(c instanceof Node ? c : document.createTextNode(String(c)));
    }
    return el;
  }

  async function api(method, path, body, extraHeaders = {}) {
    const res = await fetch(path, {
      method,
      credentials: "same-origin",
      headers: { ...(body !== undefined ? { "content-type": "application/json" } : {}), ...extraHeaders },
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
    let data = null;
    try {
      data = await res.json();
    } catch {
      data = null;
    }
    if (!res.ok) {
      const err = new Error((data && data.error) || `Request failed (${res.status})`);
      err.status = res.status;
      err.data = data;
      throw err;
    }
    return data;
  }

  function money(cents, currency = "USD") {
    if (cents == null) return "—";
    return new Intl.NumberFormat("en-US", { style: "currency", currency }).format(cents / 100);
  }

  function when(ts) {
    if (!ts) return "";
    return new Date(ts * 1000).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" });
  }

  let toastTimer;
  function toast(text) {
    let t = $(".toast");
    if (!t) {
      t = h("div", { class: "toast", role: "status", "aria-live": "polite" });
      document.body.append(t);
    }
    t.textContent = text;
    t.classList.remove("hidden");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => t.classList.add("hidden"), 4500);
  }

  /** Tiny, safe Markdown renderer: escapes everything first, then applies a few formats. */
  function markdown(src) {
    const esc = (s) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
    const inline = (s) => esc(s).replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>").replace(/`([^`]+)`/g, "<code>$1</code>");
    const out = [];
    let list = null;
    for (const raw of String(src || "").split(/\r?\n/)) {
      const line = raw.trimEnd();
      const m = line.match(/^(#{1,3})\s+(.*)$/);
      const li = line.match(/^\s*(?:[-*]|\d+\.)\s+(.*)$/);
      if (li) {
        if (!list) {
          list = [];
          out.push(list);
        }
        list.push(`<li>${inline(li[1])}</li>`);
        continue;
      }
      list = null;
      if (m) out.push(`<h${m[1].length + 1}>${inline(m[2])}</h${m[1].length + 1}>`);
      else if (line) out.push(`<p>${inline(line)}</p>`);
    }
    const div = document.createElement("div");
    div.className = "md";
    div.innerHTML = out.map((x) => (Array.isArray(x) ? `<ul>${x.join("")}</ul>` : x)).join("");
    return div;
  }

  function statusChip(status) {
    const map = {
      discovery: ["Talking with our AI", "pink"],
      brief: ["Brief ready", "pink"],
      design: ["Design ready", "pink"],
      building: ["AI building & testing", "amber"],
      refunded: ["Refunded", "red"],
      answered: ["Answered", "green"],
      refund_pending: ["Refund in progress", "amber"],
      refund_failed: ["Refund retrying", "amber"],
      awaiting_approval: ["Under company review", "amber"],
      quoted: ["Quotation ready", "pink"],
      awaiting_payment: ["Awaiting payment", "amber"],
      active: ["In development", "green"],
      delivered: ["Delivered", "green"],
      cancelled: ["Cancelled", "red"],
      rejected: ["Declined", "red"],
      pending_approval: ["Under company review", "amber"],
      sent: ["Ready to accept", "pink"],
      accepted: ["Accepted", "green"],
      superseded: ["Superseded", ""],
      expired: ["Expired", "red"],
      succeeded: ["Paid", "green"],
      pending: ["Pending", "amber"],
      created: ["Not paid yet", "amber"],
      failed: ["Failed", "red"],
      open: ["Open", "pink"],
      escalated: ["Escalated to a person", "amber"],
      resolved: ["Resolved", "green"],
      closed: ["Closed", ""],
      in_progress: ["In progress", "amber"],
      done: ["Done", "green"],
      estimated: ["Estimated", "pink"],
    };
    const [label, color] = map[status] || [String(status || "").replace(/_/g, " "), ""];
    return h("span", { class: `chip ${color}` }, h("span", { class: "dot" }), label);
  }

  /** Email one-time-code sign-in widget. Resolves with the customer once signed in. */
  function signInCard(container, { intro = "Sign in with your email to continue." } = {}) {
    return new Promise((resolve) => {
      container.innerHTML = "";
      const msg = h("p", { class: "small muted", text: intro });
      const email = h("input", { type: "email", autocomplete: "email", placeholder: "you@company.com", required: true, "aria-label": "Email" });
      const code = h("input", { inputmode: "numeric", autocomplete: "one-time-code", maxlength: "6", placeholder: "6-digit code", "aria-label": "Sign-in code" });
      const err = h("p", { class: "small error", role: "alert" });
      const sendBtn = h("button", { class: "btn primary", type: "submit", text: "Email me a code" });
      const verifyBtn = h("button", { class: "btn primary", type: "submit", text: "Sign in" });
      const step2 = h("form", { class: "hidden" }, h("label", { class: "field" }, h("span", { text: "Code we emailed you" }), code), verifyBtn);
      const step1 = h("form", {}, h("label", { class: "field" }, h("span", { text: "Email" }), email), sendBtn);
      step1.addEventListener("submit", async (e) => {
        e.preventDefault();
        err.textContent = "";
        sendBtn.disabled = true;
        try {
          const r = await api("POST", "/api/auth/request-code", { email: email.value });
          step1.classList.add("hidden");
          step2.classList.remove("hidden");
          msg.textContent = `We sent a 6-digit code to ${email.value}. It expires in 10 minutes.`;
          if (r.dev_code) {
            code.value = r.dev_code; // local development only
            msg.textContent += " (Local test mode: code filled in automatically.)";
          }
          code.focus();
        } catch (ex) {
          err.textContent = ex.message;
        } finally {
          sendBtn.disabled = false;
        }
      });
      step2.addEventListener("submit", async (e) => {
        e.preventDefault();
        err.textContent = "";
        verifyBtn.disabled = true;
        try {
          const r = await api("POST", "/api/auth/verify", { email: email.value, code: code.value.trim() });
          resolve(r.customer);
        } catch (ex) {
          err.textContent = ex.message;
        } finally {
          verifyBtn.disabled = false;
        }
      });
      container.append(h("div", { class: "panel pink" }, h("h3", { text: "Sign in" }), msg, step1, step2, err));
    });
  }

  /** Header emblem with the protected-logo rules used on the homepage. */
  function emblem(size = 40) {
    const wrap = h("span", { class: "emblem-protect", title: "© 2026 SAIF TECH GLOBAL LLC. All Rights Reserved." });
    wrap.addEventListener("contextmenu", (e) => e.preventDefault());
    wrap.addEventListener("dragstart", (e) => e.preventDefault());
    wrap.append(
      h("img", { src: "/assets/emblem-base.png", alt: "SAIF TECH GLOBAL LLC™ Official Trademark Emblem", title: "© 2026 SAIF TECH GLOBAL LLC. All Rights Reserved.", width: size, height: size, draggable: "false" }),
      h("span", { class: "emblem-tm", "aria-hidden": "true", text: "™" }),
    );
    return wrap;
  }

  window.Portal = { $, h, api, money, when, toast, markdown, statusChip, signInCard, emblem };
})();
