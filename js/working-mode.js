/* Working Mode — chat with the AI-operated company: idea → brief → design → price → pay → build → delivery. */
(function () {
  const { $, h, api, money, when, toast, markdown, statusChip, signInCard, emblem } = window.Portal;
  $("#brand").prepend(emblem(40));

  const GREETING =
    "Welcome to Saif Tech Global LLC — I'm the company's AI, and I run Working Mode around the clock. Tell me about your idea or the problem you want solved, and we'll shape it into a project together.";
  const STAGES = [
    ["discovery", "Idea"],
    ["brief", "Brief"],
    ["design", "Design"],
    ["quoted", "Price"],
    ["awaiting_payment", "Payment"],
    ["building", "Build & test"],
    ["delivered", "Delivery"],
  ];
  const KEYS = "stg-wm-keys";
  const log = $("#log");
  const stageBox = $("#stage");
  const composer = $("#composer");
  const input = $("#input");
  let current = null; // engagement id
  let pollTimer = null;
  let me = null;

  // ---------------------------------------------------------------- engagement keys (anonymous access)
  const keys = () => {
    try {
      return JSON.parse(localStorage.getItem(KEYS) || "{}");
    } catch {
      return {};
    }
  };
  const saveKey = (id, key) => {
    try {
      const k = keys();
      k[id] = key;
      localStorage.setItem(KEYS, JSON.stringify(k));
    } catch {
      /* private mode: access continues via sign-in */
    }
  };
  const hdr = (id) => (keys()[id] ? { "x-engagement-key": keys()[id] } : {});
  const call = (method, path, body) => api(method, path, body, current ? hdr(current) : {});

  // ---------------------------------------------------------------- rendering
  function bubble(role, text) {
    const who = role === "user" ? "You" : role === "assistant" ? "Saif Tech Global AI" : "Update";
    log.append(h("div", { class: `msg ${role === "notice" ? "notice" : role}` }, h("span", { class: "who", text: who }), text));
    log.scrollTop = log.scrollHeight;
  }
  function thinking(on, text) {
    $("#typing").classList.toggle("hidden", !on);
    if (text) $("#typing-text").textContent = text;
    $("#send").disabled = on;
  }
  function stagebar(stage) {
    const bar = $("#stagebar");
    bar.innerHTML = "";
    const idx = STAGES.findIndex(([s]) => s === stage);
    STAGES.forEach(([s, label], i) => bar.append(h("span", { class: i < idx ? "done" : i === idx ? "on" : "" }, label)));
    if (stage === "refunded") bar.append(h("span", { class: "on" }, "Refunded"));
  }

  function fresh() {
    stopPoll();
    current = null;
    history.replaceState(null, "", "/working-mode/");
    log.innerHTML = "";
    stageBox.innerHTML = "";
    stagebar("discovery");
    bubble("assistant", GREETING);
    composer.classList.remove("hidden");
    input.focus();
  }

  async function open(id, { quiet = false } = {}) {
    current = id;
    history.replaceState(null, "", `/working-mode/?project=${encodeURIComponent(id)}`);
    let d;
    try {
      d = await call("GET", `/api/wm/engagements/${encodeURIComponent(id)}`);
    } catch (ex) {
      if (!quiet) toast(ex.message);
      return fresh();
    }
    render(d);
    refreshSide();
  }

  function render(d) {
    const e = d.engagement;
    stagebar(e.stage);
    log.innerHTML = "";
    d.messages.forEach((m) => bubble(m.role, m.content));
    stageBox.innerHTML = "";
    composer.classList.toggle("hidden", !["discovery", "brief"].includes(e.stage));
    input.placeholder = e.stage === "brief" ? "Tell me what to change in the brief…" : "Tell us your idea, or the problem you want solved…";
    stopPoll();
    if (e.stage === "brief") stageBox.append(briefCard(e));
    if (e.stage === "design") stageBox.append(designCard(e));
    if (e.stage === "quoted") stageBox.append(priceCard(e));
    if (e.stage === "awaiting_payment") stageBox.append(payCard(e));
    if (e.stage === "building") {
      stageBox.append(buildCard(e, d.builds));
      startPoll();
    }
    if (e.stage === "delivered") stageBox.append(deliveryCard(e, d));
    if (e.stage === "refunded") stageBox.append(refundCard(e, d));
    log.scrollTop = log.scrollHeight;
  }

  function briefCard(e) {
    const yes = h("button", { class: "btn primary", type: "button", text: "Yes, that's what I had in mind", disabled: e.buildable === false });
    yes.addEventListener("click", () =>
      step(`/api/wm/engagements/${current}/brief/confirm`, "Designing your project… this can take a minute.", yes),
    );
    return h(
      "div",
      { class: "card" },
      h("p", { class: "label", text: "Project brief" }),
      markdown(e.brief_md || ""),
      e.buildable === false ? h("p", { class: "small error", text: "This exact delivery is outside what we can build and verify automatically — ask for the alternative in the chat." }) : null,
      h("div", { class: "row", style: "margin-top:10px" }, yes, h("button", { class: "btn", type: "button", text: "Adjust", onclick: () => input.focus() })),
    );
  }

  function designCard(e) {
    const card = h("div", { class: "card" }, h("p", { class: "label", text: `Design · version ${e.design_version}` }));
    if (e.design_kind === "ui_mockup") {
      const frame = h("iframe", { class: "mock", title: "Design mock-up", sandbox: "", referrerpolicy: "no-referrer" });
      frame.srcdoc = e.design_html || "";
      card.append(frame, h("p", { class: "small muted", text: "A static visual mock-up — the delivered product will be interactive." }));
    } else card.append(markdown(e.design_md || ""));
    const approve = h("button", { class: "btn primary", type: "button", text: "Approve design" });
    approve.addEventListener("click", () => step(`/api/wm/engagements/${current}/design/approve`, "Our pricing desk is setting a fair price…", approve));
    const fb = h("textarea", { placeholder: "What should we change?", maxlength: "2000" });
    const revise = h("button", { class: "btn", type: "button", text: "Request changes" });
    revise.addEventListener("click", () => {
      if (!fb.value.trim()) return fb.focus();
      step(`/api/wm/engagements/${current}/design/revise`, "Revising the design…", revise, { message: fb.value });
    });
    card.append(h("div", { class: "row", style: "margin-top:10px" }, approve), h("details", { style: "margin-top:10px" }, h("summary", { text: "Request changes" }), fb, h("div", { class: "row", style: "margin-top:8px" }, revise)));
    return card;
  }

  function priceCard(e) {
    const p = e.price || {};
    const expired = e.quote_expires_at && e.quote_expires_at * 1000 < Date.now();
    const agree = h("input", { type: "checkbox", id: "agree" });
    const accept = h("button", { class: "btn primary", type: "button", text: "Accept & pay securely", disabled: expired });
    accept.addEventListener("click", async () => {
      if (!agree.checked) return toast("Please confirm the price and terms first.");
      if (!me) {
        me = await signInCard(stageBox.querySelector("#signin-slot"), { intro: "Sign in with your email to pay and to receive your delivery and membership token." });
        await call("POST", `/api/wm/engagements/${current}/claim`, {}).catch(() => {});
        refreshAccount();
      }
      accept.disabled = true;
      try {
        const r = await call("POST", `/api/wm/engagements/${current}/accept`, { agree: true });
        location.href = r.checkout_url;
      } catch (ex) {
        toast(ex.message);
        accept.disabled = false;
      }
    });
    return h(
      "div",
      { class: "card" },
      h("p", { class: "label", text: "Our price" }),
      h("div", { class: "price", text: money(e.price_cents, e.currency) }),
      p.value_summary ? h("p", { text: p.value_summary }) : null,
      p.rationale ? h("p", { class: "small muted", text: p.rationale }) : null,
      h(
        "ul",
        { class: "small" },
        h("li", { text: "Set by our AI pricing desk from the real value and effort (minimum order $10)." }),
        h("li", { text: "Paid in full before the build starts; verified with the payment provider." }),
        h("li", { text: "Every delivery must pass its acceptance tests. If our AI can't pass them after 3 retries, you are refunded automatically." }),
        h("li", { text: "On delivery you receive a lifetime membership token with 24/7 priority support." }),
      ),
      expired
        ? h("button", { class: "btn", type: "button", text: "This price expired — get a fresh price", onclick: () => step(`/api/wm/engagements/${current}/reprice`, "Re-pricing…", null) })
        : h("div", {}, h("label", { class: "check", for: "agree" }, agree, h("span", { text: `I accept this price and the terms. Valid until ${when(e.quote_expires_at)}.` })), h("div", { class: "row", style: "margin-top:10px" }, accept)),
      h("div", { id: "signin-slot", style: "margin-top:12px" }),
    );
  }

  function payCard() {
    const btn = h("button", { class: "btn primary", type: "button", text: "Pay securely" });
    btn.addEventListener("click", async () => {
      try {
        const r = await call("POST", `/api/wm/engagements/${current}/pay`, {});
        location.href = r.checkout_url;
      } catch (ex) {
        toast(ex.message);
      }
    });
    return h("div", { class: "card" }, h("p", { text: "Your price is accepted. Complete the secure payment to start the build — or, if you just paid, the confirmation will appear here in a moment." }), btn);
  }

  function buildCard(e, builds) {
    return h(
      "div",
      { class: "card" },
      h("p", { class: "label", text: "Build & test" }),
      h("p", {}, h("span", { class: "spin", "aria-hidden": "true" }), ` Our AI is building your project and running its acceptance tests — attempt ${Math.max(1, e.build_attempts)} of ${e.max_attempts}.`),
      builds.length ? h("ul", { class: "small" }, builds.map((b) => h("li", {}, `Attempt ${b.attempt}: `, statusChip(b.status === "passed" ? "succeeded" : b.status === "failed" ? "failed" : "pending")))) : null,
      h("p", { class: "small muted", text: "You can close this page — we'll email you when it's delivered." }),
    );
  }

  function deliveryCard(e, d) {
    const card = h("div", { class: "card" }, h("p", { class: "label", text: "Delivered — all acceptance tests passed" }));
    if (d.delivery) {
      card.append(
        h("ul", { class: "small" }, d.delivery.files.map((f) => h("li", {}, h("span", { class: "mono", text: f.path }), ` · ${f.size.toLocaleString()} bytes`))),
        h("a", { class: "btn primary", href: `/api/wm/engagements/${encodeURIComponent(e.id)}/download`, text: "Download your project (.zip)" }),
      );
    } else card.append(h("p", { class: "small", text: "Sign in with the email you paid with to download your delivery." }));
    if (d.member)
      card.append(
        h("p", { class: "label", style: "margin-top:16px", text: "Lifetime membership" }),
        h("div", { class: "token", text: d.member.token }),
        h("p", { class: "small muted", text: "Your token gives you lifetime 24/7 priority support across every Saif Tech Global project." }),
        h("a", { class: "btn", href: "/helpline/", text: "Open priority support" }),
      );
    return card;
  }

  function refundCard(e, d) {
    const p = d.payments[d.payments.length - 1];
    return h(
      "div",
      { class: "card" },
      h("p", { class: "label", text: "Refund" }),
      h("p", { text: "Our AI could not deliver a version that passes every acceptance test, so we did not deliver unverified work. Your payment is refunded in full automatically." }),
      p ? h("p", {}, "Refund status: ", statusChip(p.status)) : null,
    );
  }

  async function step(path, waitText, btn, body = {}) {
    if (btn) btn.disabled = true;
    thinking(true, waitText);
    try {
      await call("POST", path, body);
      await open(current);
    } catch (ex) {
      toast(ex.message);
      if (btn) btn.disabled = false;
    } finally {
      thinking(false);
    }
  }

  function startPoll() {
    stopPoll();
    pollTimer = setInterval(async () => {
      try {
        const d = await call("GET", `/api/wm/engagements/${current}`);
        if (d.engagement.stage !== "building" || d.builds.length !== log.dataset.builds) {
          log.dataset.builds = d.builds.length;
          render(d);
        }
      } catch {
        /* keep polling */
      }
    }, 6000);
  }
  function stopPoll() {
    if (pollTimer) clearInterval(pollTimer);
    pollTimer = null;
  }

  // ---------------------------------------------------------------- sending messages
  composer.addEventListener("submit", async (ev) => {
    ev.preventDefault();
    const text = input.value.trim();
    if (!text) return;
    bubble("user", text);
    input.value = "";
    thinking(true, "Saif Tech Global AI is thinking…");
    try {
      if (!current) {
        const r = await api("POST", "/api/wm/engagements", { message: text });
        saveKey(r.id, r.key);
        current = r.id;
        history.replaceState(null, "", `/working-mode/?project=${encodeURIComponent(r.id)}`);
        if (r.ai_unavailable) bubble("notice", r.error);
        await open(r.id);
      } else {
        await call("POST", `/api/wm/engagements/${current}/messages`, { message: text });
        await open(current);
      }
    } catch (ex) {
      bubble("notice", ex.data && ex.data.ai_unavailable ? "Our AI is briefly unavailable — your message is saved. Please send again in a moment." : ex.message);
    } finally {
      thinking(false);
    }
  });
  input.addEventListener("keydown", (ev) => {
    if (ev.key === "Enter" && !ev.shiftKey) {
      ev.preventDefault();
      composer.requestSubmit();
    }
  });
  $("#new").addEventListener("click", fresh);

  // ---------------------------------------------------------------- side panel
  async function refreshSide() {
    const box = $("#projects");
    const local = Object.keys(keys());
    let list = [];
    let member = null;
    if (me) {
      try {
        const r = await api("GET", "/api/wm/engagements");
        list = r.engagements;
        member = r.member;
      } catch {
        /* ignore */
      }
    }
    const ids = new Set(list.map((x) => x.id));
    for (const id of local) if (!ids.has(id)) list.push({ id, title: null, stage: null });
    box.innerHTML = "";
    if (!list.length) box.append(h("p", { class: "small muted", text: "Projects you start appear here." }));
    list.forEach((x) => box.append(h("button", { class: `btn small ${x.id === current ? "active" : ""}`, type: "button", onclick: () => open(x.id) }, h("span", {}, h("span", { class: "mono", text: x.id }), x.title ? ` · ${x.title}` : ""))));
    const mbox = $("#member");
    mbox.innerHTML = "";
    if (member) mbox.append(h("p", { class: "label", text: "Lifetime member" }), h("div", { class: "token", style: "font-size:15px", text: member.token }));
  }

  async function refreshAccount() {
    const box = $("#account");
    box.innerHTML = "";
    if (me) {
      box.append(h("p", { class: "small muted", text: `Signed in as ${me.email}` }), h("button", { class: "btn small", type: "button", text: "Sign out", onclick: async () => { await api("POST", "/api/auth/logout", {}); location.reload(); } }));
    } else {
      box.append(h("p", { class: "small muted", text: "No sign-in needed to talk to us. You'll sign in only when you're ready to pay." }));
    }
    refreshSide();
  }

  async function boot() {
    me = (await api("GET", "/api/auth/me")).customer;
    refreshAccount();
    const params = new URLSearchParams(location.search);
    const project = params.get("project");
    if (project) {
      await open(project, { quiet: true });
      if (params.get("payment") === "return") toast("Thank you — your payment is being verified. The build starts automatically.");
    } else fresh();
  }
  boot().catch((ex) => bubble("notice", ex.message));
})();
