/**
 * Saif Tech Global — voice guide.
 * Speaks a welcome + ecosystem + AI history narration, and describes anything the visitor clicks.
 * Uses the browser's built-in speech (Web Speech API) with a preference for natural young male voices.
 *
 * Browsers do not allow sound before the visitor interacts with the page, so the narration
 * starts on the first click / tap / key press (or immediately where the browser permits it).
 * Visitors can switch it off at any time; that choice is remembered on their device.
 */
(function () {
  const synth = window.speechSynthesis;
  if (!synth || typeof SpeechSynthesisUtterance === "undefined") return;

  const STORE_KEY = "stg-voice-guide";
  const read = () => {
    try { return localStorage.getItem(STORE_KEY); } catch { return null; }
  };
  const write = (v) => {
    try { localStorage.setItem(STORE_KEY, v); } catch { /* storage unavailable */ }
  };

  // ---------------------------------------------------------------- narration
  const INTRO = [
    "Welcome to Saif Tech Global LLC.",
    "We are a USA technology company, registered in New Mexico and headquartered in Albuquerque.",
    "We build AI platforms, financial intelligence, and live global monitoring — for people all over the world.",
    "Let me walk you through our ecosystem.",
    "At the center is SG16 Brain — our own sovereign cloud AI, running twenty-four seven at mistral brain dot com. Every SG16 product connects to it.",
    "SG16 AI Engine is our flagship. It is a multi-workspace AI for chat, coding, documents and images, with five dedicated shields: Coding Hub, Health, Student, Market, and AI Chat.",
    "Its Zero-Data Trace policy means your chats are processed live to produce a reply, and are not stored on our servers.",
    "SG16 Finance brings Wall Street clarity to everyone — live dashboards, a world market map, and company earnings explained in plain English.",
    "SG16 Children World is a safe and joyful learning world, where kids chat with Robo, a friendly AI helper, protected by age tiers, parent gates, and kid-safe rules.",
    "SG16 Geopolitical Monitor is a live world command map — tension zones, flights, markets, earthquakes, and breaking news, all in one view.",
    "SG16 Ads Network lets any business advertise in about two minutes: pick a package, upload your brand, and AI designs your ad and puts it live.",
    "And SG16 Identifier helps you verify products, news, websites and media — with the evidence behind every result.",
    "So, what is artificial intelligence?",
    "AI is software that learns patterns from data, so it can understand language, recognize images, make predictions, and help people solve problems.",
    "But AI has no mind of its own. As our company message says: AI is a reflection of your own thoughts. Use it with honesty and good intent, and it can lift you toward success.",
    "Now, a short history of AI, from A to Z.",
    "In 1950, Alan Turing asked a simple question: can machines think? His imitation game, now called the Turing Test, set the goal for a whole field.",
    "In 1956, at a summer workshop at Dartmouth College, John McCarthy and his colleagues gave the field its name: artificial intelligence.",
    "In 1958, Frank Rosenblatt introduced the perceptron, one of the first artificial neural networks.",
    "In 1966, Joseph Weizenbaum created ELIZA, one of the very first chatbots.",
    "In the nineteen-seventies and eighties, expert systems captured human know-how as rules. Big promises and slow progress led to the AI winters, when funding and interest cooled.",
    "In 1986, Rumelhart, Hinton and Williams popularized backpropagation, which made it practical to train neural networks with many layers.",
    "In 1997, IBM's Deep Blue defeated world chess champion Garry Kasparov.",
    "In 2012, a deep neural network called AlexNet won the ImageNet challenge by a wide margin. Powered by big data and graphics chips, the deep-learning era had begun.",
    "In 2016, DeepMind's AlphaGo defeated Lee Sedol at the game of Go, long thought too intuitive for machines.",
    "In 2017, researchers at Google introduced the Transformer — the architecture behind today's large language models.",
    "In late 2022, ChatGPT brought generative AI to the whole world, and millions of people began writing, coding and creating with AI every day.",
    "Today, AI is moving into every product, and into the hands of companies like ours that run their own sovereign AI.",
    "That is our story — and the story of AI.",
    "Click on anything across this website, and I will tell you what it is. Thank you for visiting Saif Tech Global LLC.",
  ];

  const SECTIONS = {
    top: "This is the introduction to Saif Tech Global LLC — building global intelligence for the world.",
    network: "This is the SG16 Network: all of our live platforms, moving past like a conveyor. Hover over it to pause.",
    features: "This section explains why people choose Saif Tech Global: sovereign AI, Zero-Data Trace privacy, global scale, and human-first design.",
    showcase: "This is the product showcase, where you can explore each SG16 platform in detail.",
    sovereign: "This section is about SG16 Brain, our own sovereign cloud AI. We run our own brain — not a rented AI wrapper.",
    message: "This is our company message about AI: AI is a reflection of your own thoughts, so use it for good purposes.",
    pioneers: "This is Global Presence and the AI Pioneers gallery — six nations, and ten historical figures whose ideas made artificial intelligence possible. Click a portrait to hear about that person.",
    products: "These are our products — every SG16 platform with its features and a link to visit it.",
    benefits: "This section covers the five shields inside SG16 AI Engine: Coding Hub, Health, Student, Market, and AI Chat.",
    testimonials: "These are testimonials from people who use SG16 products.",
    pricing: "This is pricing for SG16 Ads Network, with packages starting from three dollars.",
    faq: "These are frequently asked questions. Click a question to read its answer.",
    about: "This is the About section — who Saif Tech Global LLC is and where we are based.",
    contact: "This is the contact section. You can email Saif Tech Global directly from here.",
  };

  const DOMAINS = {
    "sg16engine.com": "SG16 AI Engine, our flagship multi-workspace AI",
    "sg16finance.com": "SG16 Finance, global market intelligence in plain English",
    "sg16children.com": "SG16 Children World, a safe AI learning world for kids",
    "saifglobal16.info": "SG16 Geopolitical Monitor, a live world command map",
    "ads.saiftechglobal.com": "SG16 Ads Network, AI-built advertising in minutes",
    "sg16identifier.com": "SG16 Identifier, evidence-based verification for products, news and media",
    "mistralbrain.com": "SG16 Brain, our sovereign cloud AI",
    "api.mistralbrain.com": "the SG16 Brain service",
  };

  // ---------------------------------------------------------------- voice
  const PREFERRED = [
    /Andrew.*Natural/i, /Brian.*Natural/i, /Christopher.*Natural/i, /Guy.*Natural/i, /Eric.*Natural/i,
    /Roger.*Natural/i, /Ryan.*Natural/i, /Google UK English Male/i, /Daniel/i, /Aaron/i, /Alex\b/i,
    /Microsoft (David|Mark)/i,
  ];
  let voice = null;
  function pickVoice() {
    const voices = synth.getVoices().filter((v) => /^en(-|_|$)/i.test(v.lang));
    for (const re of PREFERRED) {
      const v = voices.find((x) => re.test(x.name));
      if (v) return (voice = v);
    }
    voice = voices.find((v) => /male/i.test(v.name) && !/female/i.test(v.name)) || voices[0] || null;
    return voice;
  }
  pickVoice();
  if (typeof synth.addEventListener === "function") synth.addEventListener("voiceschanged", pickVoice);
  else synth.onvoiceschanged = pickVoice;

  // ---------------------------------------------------------------- UI
  const style = document.createElement("style");
  style.textContent = `
  #voice-guide{position:fixed;z-index:60;right:calc(16px + env(safe-area-inset-right));bottom:calc(16px + env(safe-area-inset-bottom));
    max-width:min(320px,calc(100vw - 32px));display:flex;flex-direction:column;gap:6px;align-items:flex-end;font-style:normal;pointer-events:none}
  #voice-guide > *{pointer-events:auto}
  #voice-guide .vg-row{display:flex;gap:6px}
  #voice-guide button{display:inline-flex;align-items:center;gap:8px;border-radius:999px;border:1px solid rgba(242,21,95,.7);
    background:rgba(0,0,0,.85);color:#fff;font:500 12px/1 "Bodoni Moda",Georgia,serif;font-style:italic;padding:8px 12px;cursor:pointer;
    backdrop-filter:blur(12px);-webkit-backdrop-filter:blur(12px)}
  #voice-guide button:hover{background:#f2155f}
  #voice-guide button[aria-pressed="false"]{border-color:rgba(255,255,255,.25);color:rgba(255,255,255,.75)}
  #voice-guide .vg-bars{display:inline-flex;gap:2px;align-items:flex-end;height:12px}
  #voice-guide .vg-bars i{width:2px;background:#f2155f;height:4px;border-radius:2px}
  #voice-guide.speaking .vg-bars i{animation:vgBar .9s ease-in-out infinite}
  #voice-guide.speaking .vg-bars i:nth-child(2){animation-delay:.15s}
  #voice-guide.speaking .vg-bars i:nth-child(3){animation-delay:.3s}
  #voice-guide button:hover .vg-bars i{background:#fff}
  @keyframes vgBar{0%,100%{height:3px}50%{height:12px}}
  #voice-guide .vg-caption{display:none;border-radius:14px;border:1px solid rgba(255,255,255,.14);background:rgba(0,0,0,.88);
    color:rgba(255,255,255,.9);font:400 12px/1.45 "Bodoni Moda",Georgia,serif;font-style:italic;padding:8px 12px;pointer-events:none!important}
  @media (max-width:767px){#voice-guide .vg-caption{max-height:4.5em;overflow:hidden}}
  #voice-guide.speaking .vg-caption{display:block}
  #voice-guide .vg-hint{border-radius:14px;background:#f2155f;color:#fff;font:400 13px/1.4 "Bodoni Moda",Georgia,serif;font-style:italic;padding:8px 12px}
  @media (prefers-reduced-motion: reduce){#voice-guide.speaking .vg-bars i{animation:none;height:8px}}`;
  document.head.appendChild(style);

  const root = document.createElement("div");
  root.id = "voice-guide";
  root.setAttribute("role", "region");
  root.setAttribute("aria-label", "Voice guide");
  root.innerHTML = `
    <div class="vg-caption" aria-live="polite"></div>
    <div class="vg-hint" hidden>Tap anywhere to hear the Saif Tech Global voice guide</div>
    <div class="vg-row">
      <button type="button" class="vg-toggle" aria-pressed="true"><span class="vg-bars" aria-hidden="true"><i></i><i></i><i></i></span><span class="vg-label">Voice guide on</span></button>
      <button type="button" class="vg-replay" aria-label="Replay the voice introduction">↺ Intro</button>
    </div>`;
  document.body.appendChild(root);
  const caption = root.querySelector(".vg-caption");
  const hint = root.querySelector(".vg-hint");
  const toggleBtn = root.querySelector(".vg-toggle");
  const toggleLabel = root.querySelector(".vg-label");
  const replayBtn = root.querySelector(".vg-replay");

  // ---------------------------------------------------------------- engine
  let enabled = read() !== "off";
  let introIndex = 0;
  let introDone = false;
  let introStarted = false;
  let mode = "idle"; // idle | intro | waiting | describe
  let token = 0; // invalidates callbacks from cancelled utterances
  let interacted = false; // once the visitor touches/clicks an element, the intro stops looping
  let loopTimer = 0;
  const LOOP_GAP_MS = 5000; // silence between intro repeats

  function render() {
    toggleBtn.setAttribute("aria-pressed", enabled ? "true" : "false");
    toggleLabel.textContent = enabled ? (mode === "idle" ? "Voice guide on" : "Stop voice") : "Voice guide off";
    root.classList.toggle("speaking", enabled && (mode === "intro" || mode === "describe"));
    hint.hidden = !(enabled && !introStarted);
  }

  function say(text, onEnd) {
    const my = ++token;
    const u = new SpeechSynthesisUtterance(text);
    if (voice || pickVoice()) u.voice = voice;
    u.lang = (voice && voice.lang) || "en-US";
    u.rate = 1.02;
    u.pitch = 1.05;
    u.onstart = () => {
      if (my !== token) return;
      caption.textContent = text;
    };
    u.onend = () => {
      if (my !== token) return;
      onEnd && onEnd();
    };
    u.onerror = (e) => {
      if (my !== token) return;
      if (e.error === "not-allowed") {
        // browser wants a user gesture first
        introStarted = false;
        mode = "idle";
        render();
        return;
      }
      onEnd && onEnd();
    };
    synth.speak(u);
  }

  function stop() {
    token++;
    clearTimeout(loopTimer);
    synth.cancel();
    mode = "idle";
    render();
  }

  function continueIntro() {
    if (!enabled) return;
    if (introIndex >= INTRO.length) {
      introDone = true;
      if (!interacted) {
        // nobody has interacted yet: wait 5 seconds, then play the introduction again
        mode = "waiting";
        render();
        caption.textContent = "";
        clearTimeout(loopTimer);
        const my = token;
        loopTimer = setTimeout(() => {
          if (my !== token || interacted || !enabled) return;
          introIndex = 0;
          introDone = false;
          continueIntro();
        }, LOOP_GAP_MS);
        return;
      }
      mode = "idle";
      render();
      return;
    }
    mode = "intro";
    render();
    say(INTRO[introIndex], () => {
      introIndex++;
      continueIntro();
    });
  }

  function startIntro(fromStart) {
    if (fromStart) {
      introIndex = 0;
      introDone = false;
    }
    introStarted = true;
    interacted = false; // (re)starting the intro means it loops again until the next interaction
    token++;
    clearTimeout(loopTimer);
    synth.cancel();
    continueIntro();
  }

  function describe(text) {
    interacted = true; // the visitor is exploring: stop the intro loop, talk about what they touched
    token++;
    clearTimeout(loopTimer);
    synth.cancel();
    mode = "describe";
    render();
    say(text, () => {
      mode = "idle";
      render();
    });
  }

  // ---------------------------------------------------------------- what was clicked?
  const clean = (s) => (s || "").replace(/\s+/g, " ").replace(/[↗→↺]/g, "").trim();

  function sectionOf(el) {
    const sec = el.closest("section[id], footer, header");
    if (!sec) return null;
    if (sec.tagName === "FOOTER") return "This is the footer, with company details, our registration certificate, legal notice and links.";
    if (sec.tagName === "HEADER") return "This is the main navigation bar of Saif Tech Global.";
    if (SECTIONS[sec.id]) return SECTIONS[sec.id];
    const h = sec.querySelector("h2, h1");
    return h ? `This section is: ${clean(h.textContent)}.` : null;
  }

  function linkText(a) {
    const label = clean(a.getAttribute("aria-label") || a.textContent);
    const href = a.getAttribute("href") || "";
    if (href.startsWith("mailto:")) return `${label}. This opens your email app to contact Saif Tech Global.`;
    if (href.startsWith("#")) {
      const target = document.getElementById(href.slice(1));
      const sec = target && (SECTIONS[target.id] || (target.querySelector("h2, h3") && clean(target.querySelector("h2, h3").textContent)));
      return sec ? `${label}. ${sec}` : `${label}. This takes you to that part of the page.`;
    }
    if (/^\/?privacy/.test(href)) return `${label}. This opens our privacy policy.`;
    if (/^\/working-mode/.test(href)) return "Working Mode — for your destination. This opens our AI business and project service department, where you can describe a project, receive a specification and quotation, and follow its progress.";
    if (/^\/helpline/.test(href)) return "This opens our Centralized 24/7 Helpline, the support desk for every Saif Tech Global platform.";
    try {
      const url = new URL(href, location.href);
      const host = url.hostname.replace(/^www\./, "");
      if (url.origin !== location.origin) {
        const what = DOMAINS[host];
        return what ? `${label}. This opens ${what}, at ${host}, in a new tab.` : `${label}. This opens ${host} in a new tab.`;
      }
    } catch { /* not a URL */ }
    return label ? `${label}.` : null;
  }

  function explain(target) {
    const tagged = target.closest("[data-voice]");
    const link = target.closest("a[href]");
    if (link && (!tagged || tagged.contains(link))) return linkText(link);
    if (tagged) return tagged.getAttribute("data-voice");
    const btn = target.closest("button, summary");
    if (btn) {
      const label = clean(btn.getAttribute("aria-label") || btn.textContent);
      if (btn.closest("#faq")) return `Question: ${label}`;
      if (label) return `${label}.`;
    }
    const heading = target.closest("h1, h2, h3, h4");
    if (heading) return clean(heading.textContent);
    return sectionOf(target);
  }

  // ---------------------------------------------------------------- events
  toggleBtn.addEventListener("click", () => {
    if (enabled) {
      enabled = false;
      write("off");
      stop();
    } else {
      enabled = true;
      write("on");
      startIntro(introDone);
    }
  });
  replayBtn.addEventListener("click", () => {
    enabled = true;
    write("on");
    startIntro(true);
  });

  document.addEventListener("click", (e) => {
    if (!enabled || root.contains(e.target)) return;
    if (!introStarted) {
      startIntro(true); // first interaction unlocks audio: begin with the welcome
      return;
    }
    const text = explain(e.target);
    if (text) describe(text);
  });
  document.addEventListener("keydown", (e) => {
    if (!enabled || introStarted || root.contains(e.target)) return;
    if (e.key === "Enter" || e.key === " " || e.key === "Tab") startIntro(true);
  });

  // Where the browser allows sound without a gesture, start right away.
  render();
  if (enabled) {
    setTimeout(() => {
      if (introStarted) return;
      const probe = new SpeechSynthesisUtterance(INTRO[0]);
      if (voice) probe.voice = voice;
      probe.rate = 1.02;
      probe.pitch = 1.05;
      const my = ++token;
      probe.onstart = () => {
        if (my !== token) return;
        introStarted = true;
        mode = "intro";
        caption.textContent = INTRO[0];
        render();
      };
      probe.onend = () => {
        if (my !== token) return;
        introIndex = 1;
        continueIntro();
      };
      probe.onerror = () => {
        if (my !== token) return;
        introStarted = false;
        mode = "idle";
        render();
      };
      synth.speak(probe);
    }, 900);
  }
  window.addEventListener("pagehide", () => synth.cancel());
})();
