import { useEffect, useState } from "react";
import { Menu, X, ArrowUpRight, Activity } from "lucide-react";
import { NAV_LINKS } from "../data/platforms";

/** Small header mark — logo-icon loads reliably; hero JPG is for the large hero panel only. */
const HEADER_LOGO_SRC = "/assets/logo-icon.webp";

function LogoMark({ size = 40 }: { size?: number }) {
  return (
    <img
      src={HEADER_LOGO_SRC}
      alt="Saif Tech Global LLC"
      width={size}
      height={size}
      decoding="async"
      loading="eager"
      className="shrink-0 rounded-xl border border-orange-400/35 bg-[#0b0d1a] object-cover object-center shadow-[0_0_24px_-4px_rgba(255,122,24,.55)]"
      style={{ width: size, height: size }}
    />
  );
}

export { LogoMark };

export default function Navbar({ liveCount, total }: { liveCount: number; total: number }) {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open ]);

  return (
    <header className="fixed inset-x-0 top-0 z-50">
      <div
        className={`mx-auto transition-all duration-500 ${
          scrolled ? "max-w-6xl px-3 pt-3 sm:px-4" : "max-w-7xl px-4 pt-4 sm:px-6"
        }`}
      >
        <div
          className={`glass-strong flex items-center justify-between gap-3 rounded-2xl px-3 py-2.5 pl-4 pr-2.5 transition-all duration-500 sm:px-4 ${
            scrolled ? "shadow-[0_20px_60px_-20px_rgba(255,122,24,0.25),0_20px_60px_-20px_rgba(0,0,0,0.8)]" : ""
          }`}
        >
          <a href="#top" className="group flex min-w-0 items-center gap-3" aria-label="Saif Tech Global LLC — home">
            <LogoMark />
            <span className="min-w-0 leading-tight">
              <strong className="block truncate font-display text-base font-semibold tracking-tight text-white sm:text-lg">
                Saif Tech Global <span className="text-luxury-400">LLC</span>
              </strong>
              <span className="block truncate text-[9px] font-medium uppercase tracking-[0.16em] text-white/45 sm:text-[10px]">
                USA technology company
              </span>
            </span>
          </a>

          <nav className="hidden items-center gap-1 lg:flex" aria-label="Primary">
            {NAV_LINKS.map((l) => (
              <a
                key={l.href}
                href={l.href}
                className="group relative rounded-full px-4 py-2 text-sm font-medium text-white/70 transition-colors hover:text-white"
              >
                {l.label}
                <span className="absolute inset-x-4 -bottom-px h-px origin-left scale-x-0 bg-gradient-to-r from-orange-500 to-amber-300 transition-transform duration-300 group-hover:scale-x-100" />
              </a>
            ))}
          </nav>

          <div className="flex items-center gap-2">
            <span className="hidden items-center gap-2 rounded-full border border-emerald-400/20 bg-emerald-400/10 px-3 py-1.5 text-xs font-semibold text-emerald-200 md:inline-flex">
              <Activity className="h-3.5 w-3.5" />
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-60" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-400" />
              </span>
              {liveCount}/{total} live
            </span>
            <a
              href="https://mistralbrain.com"
              target="_blank"
              rel="noopener noreferrer"
              className="group hidden items-center gap-1.5 rounded-xl bg-gradient-to-r from-[#ff7a18] to-[#ffa53b] px-4 py-2.5 text-sm font-semibold text-[#1a0b00] shadow-[0_8px_30px_-8px_rgba(255,122,24,0.7)] transition-all duration-300 hover:shadow-[0_8px_40px_-6px_rgba(255,122,24,0.9)] hover:brightness-110 sm:inline-flex"
            >
              SG16 Brain
              <ArrowUpRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
            </a>
            <button
              type="button"
              onClick={() => setOpen(!open)}
              aria-expanded={open}
              aria-controls="mobile-nav"
              aria-label={open ? "Close menu" : "Open menu"}
              className="grid h-10 w-10 place-items-center rounded-xl border border-white/10 bg-white/5 text-white transition hover:bg-white/10 lg:hidden"
            >
              {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile nav */}
      <div
        id="mobile-nav"
        className={`mx-3 mt-2 overflow-hidden rounded-2xl transition-all duration-500 ease-[cubic-bezier(.22,1,.36,1)] lg:hidden ${
          open ? "max-h-[420px] opacity-100" : "max-h-0 opacity-0"
        }`}
      >
        <nav className="glass-strong space-y-1 p-3" aria-label="Mobile">
          {NAV_LINKS.map((l, i) => (
            <a
              key={l.href}
              href={l.href}
              onClick={() => setOpen(false)}
              className="flex items-center justify-between rounded-xl px-4 py-3 text-[15px] font-medium text-white/80 transition hover:bg-white/5 hover:text-white"
              style={{ transitionDelay: open ? `${i * 40}ms` : "0ms" }}
            >
              {l.label}
              <ArrowUpRight className="h-4 w-4 text-orange-400/60" />
            </a>
          ))}
          <a
            href="https://mistralbrain.com"
            target="_blank"
            rel="noopener noreferrer"
            className="mt-2 flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#ff7a18] to-[#ffa53b] px-4 py-3 text-sm font-bold text-[#1a0b00]"
          >
            SG16 Brain <ArrowUpRight className="h-4 w-4" />
          </a>
        </nav>
      </div>
    </header>
  );
}
