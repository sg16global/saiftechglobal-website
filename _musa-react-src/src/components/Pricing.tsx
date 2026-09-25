import { Check, Sparkles, ArrowUpRight, BadgeDollarSign } from "lucide-react";

const TIERS = [
  {
    name: "Standard",
    price: "$3",
    period: "per campaign",
    desc: "Launch your first AI-designed ad in minutes.",
    features: ["AI ad design from URL or upload", "Standard placement rotation", "Secure Dodo checkout", "Gmail sign-in · auto activation"],
    cta: "Start Standard",
    featured: false,
  },
  {
    name: "Premium",
    price: "$9",
    period: "per campaign",
    desc: "More reach, priority rotation, richer creative.",
    features: ["Everything in Standard", "Priority placement rotation", "Multiple AI creative variants", "Extended campaign runtime", "Performance visibility"],
    cta: "Start Premium",
    featured: true,
  },
  {
    name: "Pro",
    price: "$19",
    period: "per campaign",
    desc: "Maximum visibility across the SG16 network.",
    features: ["Everything in Premium", "Top-tier network placement", "Pro creative suite", "Longest campaign runtime", "Priority support"],
    cta: "Start Pro",
    featured: false,
  },
];

export default function Pricing() {
  return (
    <section id="pricing" className="relative z-10 scroll-mt-24 py-16 sm:py-24" aria-label="SG16 Ads Network pricing">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="reveal mx-auto max-w-2xl text-center">
          <span className="inline-flex items-center gap-2 rounded-full border border-violet-400/25 bg-violet-500/10 px-4 py-1.5 text-xs font-bold uppercase tracking-[0.2em] text-violet-200">
            <BadgeDollarSign className="h-3.5 w-3.5" /> SG16 Ads Network
          </span>
          <h2 className="mt-4 font-display text-3xl font-bold tracking-tight text-white sm:text-4xl lg:text-[2.75rem]">
            Advertise from <span className="text-luxury-gradient">$3.</span> Live in 2 minutes.
          </h2>
          <p className="mt-4 text-white/60">
            Packages from $3 — Standard, Premium &amp; Pro. Pick a package, upload your brand, AI builds your ad, pay
            with Dodo, go live automatically.
          </p>
        </div>

        <div className="mt-12 grid gap-5 lg:grid-cols-3">
          {TIERS.map((t, i) => (
            <article
              key={t.name}
              className={`reveal relative overflow-hidden rounded-[28px] p-7 ${
                t.featured ? "glass-orange shadow-luxury lg:-my-3 lg:py-10" : "glass glass-hover"
              }`}
              style={{ ["--reveal-delay" as string]: `${i * 110}ms` }}
            >
              {t.featured && (
                <>
                  <div className="absolute inset-x-0 top-0 h-[3px] bg-gradient-to-r from-orange-600 via-amber-300 to-orange-600" aria-hidden="true" />
                  <span className="absolute right-5 top-5 inline-flex items-center gap-1.5 rounded-full bg-gradient-to-r from-[#ff7a18] to-[#ffa53b] px-3 py-1 text-[11px] font-bold uppercase tracking-widest text-[#1a0b00]">
                    <Sparkles className="h-3 w-3" /> Popular
                  </span>
                </>
              )}
              <h3 className="font-display text-lg font-semibold text-white">{t.name}</h3>
              <p className="mt-1 text-sm text-white/50">{t.desc}</p>
              <p className="mt-5 flex items-baseline gap-2">
                <span className="font-display text-5xl font-bold tracking-tight text-white">{t.price}</span>
                <span className="text-sm text-white/45">{t.period}</span>
              </p>
              <ul className="mt-6 space-y-2.5 border-t border-white/8 pt-6">
                {t.features.map((f) => (
                  <li key={f} className="flex items-start gap-2.5 text-sm text-white/70">
                    <span className={`mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full ${t.featured ? "bg-gradient-to-br from-orange-500 to-amber-300" : "bg-white/10"}`}>
                      <Check className={`h-3 w-3 ${t.featured ? "text-black" : "text-orange-300"}`} strokeWidth={3} />
                    </span>
                    {f}
                  </li>
                ))}
              </ul>
              <a
                href="https://ads.saiftechglobal.com"
                target="_blank"
                rel="noopener noreferrer"
                className={`group mt-7 inline-flex w-full items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-bold transition ${
                  t.featured
                    ? "bg-gradient-to-r from-[#ff7a18] to-[#ffa53b] text-[#1a0b00] hover:brightness-110"
                    : "border border-white/12 bg-white/[0.05] text-white hover:border-orange-400/40 hover:bg-orange-500/10"
                }`}
                aria-label={`${t.cta} on SG16 Ads Network (opens in new tab)`}
              >
                {t.cta}
                <ArrowUpRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
              </a>
            </article>
          ))}
        </div>

        <p className="reveal mt-8 text-center text-sm text-white/45">
          Secure Dodo checkout · Gmail sign-in · instant activation · All other SG16 platforms are free to explore.
        </p>
      </div>
    </section>
  );
}
