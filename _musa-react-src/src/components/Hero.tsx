import {
  ArrowDown,
  ArrowUpRight,
  ShieldCheck,
  Lock,
  Settings,
  ScanSearch,
  Cpu,
  LayoutGrid,
  Users,
  ChartColumnIncreasing,
  Globe,
  Megaphone,
  Database,
} from "lucide-react";
import ProtectedEmblem from "./ProtectedEmblem";
import type { LucideIcon } from "lucide-react";
import type { LiveState } from "../hooks/useLiveStatus";
import { PLATFORMS } from "../data/platforms";

function HeroVisual() {
  return (
    <div className="relative mx-auto w-full max-w-[480px]" aria-label="Saif Tech Global LLC — official emblem">
      <div className="relative overflow-hidden rounded-2xl border border-white/25 bg-black">
        {/* Title bar */}
        <div className="flex items-center justify-center px-4 pb-1 pt-3">
          <span className="rounded-lg bg-white/[0.06] px-4 py-1.5 text-[13px] tracking-wide text-white/90">
            SAIF TECH GLOBAL LLC™
          </span>
        </div>

        {/* Emblem stage */}
        <div className="px-5 pb-6 pt-4">
          <div className="relative mx-auto grid aspect-[4/3] w-full place-items-center rounded-xl border border-white/[0.06] bg-black">
            <ProtectedEmblem
              eager
              imgClassName="h-[min(16rem,58vw)] w-auto object-contain drop-shadow-[0_10px_40px_rgba(212,160,40,0.25)]"
            />
            {/* chips */}
            <div className="absolute -right-2 top-[18%] rounded-full border border-white/25 bg-black/80 px-3 py-1.5 text-[12px] text-white backdrop-blur">
              <span className="flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-full bg-emerald-400" /> {PLATFORMS.length}/{PLATFORMS.length} platforms
              </span>
            </div>
            <div className="absolute bottom-3 left-3 rounded-full border border-[#f2155f]/70 bg-black/80 px-3 py-1.5 text-[12px] text-white backdrop-blur">
              <span className="flex items-center gap-1.5">
                <Database className="h-3.5 w-3.5 text-[#f2155f]" /> Zero-Data Trace
              </span>
            </div>
          </div>

          {/* platform shortcuts */}
          <div className="mx-auto mt-5 flex max-w-[400px] items-center justify-between">
            {PLATFORMS.map((p) => (
              <a
                key={p.id}
                href={`#product-${p.id}`}
                className="group flex flex-col items-center gap-2"
                aria-label={`Jump to ${p.name}`}
                title={p.name}
              >
                <span className="grid h-11 w-11 place-items-center rounded-full border border-white/25 bg-black text-[15px] text-white transition-all duration-300 group-hover:border-[#f2155f] group-hover:text-[#ff4a83]">
                  {p.tag.slice(0, 2)}
                </span>
                <span className="h-2 w-2 rounded-full bg-[#f2155f]" />
              </a>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

const SECONDARY_LINKS: { label: string; href: string; icon: LucideIcon; external?: boolean }[] = [
  { label: "SG16 Children World", href: "https://sg16children.com", icon: Users, external: true },
  { label: "SG16 Finance", href: "https://sg16finance.com", icon: ChartColumnIncreasing, external: true },
  { label: "Geo Monitor", href: "https://saifglobal16.info", icon: Globe, external: true },
  { label: "SG16 Ads Network", href: "https://ads.saiftechglobal.com", icon: Megaphone, external: true },
  { label: "SG16 Identifier", href: "https://sg16identifier.com", icon: ScanSearch, external: true },
  { label: "All products", href: "#products", icon: LayoutGrid },
];

const pill =
  "inline-flex items-center gap-2 rounded-full border border-white/20 bg-black px-3.5 py-1.5 text-[13px] text-white/85";

export default function Hero({ live }: { live: LiveState }) {
  return (
    <section id="top" className="relative z-10 overflow-hidden pt-32 sm:pt-36 lg:pt-36" aria-label="Introduction">
      {/* Seamless slow-motion light loop behind the hero — drawn by /js/ambient-loop.js */}
      <div className="hero-loop pointer-events-none absolute inset-0" aria-hidden="true">
        <canvas id="ambient-loop" width={192} height={108} />
      </div>
      <div className="relative mx-auto max-w-[1180px] px-4 sm:px-6">
        <div className="hero-layout grid items-center gap-12 lg:grid-cols-[1.4fr_1fr] lg:gap-8">
          {/* Copy */}
          <div className="reveal is-visible text-center lg:text-left">
            <div className="inline-flex flex-wrap items-center justify-center gap-2 lg:justify-start">
              <span className="inline-flex items-center gap-2 rounded-full border border-[#f2155f]/80 bg-black px-4 py-1.5 text-[13px] font-normal italic tracking-wide text-white">
                <Settings className="h-4 w-4 text-[#f2155f]" />
                SAIF TECH GLOBAL LLC · ALBUQUERQUE, USA
              </span>
            </div>

            <h1 className="mt-6 font-display text-[2.7rem] font-normal italic leading-[1.06] tracking-[-0.01em] text-white sm:text-[3.5rem] lg:text-[4rem]">
              Building global <span className="text-[#f2155f]">intelligence</span> for the world
              <span className="text-[#f2155f]">.</span>
            </h1>
            <div
              className="mx-auto mt-5 h-[3px] w-24 rounded-full bg-[#f2155f] lg:mx-0"
              aria-hidden="true"
            />

            <p className="mx-auto mt-5 max-w-xl text-[17px] leading-relaxed text-white/90 sm:text-[19px] lg:mx-0">
              Saif Tech Global LLC develops AI platforms, financial intelligence, and live geopolitical monitoring —
              designed for users worldwide from our USA headquarters.
            </p>

            {/* Actions — all original buttons preserved */}
            <div className="mt-7 flex flex-wrap items-center justify-center gap-2.5 lg:justify-start">
              <a
                href="https://sg16engine.com"
                target="_blank"
                rel="noopener noreferrer"
                className="group inline-flex items-center gap-2 rounded-xl bg-[#f2155f] px-4 py-2.5 text-[15px] font-medium text-white transition-all duration-300 hover:-translate-y-0.5 hover:bg-[#ff2a6d]"
              >
                <Cpu className="h-4 w-4" />
                SG16 AI Engine
                <ArrowUpRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
              </a>
              {SECONDARY_LINKS.map(({ label, href, icon: Icon, external }) => (
                <a
                  key={label}
                  href={href}
                  {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
                  className="inline-flex items-center gap-2 rounded-xl border border-white/20 bg-black px-4 py-2.5 text-[15px] text-white transition hover:-translate-y-0.5 hover:border-[#f2155f]/70"
                >
                  <Icon className="h-4 w-4 text-[#f2155f]" />
                  {label}
                </a>
              ))}
            </div>

            {/* Trust row — original pills preserved */}
            <div className="mt-4 flex flex-wrap items-center justify-center gap-2 lg:justify-start" role="status" aria-live="polite">
              <span className={pill}>
                <span className={`h-2.5 w-2.5 rounded-full ${live.brainLive ? "bg-emerald-400 animate-pulse-dot" : "bg-amber-400"}`} />
                {live.brainLive === null ? "SG16 Brain · checking…" : live.brainLive ? "SG16 Brain · Live 24/7" : "Brain · check later"}
              </span>
              <span className={pill}>
                <span className={`h-2.5 w-2.5 rounded-full ${live.liveCount === live.total ? "bg-emerald-400" : "bg-amber-400"}`} />
                <span>{live.liveCount}/{live.total} platforms live</span>
              </span>
              <span className={pill}>
                <Lock className="h-3.5 w-3.5 text-[#f2155f]" />
                USA registered company
              </span>
              <span className={pill}>
                <ShieldCheck className="h-3.5 w-3.5 text-sky-400" />
                Privacy-first products
              </span>
            </div>
          </div>

          {/* Visual */}
          <div className="reveal is-visible" style={{ ["--reveal-delay" as string]: "150ms" }}>
            <HeroVisual />
          </div>
        </div>

        {/* Scroll cue */}
        <div className="mt-12 flex items-center justify-center gap-6 pb-4">
          <span className="h-px w-24 bg-gradient-to-r from-transparent to-white/30 sm:w-56" aria-hidden="true" />
          <a
            href="#network"
            className="group flex flex-col items-center gap-2 text-[12px] font-medium uppercase tracking-[0.25em] text-white/70 transition hover:text-white"
            aria-label="Scroll to SG16 Network"
          >
            Scroll to explore
            <span className="grid h-10 w-10 place-items-center rounded-full border-2 border-[#f2155f] text-[#f2155f] transition group-hover:bg-[#f2155f] group-hover:text-white">
              <ArrowDown className="h-4 w-4" />
            </span>
          </a>
          <span className="h-px w-24 bg-gradient-to-l from-transparent to-white/30 sm:w-56" aria-hidden="true" />
        </div>
      </div>
    </section>
  );
}
