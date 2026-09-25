import { Globe2, ShieldCheck, Zap, Server } from "lucide-react";

const STATS = [
  { icon: Globe2, value: "5+", label: "Live platforms, one company", sub: "Engine · Finance · Children · Geo · Ads" },
  { icon: Server, value: "24/7", label: "Sovereign cloud brain", sub: "SG16 Mistral X · api.mistralbrain.com" },
  { icon: ShieldCheck, value: "Zero-Trace", label: "Privacy-first policy", sub: "Processed live · not stored" },
  { icon: Zap, value: "Global", label: "Built to scale worldwide", sub: "Cloudflare edge infrastructure" },
];

export default function SocialProof() {
  return (
    <section className="relative z-10 py-6" aria-label="Company highlights">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="reveal glass overflow-hidden rounded-3xl">
          <div className="grid divide-white/8 sm:grid-cols-2 lg:grid-cols-4 lg:divide-x">
            {STATS.map((s, i) => (
              <div
                key={s.label}
                className="group relative px-6 py-7 transition-colors duration-300 hover:bg-orange-500/[0.04]"
                style={{ ["--reveal-delay" as string]: `${i * 80}ms` }}
              >
                <div className="flex items-center gap-3">
                  <span className="grid h-10 w-10 place-items-center rounded-xl border border-orange-400/20 bg-orange-500/10 text-orange-300 transition-all duration-300 group-hover:shadow-[0_0_20px_rgba(255,122,24,.4)]">
                    <s.icon className="h-5 w-5" />
                  </span>
                  <span className="font-display text-2xl font-bold tracking-tight text-white">{s.value}</span>
                </div>
                <p className="mt-3 text-sm font-semibold text-white/85">{s.label}</p>
                <p className="mt-1 text-xs text-white/45">{s.sub}</p>
              </div>
            ))}
          </div>
          {/* marquee of domains */}
          <div className="relative overflow-hidden border-t border-white/8 bg-black/30 py-3" aria-hidden="true">
            <div className="flex w-max animate-marquee gap-10 whitespace-nowrap px-6 text-[13px] font-medium text-white/40">
              {[0, 1].map((copy) => (
                <span key={copy} className="flex gap-10">
                  {["sg16engine.com", "sg16finance.com", "sg16children.com", "saifglobal16.info", "ads.saiftechglobal.com", "api.mistralbrain.com", "saiftechglobal.com"].map((d) => (
                    <span key={d} className="flex items-center gap-2">
                      <span className="h-1.5 w-1.5 rounded-full bg-orange-500/60" /> {d}
                    </span>
                  ))}
                </span>
              ))}
            </div>
            <div className="pointer-events-none absolute inset-y-0 left-0 w-24 bg-gradient-to-r from-[#06070f] to-transparent" />
            <div className="pointer-events-none absolute inset-y-0 right-0 w-24 bg-gradient-to-l from-[#06070f] to-transparent" />
          </div>
        </div>
      </div>
    </section>
  );
}
