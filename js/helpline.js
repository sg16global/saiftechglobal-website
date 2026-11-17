/* Centralized 24/7 Helpline customer page. */
(function () {
  const { $, h, api, when, toast, statusChip, signInCard, emblem } = window.Portal;
  $("#brand").prepend(emblem(40));
  const params = new URLSearchParams(location.search);
  const log = $("#log");
  let session = null;
  let me = null;

  function add(role, text) {
    log.append(h("div", { class: `msg ${role}` }, h("span", { class: "who", text: role === "user" ? "You" : role === "assistant" ? "AI support agent" : role === "staff" ? "Saif Tech support team" : "Notice" }), text));
    log.scrollTop = log.scrollHeight;
  }

  function showPlatform(p) {
    const box = $("#platform");
    box.innerHTML = "";
    box.append(h("h3", { text: p.name }), p.verified ? h("span", { class: "chip green" }, h("span", { class: "dot" }), "Verified by the product") : h("span", { class: "chip" }, "Selected product"));
  }

  async function startSession(project) {
    // ctx = signed platform context from an SG16 product; project = untrusted hint (documentation only)
    session = await api("POST", "/api/helpline/sessions", { ctx: params.get("ctx") || undefined, project: project || params.get("project") || undefined });
    showPlatform(session.platform);
    if (session.member) $("#platform").append(h("p", { style: "margin-top:8px" }, h("span", { class: "chip pink" }, h("span", { class: "dot" }), `Lifetime priority member · ${session.member}`)));
    $("#platform-select").value = session.platform.id;
    log.innerHTML = "";
    add("assistant", session.member
      ? `Welcome back! As a lifetime member you have priority support, and I know your delivered projects in full. How can I help with ${session.platform.name} or your project today?`
      : `Hello! I'm the 24/7 AI support agent for ${session.platform.name}. How can I help you today?`);
  }

  async function boot() {
    const { platforms } = await api("GET", "/api/helpline/platforms");
    const sel = $("#platform-select");
    platforms.forEach((p) => sel.append(h("option", { value: p.id, text: p.name })));
    sel.addEventListener("change", () => startSession(sel.value));
    me = (await api("GET", "/api/auth/me")).customer;
    await startSession();
    if (me) loadTickets();
    if (params.get("ticket") && me) openTicket(params.get("ticket"));
  }

  $("#composer").addEventListener("submit", async (e) => {
    e.preventDefault();
    const input = $("#input");
    const text = input.value.trim();
    if (!text || !session) return;
    add("user", text);
    input.value = "";
    $("#send").disabled = true;
    $("#typing").classList.remove("hidden");
    try {
      const r = await api("POST", `/api/helpline/sessions/${session.id}/messages`, { message: text });
      add("assistant", r.reply);
      if (r.suggest_ticket) add("notice", "This looks like something our team should handle. Use “Talk to a person” to open a ticket — the conversation is attached automatically.");
    } catch (ex) {
      add("notice", ex.data && ex.data.ai_unavailable ? "Our AI agent is temporarily unavailable. Please open a ticket and our team will help you." : ex.message);
    } finally {
      $("#send").disabled = false;
      $("#typing").classList.add("hidden");
    }
  });
  $("#input").addEventListener("keydown", (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      $("#composer").requestSubmit();
    }
  });

  $("#human").addEventListener("click", async () => {
    const area = $("#ticket-area");
    if (!me) {
      me = await signInCard(area, { intro: "Sign in with your email so you can follow your ticket and receive replies." });
      loadTickets();
    }
    area.innerHTML = "";
    const subject = h("input", { maxlength: "160", placeholder: "Short summary", required: true });
    const description = h("textarea", { maxlength: "5000", placeholder: "What happened, what you expected, and any error message.", required: true });
    const priority = h("select", {}, ["normal", "high", "urgent", "low"].map((p) => h("option", { value: p, text: p })));
    const escalate = h("input", { type: "checkbox" });
    const form = h(
      "form",
      { class: "panel pink" },
      h("h3", { text: "Open a support ticket" }),
      h("p", { class: "small muted", text: "Our AI answers tickets immediately, 24/7. This chat is attached to the ticket." }),
      h("label", { class: "field" }, h("span", { text: "Subject" }), subject),
      h("label", { class: "field" }, h("span", { text: "Details" }), description),
      h("label", { class: "field" }, h("span", { text: "Priority" }), priority),
      h("label", { class: "check" }, escalate, h("span", { text: "I need a person to take over (escalate)" })),
      h("div", { class: "row", style: "margin-top:12px" }, h("button", { class: "btn primary", type: "submit", text: "Submit ticket" })),
    );
    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      try {
        const r = await api("POST", "/api/helpline/tickets", { subject: subject.value, description: description.value, priority: priority.value, escalate: escalate.checked, session_id: session && session.id });
        toast(`Ticket ${r.id} created${r.member ? " with lifetime priority" : ""} — our AI has replied.`);
        area.innerHTML = "";
        loadTickets();
        openTicket(r.id);
      } catch (ex) {
        toast(ex.message);
      }
    });
    area.append(form);
    subject.focus();
  });

  async function loadTickets() {
    const box = $("#tickets");
    try {
      const { tickets } = await api("GET", "/api/helpline/tickets");
      box.innerHTML = "";
      if (!tickets.length) box.append(h("p", { class: "small muted", text: "No tickets yet." }));
      tickets.forEach((t) => box.append(h("button", { class: "btn small", type: "button", onclick: () => openTicket(t.id) }, h("span", {}, h("span", { class: "mono", text: t.id }), " · ", t.subject))));
    } catch {
      box.innerHTML = "";
      box.append(h("p", { class: "small muted", text: "Sign in to see your tickets." }));
    }
  }

  async function openTicket(id) {
    const area = $("#ticket-area");
    const { ticket, messages } = await api("GET", `/api/helpline/tickets/${encodeURIComponent(id)}`);
    area.innerHTML = "";
    const tlog = h("div", { class: "chat" }, messages.map((m) => h("div", { class: `msg ${m.author_type === "customer" ? "user" : m.author_type === "system" ? "system" : "staff"}` }, h("span", { class: "who", text: `${m.author_type === "customer" ? "You" : m.author_type === "ai" ? "Saif Tech Global AI" : m.author_type === "staff" ? "Saif Tech Global" : "System"} · ${when(m.created_at)}` }), m.content)));
    const reply = h("textarea", { placeholder: "Add a reply…", maxlength: "5000" });
    const form = h("form", { class: "composer" }, reply, h("button", { class: "btn primary", type: "submit", text: "Reply" }));
    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      if (!reply.value.trim()) return;
      try {
        await api("POST", `/api/helpline/tickets/${ticket.id}/messages`, { message: reply.value });
        openTicket(ticket.id);
      } catch (ex) {
        toast(ex.message);
      }
    });
    const escalateBtn = h("button", {
      class: "btn small",
      type: "button",
      text: "Escalate to a person",
      onclick: async () => {
        try {
          await api("POST", `/api/helpline/tickets/${ticket.id}/escalate`, {});
          toast("Escalated to our support team.");
          openTicket(ticket.id);
        } catch (ex) {
          toast(ex.message);
        }
      },
    });
    area.append(
      h(
        "div",
        { class: "panel" },
        h("div", { class: "spread" }, h("h3", {}, h("span", { class: "mono", text: ticket.id }), " · ", ticket.subject), statusChip(ticket.status)),
        h("p", { class: "small muted", text: `Priority ${ticket.priority} · opened ${when(ticket.created_at)}` }),
        tlog,
        ticket.status === "closed" ? h("p", { class: "small muted", text: "This ticket is closed." }) : form,
        ["closed", "escalated"].includes(ticket.status) ? null : h("div", { class: "row", style: "margin-top:10px" }, escalateBtn),
      ),
    );
  }

  boot().catch((ex) => add("notice", ex.message));
})();
