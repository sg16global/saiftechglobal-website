import { Code2, HeartPulse, GraduationCap, TrendingUp, MessagesSquare, ShieldCheck, ArrowUpRight } from "lucide-react";
import { SHIELDS } from "../data/platforms";

const ICONS: Record<string, typeof Code2> = {
  code: Code2,
  health: HeartPulse,
  student: GraduationCap,
  market: TrendingUp,
  chat: MessagesSquare,
};

const BENEFITS = [
  { title: "One login, many worlds", desc: "Google & Gmail sign-in across Engine and Ads — familiar, fast, secure." },
  { title: "Works on every device", desc: "Free on PC, Android & iOS. Add Geo Monitor to your home screen in seconds." },
  { title: "Plain language, always", desc: "Finance, AI and world events decoded — no jargon, no gatekeeping." },
  { title: "Safety by design", desc: "Parent gates, age tiers, kid-safe rules and tiered shields for every audience." },
];

export default function Benefits() {
  return (
    <section id="benefits" className="relative z-10 scroll-mt-24 py-16 sm:py-24" aria-label="Benefits and shields">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid gap-10 lg:grid-cols-[1fr_1fr] lg:gap-14">
          {/* Five shields */}
          <div className="reveal">
            <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-1.5 text-xs font-bold uppercase tracking-[0.2em] text-white/60">
              <ShieldCheck className="h-3.5 w-3.5 text-orange-400" /> Inside SG16 AI Engine
            </span>
            <h2 className="mt-4 font-display text-3xl font-bold tracking-tight text-white sm:text-4xl">
              Five shields. <span className="text-luxury-gradient">One intelligent home.</span>
            </h2>
            <p className="mt-3 text-white/60">
              Five shields — Coding Hub, Health, Student, Market, AI Chat — each a dedicated workspace with its own memory, tools and personality.
            </p>
            <div className="mt-7 space-y-2.5">
              {SHIELDS.map((s, i) => {
                const Icon = ICONS[s.icon] ?? MessagesSquare;
                return (
                  <a
                    key={s.name}
                    href="https://sg16engine.com"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="reveal glass glass-hover group flex items-center gap-4 rounded-2xl p-4"
                    style={{ ["--reveal-delay" as string]: `${i * 80}ms` }}
                    aria-label={`${s.name} shield — open SG16 AI Engine (new tab)`}
                  >
                    <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl border border-orange-400/20 bg-gradient-to-br from-orange-500/20 to-transparent text-orange-300">
                      <Icon className="h-5 w-5" />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block font-display text-[15px] font-semibold text-white">{s.name}</span>
                      <span className="block truncate text-[13px] text-white/50">{s.desc}</span>
                    </span>
                    <ArrowUpRight className="h-4 w-4 shrink-0 text-white/25 transition group-hover:text-orange-300" />
                  </a>
                );
              })}
            </div>
          </div>

          {/* Benefits */}
          <div className="flex flex-col justify-center">
            <div className="reveal">
              <span className="inline-flex items-center rounded-full border border-orange-400/25 bg-orange-500/10 px-4 py-1.5 text-xs font-bold uppercase tracking-[0.2em] text-orange-300">
                Benefits
              </span>
              <h2 className="mt-4 font-display text-3xl font-bold tracking-tight text-white sm:text-4xl">
                Designed for a <span className="text-luxury-gradient">global audience.</span>
              </h2>
            </div>
            <div className="mt-7 grid gap-3 sm:grid-cols-2">
              {BENEFITS.map((b, i) => (
                <div
                  key={b.title}
                  className="reveal glass relative overflow-hidden rounded-2xl p-5"
                  style={{ ["--reveal-delay" as string]: `${i * 90}ms` }}
                >
                  <span className="font-display text-3xl font-bold text-orange-500/25" aria-hidden="true">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <h3 className="mt-2 font-display text-[16px] font-semibold text-white">{b.title}</h3>
                  <p className="mt-1.5 text-[13.5px] leading-relaxed text-white/55">{b.desc}</p>
                </div>
              ))}
            </div>
            <div className="reveal glass-orange mt-3 rounded-2xl p-5" style={{ ["--reveal-delay" as string]: "360ms" }}>
              <p className="text-sm leading-relaxed text-orange-100/90">
                <strong className="text-white">High-traffic ready:</strong> static edge delivery, independent domains per
                product and a sovereign API brain — so a surge on one platform never slows the others.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
