import { ArrowDown, ArrowUpRight, ShieldCheck, Building2, Sparkles, Cpu, LayoutGrid } from "lucide-react";
import type { LiveState } from "../hooks/useLiveStatus";
import { PLATFORMS } from "../data/platforms";

const HERO_BRAND_SRC = "/assets/saif-tech-global-hero.jpg";

function HeroVisual() {
  return (
    <div className="relative mx-auto w-full max-w-[min(100%,380px)] sm:max-w-[400px] lg:max-w-[420px]" aria-label="Saif Tech Global — global technology company visual">
      {/* Outer glow */}
      <div className="absolute -inset-6 rounded-[40px] bg-[radial-gradient(closest-side,rgba(255,122,24,0.22),transparent)] blur-2xl" aria-hidden="true" />

      <div className="glass relative overflow-visible rounded-[28px] p-2 shadow-luxury sm:overflow-hidden">
        <div className="pointer-events-none absolute inset-y-0 w-1/4 bg-gradient-to-r from-transparent via-white/15 to-transparent animate-shine-sweep" aria-hidden="true" />
        {/* Browser chrome */}
        <div className="flex items-center gap-2 rounded-t-[20px] border-b border-white/8 bg-white/[0.03] px-4 py-3">
          <span className="flex gap-1.5">
            <i className="h-2.5 w-2.5 rounded-full bg-[#ff5f57]" />
            <i className="h-2.5 w-2.5 rounded-full bg-[#febc2e]" />
            <i className="h-2.5 w-2.5 rounded-full bg-[#28c840]" />
          </span>
          <a
            href="https://mistralbrain.com"
            target="_blank"
            rel="noopener noreferrer"
            className="mx-auto flex items-center gap-2 rounded-full border border-white/10 bg-black/40 px-3 py-1 text-[11px] font-medium text-white/60 transition hover:border-emerald-400/30 hover:text-white/80"
          >
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse-dot" />
            mistralbrain.com
          </a>
          <span className="w-12" />
        </div>

        {/* Globe visual */}
        <div className="relative bg-[radial-gradient(ellipse_at_center,rgba(255,122,24,0.14),transparent_65%),linear-gradient(180deg,#0b0d1a,#06070f)] px-4 pb-6 pt-4 sm:px-5">
          <div className="relative mx-auto aspect-square w-[min(100%,260px)] max-w-[260px]">
            <div className="h-full w-full overflow-hidden rounded-[20px] border border-orange-400/20 bg-[#020205] shadow-[0_0_80px_-10px_rgba(255,122,24,0.45),inset_0_0_40px_rgba(255,122,24,0.08)]">
              <img
                src={HERO_BRAND_SRC}
                alt="Saif Tech Global LLC — global technology brand"
                className="h-full w-full object-cover object-center"
                width={680}
                height={850}
                loading="eager"
                decoding="async"
              />
            </div>
            {/* floating chips — desktop only (avoid mobile clip/overlap) */}
            <div className="absolute -left-2 top-8 hidden animate-float-slow rounded-xl border border-white/10 bg-black/60 px-3 py-2 text-[11px] font-semibold text-white/90 backdrop-blur-xl sm:block">
              <span className="flex items-center gap-1.5"><Cpu className="h-3.5 w-3.5 text-orange-400" /> Mistral X · Live</span>
            </div>
            <div className="absolute -right-2 top-1/3 hidden animate-float-slow rounded-xl border border-white/10 bg-black/60 px-3 py-2 text-[11px] font-semibold text-white/90 backdrop-blur-xl sm:block" style={{ animationDelay: "1.4s" }}>
              <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-emerald-400" /> 5/5 platforms</span>
            </div>
            <div className="absolute bottom-2 left-6 hidden animate-float-slow rounded-xl border border-orange-400/20 bg-orange-500/10 px-3 py-2 text-[11px] font-semibold text-orange-200 backdrop-blur-xl sm:block" style={{ animationDelay: "2.6s" }}>
              Zero-Data Trace
            </div>
          </div>
          <div className="mt-3 flex flex-wrap items-center justify-center gap-2 sm:hidden">
            <span className="inline-flex items-center gap-1.5 rounded-lg border border-white/10 bg-black/50 px-2.5 py-1 text-[10px] font-semibold text-white/85">
              <Cpu className="h-3 w-3 text-orange-400" /> Mistral X · Live
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-lg border border-white/10 bg-black/50 px-2.5 py-1 text-[10px] font-semibold text-white/85">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" /> 5/5 platforms
            </span>
          </div>

          {/* mini platform dots */}
          <div className="mx-auto mt-3 flex max-w-[260px] items-center justify-between rounded-2xl border border-white/8 bg-black/40 px-3 py-2.5 backdrop-blur-xl">
            {PLATFORMS.map((p) => (
              <a
                key={p.id}
                href={`#product-${p.id}`}
                className="group flex flex-col items-center gap-1.5"
                aria-label={`Jump to ${p.name}`}
                title={p.name}
              >
                <span className="grid h-9 w-9 place-items-center rounded-xl border border-white/10 bg-white/5 text-[11px] font-bold text-white/80 transition-all duration-300 group-hover:border-orange-400/40 group-hover:bg-orange-500/15 group-hover:text-orange-200 group-hover:shadow-[0_0_16px_rgba(255,122,24,.4)]">
                  {p.tag.slice(0, 2)}
                </span>
                <span className="h-1 w-1 rounded-full bg-emerald-400" />
              </a>
            ))}
          </div>
        </div>
      </div>

      {/* under-glow line */}
      <div className="hairline mx-12 mt-6 opacity-70" aria-hidden="true" />
    </div>
  );
}

