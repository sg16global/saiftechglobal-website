/* Company Admin Panel — observer window into the AI-operated company (Cloudflare Access protected). */
(function () {
  const { $, h, api, money, when, toast, markdown, statusChip, emblem } = window.Portal;
  $("#brand").prepend(emblem(40));
  const view = $("#view");
  let staff = null;

  const TABS = [
    ["overview", "Overview"],
    ["engagements", "Projects (live)"],
    ["tickets", "Tickets"],
    ["policy", "Company policy"],
    ["ai", "AI infrastructure"],
    ["kb", "Knowledge base"],
    ["audit", "Audit log"],
    ["staff", "Staff"],
  ];
  const fail = (ex) => toast(ex.message);
  const table = (headers, rows) => h("div", { class: "table-scroll" }, h("table", {}, h("tr", {}, headers.map((x) => h("th", { text: x }))), rows));
  const labelled = (text, el) => h("label", { class: "field" }, h("span", { text }), el);

  async function boot() {
    try {
      staff = await api("GET", "/api/admin/me");
    } catch (ex) {
      view.append(h("div", { class: "panel pink" }, h("h2", { text: "Staff access required" }), h("p", { text: ex.message })));
      return;
    }
    $("#who").textContent = `${staff.email} · ${staff.role}`;
    for (const [id, label] of TABS) {
      if (id === "staff" && staff.role !== "owner") continue;
      $("#tabs").append(h("button", { class: "btn small", type: "button", "data-tab": id, text: label, onclick: () => go(id) }));
    }
    go(location.hash.slice(1) || "overview");
  }

  function go(tab) {
    location.hash = tab;
    document.querySelectorAll("#tabs .btn").forEach((b) => b.classList.toggle("active", b.dataset.tab === tab));
    view.innerHTML = "";
    ({ overview, engagements, tickets, policy, ai, kb, audit, staff: staffTab }[tab] || overview)().catch(fail);
  }

  // ------------------------------------------------------------------ overview
  async function overview() {
    const o = await api("GET", "/api/admin/overview");
    const kpi = (label, value) => h("div", { class: "kpi" }, h("span", { class: "label", text: label }), h("b", { text: String(value) }));
    const st = o.stages || {};
    view.append(
      h("p", { class: "muted", text: "Saif Tech Global runs itself. This is your window — nothing here waits for approval." }),
      h(
        "div",
        { class: "kpis" },
        kpi("Revenue (verified)", money(o.revenue_cents)),
        kpi("Refunded", money(o.refunded_cents)),
        kpi("In conversation", (st.discovery || 0) + (st.brief || 0) + (st.design || 0)),
        kpi("Quoted", st.quoted || 0),
        kpi("Building now", st.building || 0),
        kpi("Delivered", st.delivered || 0),
        kpi("Builds passed / failed", `${o.builds_passed} / ${o.builds_failed}`),
        kpi("Lifetime members", o.members),
        kpi("Open tickets", o.open_tickets),
        kpi("AI calls 24h (failed)", `${o.ai_calls_24h} (${o.ai_failures_24h})`),
      ),
      h(
        "div",
        { class: "panel", style: "margin-top:16px" },
        h("h3", { text: "Operational status" }),
        h(
          "ul",
          {},
          h("li", {}, "New orders: ", o.accepting_orders ? "accepting" : "PAUSED"),
          h("li", {}, "Online payments: ", o.payments_enabled ? "on" : "off", " · Dodo keys ", o.payments_configured ? "configured" : "NOT configured"),
          h("li", {}, "Build runner: ", o.runner_configured ? "connected" : "NOT connected"),
          h("li", {}, "Customer email codes: ", o.email_configured ? "configured" : "NOT configured"),
          h("li", {}, `Minimum order ${money(o.min_order_cents)} · build retries ${o.build_retries} · then automatic refund`),
          h("li", {}, "Gemma layer — chat: ", h("span", { class: "mono", text: o.ai_layers.gemma_chat.join(", ") }), " · brief & design: ", h("span", { class: "mono", text: o.ai_layers.gemma_design.join(", ") })),
          h("li", {}, "Mistral layer — pricing, tests, code, verification, delivery: ", h("span", { class: "mono", text: o.ai_layers.mistral.join(", ") })),
          h("li", {}, `Rescue from build attempt ${o.ai_layers.rescue_from_attempt}: `, h("span", { class: "mono", text: o.ai_layers.rescue.join(", ") })),
        ),
      ),
    );
  }

  // ------------------------------------------------------------------ engagements
  async function engagements(stage = "") {
    const { engagements: list } = await api("GET", `/api/admin/engagements${stage ? `?stage=${stage}` : ""}`);
    const sel = h("select", { style: "width:auto" }, ["", "discovery", "brief", "design", "quoted", "awaiting_payment", "building", "delivered", "refunded"].map((s) => h("option", { value: s, text: s || "all stages", selected: s === stage })));
    sel.addEventListener("change", () => {
      view.innerHTML = "";
      engagements(sel.value).catch(fail);
    });
    view.append(h("div", { class: "spread" }, h("h2", { text: "Projects run by the company AI" }), sel));
    if (!list.length) return view.append(h("p", { class: "muted", text: "No projects yet." }));
    view.append(
      table(
        ["Project", "Title", "Client", "Stage", "Price", "Build", "Updated"],
        list.map((e) =>
          h(
            "tr",
            { class: "click", onclick: () => openEngagement(e.id) },
            h("td", { class: "mono small", text: e.id }),
            h("td", { text: e.title || "—" }),
            h("td", { text: e.customer_email || "(anonymous)" }),
            h("td", {}, statusChip(e.stage)),
            h("td", { class: "num", text: e.price_cents ? money(e.price_cents, e.currency) : "—" }),
            h("td", { class: "small", text: e.build_attempts ? `${e.build_state || ""} · ${e.build_attempts} attempt(s)` : "" }),
            h("td", { class: "small", text: when(e.updated_at) }),
          ),
        ),
      ),
    );
  }

  async function openEngagement(id) {
    const d = await api("GET", `/api/admin/engagements/${encodeURIComponent(id)}`);
    const e = d.engagement;
    view.innerHTML = "";
    let price = {};
    try {
      price = JSON.parse(e.price_json || "{}");
    } catch {
      price = {};
    }
    view.append(
      h("button", { class: "btn small", type: "button", text: "← Back", onclick: () => go("engagements") }),
      h("div", { class: "spread", style: "margin-top:10px" }, h("div", {}, h("p", { class: "label mono", text: e.id }), h("h2", { text: e.title || "Untitled" }), h("p", { class: "small muted", text: e.customer_email || "anonymous visitor" })), statusChip(e.stage)),
      e.price_cents
        ? h("div", { class: "panel", style: "margin-top:12px" }, h("h3", { text: `AI price: ${money(e.price_cents, e.currency)}` }), h("p", { class: "small", text: price.rationale || "" }), h("p", { class: "small muted", text: `Effort estimate ${price.effort_hours ?? "?"} h · ${price.value_summary || ""} · model ${price.model || ""}${price.floor_applied ? " · $10 floor applied" : ""}` }))
        : null,
      h("h3", { style: "margin-top:16px", text: "Conversation" }),
      h("div", { class: "chat", style: "max-height:420px" }, d.messages.map((m) => h("div", { class: `msg ${m.role === "notice" ? "notice" : m.role}` }, h("span", { class: "who", text: `${m.role} · ${m.kind} · ${when(m.created_at)}` }), m.content))),
    );
    if (e.brief_md) view.append(h("details", { style: "margin-top:12px" }, h("summary", { text: "Brief" }), markdown(e.brief_md)));
    if (e.design_html) {
      const f = h("iframe", { sandbox: "", style: "width:100%;height:480px;border:1px solid var(--line);border-radius:12px;background:#fff" });
      f.srcdoc = e.design_html;
      view.append(h("details", { style: "margin-top:12px" }, h("summary", { text: `Design v${e.design_version} (mock-up)` }), f));
    }
    if (e.design_md) view.append(h("details", { style: "margin-top:12px" }, h("summary", { text: `Design v${e.design_version} (outline)` }), markdown(e.design_md)));
    if (e.tests_json) {
      const t = JSON.parse(e.tests_json);
      view.append(h("details", { style: "margin-top:12px" }, h("summary", { text: "Frozen acceptance tests & contract" }), markdown(t.contract), h("pre", { class: "json", text: t.files.map((f) => `// ${f.path}\n${f.content}`).join("\n") })));
    }
    view.append(h("h3", { style: "margin-top:16px", text: "Build attempts" }));
    if (!d.builds.length) view.append(h("p", { class: "small muted", text: "No builds yet." }));
    for (const b of d.builds) {
      const filesBox = h("div");
      view.append(
        h(
          "details",
          { class: "step", style: "margin-bottom:8px" },
          h("summary", {}, `Attempt ${b.attempt} · `, statusChip(b.status === "passed" ? "succeeded" : b.status), ` · exit ${b.exit_code ?? "?"} · ${b.model || ""}`),
          h("pre", { class: "json", text: b.test_output || "" }),
          h("button", {
            class: "btn small",
            type: "button",
            text: "Show files",
            onclick: async () => {
              const r = await api("GET", `/api/admin/builds/${b.id}/files`);
              filesBox.innerHTML = "";
              r.files.forEach((f) => filesBox.append(h("details", {}, h("summary", { class: "mono small", text: f.path }), h("pre", { class: "json", text: f.content }))));
            },
          }),
          filesBox,
        ),
      );
    }
    view.append(
      h("h3", { style: "margin-top:16px", text: "Payments" }),
      d.payments.length
        ? table(["Payment", "Amount", "Status", "Provider id", "Refund"], d.payments.map((p) => h("tr", {}, h("td", { class: "mono small", text: p.id }), h("td", { class: "num", text: money(p.amount_cents, p.currency) }), h("td", {}, statusChip(p.status)), h("td", { class: "mono small", text: p.provider_payment_id || "" }), h("td", { class: "small", text: p.refund_id ? `${p.refund_id} — ${p.refund_reason || ""}` : "" }))))
        : h("p", { class: "small muted", text: "No payments." }),
    );
    const controls = h("div", { class: "row", style: "margin-top:12px" });
    if (e.stage === "building") controls.append(h("button", { class: "btn small", type: "button", text: "Nudge build runner", onclick: () => api("POST", `/api/admin/engagements/${id}/nudge`, {}).then(() => toast("Runner nudged"), fail) }));
    if (["building", "delivered"].includes(e.stage))
      controls.append(
        h("button", {
          class: "btn small danger",
          type: "button",
          text: "Emergency full refund",
          onclick: () => {
            const reason = prompt("Reason for the emergency refund (shown to the payment provider):");
            if (reason) api("POST", `/api/admin/engagements/${id}/refund`, { reason }).then(() => openEngagement(id), fail);
          },
        }),
      );
    view.append(controls);
  }

  // ------------------------------------------------------------------ tickets
  async function tickets(filter = "") {
    const { tickets: list } = await api("GET", `/api/admin/tickets${filter ? `?status=${filter}` : ""}`);
    const sel = h("select", { style: "width:auto" }, ["", "open", "answered", "escalated", "resolved", "closed"].map((s) => h("option", { value: s, text: s || "all statuses", selected: s === filter })));
    sel.addEventListener("change", () => {
      view.innerHTML = "";
      tickets(sel.value).catch(fail);
    });
    view.append(h("div", { class: "spread" }, h("h2", { text: "Support tickets (answered by the AI 24/7)" }), sel));
    if (!list.length) return view.append(h("p", { class: "muted", text: "No tickets." }));
    view.append(
      table(
        ["Ticket", "Platform", "Member", "Subject", "Customer", "Priority", "Status"],
        list.map((t) => h("tr", { class: "click", onclick: () => openTicket(t.id) }, h("td", { class: "mono small", text: t.id }), h("td", {}, t.platform, t.platform_verified ? " ✓" : ""), h("td", { text: t.member ? "★ lifetime" : "" }), h("td", { text: t.subject }), h("td", { text: t.customer_email }), h("td", { text: t.priority }), h("td", {}, statusChip(t.status)))),
      ),
    );
  }

  async function openTicket(id) {
    const { ticket, messages } = await api("GET", `/api/admin/tickets/${id}`);
    view.innerHTML = "";
    const status = h("select", {}, ["open", "answered", "escalated", "resolved", "closed"].map((s) => h("option", { value: s, text: s, selected: ticket.status === s })));
    const priority = h("select", {}, ["low", "normal", "high", "urgent"].map((s) => h("option", { value: s, text: s, selected: ticket.priority === s })));
    const reply = h("textarea", { placeholder: "Optional message as Saif Tech Global" });
    view.append(
      h("button", { class: "btn small", type: "button", text: "← Back", onclick: () => go("tickets") }),
      h("h2", { style: "margin-top:10px" }, h("span", { class: "mono", text: ticket.id }), " · ", ticket.subject),
      h("p", { class: "small muted", text: `${ticket.customer_email} · ${ticket.platform}${ticket.platform_verified ? " (verified)" : ""}${ticket.member ? " · lifetime member" : ""}` }),
      h("div", { class: "form-grid" }, labelled("Status", status), labelled("Priority", priority)),
      h("button", { class: "btn small", type: "button", text: "Save", onclick: () => api("POST", `/api/admin/tickets/${id}`, { status: status.value, priority: priority.value }).then(() => toast("Saved"), fail) }),
      h("div", { class: "chat", style: "max-height:none;margin-top:14px" }, messages.map((m) => h("div", { class: `msg ${m.author_type === "customer" ? "user" : m.internal ? "system" : "staff"}` }, h("span", { class: "who", text: `${m.author_type} · ${m.author} · ${when(m.created_at)}` }), m.content))),
      reply,
      h("button", { class: "btn small", type: "button", text: "Send", style: "margin-top:8px", onclick: () => api("POST", `/api/admin/tickets/${id}/messages`, { message: reply.value }).then(() => openTicket(id), fail) }),
    );
  }

  // ------------------------------------------------------------------ policy
  async function policy() {
    const p = (await api("GET", "/api/admin/settings")).settings.company_policy;
    const accepting = h("input", { type: "checkbox", checked: !!p.accepting_orders });
    const payments = h("input", { type: "checkbox", checked: !!p.payments_enabled });
    const refund = h("input", { type: "checkbox", checked: !!p.auto_refund });
    const minOrder = h("input", { type: "number", min: "10", step: "1", value: p.min_order_cents / 100 });
    const retries = h("input", { type: "number", min: "0", max: "5", value: p.build_retries });
    const valid = h("input", { type: "number", min: "1", value: p.quote_valid_days });
    const revisions = h("input", { type: "number", min: "0", value: p.max_design_revisions });
    const terms = h("input", { value: p.terms_version });
    view.append(
      h("h2", { text: "Company policy" }),
      h("p", { class: "small muted", text: "Prices are set by the company AI. These are only the safety rails; the $10 minimum cannot be lowered." }),
      h(
        "fieldset",
        {},
        h("legend", { text: "Switches" }),
        h("label", { class: "check" }, accepting, h("span", { text: "Accept new orders (turn off only in an emergency)" })),
        h("label", { class: "check" }, payments, h("span", { text: "Online payments on (requires Dodo keys)" })),
        h("label", { class: "check" }, refund, h("span", { text: "Automatic refund when the AI cannot pass the tests" })),
      ),
      h("fieldset", {}, h("legend", { text: "Rails" }), h("div", { class: "form-grid" }, labelled("Minimum order (USD, ≥ 10)", minOrder), labelled("Build retries after a failed test", retries), labelled("Price valid (days)", valid), labelled("Design revisions allowed", revisions), labelled("Terms version", terms))),
      h("button", {
        class: "btn primary",
        type: "button",
        text: "Save company policy",
        onclick: () =>
          api("PUT", "/api/admin/settings/company_policy", {
            value: {
              accepting_orders: accepting.checked,
              payments_enabled: payments.checked,
              auto_refund: refund.checked,
              min_order_cents: Math.round(Number(minOrder.value) * 100),
              build_retries: Number(retries.value),
              quote_valid_days: Number(valid.value),
              max_design_revisions: Number(revisions.value),
              terms_version: terms.value,
            },
          }).then(() => toast("Saved"), fail),
      }),
    );
  }

  // ------------------------------------------------------------------ AI
  async function ai() {
    const s = (await api("GET", "/api/admin/settings")).settings.ai_config;
    const usage = await api("GET", "/api/admin/ai/usage");
    const list = (v) => v.split(",").map((x) => x.trim()).filter(Boolean);
    const f = {
      gemma_chat_models: h("input", { value: (s.gemma_chat_models || []).join(", ") }),
      gemma_design_models: h("input", { value: (s.gemma_design_models || []).join(", ") }),
      mistral_models: h("input", { value: (s.mistral_models || []).join(", ") }),
      rescue_models: h("input", { value: (s.rescue_models || []).join(", ") }),
      rescue_from_attempt: h("input", { type: "number", min: "2", max: "6", value: s.rescue_from_attempt }),
      timeout_ms: h("input", { type: "number", value: s.timeout_ms }),
      long_timeout_ms: h("input", { type: "number", value: s.long_timeout_ms }),
      retries_per_model: h("input", { type: "number", min: "0", max: "3", value: s.retries_per_model }),
      gateway_id: h("input", { value: s.gateway_id || "" }),
      daily_request_limit: h("input", { type: "number", value: s.daily_request_limit }),
    };
    const health = h("div");
    view.append(
      h("h2", { text: "AI infrastructure — Gemma + Mistral" }),
      h("p", { class: "small muted", text: "Only two models are accepted: @cf/google/gemma-4-26b-a4b-it and @cf/mistralai/mistral-small-3.1-24b-instruct." }),
      h(
        "fieldset",
        {},
        h("legend", { text: "Gemma layer — front-end" }),
        h("div", { class: "form-grid" }, labelled("Customer chat & 24/7 support", f.gemma_chat_models), labelled("Project brief & design / mock-ups", f.gemma_design_models)),
      ),
      h(
        "fieldset",
        {},
        h("legend", { text: "Mistral layer — precision coding, logic & delivery" }),
        h("div", { class: "form-grid" }, labelled("Pricing logic, acceptance tests, code, fixes, final review, delivery docs", f.mistral_models)),
      ),
      h(
        "fieldset",
        {},
        h("legend", { text: "Fallback before refund" }),
        h("div", { class: "form-grid" }, labelled("Use fallback from build attempt #", f.rescue_from_attempt), labelled("Fallback model on those attempts", f.rescue_models)),
      ),
      h(
        "fieldset",
        {},
        h("legend", { text: "Reliability & cost" }),
        h("div", { class: "form-grid" }, labelled("Chat timeout (ms)", f.timeout_ms), labelled("Long task timeout (ms)", f.long_timeout_ms), labelled("Retries per model", f.retries_per_model), labelled("AI Gateway id", f.gateway_id), labelled("Daily request cap", f.daily_request_limit)),
      ),
      h(
        "div",
        { class: "row" },
        h("button", {
          class: "btn primary",
          type: "button",
          text: "Save",
          onclick: () =>
            api("PUT", "/api/admin/settings/ai_config", {
              value: {
                gemma_chat_models: list(f.gemma_chat_models.value),
                gemma_design_models: list(f.gemma_design_models.value),
                mistral_models: list(f.mistral_models.value),
                rescue_models: list(f.rescue_models.value),
                rescue_from_attempt: Number(f.rescue_from_attempt.value),
                timeout_ms: Number(f.timeout_ms.value),
                long_timeout_ms: Number(f.long_timeout_ms.value),
                retries_per_model: Number(f.retries_per_model.value),
                gateway_id: f.gateway_id.value.trim(),
                daily_request_limit: Number(f.daily_request_limit.value),
              },
            }).then(() => toast("Saved"), fail),
        }),
        h("button", {
          class: "btn",
          type: "button",
          text: "Health check",
          onclick: async () => {
            health.textContent = "Checking…";
            const r = await api("POST", "/api/admin/ai/health", {}).catch((ex) => ({ error: ex.message }));
            health.innerHTML = "";
            if (r.error) return (health.textContent = r.error);
            health.append(table(["Model", "Status", "Latency"], r.models.map((m) => h("tr", {}, h("td", { class: "mono small", text: m.model }), h("td", {}, statusChip(m.ok ? "succeeded" : "failed")), h("td", { class: "num", text: `${m.latency_ms} ms` })))));
          },
        }),
      ),
      health,
      h("h3", { style: "margin-top:16px", text: "Usage (7 days)" }),
      table(["Model", "Task", "Calls", "OK", "Avg latency"], usage.usage.map((u) => h("tr", {}, h("td", { class: "mono small", text: u.model }), h("td", { text: u.task }), h("td", { class: "num", text: String(u.calls) }), h("td", { class: "num", text: String(u.ok) }), h("td", { class: "num", text: `${Math.round(u.avg_latency_ms)} ms` })))),
    );
  }

  // ------------------------------------------------------------------ KB, audit, staff
  async function kb() {
    const { docs } = await api("GET", "/api/admin/kb");
    const editor = h("div");
    const edit = (doc = {}) => {
      editor.innerHTML = "";
      const scope = h("input", { value: doc.scope || "company" });
      const title = h("input", { value: doc.title || "" });
      const body = h("textarea", { style: "min-height:200px" });
      body.value = doc.body || "";
      const verified = h("input", { type: "checkbox", checked: doc.verified === undefined ? true : !!doc.verified });
      editor.append(
        h(
          "div",
          { class: "panel pink", style: "margin:12px 0" },
          h("div", { class: "form-grid" }, labelled("Scope", scope), labelled("Title", title)),
          labelled("Body", body),
          h("label", { class: "check" }, verified, h("span", { text: "Verified (used by the AI)" })),
          h(
            "div",
            { class: "row" },
            h("button", { class: "btn primary small", type: "button", text: "Save", onclick: () => api(doc.id ? "PUT" : "POST", `/api/admin/kb${doc.id ? `/${doc.id}` : ""}`, { scope: scope.value, title: title.value, body: body.value, verified: verified.checked }).then(() => go("kb"), fail) }),
            doc.id ? h("button", { class: "btn danger small", type: "button", text: "Delete", onclick: () => confirm("Delete?") && api("DELETE", `/api/admin/kb/${doc.id}`).then(() => go("kb"), fail) }) : null,
          ),
        ),
      );
    };
    view.append(
      h("h2", { text: "Knowledge base" }),
      h("button", { class: "btn small", type: "button", text: "+ New document", onclick: () => edit() }),
      editor,
      table(["Scope", "Title", "Verified", "Updated"], docs.map((d) => h("tr", { class: "click", onclick: () => edit(d) }, h("td", { text: d.scope }), h("td", { text: d.title }), h("td", { text: d.verified ? "yes" : "no" }), h("td", { class: "small", text: when(d.updated_at) })))),
    );
  }

  async function audit() {
    const { entries } = await api("GET", "/api/admin/audit");
    view.append(h("h2", { text: "Audit log" }), table(["Time", "Actor", "Action", "Target", "Detail"], entries.map((e) => h("tr", {}, h("td", { class: "small", text: when(e.created_at) }), h("td", { text: e.actor }), h("td", { class: "mono small", text: e.action }), h("td", { class: "mono small", text: e.target || "" }), h("td", { class: "small", text: e.detail || "" })))));
  }

  async function staffTab() {
    const r = await api("GET", "/api/admin/staff");
    const email = h("input", { type: "email", placeholder: "staff@saiftechglobal.com" });
    const role = h("select", {}, ["admin", "support", "viewer"].map((x) => h("option", { value: x, text: x })));
    view.append(
      h("h2", { text: "Staff" }),
      h("p", { class: "small muted", text: `Owners: ${r.owners_from_config.join(", ") || "none configured"}` }),
      table(["Email", "Role", ""], r.staff.map((s) => h("tr", {}, h("td", { text: s.email }), h("td", { text: s.role }), h("td", {}, h("button", { class: "btn small danger", type: "button", text: "Remove", onclick: () => api("DELETE", `/api/admin/staff/${encodeURIComponent(s.email)}`).then(() => go("staff"), fail) }))))),
      h("div", { class: "form-grid", style: "margin-top:12px" }, email, role, h("button", { class: "btn small primary", type: "button", text: "Add / update", onclick: () => api("POST", "/api/admin/staff", { email: email.value, role: role.value }).then(() => go("staff"), fail) })),
    );
  }

  boot().catch(fail);
})();
