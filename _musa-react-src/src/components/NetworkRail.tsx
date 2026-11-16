import { ArrowUpRight, Radio } from "lucide-react";
import { PLATFORMS, ACCENT_STYLES } from "../data/platforms";
import type { LiveState } from "../hooks/useLiveStatus";

const NUMBER_WORDS = ["Zero", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine", "Ten"];

function PlatformCard({ p, live, hidden }: { p: (typeof PLATFORMS)[number]; live: LiveState; hidden?: boolean }) {
  const a = ACCENT_STYLES[p.accent];
  const isLive = live.perPlatform[p.id] !== false;
  const tab = hidden ? { tabIndex: -1 } : {};
  return (
    <article
      className="group relative w-[300px] shrink-0 overflow-hidden rounded-3xl sm:w-[340px]"
      data-platform={p.id}
      data-voice={`${p.name}. ${p.description}`}
    >
      <div className="glass glass-hover relative h-full p-6">
        <div className={`absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r ${a.gradient} opacity-60`} aria-hidden="true" />
        <div className="flex items-start justify-between gap-3">
          <span className={`inline-flex items-center rounded-full border px-3 py-1 text-[11px] font-bold uppercase tracking-[0.14em] ${a.bg} ${a.border} ${a.text}`}>
            {p.tag}
          </span>
          <span
            className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold ${isLive ? "bg-emerald-400/10 text-emerald-300" : "bg-red-400/10 text-red-300"}`}
          >
            <span className={`h-1.5 w-1.5 rounded-full ${isLive ? "bg-emerald-400" : "bg-red-400"}`} />
            <span data-live-badge>{isLive ? "Live" : "Down"}</span>
          </span>
        </div>
        <div className="mt-5 flex items-baseline gap-3">
          <span className="font-display text-sm text-white/30">{p.index}</span>
          <h3 className="font-display text-xl tracking-tight text-white">{p.name}</h3>
        </div>
        <p className="mt-2 min-h-[44px] text-sm leading-relaxed text-white/65">{p.tagline}</p>
        <div className="mt-5 flex items-center gap-2">
          <a
            href={`#product-${p.id}`}
            {...tab}
            className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-xl border border-white/15 bg-black px-4 py-2.5 text-[13px] text-white transition hover:border-[#f2155f]/60"
            aria-label={`View ${p.name} details on this page`}
          >
            Explore below
          </a>
          <a
            href={p.url}
            target="_blank"
            rel="noopener noreferrer"
            {...tab}
            className={`inline-flex items-center justify-center gap-1 rounded-xl bg-gradient-to-r px-4 py-2.5 text-[13px] font-bold text-white transition hover:brightness-110 ${a.gradient}`}
            aria-label={`Visit ${p.name} at ${p.displayUrl} (opens in new tab)`}
          >
            Visit <ArrowUpRight className="h-3.5 w-3.5" />
          </a>
        </div>
      </div>
    </article>
  );
}

export default function NetworkRail({ live }: { live: LiveState }) {
  const count = PLATFORMS.length;
  const countWord = NUMBER_WORDS[count] ?? String(count);

  return (
    <section id="network" className="relative z-10 scroll-mt-24 py-16 sm:py-20" aria-label="SG16 product network">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="reveal">
          <span className="inline-flex items-center gap-2 rounded-full border border-[#f2155f]/60 bg-black px-4 py-1.5 text-xs font-bold uppercase tracking-[0.2em] text-orange-200">
            <Radio className="h-3.5 w-3.5" /> SG16 Network
          </span>
          <h2 className="mt-4 font-display text-3xl tracking-tight text-white sm:text-4xl lg:text-[2.75rem]">
            One company. <span className="text-luxury-gradient">{countWord} live platforms.</span>
          </h2>
          <p className="mt-3 flex items-center gap-2 text-sm text-white/60" role="status" aria-live="polite">
            <span className="relative flex h-2 w-2 shrink-0">
              <span className="absolute h-full w-full animate-ping rounded-full bg-emerald-400 opacity-60" />
              <span className="relative h-2 w-2 rounded-full bg-emerald-400" />
            </span>
            <span id="network-live" className="truncate">
              {live.line || "Checking live APIs…"}
            </span>
          </p>
        </div>
      </div>

      {/* Continuous conveyor — two identical groups, translated -50% for a seamless loop */}
      <div className="conveyor rail-pause reveal mt-8 overflow-hidden py-2" role="region" aria-label="SG16 platforms" style={{ ["--reveal-delay" as string]: "120ms" }}>
        <div className="flex w-max animate-conveyor">
          {[0, 1].map((copy) => (
            <div key={copy} className="flex gap-4 pr-4" aria-hidden={copy === 1 ? true : undefined}>
              {PLATFORMS.map((p) => (
                <PlatformCard key={`${copy}-${p.id}`} p={p} live={live} hidden={copy === 1} />
              ))}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
