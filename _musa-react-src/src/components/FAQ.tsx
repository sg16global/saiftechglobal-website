import { useState } from "react";
import { Plus, MessageCircleQuestion } from "lucide-react";

const FAQS = [
  {
    q: "What is Saif Tech Global LLC?",
    a: "Saif Tech Global LLC is a USA-registered technology company focused on digital innovation, software solutions, and global technology services. We build scalable platforms designed to serve users worldwide — including SG16 AI Engine, SG16 Finance, SG16 Children World, the Geopolitical Monitor and the Ads Network.",
  },
  {
    q: "What makes SG16 AI Engine sovereign?",
    a: "SG16 AI Engine runs on SG16 Mistral X at api.mistralbrain.com — a sovereign cloud brain operated 24/7 by Saif Tech Global on Cloudflare infrastructure. Each SG16 product connects to the brain directly from its own Cloudflare Pages site. It is our own stack, not a rented API wrapper.",
  },
  {
    q: "How does Zero-Data Trace privacy work?",
    a: "Chat content is processed live to produce a reply — not stored in our database. Your conversation history stays on your device. Combined with Google sign-in and Coding Shield + Platform Shield security tools, your data stays yours.",
  },
  {
    q: "Is SG16 Children World safe for kids?",
    a: "Yes. Children World is a parent-gated learning world with Robo, the friendly AI helper. It uses tiered safety for ages 6–11, teens and adults, plus parent gates and kid-safe chat rules — covering homework help, stories, science facts and gentle support.",
  },
  {
    q: "How does the SG16 Ads Network work?",
    a: "Pick a package (Standard, Premium or Pro from $3), upload your brand or paste your website — AI builds your ad creative, you pay securely with Dodo, and your ad goes live automatically. Gmail sign-in and instant activation included.",
  },
  {
    q: "Is the Geopolitical Monitor really free?",
    a: "Yes — free on PC, Android and iOS. Just add it to your home screen. You get a live world command map with tension zones, flights, markets, earthquakes and breaking updates, powered by open data feeds.",
  },
  {
    q: "How can enterprises work with you?",
    a: "We build custom digital platforms for partners and global teams — software and AI integration on scalable, cloud-ready architecture. Email contact@saiftechglobal.com to discuss your project.",
  },
];

export default function FAQ() {
  const [open, setOpen] = useState<number | null>(0);

  return (
    <section id="faq" className="relative z-10 scroll-mt-24 py-16 sm:py-24" aria-label="Frequently asked questions">
      <div className="mx-auto mb-14 max-w-5xl px-4"><div className="hairline" aria-hidden="true" /></div>
      <div className="mx-auto max-w-3xl px-4 sm:px-6">
        <div className="reveal text-center">
          <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-1.5 text-xs font-bold uppercase tracking-[0.2em] text-white/60">
            <MessageCircleQuestion className="h-3.5 w-3.5 text-orange-400" /> FAQ
          </span>
          <h2 className="mt-4 font-display text-3xl font-bold tracking-tight text-white sm:text-4xl">
            Questions, <span className="text-luxury-gradient">answered.</span>
          </h2>
        </div>

        <div className="mt-10 space-y-3">
          {FAQS.map((f, i) => {
            const isOpen = open === i;
            return (
              <div
                key={f.q}
                className={`reveal glass overflow-hidden rounded-2xl transition-all duration-300 ${isOpen ? "border-orange-400/25 shadow-[0_0_30px_-12px_rgba(255,122,24,.4)]" : ""}`}
                style={{ ["--reveal-delay" as string]: `${i * 60}ms` }}
              >
                <button
                  type="button"
                  onClick={() => setOpen(isOpen ? null : i)}
                  aria-expanded={isOpen}
                  aria-controls={`faq-panel-${i}`}
                  className="flex w-full items-center justify-between gap-4 px-6 py-5 text-left"
                >
                  <span className={`font-display text-[16px] font-semibold ${isOpen ? "text-orange-200" : "text-white"}`}>{f.q}</span>
                  <span
                    className={`grid h-8 w-8 shrink-0 place-items-center rounded-full border transition-all duration-300 ${
                      isOpen ? "rotate-45 border-orange-400/40 bg-orange-500/15 text-orange-300" : "border-white/12 bg-white/5 text-white/60"
                    }`}
                  >
                    <Plus className="h-4 w-4" />
                  </span>
                </button>
                <div
                  id={`faq-panel-${i}`}
                  role="region"
                  className={`grid transition-all duration-500 ease-[cubic-bezier(.22,1,.36,1)] ${isOpen ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"}`}
                >
                  <div className="overflow-hidden">
                    <p className="px-6 pb-6 text-sm leading-relaxed text-white/60">{f.a}</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
