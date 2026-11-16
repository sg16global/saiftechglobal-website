import { ArrowUp, ExternalLink } from "lucide-react";
import { LogoMark } from "./Navbar";
import { PLATFORMS } from "../data/platforms";

export default function Footer() {
  return (
    <footer className="relative z-10 border-t border-white/8 bg-black/40 backdrop-blur-xl" aria-label="Footer">
      <div className="hairline" aria-hidden="true" />
      <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
        <div className="grid gap-10 lg:grid-cols-[1.2fr_1.6fr_.8fr]">
          <div>
            <a href="#top" className="flex items-center gap-3" aria-label="Back to top — Saif Tech Global LLC">
              <LogoMark size={44} />
              <span className="leading-tight">
                <strong className="block font-display text-lg font-semibold text-white">
                  Saif Tech Global <span className="text-orange-400">LLC</span>
                </strong>
                <span className="mt-0.5 block text-[10px] font-medium tracking-wide text-white/45">
                  NM Secretary of State · Reg. No. 0008128993
                </span>
                <span className="block text-[9px] font-medium uppercase tracking-[0.16em] text-white/40">
                  USA technology company
                </span>
              </span>
            </a>
            <p className="mt-4 text-sm text-white/55">Global Technology &amp; Digital Solutions · Albuquerque, NM, USA</p>
            <figure className="mt-5 max-w-[300px]">
              <p className="mb-2 text-[11px] font-bold uppercase tracking-[0.22em] text-white/45">LLC registration</p>
              <div
                className="doc-protect overflow-hidden rounded-xl border border-white/15 bg-white shadow-[0_8px_32px_-12px_rgba(0,0,0,0.8)]"
                onContextMenu={(e) => e.preventDefault()}
                onDragStart={(e) => e.preventDefault()}
                data-voice="This is Saif Tech Global's Certificate of Organization from the New Mexico Secretary of State, entity ID 0008128993. It is shown as a watermarked display copy only."
              >
                <img
                  src="/assets/nm-certificate-of-organization-watermarked.jpg"
                  width={791}
                  height={1024}
                  draggable={false}
                  alt="New Mexico Certificate of Organization — Saif Tech Global LLC, entity ID 0008128993 (watermarked display copy)"
                  title="Watermarked display copy — © 2026 SAIF TECH GLOBAL LLC"
                  className="h-auto w-full"
                  loading="lazy"
                  decoding="async"
                />
              </div>
              <figcaption className="mt-2 text-[10px] leading-snug text-white/45">
                Certificate of Organization · State of New Mexico · effective September 10, 2026 · watermarked display copy —
                not valid for any other use.
              </figcaption>
            </figure>
            <p className="mt-3 text-[13px] leading-relaxed text-white/40">
              SG16 Brain ·{" "}
              <a
                href="https://mistralbrain.com"
                target="_blank"
                rel="noopener noreferrer"
                className="font-semibold text-orange-300/90 underline decoration-orange-400/30 underline-offset-4 hover:text-orange-200"
              >
                mistralbrain.com
              </a>{" "}
              · api.mistralbrain.com ·{" "}
              <a
                href="https://sg16engine.com/license"
                target="_blank"
                rel="noopener noreferrer"
                className="font-semibold text-orange-300/90 underline decoration-orange-400/30 underline-offset-4 hover:text-orange-200"
              >
                Zero-Data policy
              </a>
            </p>
            <div className="mt-5 flex items-center gap-2 text-xs text-white/35">
              <span className="relative flex h-2 w-2">
                <span className="absolute h-full w-full animate-ping rounded-full bg-emerald-400 opacity-60" />
                <span className="relative h-2 w-2 rounded-full bg-emerald-400" />
              </span>
              All systems operational
            </div>
          </div>

          <nav className="grid grid-cols-2 gap-8 sm:grid-cols-3" aria-label="Footer">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-white/40">Company</p>
              <ul className="mt-4 space-y-2.5 text-sm">
                {[
                  { l: "Home", h: "#top" },
                  { l: "Sovereign AI", h: "#sovereign" },
                  { l: "Products", h: "#products" },
                  { l: "About", h: "#about" },
                  { l: "Privacy Policy", h: "/privacy" },
                  { l: "SG16 License", h: "https://sg16engine.com/license", ext: true },
                ].map((x) => (
                  <li key={x.l}>
                    <a
                      href={x.h}
                      {...(x.ext ? { target: "_blank", rel: "noopener noreferrer" } : {})}
                      className="inline-flex items-center gap-1 text-white/60 transition hover:text-orange-300"
                    >
                      {x.l} {x.ext && <ExternalLink className="h-3 w-3 opacity-50" />}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-white/40">SG16 Platforms</p>
              <ul className="mt-4 space-y-2.5 text-sm">
                {PLATFORMS.map((p) => (
                  <li key={p.id}>
                    <a
                      href={p.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-white/60 transition hover:text-orange-300"
                    >
                      {p.name} <ExternalLink className="h-3 w-3 opacity-50" />
                    </a>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-white/40">Explore</p>
              <ul className="mt-4 space-y-2.5 text-sm">
                {[
                  { l: "Network", h: "#network" },
                  { l: "Showcase", h: "#showcase" },
                  { l: "Company message", h: "#message" },
                  { l: "Pricing", h: "#pricing" },
                  { l: "FAQ", h: "#faq" },
                  { l: "Contact", h: "#contact" },
                ].map((x) => (
                  <li key={x.l}>
                    <a href={x.h} className="text-white/60 transition hover:text-orange-300">
                      {x.l}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          </nav>

          <div className="flex flex-col items-start gap-4 lg:items-end">
            <a
              href="#top"
              className="group inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm font-semibold text-white/70 transition hover:border-orange-400/40 hover:text-white"
              aria-label="Back to top"
            >
              Back to top
              <span className="grid h-7 w-7 place-items-center rounded-lg bg-gradient-to-br from-orange-500 to-orange-300 text-black transition-transform duration-300 group-hover:-translate-y-0.5">
                <ArrowUp className="h-4 w-4" />
              </span>
            </a>
          </div>
        </div>

        <p className="mt-10 border-t border-white/8 pt-6 text-[12.5px] leading-relaxed text-white/55" data-voice="This is the company's legal and copyright notice.">
          © 2026 SAIF TECH GLOBAL LLC. All Rights Reserved. SAIF TECH GLOBAL LLC™ and its official golden emblem are exclusive
          trademarks and copyrighted assets of SAIF TECH GLOBAL LLC (Registered in New Mexico, USA | Entity ID: 0008128993 |
          8206 Louisiana Blvd NE, Ste A #10595, Albuquerque, NM 87113).
        </p>

        <div className="mt-6 flex flex-wrap items-center justify-between gap-3 text-xs text-white/30">
          <p>Designed in Albuquerque · Delivered on the edge · Loved worldwide</p>
          <p className="font-mono">saiftechglobal.com</p>
        </div>
      </div>
    </footer>
  );
}
