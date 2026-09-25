import { Mail, MapPin, ArrowUpRight, Send, ShieldCheck } from "lucide-react";

const EMAILS = [
  { label: "General enquiries and partnerships", email: "contact@saiftechglobal.com", href: "mailto:contact@saiftechglobal.com" },
  { label: "SG16 Finance", email: "info@saiftechglobal.com", href: "mailto:info@saiftechglobal.com" },
  { label: "SG16 AI Engine", email: "contact@sg16engine.com", href: "mailto:contact@sg16engine.com" },
  { label: "SG16 Children World", email: "sg16children.com", href: "https://sg16children.com" },
  { label: "SG16 Ads Network", email: "ads.saiftechglobal.com", href: "https://ads.saiftechglobal.com" },
  { label: "Geo Monitor · saifglobal16.info", email: "saifglobal16.info", href: "https://saifglobal16.info" },
];

export default function ContactCTA() {
  return (
    <section id="contact" className="relative z-10 scroll-mt-24 py-16 sm:py-24" aria-label="Contact">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Final CTA banner */}
        <div className="reveal glass-orange relative overflow-hidden rounded-[32px] p-8 text-center shadow-luxury sm:p-14">
          <div className="pointer-events-none absolute -top-24 left-1/2 h-64 w-[700px] -translate-x-1/2 rounded-full bg-[radial-gradient(closest-side,rgba(255,165,59,0.3),transparent)] blur-2xl" aria-hidden="true" />
          <div className="absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-transparent via-amber-300 to-transparent" aria-hidden="true" />
          <p className="relative inline-flex items-center gap-2 rounded-full border border-orange-300/25 bg-black/30 px-4 py-1.5 text-xs font-bold uppercase tracking-[0.22em] text-orange-200">
            <ShieldCheck className="h-3.5 w-3.5" /> Join the SG16 network
          </p>
          <h2 className="relative mx-auto mt-5 max-w-2xl font-display text-3xl font-bold leading-tight tracking-tight text-white sm:text-4xl lg:text-5xl">
            Start with intelligence. <span className="text-luxury-gradient">Stay for the ecosystem.</span>
          </h2>
          <p className="relative mx-auto mt-4 max-w-xl text-white/65">
            Five live platforms, one sovereign brain, zero data trace. Free to explore — built for the world, from the USA.
          </p>
          <div className="relative mt-8 flex flex-wrap items-center justify-center gap-3">
            <a
              href="https://sg16engine.com"
              target="_blank"
              rel="noopener noreferrer"
              className="group inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#ff7a18] to-[#ffa53b] px-7 py-3.5 text-[15px] font-bold text-[#1a0b00] shadow-[0_12px_40px_-10px_rgba(255,122,24,0.8)] transition hover:-translate-y-0.5 hover:brightness-110"
            >
              Launch SG16 AI Engine
              <ArrowUpRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
            </a>
            <a
              href="mailto:contact@saiftechglobal.com"
              className="inline-flex items-center gap-2 rounded-xl border border-white/15 bg-black/30 px-7 py-3.5 text-[15px] font-semibold text-white transition hover:border-orange-400/40 hover:bg-orange-500/10"
            >
              <Send className="h-4 w-4 text-orange-400" /> Talk to us
            </a>
          </div>
        </div>

        {/* Contact cards — original content preserved */}
        <div className="mt-12 grid gap-6 lg:grid-cols-[1.2fr_.8fr]">
          <div className="reveal glass rounded-3xl p-7 sm:p-8">
            <span className="grid h-12 w-12 place-items-center rounded-2xl border border-orange-400/25 bg-orange-500/10 text-orange-300">
              <Mail className="h-6 w-6" />
            </span>
            <h2 className="mt-5 font-display text-2xl font-bold tracking-tight text-white">Contact</h2>
            <p className="mt-1.5 text-white/55">For product support, partnerships, or privacy requests.</p>
            <h3 className="mt-6 text-sm font-bold uppercase tracking-[0.18em] text-white/45">Email</h3>
            <div className="mt-3 divide-y divide-white/8 rounded-2xl border border-white/8 bg-black/20">
              {EMAILS.map((e) => (
                <div key={e.label} className="flex flex-wrap items-center justify-between gap-2 px-5 py-3.5 transition hover:bg-orange-500/[0.04]">
                  <span className="text-sm text-white/50">{e.label}</span>
                  <a
                    href={e.href}
                    {...(e.href.startsWith("http") ? { target: "_blank", rel: "noopener noreferrer" } : {})}
                    className="inline-flex items-center gap-1.5 font-mono text-[13.5px] font-semibold text-orange-300 transition hover:text-orange-200"
                  >
                    {e.email}
                    {e.href.startsWith("http") && <ArrowUpRight className="h-3.5 w-3.5" />}
                  </a>
                </div>
              ))}
            </div>
          </div>

          <div className="flex flex-col gap-6">
            <div className="reveal glass glass-hover rounded-3xl p-7 sm:p-8" style={{ ["--reveal-delay" as string]: "120ms" }}>
              <span className="grid h-12 w-12 place-items-center rounded-2xl border border-orange-400/25 bg-orange-500/10 text-orange-300">
                <MapPin className="h-6 w-6" />
              </span>
              <h3 className="mt-5 font-display text-xl font-semibold text-white">Registered office</h3>
              <p className="mt-2.5 leading-relaxed text-white/65">
                8206 Louisiana Blvd NE<br />
                Ste A #10595<br />
                Albuquerque, NM 87113<br />
                United States
              </p>
              <p className="mt-4 border-t border-white/8 pt-4 text-sm text-white/55">
                Saif Tech Global LLC<br />Registered in New Mexico, USA
              </p>
            </div>
            <div className="reveal glass-orange rounded-3xl p-6" style={{ ["--reveal-delay" as string]: "200ms" }}>
              <p className="text-sm leading-relaxed text-orange-100/90">
                <strong className="text-white">Prefer the web?</strong> Every platform has its own domain and support —
                jump straight in from the network above.
              </p>
              <a href="#network" className="mt-4 inline-flex items-center gap-2 rounded-xl bg-white/10 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-white/15">
                Back to network <ArrowUpRight className="h-4 w-4" />
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