export default function Hero({ live }: { live: LiveState }) {
  return (
    <section id="top" className="relative z-10 overflow-x-hidden pt-[max(7.5rem,env(safe-area-inset-top,0px)+5.5rem)] sm:pt-36 lg:pt-40" aria-label="Introduction">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid items-center gap-8 lg:grid-cols-[1.12fr_.88fr] lg:gap-6">
          {/* Copy */}
          <div className="reveal is-visible order-2 text-center lg:order-none lg:text-left">
            <div className="inline-flex flex-wrap items-center justify-center gap-2 lg:justify-start">
              <span className="glass-orange inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-xs font-semibold tracking-wide text-orange-200">
                <Sparkles className="h-3.5 w-3.5" />
                SAIF TECH GLOBAL LLC · ALBUQUERQUE, USA
              </span>
            </div>

            <h1 className="mt-5 font-display text-[1.85rem] font-bold leading-[1.08] tracking-tight text-white sm:mt-6 sm:text-[2.35rem] sm:leading-[1.05] md:text-5xl lg:text-[3.75rem] xl:text-[4.4rem]">
              Building{" "}
              <span className="text-luxury-gradient">global intelligence</span>{" "}
              for the world.
            </h1>

            <p className="mx-auto mt-6 max-w-xl text-base leading-relaxed text-white/65 sm:text-lg lg:mx-0">
              Saif Tech Global LLC develops AI platforms, financial intelligence, and live geopolitical monitoring —
              designed for users worldwide from our USA headquarters.
            </p>

            {/* Actions — all original buttons preserved */}
            <div className="mt-8 flex flex-wrap items-center justify-center gap-2.5 lg:justify-start">
              <a
                href="https://sg16engine.com"
                target="_blank"
                rel="noopener noreferrer"
                className="group inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#ff7a18] to-[#ffa53b] px-5 py-3 text-sm font-bold text-[#1a0b00] shadow-[0_12px_40px_-10px_rgba(255,122,24,0.8)] transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_18px_50px_-10px_rgba(255,122,24,1)] hover:brightness-110"
              >
                SG16 AI Engine
                <ArrowUpRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
              </a>
              <a
                href="https://sg16children.com"
                target="_blank"
                rel="noopener noreferrer"
                className="glass glass-hover inline-flex items-center gap-2 rounded-xl px-5 py-3 text-sm font-semibold text-sky-100"
              >
                SG16 Children World
              </a>
              <a
                href="https://sg16finance.com"
                target="_blank"
                rel="noopener noreferrer"
                className="glass glass-hover inline-flex items-center gap-2 rounded-xl px-5 py-3 text-sm font-semibold text-amber-100"
              >
                SG16 Finance
              </a>
              <a
                href="https://saifglobal16.info"
                target="_blank"
                rel="noopener noreferrer"
                className="glass glass-hover inline-flex items-center gap-2 rounded-xl px-5 py-3 text-sm font-semibold text-rose-100"
              >
                Geo Monitor
              </a>
              <a
                href="https://ads.saiftechglobal.com"
                target="_blank"
                rel="noopener noreferrer"
                className="glass glass-hover inline-flex items-center gap-2 rounded-xl px-5 py-3 text-sm font-semibold text-violet-100"
              >
                SG16 Ads Network
              </a>
              <a
                href="#products"
                className="inline-flex items-center gap-2 rounded-xl border border-white/15 bg-white/[0.03] px-5 py-3 text-sm font-semibold text-white/80 transition hover:border-orange-400/40 hover:text-white"
              >
                <LayoutGrid className="h-4 w-4 text-orange-400" />
                All products
              </a>
            </div>

            {/* Trust row — original pills preserved */}
            <div className="mt-8 flex flex-wrap items-center justify-center gap-2 lg:justify-start" role="status" aria-live="polite">
              <span className="inline-flex items-center gap-2 rounded-full border border-orange-400/25 bg-orange-500/10 px-3.5 py-1.5 text-xs font-semibold text-orange-100">
                <span className={`h-2 w-2 rounded-full ${live.brainLive ? "bg-emerald-400 animate-pulse-dot" : "bg-amber-400"}`} />
                {live.brainLive === null ? "SG16 Mistral X · checking…" : live.brainLive ? "SG16 Mistral X · live 24/7" : "Brain · check later"}
              </span>
              <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3.5 py-1.5 text-xs font-semibold text-white/75">
                <span className={`h-2 w-2 rounded-full ${live.liveCount === live.total ? "bg-emerald-400" : "bg-amber-400"}`} />
                {live.liveCount}/{live.total} platforms live
              </span>
              <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3.5 py-1.5 text-xs font-semibold text-white/75">
                <Building2 className="h-3.5 w-3.5 text-orange-400" />
                USA registered company
              </span>
              <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3.5 py-1.5 text-xs font-semibold text-white/75">
                <ShieldCheck className="h-3.5 w-3.5 text-emerald-400" />
                Privacy-first products
              </span>
            </div>
          </div>

          {/* Visual */}
          <div className="reveal is-visible order-1 lg:order-none" style={{ ["--reveal-delay" as string]: "150ms" }}>
            <HeroVisual />
          </div>
        </div>

        {/* Scroll cue */}
        <div className="mt-8 flex justify-center pb-4 sm:mt-14">
          <a
            href="#network"
            className="group flex flex-col items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.25em] text-white/35 transition hover:text-orange-300"
            aria-label="Scroll to SG16 Network"
          >
            Scroll to explore
            <span className="grid h-10 w-10 place-items-center rounded-full border border-white/10 bg-white/[0.03] transition group-hover:border-orange-400/40">
              <ArrowDown className="h-4 w-4 animate-bounce" />
            </span>
          </a>
        </div>
      </div>
    </section>
  );
}
