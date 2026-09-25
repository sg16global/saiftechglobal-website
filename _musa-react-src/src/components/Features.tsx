import { BrainCircuit, Lock, Rocket, HeartHandshake } from "lucide-react";

const FEATURES = [
  {
    icon: BrainCircuit,
    title: "Sovereign AI, owned end-to-end",
    desc: "SG16 Mistral X runs on our own cloud stack — not a rented wrapper. Every product connects directly to api.mistralbrain.com.",
  },
  {
    icon: Lock,
    title: "Zero-Data Trace privacy",
    desc: "Chat content is processed live to produce a reply — not stored in our database. History stays on your device.",
  },
  {
    icon: Rocket,
    title: "Engineered for global scale",
    desc: "Cloudflare-powered edge delivery, independent domains per product, and architecture ready for high-traffic growth.",
  },
  {
    icon: HeartHandshake,
    title: "Human-first design",
    desc: "From Robo for kids to plain-English finance — every platform is crafted for real people, in every country, on every device.",
  },
];

export default function Features() {
  return (
    <section id="features" className="relative z-10 scroll-mt-24 py-16 sm:py-24" aria-label="Why Saif Tech Global">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="reveal mx-auto max-w-2xl text-center">
          <span className="inline-flex items-center rounded-full border border-white/10 bg-white/5 px-4 py-1.5 text-xs font-bold uppercase tracking-[0.2em] text-white/60">
            Why Saif Tech
          </span>
          <h2 className="mt-4 font-display text-3xl font-bold tracking-tight text-white sm:text-4xl lg:text-[2.75rem]">
            Practical innovation, <span className="text-luxury-gradient">people can use daily.</span>
          </h2>
          <p className="mt-4 text-white/60">
            A USA technology company focused on practical innovation and products people can use every day.
          </p>
        </div>

        <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {FEATURES.map((f, i) => (
            <article
              key={f.title}
              className="reveal glass glass-hover group relative overflow-hidden rounded-3xl p-6"
              style={{ ["--reveal-delay" as string]: `${i * 100}ms` }}
            >
              <div className="absolute -right-12 -top-12 h-32 w-32 rounded-full bg-orange-500/10 blur-2xl transition-opacity duration-500 group-hover:bg-orange-500/20" aria-hidden="true" />
              <span className="relative grid h-12 w-12 place-items-center rounded-2xl border border-orange-400/25 bg-gradient-to-br from-orange-500/20 to-amber-400/10 text-orange-300 shadow-[0_8px_24px_-8px_rgba(255,122,24,.5)]">
                <f.icon className="h-6 w-6" />
              </span>
              <h3 className="relative mt-5 font-display text-lg font-semibold tracking-tight text-white">{f.title}</h3>
              <p className="relative mt-2 text-sm leading-relaxed text-white/60">{f.desc}</p>
              <span className="relative mt-5 block h-px w-full bg-gradient-to-r from-orange-500/40 to-transparent" aria-hidden="true" />
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
