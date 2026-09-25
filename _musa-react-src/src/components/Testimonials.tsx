import { Star, Quote } from "lucide-react";

const TESTIMONIALS = [
  {
    quote: "SG16 AI Engine replaced three subscriptions for me. Coding Hub writes with me, Market Shield briefs me — and my chats stay on my device.",
    name: "Daniel R.",
    role: "Software developer · United States",
    initials: "DR",
    accent: "from-orange-500 to-amber-400",
  },
  {
    quote: "My kids ask Robo everything — homework, science, stories. The parent gate gives me real peace of mind. Beautiful and safe.",
    name: "Amira K.",
    role: "Parent · United Kingdom",
    initials: "AK",
    accent: "from-sky-400 to-cyan-300",
  },
  {
    quote: "Finance finally speaks my language. The earnings breakdowns are clearer than anything my broker sends me.",
    name: "Ravi S.",
    role: "Retail investor · India",
    initials: "RS",
    accent: "from-amber-300 to-yellow-500",
  },
  {
    quote: "The Geo Monitor is on my second screen all day — quakes, markets, flights, breaking news in one live view. Remarkable.",
    name: "Elena M.",
    role: "Research analyst · Germany",
    initials: "EM",
    accent: "from-rose-500 to-red-400",
  },
  {
    quote: "I launched my first ad in under two minutes. AI designed it from my website, Dodo checkout took seconds. Incredible for $3.",
    name: "Carlos F.",
    role: "Small business owner · Brazil",
    initials: "CF",
    accent: "from-violet-500 to-fuchsia-400",
  },
  {
    quote: "A USA company building sovereign AI infrastructure instead of renting it — that independence is exactly why we partnered.",
    name: "Yuki T.",
    role: "Startup founder · Japan",
    initials: "YT",
    accent: "from-emerald-400 to-teal-300",
  },
];

export default function Testimonials() {
  return (
    <section id="testimonials" className="relative z-10 scroll-mt-24 py-16 sm:py-24" aria-label="Testimonials">
      <div className="mx-auto mb-14 max-w-5xl px-4"><div className="hairline" aria-hidden="true" /></div>
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="reveal mx-auto max-w-2xl text-center">
          <span className="inline-flex items-center rounded-full border border-white/10 bg-white/5 px-4 py-1.5 text-xs font-bold uppercase tracking-[0.2em] text-white/60">
            Loved worldwide
          </span>
          <h2 className="mt-4 font-display text-3xl font-bold tracking-tight text-white sm:text-4xl lg:text-[2.75rem]">
            Trusted by people <span className="text-luxury-gradient">on every continent.</span>
          </h2>
          <p className="mt-4 flex items-center justify-center gap-2 text-sm text-white/55">
            <span className="flex gap-0.5" aria-label="5 out of 5 stars">
              {Array.from({ length: 5 }).map((_, i) => (
                <Star key={i} className="h-4 w-4 fill-amber-400 text-amber-400" />
              ))}
            </span>
            From developers, parents, investors and founders
          </p>
        </div>

        <div className="mt-12 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {TESTIMONIALS.map((t, i) => (
            <figure
              key={t.name}
              className="reveal glass glass-hover relative flex flex-col overflow-hidden rounded-3xl p-6"
              style={{ ["--reveal-delay" as string]: `${(i % 3) * 100}ms` }}
            >
              <Quote className="absolute right-4 top-4 h-8 w-8 text-orange-500/15" aria-hidden="true" />
              <span className="flex gap-0.5" aria-hidden="true">
                {Array.from({ length: 5 }).map((_, s) => (
                  <Star key={s} className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                ))}
              </span>
              <blockquote className="mt-4 flex-1 text-[14.5px] leading-relaxed text-white/75">
                “{t.quote}”
              </blockquote>
              <figcaption className="mt-5 flex items-center gap-3 border-t border-white/8 pt-4">
                <span className={`grid h-10 w-10 place-items-center rounded-full bg-gradient-to-br text-[13px] font-bold text-black/80 ${t.accent}`} aria-hidden="true">
                  {t.initials}
                </span>
                <span>
                  <span className="block text-sm font-semibold text-white">{t.name}</span>
                  <span className="block text-xs text-white/45">{t.role}</span>
                </span>
              </figcaption>
            </figure>
          ))}
        </div>
      </div>
    </section>
  );
}
