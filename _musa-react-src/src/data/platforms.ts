/**
 * SAIF TECH GLOBAL — PLATFORM REGISTRY
 * ------------------------------------
 * To add a new project in the future:
 * 1. Duplicate one entry below
 * 2. Change id, name, tagline, description, url, accent + features
 * 3. Save — navbar, network rail, showcase, products, side-panel,
 *    footer and sitemap update automatically. No other code changes needed.
 */

export type PlatformAccent = "orange" | "gold" | "sky" | "rose" | "violet" | "emerald";

export interface Platform {
  id: string;
  index: string;
  tag: string;
  name: string;
  shortName: string;
  tagline: string;
  description: string;
  longDescription: string;
  url: string;
  displayUrl: string;
  accent: PlatformAccent;
  badge: string;
  features: string[];
  stats: { label: string; value: string }[];
  glow: string;
}

export const PLATFORMS: Platform[] = [
  {
    id: "engine",
    index: "01",
    tag: "AI",
    name: "SG16 AI Engine",
    shortName: "AI Engine",
    tagline: "Multi-workspace AI for chat, code, docs & images — sovereign Mistral brain",
    description: "Multi-workspace AI platform for chat, coding, documents, images, and more.",
    longDescription:
      "The flagship sovereign AI workspace. Five dedicated shields, a private cloud brain, and Zero-Data Trace privacy — built for creators, developers, students and teams worldwide.",
    url: "https://sg16engine.com",
    displayUrl: "sg16engine.com",
    accent: "orange",
    badge: "Flagship · Live",
    features: [
      "SG16 Mistral X cloud brain — api.mistralbrain.com, 24/7 sovereign stack",
      "Five shields — Coding Hub, Health, Student, Market, AI Chat",
      "Zero-Data Trace policy — chat processed live, not stored on servers",
      "Google sign-in · Coding Shield + Platform Shield security tools",
    ],
    stats: [
      { label: "Shields", value: "5" },
      { label: "Brain", value: "24/7" },
      { label: "Privacy", value: "Zero-Trace" },
    ],
    glow: "rgba(255,122,24,.35)",
  },
  {
    id: "finance",
    index: "02",
    tag: "Finance",
    name: "SG16 Finance",
    shortName: "Finance",
    tagline: "Global markets, sectors & earnings intelligence",
    description:
      "Institutional-grade market intelligence — global indices, sector research, and plain-English earnings breakdowns.",
    longDescription:
      "Wall-Street clarity for everyone. Live dashboards, world market maps and earnings decoded in plain English — educational intelligence for global investors.",
    url: "https://sg16finance.com",
    displayUrl: "sg16finance.com",
    accent: "gold",
    badge: "Markets · Live",
    features: [
      "Live dashboard with world market map & tickers",
      "Sectors, earnings, and markets in clear language",
      "Built for global investors — educational content",
    ],
    stats: [
      { label: "Coverage", value: "Global" },
      { label: "Language", value: "Plain-English" },
      { label: "Access", value: "Free" },
    ],
    glow: "rgba(255,197,66,.3)",
  },
  {
    id: "children",
    index: "03",
    tag: "Kids",
    name: "SG16 Children World",
    shortName: "Children World",
    tagline: "Parent-gated learning chat with Robo — ages 6–11 & up",
    description: "Parent-gated learning world for kids and families — chat with Robo, the friendly AI helper.",
    longDescription:
      "A safe, joyful learning world where kids chat with Robo — the friendly AI helper — under tiered safety, parent gates and gentle kid-safe rules.",
    url: "https://sg16children.com",
    displayUrl: "sg16children.com",
    accent: "sky",
    badge: "Family · Live",
    features: [
      "Robo assistant for ages 6–11, teens & adults — tiered safety",
      "Parent gate, age tiers & kid-safe chat rules",
      "Homework help, stories, science facts & gentle support",
    ],
    stats: [
      { label: "Helper", value: "Robo" },
      { label: "Ages", value: "6–11 & up" },
      { label: "Safety", value: "Tiered" },
    ],
    glow: "rgba(56,189,248,.3)",
  },
  {
    id: "geo",
    index: "04",
    tag: "Geo",
    name: "SG16 Geopolitical Monitor",
    shortName: "Geo Monitor",
    tagline: "Live world map — tension zones, markets & breaking events",
    description:
      "Live world command map — tension zones, flights, markets, earthquakes, and breaking geopolitical updates in one view.",
    longDescription:
      "A live world command view: tension zones, flights, markets, earthquakes and breaking geopolitical updates — deep-black with red-neon clarity.",
    url: "https://saifglobal16.info",
    displayUrl: "saifglobal16.info",
    accent: "rose",
    badge: "Command · Live",
    features: [
      "Deep black · red neon live map with tension zones",
      "Free on PC, Android & iOS (Add to Home Screen)",
      "Open data feeds — quakes, news, finance, flights",
    ],
    stats: [
      { label: "View", value: "Live Map" },
      { label: "Feeds", value: "Open Data" },
      { label: "Devices", value: "All" },
    ],
    glow: "rgba(244,63,94,.3)",
  },
  {
    id: "ads",
    index: "05",
    tag: "Ads",
    name: "SG16 Ads Network",
    shortName: "Ads Network",
    tagline: "Run your ad in 2 minutes — AI designs, Dodo pay, auto live",
    description:
      "Advertiser platform — pick a package, upload your brand, AI builds your ad, pay with Dodo, go live automatically.",
    longDescription:
      "Advertising in two minutes. Pick a package, upload your brand — AI designs your creative, Dodo checks you out, and your ad goes live automatically.",
    url: "https://ads.saiftechglobal.com",
    displayUrl: "ads.saiftechglobal.com",
    accent: "violet",
    badge: "Growth · Live",
    features: [
      "Packages from $3 — Standard, Premium & Pro",
      "AI ad designs from your website or upload",
      "Secure Dodo checkout · Gmail sign-in · instant activation",
    ],
    stats: [
      { label: "From", value: "$3" },
      { label: "Setup", value: "2 min" },
      { label: "Design", value: "AI-built" },
    ],
    glow: "rgba(167,139,250,.32)",
  },
  // ── ADD NEW PROJECT HERE ──
  // {
  //   id: "new-project",
  //   index: "06",
  //   tag: "New",
  //   name: "SG16 New Project",
  //   shortName: "New",
  //   tagline: "One-line tagline for the network rail",
  //   description: "Short card description",
  //   longDescription: "Longer showcase paragraph",
  //   url: "https://example.com",
  //   displayUrl: "example.com",
  //   accent: "emerald",
  //   badge: "New · Live",
  //   features: ["Feature one", "Feature two", "Feature three"],
  //   stats: [{ label: "Status", value: "Live" }],
  //   glow: "rgba(52,211,153,.3)",
  // },
];

