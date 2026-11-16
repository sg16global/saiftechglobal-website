/**
 * National flags as crisp inline SVG (sharp at any size, no image downloads).
 * Each keeps its official proportions; the grid gives them a shared height.
 */
import type { ReactElement } from "react";

/** Five-pointed star of radius 1 centred on (0,0), point up. */
const STAR =
  "0,-1 0.2245,-0.309 0.9511,-0.309 0.3633,0.118 0.5878,0.809 0,0.382 -0.5878,0.809 -0.3633,0.118 -0.9511,-0.309 -0.2245,-0.309";

function UnitedStates() {
  // 19:10 — 13 stripes, 50 stars in 9 alternating rows of 6 and 5
  const stripeH = 100 / 13;
  const cantonW = 76;
  const cantonH = stripeH * 7;
  const stars: ReactElement[] = [];
  for (let row = 0; row < 9; row++) {
    const n = row % 2 === 0 ? 6 : 5;
    for (let k = 0; k < n; k++) {
      const x = (cantonW / 12) * (row % 2 === 0 ? 1 + 2 * k : 2 + 2 * k);
      const y = (cantonH / 10) * (row + 1);
      stars.push(<polygon key={`${row}-${k}`} points={STAR} transform={`translate(${x} ${y}) scale(3.08)`} fill="#fff" />);
    }
  }
  return (
    <svg viewBox="0 0 190 100" role="img" aria-label="Flag of the United States">
      <rect width="190" height="100" fill="#fff" />
      {Array.from({ length: 7 }).map((_, i) => (
        <rect key={i} y={i * 2 * stripeH} width="190" height={stripeH} fill="#B22234" />
      ))}
      <rect width={cantonW} height={cantonH} fill="#3C3B6E" />
      {stars}
    </svg>
  );
}

function UnitedKingdom() {
  // 2:1 Union Flag
  return (
    <svg viewBox="0 0 60 30" role="img" aria-label="Flag of the United Kingdom">
      <clipPath id="uk-clip-s">
        <path d="M0,0 v30 h60 v-30 z" />
      </clipPath>
      <clipPath id="uk-clip-t">
        <path d="M30,15 h30 v15 z v15 h-30 z h-30 v-15 z v-15 h30 z" />
      </clipPath>
      <g clipPath="url(#uk-clip-s)">
        <path d="M0,0 v30 h60 v-30 z" fill="#012169" />
        <path d="M0,0 L60,30 M60,0 L0,30" stroke="#fff" strokeWidth="6" />
        <path d="M0,0 L60,30 M60,0 L0,30" clipPath="url(#uk-clip-t)" stroke="#C8102E" strokeWidth="4" />
        <path d="M30,0 v30 M0,15 h60" stroke="#fff" strokeWidth="10" />
        <path d="M30,0 v30 M0,15 h60" stroke="#C8102E" strokeWidth="6" />
      </g>
    </svg>
  );
}

function France() {
  return (
    <svg viewBox="0 0 3 2" role="img" aria-label="Flag of France">
      <rect width="1" height="2" fill="#002654" />
      <rect x="1" width="1" height="2" fill="#fff" />
      <rect x="2" width="1" height="2" fill="#CE1126" />
    </svg>
  );
}

function Russia() {
  return (
    <svg viewBox="0 0 9 6" role="img" aria-label="Flag of Russia">
      <rect width="9" height="2" fill="#fff" />
      <rect y="2" width="9" height="2" fill="#0039A6" />
      <rect y="4" width="9" height="2" fill="#D52B1E" />
    </svg>
  );
}

function China() {
  // 3:2 — large star plus four small stars each pointing at the large star's centre
  const small: [number, number, number][] = [
    [10, 2, 23.036243],
    [12, 4, 45.869898],
    [12, 7, 69.945396],
    [10, 9, 20.659808],
  ];
  return (
    <svg viewBox="0 0 30 20" role="img" aria-label="Flag of China">
      <rect width="30" height="20" fill="#EE1C25" />
      <polygon points={STAR} transform="translate(5 5) scale(3)" fill="#FFDE00" />
      {small.map(([x, y, r]) => (
        <polygon key={`${x}-${y}`} points={STAR} transform={`translate(${x} ${y}) rotate(${r})`} fill="#FFDE00" />
      ))}
    </svg>
  );
}

function Germany() {
  return (
    <svg viewBox="0 0 5 3" role="img" aria-label="Flag of Germany">
      <rect width="5" height="1" fill="#000" />
      <rect y="1" width="5" height="1" fill="#DD0000" />
      <rect y="2" width="5" height="1" fill="#FFCE00" />
    </svg>
  );
}

export const FLAGS: { id: string; name: string; ratio: number; Flag: () => ReactElement }[] = [
  { id: "us", name: "United States", ratio: 1.9, Flag: UnitedStates },
  { id: "uk", name: "United Kingdom", ratio: 2, Flag: UnitedKingdom },
  { id: "fr", name: "France", ratio: 1.5, Flag: France },
  { id: "ru", name: "Russia", ratio: 1.5, Flag: Russia },
  { id: "cn", name: "China", ratio: 1.5, Flag: China },
  { id: "de", name: "Germany", ratio: 5 / 3, Flag: Germany },
];
