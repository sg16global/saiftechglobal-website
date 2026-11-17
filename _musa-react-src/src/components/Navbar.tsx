import { useEffect, useState } from "react";
import { Menu, X, ArrowUpRight, AudioLines } from "lucide-react";
import { NAV_LINKS } from "../data/platforms";
import ProtectedEmblem from "./ProtectedEmblem";

/** Header mark — official emblem (untouched PNG) with external ™ and save/drag protection. */
function LogoMark({ size = 44 }: { size?: number }) {
  return (
    <ProtectedEmblem
      size={size}
      eager
      className="mr-4 shrink-0"
      imgClassName="rounded-full object-contain drop-shadow-[0_2px_10px_rgba(212,160,40,.25)]"
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
          className={`flex items-center justify-between gap-3 rounded-2xl border px-3 py-2.5 pr-2.5 transition-all duration-500 sm:px-4 ${
            scrolled
              ? "border-white/10 bg-black/90 shadow-[0_20px_50px_-20px_rgba(0,0,0,0.9)] backdrop-blur-xl"
              : "border-transparent bg-black/90 backdrop-blur-xl"
          }`}
        >
          <a href="#top" className="group flex min-w-0 items-center gap-3 border-l-2 border-[#f2155f] pl-3" aria-label="Saif Tech Global LLC — home">
            <LogoMark />
            <span className="min-w-0 leading-tight">
              <strong className="block truncate font-display text-lg font-semibold tracking-tight text-white sm:text-[22px]">
                Saif Tech Global <span className="text-luxury-400">LLC</span>
              </strong>
              <span className="block truncate text-[9px] font-medium uppercase tracking-[0.18em] text-white/60 sm:text-[11px]">
                USA technology company
              </span>
            </span>
          </a>

          <nav className="hidden items-center gap-1 lg:flex" aria-label="Primary">
            {NAV_LINKS.map((l) => (
              <a
                key={l.href}
                href={l.href}
                className="group relative rounded-full px-4 py-2 text-[17px] font-normal text-white/90 transition-colors hover:text-white"
              >
                {l.label}
                <span className="absolute inset-x-4 -bottom-px h-px origin-left scale-x-0 bg-gradient-to-r from-orange-500 to-orange-200 transition-transform duration-300 group-hover:scale-x-100" />
              </a>
            ))}
          </nav>

          <div className="flex items-center gap-2">
            <span className="hidden items-center gap-2 rounded-full border border-emerald-400/70 bg-transparent px-4 py-2 text-sm font-semibold text-emerald-300 md:inline-flex">
              <AudioLines className="h-4 w-4" />
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-60" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-400" />
              </span>
              <span>{liveCount}/{total} live</span>
            </span>
            <a
              href="/working-mode"
              title="For Your Destination"
              aria-describedby="working-mode-tip"
              className="group relative hidden items-center gap-1.5 rounded-xl bg-[#f2155f] px-5 py-2.5 text-[15px] font-semibold text-white transition-all duration-300 hover:bg-[#ff2a6d] sm:inline-flex"
            >
              Working Mode
              <ArrowUpRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
              <span
                id="working-mode-tip"
                role="tooltip"
                className="pointer-events-none absolute right-0 top-full mt-2 whitespace-nowrap rounded-lg border border-[#f2155f]/60 bg-black px-3 py-1 text-xs font-normal text-white/90 opacity-0 transition-opacity duration-200 group-hover:opacity-100 group-focus-visible:opacity-100"
              >
                For Your Destination
              </span>
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
            href="/working-mode"
            title="For Your Destination"
            className="mt-2 flex flex-col items-center justify-center rounded-xl bg-[#f2155f] px-4 py-3 text-sm font-bold text-white"
          >
            <span className="flex items-center gap-2">
              Working Mode <ArrowUpRight className="h-4 w-4" />
            </span>
            <span className="text-[11px] font-normal text-white/85">For Your Destination</span>
          </a>
        </nav>
      </div>
    </header>
  );
}
