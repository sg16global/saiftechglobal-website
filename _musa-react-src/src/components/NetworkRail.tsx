import { useRef, useState, useEffect } from "react";
import { ChevronLeft, ChevronRight, ArrowUpRight, Radio } from "lucide-react";
import { PLATFORMS, ACCENT_STYLES } from "../data/platforms";
import type { LiveState } from "../hooks/useLiveStatus";

export default function NetworkRail({ live }: { live: LiveState }) {
  const railRef = useRef<HTMLDivElement>(null);
  const [canLeft, setCanLeft] = useState(false);
  const [canRight, setCanRight] = useState(true);
  const [progress, setProgress] = useState(0);

  const update = () => {
    const el = railRef.current;
    if (!el) return;
    setCanLeft(el.scrollLeft > 8);
    setCanRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 8);
    const max = el.scrollWidth - el.clientWidth;
    setProgress(max > 0 ? el.scrollLeft / max : 0);
  };

  useEffect(() => {
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);

  const scrollBy = (dir: number) => {
    const el = railRef.current;
    if (!el) return;
    el.scrollBy({ left: dir * Math.min(380, el.clientWidth * 0.8), behavior: "smooth" });
  };

  return (
    <section id="network" className="relative z-10 scroll-mt-24 py-16 sm:py-20" aria-label="SG16 product network">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="reveal flex flex-wrap items-end justify-between gap-6">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full border border-orange-400/25 bg-orange-500/10 px-4 py-1.5 text-xs font-bold uppercase tracking-[0.2em] text-orange-300">
              <Radio className="h-3.5 w-3.5" /> SG16 Network
            </span>
            <h2 className="mt-4 font-display text-3xl font-bold tracking-tight text-white sm:text-4xl lg:text-[2.75rem]">
              One company. <span className="text-luxury-gradient">Five live platforms.</span>
            </h2>
            <p className="mt-3 flex items-center gap-2 text-sm text-white/55" role="status" aria-live="polite">
              <span className="relative flex h-2 w-2 shrink-0">
                <span className="absolute h-full w-full animate-ping rounded-full bg-emerald-400 opacity-60" />
                <span className="relative h-2 w-2 rounded-full bg-emerald-400" />
              </span>
              <span className="truncate">{live.line || "Checking live APIs…"}</span>
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className="mr-2 hidden text-xs font-medium uppercase tracking-widest text-white/35 sm:block">
              Swipe / drag to explore
            </span>
            <button
              onClick={() => scrollBy(-1)}
              disabled={!canLeft}
              aria-label="Scroll network cards left"
              className="grid h-11 w-11 place-items-center rounded-full border border-white/10 bg-white/5 text-white transition hover:border-orange-400/40 hover:bg-orange-500/10 disabled:cursor-not-allowed disabled:opacity-30"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <button
              onClick={() => scrollBy(1)}
              disabled={!canRight}
              aria-label="Scroll network cards right"
              className="grid h-11 w-11 place-items-center rounded-full border border-white/10 bg-white/5 text-white transition hover:border-orange-400/40 hover:bg-orange-500/10 disabled:cursor-not-allowed disabled:opacity-30"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
          </div>
        </div>
      </div>

      {/* Independently scrollable rail */}
      <div className="reveal mt-8" style={{ ["--reveal-delay" as string]: "120ms" }}>
        <div
          ref={railRef}
          onScroll={update}
          tabIndex={0}
          role="region"
          aria-label="SG16 platforms — horizontally scrollable"
          className="rail-scroll flex snap-x snap-mandatory gap-4 overflow-x-auto scroll-smooth px-4 pb-4 pt-2 sm:px-6 lg:px-[max(1.5rem,calc((100vw-80rem)/2+2rem))]"
          style={{ scrollbarWidth: "thin" }}
        >
          {PLATFORMS.map((p, i) => {
            const a = ACCENT_STYLES[p.accent];
            const isLive = live.perPlatform[p.id] !== false;
            return (
              <article
                key={p.id}
                className="group relative w-[300px] shrink-0 snap-start overflow-hidden rounded-3xl sm:w-[340px]"
                style={{ animationDelay: `${i * 80}ms` }}
              >
                <div className="glass glass-hover relative h-full p-6">
                  {/* top glow line */}
                  <div className={`absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r ${a.gradient} opacity-60`} aria-hidden="true" />
                  <div
                    className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full opacity-0 blur-3xl transition-opacity duration-500 group-hover:opacity-100"
                    style={{ background: p.glow }}
                    aria-hidden="true"
                  />
                  <div className="flex items-start justify-between gap-3">
                    <span className={`inline-flex items-center rounded-full border px-3 py-1 text-[11px] font-bold uppercase tracking-[0.14em] ${a.bg} ${a.border} ${a.text}`}>
                      {p.tag}
                    </span>
                    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold ${isLive ? "bg-emerald-400/10 text-emerald-300" : "bg-red-400/10 text-red-300"}`}>
                      <span className={`h-1.5 w-1.5 rounded-full ${isLive ? "bg-emerald-400" : "bg-red-400"}`} />
                      {isLive ? "Live" : "Down"}
                    </span>
                  </div>
                  <div className="mt-5 flex items-baseline gap-3">
                    <span className="font-display text-sm font-semibold text-white/25">{p.index}</span>
                    <h3 className="font-display text-xl font-semibold tracking-tight text-white">{p.name}</h3>
                  </div>
                  <p className="mt-2 min-h-[44px] text-sm leading-relaxed text-white/60">{p.tagline}</p>
                  <div className="mt-5 flex items-center gap-2">
                    <a
                      href={`#product-${p.id}`}
                      className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-xl border border-white/12 bg-white/[0.05] px-4 py-2.5 text-[13px] font-semibold text-white transition hover:border-orange-400/40 hover:bg-orange-500/10"
                      aria-label={`View ${p.name} details on this page`}
                    >
                      Explore below
                    </a>
                    <a
                      href={p.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={`inline-flex items-center justify-center gap-1 rounded-xl bg-gradient-to-r px-4 py-2.5 text-[13px] font-bold text-[#140800] transition hover:brightness-110 ${a.gradient}`}
                      aria-label={`Visit ${p.name} at ${p.displayUrl} (opens in new tab)`}
                    >
                      Visit <ArrowUpRight className="h-3.5 w-3.5" />
                    </a>
                  </div>
                </div>
              </article>
            );
          })}

          {/* Add-your-project teaser card — shows extensibility */}
          <article className="w-[300px] shrink-0 snap-start sm:w-[340px]">
            <div className="relative flex h-full min-h-[280px] flex-col justify-between overflow-hidden rounded-3xl border border-dashed border-orange-400/25 bg-orange-500/[0.04] p-6 backdrop-blur-xl">
              <div>
                <span className="inline-flex items-center rounded-full border border-orange-400/25 bg-orange-500/10 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.14em] text-orange-300">
                  + Future
                </span>
                <h3 className="mt-5 font-display text-xl font-semibold text-white">Your next platform, here.</h3>
                <p className="mt-2 text-sm leading-relaxed text-white/55">
                  The SG16 network is designed to grow. New products plug into the same sovereign brain and appear across the site automatically.
                </p>
              </div>
              <a
                href="mailto:contact@saiftechglobal.com"
                className="mt-5 inline-flex items-center justify-center gap-2 rounded-xl border border-orange-400/30 bg-orange-500/10 px-4 py-2.5 text-[13px] font-bold text-orange-200 transition hover:bg-orange-500/20"
              >
                Partner with us <ArrowUpRight className="h-3.5 w-3.5" />
              </a>
            </div>
          </article>
        </div>

        {/* progress */}
        <div className="mx-auto mt-4 max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="h-1 overflow-hidden rounded-full bg-white/8" aria-hidden="true">
            <div
              className="h-full rounded-full bg-gradient-to-r from-orange-600 via-orange-400 to-amber-300 transition-all duration-200"
              style={{ width: `${12 + progress * 88}%` }}
            />
          </div>
        </div>
      </div>
    </section>
  );
}
