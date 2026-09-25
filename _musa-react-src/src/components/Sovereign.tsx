import { BrainCircuit, Network, EyeOff, ExternalLink } from "lucide-react";

const SOVEREIGN_BADGE_SRC = "/assets/sovereign-sg16-brain-badge.jpg";

const CARDS = [
  {
    icon: BrainCircuit,
    title: "Sovereign brain",
    desc: "SG16 Mistral X on api.mistralbrain.com — each SG16 product connects to the brain directly from its own Cloudflare Pages site.",
  },
  {
    icon: Network,
    title: "Independent projects",
    desc: "Children, Ads, Finance, and Geo each run on their own domain. SG16 Engine (sg16engine.com) is a separate product — not a shared hub.",
  },
  {
    icon: EyeOff,
    title: "Zero-Data Trace",
    desc: "Chat content is processed live to produce a reply — not stored in our database. Device-local history.",
  },
];

function SovereignBadge() {
  return (
    <div className="relative mx-auto w-full max-w-[340px]" aria-label="Sovereign SG16 Brain — Mistral X Instruct, Apache 2.0, mistralbrain.com">
      <div className="absolute -inset-6 rounded-full bg-[radial-gradient(closest-side,rgba(255,122,24,0.25),transparent)] blur-2xl" aria-hidden="true" />
      <div className="glass relative overflow-hidden rounded-[32px] p-8 text-center shadow-luxury">
        <div className="pointer-events-none absolute inset-y-0 w-1/4 bg-gradient-to-r from-transparent via-white/12 to-transparent animate-shine-sweep" aria-hidden="true" />
        <div className="relative mx-auto w-full max-w-[260px]">
          <div className="absolute -inset-4 rounded-full bg-[radial-gradient(closest-side,rgba(255,122,24,0.2),transparent)] blur-xl" aria-hidden="true" />
          <img
            src={SOVEREIGN_BADGE_SRC}
            width={520}
            height={520}
            alt="Sovereign SG16 Brain emblem — Mistral X Instruct, Apache 2.0"
            className="relative mx-auto h-auto w-full drop-shadow-[0_12px_40px_rgba(0,0,0,0.55)]"
            loading="lazy"
            decoding="async"
          />
        </div>
        <p className="mt-5 text-[11px] font-bold uppercase tracking-[0.28em] text-orange-300">Sovereign SG16 Brain</p>
        <p className="mt-2 font-display text-2xl font-bold tracking-tight text-white">Mistral X</p>
        <p className="mt-1 text-xs font-medium text-white/50">Instruct · Apache 2.0</p>
        <p className="mx-auto mt-4 inline-flex items-center gap-2 rounded-full border border-white/10 bg-black/40 px-4 py-1.5 font-mono text-xs text-orange-200">
          api.mistralbrain.com
        </p>
        <div className="mt-4 flex items-center justify-center gap-2 text-[11px] font-semibold text-emerald-200">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" /> OPERATIONAL · 24/7
        </div>
      </div>
    </div>
  );
}

export default function Sovereign() {
  return (
    <section id="sovereign" className="relative z-10 scroll-mt-24 py-16 sm:py-24" aria-label="Sovereign SG16 AI">
      {/* flowing divider */}
      <div className="mx-auto mb-14 max-w-5xl px-4"><div className="hairline" aria-hidden="true" /></div>

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid items-center gap-12 lg:grid-cols-[1fr_.85fr]">
          <div className="reveal">
            <span className="inline-flex items-center rounded-full border border-orange-400/25 bg-orange-500/10 px-4 py-1.5 text-xs font-bold uppercase tracking-[0.2em] text-orange-300">
              SG16 AI Engine
            </span>
            <h2 className="mt-4 font-display text-3xl font-bold tracking-tight text-white sm:text-4xl lg:text-[2.75rem]">
              Own brain. <span className="text-luxury-gradient">Not a rented AI wrapper.</span>
            </h2>
            <p className="mt-4 max-w-xl leading-relaxed text-white/60">
              SG16 AI Engine runs on a sovereign cloud brain — SG16 Mistral X at api.mistralbrain.com — operated 24/7 by
              Saif Tech Global on Cloudflare infrastructure.
            </p>

            <div className="mt-8 space-y-3">
              {CARDS.map((c, i) => (
                <article
                  key={c.title}
                  className="reveal glass glass-hover flex gap-4 rounded-2xl p-5"
                  style={{ ["--reveal-delay" as string]: `${i * 100}ms` }}
                >
                  <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl border border-orange-400/25 bg-orange-500/10 text-orange-300">
                    <c.icon className="h-5 w-5" />
                  </span>
                  <span>
                    <h3 className="font-display text-[17px] font-semibold text-white">{c.title}</h3>
                    <p className="mt-1 text-sm leading-relaxed text-white/60">{c.desc}</p>
                  </span>
                </article>
              ))}
            </div>

            <p className="mt-6 flex flex-wrap items-center gap-x-2 gap-y-2 text-sm">
              <a href="https://sg16engine.com/license" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 font-semibold text-orange-300 underline decoration-orange-400/40 underline-offset-4 transition hover:text-orange-200">
                License &amp; sovereign brain policy <ExternalLink className="h-3.5 w-3.5" />
              </a>
              <span className="text-white/25" aria-hidden="true">·</span>
              <a href="https://api.mistralbrain.com/api/v1/ping" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 font-semibold text-orange-300 underline decoration-orange-400/40 underline-offset-4 transition hover:text-orange-200">
                Cloud brain ping <ExternalLink className="h-3.5 w-3.5" />
              </a>
              <span className="text-white/25" aria-hidden="true">·</span>
              <a href="https://sg16engine.com/health" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 font-semibold text-orange-300 underline decoration-orange-400/40 underline-offset-4 transition hover:text-orange-200">
                Engine health <ExternalLink className="h-3.5 w-3.5" />
              </a>
            </p>
          </div>

          <div className="reveal" style={{ ["--reveal-delay" as string]: "150ms" }}>
            <SovereignBadge />
            {/* mini stats under badge */}
            <div className="mx-auto mt-6 grid max-w-[340px] grid-cols-3 gap-2">
              {[
                { v: "Own", l: "Brain" },
                { v: "5", l: "Products" },
                { v: "0", l: "Data stored" },
              ].map((s) => (
                <div key={s.l} className="glass rounded-2xl px-3 py-3 text-center">
                  <p className="font-display text-lg font-bold text-white">{s.v}</p>
                  <p className="text-[11px] uppercase tracking-widest text-white/45">{s.l}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
