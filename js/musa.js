/** Vanilla behaviors for prerendered Musa premium page (no React). */
(function () {
  const menuBtn = document.querySelector('button[aria-controls="mobile-nav"]');
  const mobileNav = document.getElementById("mobile-nav");
  if (menuBtn && mobileNav) {
    menuBtn.addEventListener("click", () => {
      const open = menuBtn.getAttribute("aria-expanded") !== "true";
      menuBtn.setAttribute("aria-expanded", open ? "true" : "false");
      mobileNav.classList.toggle("max-h-0", !open);
      mobileNav.classList.toggle("opacity-0", !open);
      mobileNav.classList.toggle("max-h-[420px]", open);
      mobileNav.classList.toggle("opacity-100", open);
      document.body.style.overflow = open ? "hidden" : "";
    });
    mobileNav.querySelectorAll("a").forEach((link) => {
      link.addEventListener("click", () => {
        mobileNav.classList.remove("open");
        menuBtn.setAttribute("aria-expanded", "false");
      });
    });
  }

  document.querySelectorAll("#faq button[aria-expanded]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const open = btn.getAttribute("aria-expanded") === "true";
      btn.setAttribute("aria-expanded", open ? "false" : "true");
      const panel = btn.parentElement?.querySelector(".grid");
      if (panel) {
        panel.classList.toggle("grid-rows-[0fr]", open);
        panel.classList.toggle("grid-rows-[1fr]", !open);
      }
    });
  });

  document.querySelectorAll(".reveal").forEach((el) => {
    el.classList.add("is-visible");
  });

  (function networkRailScroll() {
    const section = document.getElementById("network");
    if (!section) return;
    const rail = section.querySelector(".rail-scroll");
    const prev = section.querySelector('button[aria-label="Scroll network cards left"]');
    const next = section.querySelector('button[aria-label="Scroll network cards right"]');
    const progressFill = section.querySelector(".h-1.overflow-hidden.rounded-full > div");
    if (!rail || !prev || !next) return;

    function update() {
      const canLeft = rail.scrollLeft > 8;
      const canRight = rail.scrollLeft + rail.clientWidth < rail.scrollWidth - 8;
      prev.disabled = !canLeft;
      next.disabled = !canRight;
      const max = rail.scrollWidth - rail.clientWidth;
      const progress = max > 0 ? rail.scrollLeft / max : 0;
      if (progressFill) progressFill.style.width = 12 + progress * 88 + "%";
    }

    function scrollBy(dir) {
      const step = Math.min(380, rail.clientWidth * 0.8);
      rail.scrollBy({ left: dir * step, behavior: "smooth" });
    }

    prev.addEventListener("click", () => scrollBy(-1));
    next.addEventListener("click", () => scrollBy(1));
    rail.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    update();
    requestAnimationFrame(update);
  })();

  (function warmAdsSite() {
    const base = "https://ads.saiftechglobal.com";
    let done = false;
    function prefetch(path, as) {
      const link = document.createElement("link");
      link.rel = "prefetch";
      link.href = base + path;
      if (as) link.as = as;
      document.head.appendChild(link);
    }
    function warm() {
      if (done) return;
      done = true;
      prefetch("/", "document");
      prefetch("/css/style.css", "style");
      prefetch("/assets/sovereign-logo.svg", "image");
    }
    if ("requestIdleCallback" in window) requestIdleCallback(warm, { timeout: 4000 });
    else setTimeout(warm, 4000);
    document.querySelectorAll('a[href*="ads.saiftechglobal.com"]').forEach((a) => {
      a.addEventListener("mouseenter", warm, { once: true });
      a.addEventListener("touchstart", warm, { once: true, passive: true });
    });
  })();

  (function liveNetworkStatus() {
    const brainTexts = [];
    document.querySelectorAll("span, p").forEach((el) => {
      const t = el.textContent || "";
      if (t.includes("SG16 Mistral X") && t.includes("live")) brainTexts.push(el);
      if (t.includes("platforms live")) brainTexts.push(el);
    });

    function apply(data) {
      const byId = {};
      (data.platforms || []).forEach((p) => {
        byId[p.id] = p;
      });
      const brain = byId.brain;
      const productIds = ["engine", "children", "finance", "geo", "ads"];
      const liveCount = productIds.filter((id) => byId[id] && byId[id].ok).length;

      document.querySelectorAll("[data-live-badge]").forEach((badge) => {
        const card = badge.closest("[data-platform]");
        const id = card?.getAttribute("data-platform");
        if (id && byId[id]) badge.textContent = byId[id].ok ? "Live" : "Down";
      });

      document.querySelectorAll("*").forEach((el) => {
        if (el.children.length > 0) return;
        const txt = el.textContent?.trim() || "";
        if (txt === "SG16 Mistral X · checking…" || txt.startsWith("SG16 Mistral X ·")) {
          el.textContent = brain && brain.ok ? "SG16 Mistral X · live 24/7" : "Brain · check later";
        }
        if (txt === "Platforms · checking…" || /\d\/5 platforms live/.test(txt)) {
          el.textContent = liveCount + "/" + productIds.length + " platforms live";
        }
      });

      const liveLine = document.getElementById("network-live");
      if (liveLine) {
        liveLine.textContent = (data.platforms || [])
          .filter((p) => p.id !== "brain")
          .map((p) => p.label + (p.ok ? " · live" : " · down"))
          .join("   ·   ");
      }
    }

    fetch("/api/status", { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error("status"))))
      .then(apply)
      .catch(() => {
        const liveLine = document.getElementById("network-live");
        if (liveLine) liveLine.textContent = "Live status unavailable — sites may still be up.";
      });
  })();
})();
