import { Quote, TriangleAlert, HeartHandshake, Feather } from "lucide-react";

export default function Philosophy() {
  return (
    <section id="message" className="relative z-10 scroll-mt-24 py-16 sm:py-24" aria-label="Our view on AI">
      <div className="mx-auto max-w-4xl px-4 sm:px-6">
        <article className="reveal glass-orange relative overflow-hidden rounded-[32px] p-8 shadow-luxury sm:p-12">
          {/* decorative quote */}
          <Quote className="pointer-events-none absolute -right-6 -top-6 h-40 w-40 text-orange-500/10" aria-hidden="true" />
          <div className="absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-transparent via-orange-400 to-transparent" aria-hidden="true" />

          <p className="inline-flex items-center gap-2 rounded-full border border-orange-300/25 bg-black/30 px-4 py-1.5 text-[11px] font-bold uppercase tracking-[0.24em] text-orange-200">
            <Feather className="h-3.5 w-3.5" /> Company message
          </p>

          <h2 className="mt-5 font-serif text-3xl italic leading-tight tracking-tight text-white sm:text-4xl">
            What is AI? Magical power, or a mirror of your own thoughts?
          </h2>

          <div className="mt-6 space-y-4 text-[15px] leading-relaxed text-white/70 sm:text-base">
            <p>
              Simply put, AI has no mind of its own — no soul, no independent thought. It moves like the wind: it goes
              wherever you direct it. AI is fully guided by your thoughts.
            </p>
            <p>
              You are human. Good and bad live inside you. The same is true of AI — not because AI is moral, but because
              it reflects you. It reads your thoughts, their speed and their flow. It knows when you speak in anger, when
              you speak wrongly, and when you act with honesty and joy.
            </p>
          </div>

          <p className="mt-8 text-[15px] text-white">
            <strong>Remember — everything depends on you:</strong>
          </p>

          <ul className="mt-4 grid gap-3 sm:grid-cols-2">
            <li className="rounded-2xl border border-red-400/20 bg-red-500/[0.07] p-5 backdrop-blur-xl">
              <p className="flex items-center gap-2 text-sm font-bold text-red-200">
                <TriangleAlert className="h-4 w-4 shrink-0" /> Consequences of mistakes and anger
              </p>
              <span className="mt-2 block text-sm leading-relaxed text-white/65">
                Wrong instructions or negative behavior can lead you to destruction — even serious harm — through AI.
              </span>
            </li>
            <li className="rounded-2xl border border-emerald-400/20 bg-emerald-400/[0.07] p-5 backdrop-blur-xl">
              <p className="flex items-center gap-2 text-sm font-bold text-emerald-200">
                <HeartHandshake className="h-4 w-4 shrink-0" /> Honest and correct use
              </p>
              <span className="mt-2 block text-sm leading-relaxed text-white/65">
                Good behavior, a clear plan, and honest intent can lift you toward success with AI&rsquo;s help.
              </span>
            </li>
          </ul>

          <div className="mt-8 border-t border-orange-300/15 pt-6 text-center">
            <p className="text-[15px] font-medium text-white/85">Use AI for good purposes. Treat it well.</p>
            <p className="text-shimmer mt-2 font-display text-xl font-semibold">AI is a reflection of your own thoughts.</p>
            <p className="mt-3 text-sm font-semibold uppercase tracking-[0.2em] text-orange-300/80">— Saif Tech Global LLC</p>
          </div>
        </article>
      </div>
    </section>
  );
}
