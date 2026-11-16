/** Pure black page background with faint stars (the slow-motion loop lives in the hero). */
export default function AmbientBackground() {
  return (
    <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden bg-black" aria-hidden="true">
      {/* Stars */}
      <div className="absolute inset-0">
        {Array.from({ length: 46 }).map((_, i) => {
          const left = (i * 37.7 + 11) % 100;
          const top = (i * 53.3 + 7) % 70;
          const size = i % 5 === 0 ? 2 : i % 3 === 0 ? 1.6 : 1.1;
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
                opacity: 0.35,
                animationDelay: `${delay}s`,
              }}
            />
          );
        })}
      </div>
    </div>
  );
}
