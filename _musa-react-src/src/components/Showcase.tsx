import { useEffect, useRef, useState } from "react";
import { ArrowUpRight, Check, MonitorPlay } from "lucide-react";
import { PLATFORMS, ACCENT_STYLES } from "../data/platforms";

/**
 * Product showcase — long-scrolling main column + synced side panel.
 * The side panel is sticky with a fixed max-height; its active item
 * auto-scrolls into view as the reader moves through products.
 */
export default function Showcase() {
  const [active, setActive] = useState(PLATFORMS[0].id);
  const sideRef = useRef<HTMLDivElement>(null);
  const btnRefs = useRef<Record<string, HTMLAnchorElement | null>>({});

  useEffect(() => {
    const sections = PLATFORMS.map((p) => document.getElementById(`showcase-${p.id}`)).filter(Boolean) as HTMLElement[];
    if (!("IntersectionObserver" in window)) return;
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            const id = e.target.id.replace("showcase-", "");
            setActive(id);
          }
        });
      },
      { rootMargin: "-35% 0px -50% 0px", threshold: 0 }
    );
    sections.forEach((s) => io.observe(s));
    return () => io.disconnect();
  }, []);

  // Auto-scroll side panel to keep active item visible
  useEffect(() => {
    const btn = btnRefs.current[active];
    const panel = sideRef.current;
    if (btn && panel) {
      const panelRect = panel.getBoundingClientRect();
      const btnRect = btn.getBoundingClientRect();
      const isAbove = btnRect.top < panelRect.top + 12;
      const isBelow = btnRect.bottom > panelRect.bottom - 12;
      if (isAbove || isBelow) {
        panel.scrollTo({ top: btn.offsetTop - panel.clientHeight / 2 + btn.clientHeight / 2, behavior: "smooth" });
      }
    }
  }, [active]);

  return (
    <section id="showcase" className="relative z-10 scroll-mt-24 py-16 sm:py-24" aria-label="Product showcase">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="reveal mx-auto max-w-2xl text-center">
          <span className="inline-flex items-center gap-2 rounded-full border border-orange-400/25 bg-orange-500/10 px-4 py-1.5 text-xs font-bold uppercase tracking-[0.2em] text-orange-300">
            <MonitorPlay className="h-3.5 w-3.5" /> Product showcase
          </span>
          <h2 className="mt-4 font-display text-3xl font-bold tracking-tight text-white sm:text-4xl lg:text-[2.75rem]">
            A closer look at <span className="text-luxury-gradient">each world.</span>
          </h2>
          <p className="mt-4 text-white/60">
            Scroll the journey — the side navigator follows you. Click any platform to jump instantly.
          </p>
        </div>

        <div className="mt-12 grid gap-6 lg:grid-cols-[280px_1fr] lg:gap-8">
          {/* ── Side panel: sticky, fixed height, auto-scrolls in sync ── */}
          <aside className="hidden lg:block" aria-label="Showcase navigator">
            <div className="sticky top-24">
              <div className="glass-strong overflow-hidden rounded-3xl">
                <div className="border-b border-white/8 bg-white/[0.02] px-5 py-4">
                  <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-white/45">SG16 Navigator</p>
                  <p className="mt-1 font-display text-sm font-semibold text-white">
                    {PLATFORMS.findIndex((p) => p.id === active) + 1} / {PLATFORMS.length} ·{" "}
                    {PLATFORMS.find((p) => p.id === active)?.shortName}
                  </p>
                  {/* progress bar */}
                  <div className="mt-3 h-1 overflow-hidden rounded-full bg-white/8" aria-hidden="true">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-orange-600 to-amber-300 transition-all duration-500"
                      style={{ width: `${((PLATFORMS.findIndex((p) => p.id === active) + 1) / PLATFORMS.length) * 100}%` }}
                    />
                  </div>
                </div>
                <div ref={sideRef} className="no-scrollbar max-h-[420px] space-y-2 overflow-y-auto scroll-smooth p-3">
                  {PLATFORMS.map((p) => {
                    const a = ACCENT_STYLES[p.accent];
                    const isActive = active === p.id;
                    return (
                      <a
                        key={p.id}
                        ref={(el) => {
                          btnRefs.current[p.id] = el;
                        }}
                        href={`#showcase-${p.id}`}
                        aria-current={isActive ? "true" : undefined}
                        className={`group flex items-center gap-3 rounded-2xl border p-3 transition-all duration-300 ${
                          isActive
                            ? "border-orange-400/35 bg-orange-500/10 shadow-[0_0_24px_-8px_rgba(255,122,24,.5)]"
                            : "border-transparent hover:border-white/10 hover:bg-white/[0.04]"
                        }`}
                      >
                        <span
                          className={`grid h-10 w-10 shrink-0 place-items-center rounded-xl border text-xs font-bold transition ${
                            isActive ? `${a.bg} ${a.border} ${a.text}` : "border-white/10 bg-white/5 text-white/60"
                          }`}
                        >
                          {p.index}
                        </span>
                        <span className="min-w-0">
                          <span className={`block truncate text-sm font-semibold ${isActive ? "text-white" : "text-white/70"}`}>
                            {p.name}
                          </span>
                          <span className="block truncate text-xs text-white/40">{p.tag} · {p.displayUrl}</span>
                        </span>
                        <span
                          className={`ml-auto h-2 w-2 shrink-0 rounded-full transition ${
                            isActive ? "bg-orange-400 shadow-[0_0_10px_2px_rgba(255,122,24,.6)]" : "bg-white/15"
                          }`}
                          aria-hidden="true"
                        />
                      </a>
                    );
                  })}
                </div>
                <div className="border-t border-white/8 p-3">
                  <a
                    href="#products"
                    className="flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#ff7a18] to-[#ffa53b] px-4 py-2.5 text-[13px] font-bold text-[#1a0b00] transition hover:brightness-110"
                  >
                    All products <ArrowUpRight className="h-3.5 w-3.5" />
                  </a>
                </div>
              </div>
            </div>
          </aside>

          {/* ── Main long-scroll column ── */}
          <div className="space-y-6">
            {PLATFORMS.map((p, i) => {
              const a = ACCENT_STYLES[p.accent];
              return (
                <article
                  key={p.id}
                  id={`showcase-${p.id}`}
                  className="reveal glass group relative scroll-mt-28 overflow-hidden rounded-[28px] p-6 sm:p-8"
                  style={{ ["--reveal-delay" as string]: "60ms" }}
                >
                  <div
                    className="pointer-events-none absolute -left-24 -top-24 h-64 w-64 rounded-full opacity-40 blur-3xl transition-opacity duration-700 group-hover:opacity-80"
                    style={{ background: p.glow }}
                    aria-hidden="true"
                  />
                  <div className={`absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r ${a.gradient}`} aria-hidden="true" />

                  <div className="relative flex flex-wrap items-center gap-2">
                    <span className="font-display text-sm font-bold text-white/25">{p.index}</span>
                    <span className={`inline-flex items-center rounded-full border px-3 py-1 text-[11px] font-bold uppercase tracking-[0.14em] ${a.bg} ${a.border} ${a.text}`}>
                      {p.tag}
                    </span>
                    <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-400/20 bg-emerald-400/10 px-3 py-1 text-[11px] font-semibold text-emerald-200">
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" /> {p.badge}
                    </span>
                  </div>

                  <div className="relative mt-4 grid gap-6 md:grid-cols-[1.1fr_.9fr]">
                    <div>
                      <h3 className="font-display text-2xl font-bold tracking-tight text-white sm:text-3xl">{p.name}</h3>
                      <p className="mt-2 text-[15px] font-medium text-orange-200/90">{p.tagline}</p>
                      <p className="mt-3 text-sm leading-relaxed text-white/60">{p.longDescription}</p>
                      <ul className="mt-5 space-y-2.5">
                        {p.features.map((f) => (
                          <li key={f} className="flex items-start gap-2.5 text-sm text-white/70">
                            <span className={`mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full bg-gradient-to-br ${a.gradient}`}>
                              <Check className="h-3 w-3 text-black/80" strokeWidth={3} />
                            </span>
                            {f}
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* Mock preview pane */}
                    <div className="flex flex-col overflow-hidden rounded-2xl border border-white/10 bg-black/40">
                      <div className="flex items-center gap-2 border-b border-white/8 bg-white/[0.03] px-4 py-2.5">
                        <span className="flex gap-1.5" aria-hidden="true">
                          <i className="h-2 w-2 rounded-full bg-white/20" />
                          <i className="h-2 w-2 rounded-full bg-white/20" />
                          <i className="h-2 w-2 rounded-full bg-white/20" />
                        </span>
                        <span className="truncate text-[11px] font-medium text-white/50">{p.displayUrl}</span>
                      </div>
                      <div className="relative flex-1 bg-[radial-gradient(ellipse_at_top,rgba(255,122,24,0.1),transparent_60%)] p-5">
                        <div className="space-y-2.5" aria-hidden="true">
                          <div className={`h-2.5 w-2/3 rounded-full bg-gradient-to-r ${a.gradient} opacity-70`} />
                          <div className="h-2 w-full rounded-full bg-white/10" />
                          <div className="h-2 w-5/6 rounded-full bg-white/8" />
                          <div className="grid grid-cols-3 gap-2 pt-2">
                            {p.stats.map((s) => (
                              <div key={s.label} className="rounded-xl border border-white/8 bg-white/[0.04] p-2.5 text-center">
                                <p className="text-[13px] font-bold text-white">{s.value}</p>
                                <p className="text-[10px] text-white/45">{s.label}</p>
                              </div>
                            ))}
                          </div>
                          <div className="flex gap-2 pt-1">
                            <div className={`h-8 flex-1 rounded-lg bg-gradient-to-r ${a.gradient} opacity-80`} />
                            <div className="h-8 w-16 rounded-lg border border-white/10 bg-white/5" />
                          </div>
                        </div>
                      </div>
                      <div className="flex gap-2 border-t border-white/8 p-3">
                        <a
                          href={p.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-white px-4 py-2.5 text-[13px] font-bold text-black transition hover:bg-orange-100"
                          aria-label={`Visit ${p.displayUrl} (opens in new tab)`}
                        >
                          Visit {p.displayUrl} <ArrowUpRight className="h-3.5 w-3.5" />
                        </a>
                        <a
                          href={`#product-${p.id}`}
                          className="inline-flex items-center justify-center rounded-xl border border-white/12 bg-white/5 px-4 py-2.5 text-[13px] font-semibold text-white/80 transition hover:border-orange-400/40 hover:text-white"
                          aria-label={`Jump to ${p.name} product card`}
                        >
                          #{i + 1}
                        </a>
                      </div>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
