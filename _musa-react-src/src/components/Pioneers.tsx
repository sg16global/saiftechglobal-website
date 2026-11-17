import { Globe2, Sparkles } from "lucide-react";
import { FLAGS } from "./Flags";

/** Educational gallery — historical profiles, not AI models, not connected to any Saif Tech system. */
const PIONEERS = [
  {
    id: "hinton",
    name: "Geoffrey Hinton",
    role: "Deep Learning Pioneer",
    bio: "Geoffrey Hinton, British-Canadian computer scientist. He helped popularize backpropagation in 1986 and led the deep-learning revolution, winning the Turing Award in 2018 and the Nobel Prize in Physics in 2024.",
  },
  {
    id: "samuel",
    name: "Arthur Samuel",
    role: "Machine Learning Pioneer",
    bio: "Arthur Samuel, American computer scientist. His checkers-playing program learned from experience, and in 1959 he popularized the term machine learning.",
  },
  {
    id: "shannon",
    name: "Claude Shannon",
    role: "Information Theory Pioneer",
    bio: "Claude Shannon, American mathematician and engineer, the father of information theory. His 1948 paper defined how information is measured and sent, and he co-organized the 1956 Dartmouth workshop on AI.",
  },
  {
    id: "wiener",
    name: "Norbert Wiener",
    role: "Cybernetics Pioneer",
    bio: "Norbert Wiener, American mathematician who founded cybernetics in 1948 — the study of control and communication in animals and machines.",
  },
  {
    id: "simon",
    name: "Herbert A. Simon",
    role: "AI & Cognitive Science Pioneer",
    bio: "Herbert A. Simon, American scientist. With Allen Newell he built the Logic Theorist, one of the first AI programs. He won the Turing Award in 1975 and the Nobel Prize in Economics in 1978.",
  },
  {
    id: "turing",
    name: "Alan Turing",
    role: "Computing & AI Pioneer",
    bio: "Alan Turing, British mathematician. He described the universal computing machine in 1936 and, in 1950, proposed the imitation game — now known as the Turing Test.",
  },
  {
    id: "mccarthy",
    name: "John McCarthy",
    role: "Artificial Intelligence Pioneer",
    bio: "John McCarthy, American computer scientist who coined the term artificial intelligence for the 1956 Dartmouth workshop and created the Lisp programming language.",
  },
  {
    id: "minsky",
    name: "Marvin Minsky",
    role: "AI Pioneer · MIT AI Lab",
    bio: "Marvin Minsky, American cognitive scientist. He co-founded the MIT artificial intelligence laboratory and built SNARC, an early neural-network machine, in 1951.",
  },
  {
    id: "rosenblatt",
    name: "Frank Rosenblatt",
    role: "Neural Network Pioneer",
    bio: "Frank Rosenblatt, American psychologist who introduced the perceptron in 1958 — one of the first artificial neural networks that could learn.",
  },
  {
    id: "widrow",
    name: "Bernard Widrow",
    role: "Adaptive Neural Network Pioneer",
    bio: "Bernard Widrow, American engineer. With Ted Hoff he created the ADALINE neural network and the least-mean-squares learning rule in 1960.",
  },
];

