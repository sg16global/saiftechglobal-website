import { ArrowUpRight, Check, Mail, Boxes } from "lucide-react";
import { PLATFORMS, ACCENT_STYLES } from "../data/platforms";
import type { LiveState } from "../hooks/useLiveStatus";

export default function Products({ live }: { live: LiveState }) {
  return (
    <section id="products" className="relative z-10 scroll-mt-24 py-16 sm:py-24" aria-label="Products">
      <div className="mx-auto mb-14 max-w-5xl px-4"><div className="hairline" aria-hidden="true" /></div>

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="reveal flex flex-wrap items-end justify-between gap-6">
          <div className="max-w-xl">
            <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-1.5 text-xs font-bold uppercase tracking-[0.2em] text-white/60">
              <Boxes className="h-3.5 w-3.5 text-orange-400" /> Products
            </span>
            <h2 className="mt-4 font-display text-3xl font-bold tracking-tight text-white sm:text-4xl lg:text-[2.75rem]">
              Our live platforms, <span className="text-luxury-gradient">ready today.</span>
            </h2>
            <p className="mt-3 text-white/60">Our live platforms and upcoming apps from Saif Tech Global LLC.</p>
          </div>
          <p className="max-w-xs text-sm leading-relaxed text-white/45">
            Every card links outward to its live domain — and inward to its showcase story. One click, anywhere.
          </p>
        </div>

        <div className="mt-10 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {PLATFORMS.map((p, i) => {
            const a = ACCENT_STYLES[p.accent];
            const isLive = live.perPlatform[p.id] !== false;
            return (
              <article
                key={p.id}
                id={`product-${p.id}`}
                data-platform={p.id}
                className="reveal glass glass-hover relative scroll-mt-28 overflow-hidden rounded-3xl p-6 sm:p-7"
                style={{ ["--reveal-delay" as string]: `${(i % 3) * 100}ms` }}
              >
                <div className={`absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r ${a.gradient} opacity-70`} aria-hidden="true" />
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-[0.14em] ${a.bg} ${a.border} ${a.text}`}>
                      {p.tag}
                    </span>
                    <h3 className="mt-3 font-display text-[22px] font-bold leading-tight tracking-tight text-white">
                      <a href={`#showcase-${p.id}`} className="transition hover:text-orange-200" title={`Jump to ${p.name} showcase`}>
                        {p.name}
                      </a>
                    </h3>
                    <p className="mt-2 text-sm leading-relaxed text-white/60">{p.description}</p>
                  </div>
                  <span
                    data-live-badge
                    className={`inline-flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold ${
                      isLive ? "bg-emerald-400/12 text-emerald-300 border border-emerald-400/25" : "bg-red-400/12 text-red-300 border border-red-400/25"
                    }`}
                  >
                    <span className={`h-1.5 w-1.5 rounded-full ${isLive ? "bg-emerald-400" : "bg-red-400"}`} />
                    {isLive ? "Live" : "Down"}
                  </span>
                </div>

                <ul className="mt-5 space-y-2.5 border-t border-white/8 pt-5">
                  {p.features.map((f) => (
                    <li key={f} className="flex items-start gap-2.5 text-[13.5px] leading-relaxed text-white/65">
                      <Check className="mt-0.5 h-4 w-4 shrink-0 text-orange-400" strokeWidth={2.5} />
                      {f}
                    </li>
                  ))}
                </ul>

                <div className="mt-6 flex gap-2">
                  <a
                    href={p.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`group inline-flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-gradient-to-r px-4 py-3 text-sm font-bold text-[#140800] transition hover:brightness-110 ${a.gradient}`}
                    aria-label={`Visit ${p.displayUrl} (opens in new tab)`}
                  >
                    Visit {p.displayUrl}
                    <ArrowUpRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                  </a>
                  <a
                    href={`#showcase-${p.id}`}
                    className="inline-flex items-center justify-center rounded-xl border border-white/12 bg-white/[0.04] px-4 py-3 text-sm font-semibold text-white/75 transition hover:border-orange-400/40 hover:text-white"
                    aria-label={`Read ${p.name} story in showcase`}
                    title="Read story"
                  >
                    Story
                  </a>
                </div>
              </article>
            );
          })}

          {/* Enterprise — original content preserved */}
          <article className="reveal glass-orange glass-hover relative overflow-hidden rounded-3xl p-6 sm:p-7" style={{ ["--reveal-delay" as string]: "200ms" }}>
            <div className="absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-orange-500 via-amber-300 to-orange-500" aria-hidden="true" />
            <div className="flex items-start justify-between gap-4">
              <div>
                <span className="inline-flex items-center rounded-full border border-orange-300/25 bg-orange-500/10 px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-[0.14em] text-orange-200">
                  B2B
                </span>
                <h3 className="mt-3 font-display text-[22px] font-bold leading-tight tracking-tight text-white">
                  Enterprise solutions
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-white/60">Custom digital platforms for partners and global teams.</p>
              </div>
              <span className="inline-flex shrink-0 items-center rounded-full border border-orange-300/25 bg-orange-500/10 px-3 py-1 text-xs font-bold text-orange-200">
                Contact us
              </span>
            </div>
            <ul className="mt-5 space-y-2.5 border-t border-orange-300/10 pt-5">
              {["Software and AI integration", "Scalable cloud-ready architecture", "Email us to discuss your project"].map((f) => (
                <li key={f} className="flex items-start gap-2.5 text-[13.5px] leading-relaxed text-white/65">
                  <Check className="mt-0.5 h-4 w-4 shrink-0 text-orange-400" strokeWidth={2.5} />
                  {f}
                </li>
              ))}
            </ul>
            <a
              href="mailto:contact@saiftechglobal.com"
              className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-xl border border-orange-300/30 bg-orange-500/15 px-4 py-3 text-sm font-bold text-orange-100 transition hover:bg-orange-500/25"
            >
              <Mail className="h-4 w-4" /> Get in touch
            </a>
          </article>
        </div>
      </div>
    </section>
  );
}