export const ACCENT_STYLES: Record<
  PlatformAccent,
  { text: string; bg: string; border: string; dot: string; gradient: string; softBg: string }
> = {
  orange: {
    text: "text-orange-300",
    bg: "bg-orange-500/15",
    border: "border-orange-400/25",
    dot: "bg-orange-400",
    gradient: "from-orange-500 to-amber-400",
    softBg: "bg-orange-500/[0.07]",
  },
  gold: {
    text: "text-amber-200",
    bg: "bg-amber-400/15",
    border: "border-amber-300/25",
    dot: "bg-amber-300",
    gradient: "from-amber-300 to-yellow-500",
    softBg: "bg-amber-400/[0.07]",
  },
  sky: {
    text: "text-sky-200",
    bg: "bg-sky-400/15",
    border: "border-sky-300/25",
    dot: "bg-sky-300",
    gradient: "from-sky-400 to-cyan-300",
    softBg: "bg-sky-400/[0.07]",
  },
  rose: {
    text: "text-rose-200",
    bg: "bg-rose-500/15",
    border: "border-rose-400/25",
    dot: "bg-rose-400",
    gradient: "from-rose-500 to-red-400",
    softBg: "bg-rose-500/[0.07]",
  },
  violet: {
    text: "text-violet-200",
    bg: "bg-violet-500/15",
    border: "border-violet-400/25",
    dot: "bg-violet-400",
    gradient: "from-violet-500 to-fuchsia-400",
    softBg: "bg-violet-500/[0.07]",
  },
  emerald: {
    text: "text-emerald-200",
    bg: "bg-emerald-500/15",
    border: "border-emerald-400/25",
    dot: "bg-emerald-400",
    gradient: "from-emerald-400 to-teal-300",
    softBg: "bg-emerald-500/[0.07]",
  },
};

export const NAV_LINKS = [
  { label: "Products", href: "#products" },
  { label: "Network", href: "#network" },
  { label: "Sovereign", href: "#sovereign" },
  { label: "About", href: "#about" },
  { label: "Contact", href: "#contact" },
];

export const SHIELDS = [
  { name: "Coding Hub", desc: "Build, debug & ship with an AI pair-programmer.", icon: "code" },
  { name: "Health", desc: "Clear, calm wellness guidance & habits.", icon: "health" },
  { name: "Student", desc: "Homework, exams & deep learning support.", icon: "student" },
  { name: "Market", desc: "Markets, business & money intelligence.", icon: "market" },
  { name: "AI Chat", desc: "Everyday assistant for writing & ideas.", icon: "chat" },
];