export default function Pioneers() {
  return (
    <section id="pioneers" className="relative z-10 scroll-mt-24 py-8 sm:py-12" aria-label="Global presence and AI pioneers">
      <div className="mx-auto max-w-7xl space-y-4 px-4 sm:px-6 lg:px-8">
        {/* ---------- Global presence ---------- */}
        <div
          className="holo-panel reveal mx-auto max-w-[960px] rounded-[22px] px-4 py-6 text-center sm:px-8"
          data-voice="Global Presence. Six nations — the United States, the United Kingdom, France, Russia, China and Germany. Different nations, a common goal, a brighter future for humanity."
        >
          <span className="inline-flex items-center gap-2 rounded-full border border-[#f2155f]/60 bg-black px-3 py-1 text-[10px] font-bold uppercase tracking-[0.2em] text-orange-200">
            <Globe2 className="h-3.5 w-3.5" /> Global presence
          </span>
          <h2 className="mt-3 font-display text-2xl tracking-tight text-white sm:text-3xl">Global Presence</h2>
          <p className="mt-1 text-[11px] uppercase tracking-[0.22em] text-white/60">United minds — for a better tomorrow</p>

          <ul className="mx-auto mt-5 grid max-w-3xl grid-cols-3 items-end justify-items-center gap-x-3 gap-y-4 lg:grid-cols-6" aria-label="Six nations">
            {FLAGS.map(({ id, name, ratio, Flag }, i) => (
              <li key={id} className="flex flex-col items-center gap-2" data-voice={`The flag of ${name}.`}>
                <span className="holo-frame" style={{ ["--holo-delay" as string]: `${-i * 0.9}s` }}>
                  <span className="holo-inner block h-9 sm:h-11" style={{ aspectRatio: String(ratio) }}>
                    <Flag />
                  </span>
                </span>
                <span className="text-[9.5px] uppercase tracking-[0.14em] text-white/55 sm:text-[10px]">{name}</span>
              </li>
            ))}
          </ul>

          <p className="mx-auto mt-5 max-w-3xl font-display text-[15px] text-white sm:text-lg">
            Different Nations <span className="text-[#f2155f]">—</span> A Common Goal <span className="text-[#f2155f]">—</span> A Brighter Future for
            Humanity
          </p>
        </div>

        {/* ---------- AI pioneers ---------- */}
        <div
          className="holo-panel reveal rounded-[22px] px-4 py-5 sm:px-8 lg:py-6"
          style={{ ["--reveal-delay" as string]: "120ms" }}
          data-voice="AI Pioneers. Ten historical figures whose ideas made artificial intelligence possible. These are historical profiles — not AI models, and not connected to this system."
        >
          <div className="text-center">
            <span className="inline-flex items-center gap-2 rounded-full border border-[#f2155f]/60 bg-black px-3 py-1 text-[10px] font-bold uppercase tracking-[0.2em] text-orange-200">
              <Sparkles className="h-3.5 w-3.5" /> Intellectual heritage
            </span>
            <h2 className="mt-3 font-display text-2xl tracking-tight text-white sm:text-3xl">AI Pioneers</h2>
          </div>

          <ul className="mt-5 flex flex-wrap justify-center gap-x-3 gap-y-5 sm:gap-x-4 lg:flex-nowrap lg:justify-between lg:gap-x-2">
            {PIONEERS.map((p, i) => (
              <li key={p.id} className="flex w-[30%] flex-col items-center text-center sm:w-[18%] lg:w-[9.5%]" data-voice={p.bio}>
                <span className="holo-frame w-full max-w-[104px]" style={{ ["--holo-delay" as string]: `${-i * 0.6}s` }}>
                  <span className="holo-inner block aspect-[115/118]">
                    <img
                      src={`/assets/pioneers/${p.id}.webp`}
                      alt={`${p.name} — ${p.role} (historical portrait)`}
                      width={230}
                      height={236}
                      loading="lazy"
                      decoding="async"
                      draggable={false}
                      className="h-full w-full object-cover grayscale"
                    />
                  </span>
                </span>
                <span className="mt-2 text-[10px] uppercase tracking-[0.1em] text-white sm:text-[11px]">{p.name}</span>
                <span className="mt-0.5 text-[10px] leading-snug text-white/55 sm:text-[11px]">{p.role}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="reveal text-center" style={{ ["--reveal-delay" as string]: "200ms" }}>
          <p className="font-display text-lg text-white sm:text-xl">
            Great Minds <span className="text-[#f2155f]">—</span> Timeless Impact
          </p>
          <p className="mt-1 text-[10px] uppercase tracking-[0.18em] text-white/50 sm:text-[11px]">
            Historical profiles · Not AI models · Not connected to this system
          </p>
        </div>
      </div>
    </section>
  );
}
