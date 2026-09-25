import { Building2, Check, Globe2, MapPin } from "lucide-react";

export default function About() {
  return (
    <section id="about" className="relative z-10 scroll-mt-24 py-16 sm:py-24" aria-label="About us">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="reveal mx-auto max-w-2xl text-center">
          <p className="text-xs font-bold uppercase tracking-[0.28em] text-orange-300">Saif Tech Global LLC</p>
          <h2 className="mt-3 font-display text-3xl font-bold tracking-tight text-white sm:text-4xl lg:text-[2.75rem]">
            About us
          </h2>
          <p className="mt-3 text-white/60">
            A USA technology company focused on practical innovation and products people can use every day.
          </p>
        </div>

        {/* Brand banner — recreated as premium CSS visual (original image preserved in spirit) */}
        <div className="reveal glass relative mt-10 overflow-hidden rounded-[28px]" style={{ ["--reveal-delay" as string]: "100ms" }}>
          <div className="absolute inset-0 bg-[radial-gradient(800px_300px_at_50%_0%,rgba(255,122,24,0.16),transparent_65%)]" aria-hidden="true" />
          <div className="relative grid items-center gap-8 p-8 sm:p-12 lg:grid-cols-[1fr_.9fr]">
            <div>
              <p className="inline-flex items-center gap-2 rounded-full border border-orange-400/25 bg-orange-500/10 px-4 py-1.5 text-[11px] font-bold uppercase tracking-[0.22em] text-orange-200">
                <Building2 className="h-3.5 w-3.5" /> Technology · Software · AI Tools · Digital Products
              </p>
              <h3 className="mt-5 font-display text-2xl font-bold tracking-tight text-white sm:text-3xl">
                Saif Tech Global LLC — <span className="text-luxury-gradient">technology services for the world.</span>
              </h3>
              <p className="mt-3 flex items-center gap-2 text-sm text-white/55">
                <MapPin className="h-4 w-4 text-orange-400" />
                Albuquerque, New Mexico, USA — serving users worldwide.
              </p>
              <div className="mt-6 flex flex-wrap gap-2">
                {["Software", "AI Tools", "Digital Products", "Global Services"].map((t) => (
                  <span key={t} className="rounded-full border border-white/10 bg-white/[0.04] px-3.5 py-1.5 text-xs font-semibold text-white/70">
                    {t}
                  </span>
                ))}
              </div>
            </div>
            <div className="relative">
              <div className="grid grid-cols-2 gap-3">
                {[
                  { n: "5", l: "Live platforms" },
                  { n: "24/7", l: "Sovereign brain" },
                  { n: "USA", l: "Registered · NM" },
                  { n: "∞", l: "Global ambition" },
                ].map((s) => (
                  <div key={s.l} className="rounded-2xl border border-white/10 bg-black/30 p-5 text-center backdrop-blur-xl">
                    <p className="font-display text-2xl font-bold text-white">{s.n}</p>
                    <p className="mt-1 text-[11px] uppercase tracking-widest text-white/45">{s.l}</p>
                  </div>
                ))}
              </div>
              <div className="absolute -inset-4 -z-10 rounded-[28px] bg-[radial-gradient(closest-side,rgba(255,122,24,0.12),transparent)] blur-xl" aria-hidden="true" />
            </div>
          </div>
        </div>

        <div className="mt-6 grid gap-5 md:grid-cols-2">
          <div className="reveal glass glass-hover rounded-3xl p-7 sm:p-8">
            <span className="grid h-12 w-12 place-items-center rounded-2xl border border-orange-400/25 bg-orange-500/10 text-orange-300">
              <Globe2 className="h-6 w-6" />
            </span>
            <h3 className="mt-5 font-display text-xl font-semibold text-white">Who we are</h3>
            <p className="mt-2.5 text-[15px] leading-relaxed text-white/60">
              Saif Tech Global LLC is a USA-registered technology company focused on digital innovation, software
              solutions, and global technology services. We build scalable platforms designed to serve users worldwide.
            </p>
          </div>
          <div className="reveal glass glass-hover rounded-3xl p-7 sm:p-8" style={{ ["--reveal-delay" as string]: "120ms" }}>
            <span className="grid h-12 w-12 place-items-center rounded-2xl border border-orange-400/25 bg-orange-500/10 text-orange-300">
              <Building2 className="h-6 w-6" />
            </span>
            <h3 className="mt-5 font-display text-xl font-semibold text-white">What we build</h3>
            <ul className="mt-2.5 space-y-2.5">
              {[
                "AI-powered web and mobile applications",
                "Sovereign AI infrastructure — own brain, not rented API dependency",
                "Secure, privacy-conscious user experiences",
                "Products that scale from launch to global growth",
              ].map((li) => (
                <li key={li} className="flex items-start gap-2.5 text-[15px] text-white/65">
                  <Check className="mt-0.5 h-4 w-4 shrink-0 text-orange-400" strokeWidth={2.5} />
                  {li}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}
