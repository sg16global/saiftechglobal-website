export default function AmbientBackground() {
  return (
    <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden" aria-hidden="true">
      {/* Base gradient wash */}
      <div className="absolute inset-0 bg-[radial-gradient(1200px_600px_at_50%_-10%,rgba(255,122,24,0.12),transparent_60%),radial-gradient(900px_500px_at_85%_20%,rgba(120,80,255,0.08),transparent_60%),radial-gradient(800px_600px_at_10%_80%,rgba(255,122,24,0.06),transparent_60%),linear-gradient(180deg,#020205_0%,#06070f_50%,#020205_100%)]" />

      {/* Orbs */}
      <div className="absolute -top-40 left-1/2 h-[560px] w-[900px] -translate-x-1/2 rounded-full bg-[radial-gradient(closest-side,rgba(255,122,24,0.22),rgba(255,122,24,0.06),transparent)] blur-3xl animate-orb-drift-1" />
      <div className="absolute top-[30%] -left-40 h-[520px] w-[520px] rounded-full bg-[radial-gradient(closest-side,rgba(99,102,241,0.16),transparent)] blur-3xl animate-orb-drift-2" />
      <div className="absolute top-[55%] -right-40 h-[620px] w-[620px] rounded-full bg-[radial-gradient(closest-side,rgba(255,165,59,0.12),transparent)] blur-3xl animate-orb-drift-3" />
      <div className="absolute bottom-[-200px] left-[20%] h-[500px] w-[700px] rounded-full bg-[radial-gradient(closest-side,rgba(255,122,24,0.08),transparent)] blur-3xl animate-orb-drift-1" />

      {/* Grid */}
      <div
        className="absolute inset-0 opacity-[0.13]"
        style={{
          backgroundImage:
            "linear-gradient(rgba(255,255,255,.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.5) 1px, transparent 1px)",
          backgroundSize: "72px 72px",
          maskImage: "radial-gradient(ellipse 90% 60% at 50% 0%, black 30%, transparent 75%)",
          WebkitMaskImage: "radial-gradient(ellipse 90% 60% at 50% 0%, black 30%, transparent 75%)",
        }}
      />

      {/* Stars */}
      <div className="absolute inset-0">
        {Array.from({ length: 46 }).map((_, i) => {
          const left = (i * 37.7 + 11) % 100;
          const top = (i * 53.3 + 7) % 70;
          const size = i % 5 === 0 ? 2.5 : i % 3 === 0 ? 2 : 1.2;
          const delay = (i % 12) * 0.35;
          return (
            <span
              key={i}
              className="absolute rounded-full bg-white animate-twinkle"
              style={{
                left: `${left}%`,
                top: `${top}%`,
                width: size,
                height: size,
                opacity: 0.5,
                animationDelay: `${delay}s`,
                boxShadow: i % 7 === 0 ? "0 0 8px 1px rgba(255,165,59,.7)" : "none",
              }}
            />
          );
        })}
      </div>

      {/* Vignette */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_120%_90%_at_50%_50%,transparent_55%,rgba(2,2,5,.75)_100%)]" />

      {/* Top hairline glow */}
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-orange-500/50 to-transparent" />
    </div>
  );
}
