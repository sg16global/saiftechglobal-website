/**
 * Seamless slow-motion loop behind the hero on saiftechglobal.com.
 * Fine gold and white specks drift slowly over PURE BLACK — no colour wash, the background stays #000.
 * Every motion uses whole-number multiples of one 60 s period, so the loop repeats without a jump.
 */
(function () {
  const canvas = document.getElementById("ambient-loop");
  if (!canvas || !canvas.getContext) return;
  const ctx = canvas.getContext("2d");
  const PERIOD = 60000; // ms — one full loop
  const TAU = Math.PI * 2;
  const COUNT = 90;

  // deterministic pseudo-random so the scene is identical on every load
  let seed = 16;
  const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);

  const specks = Array.from({ length: COUNT }, () => {
    const gold = rnd() < 0.45;
    return {
      x: rnd(),
      y: rnd(),
      ax: 0.02 + rnd() * 0.05, // drift amplitude (fraction of width)
      ay: 0.02 + rnd() * 0.06,
      fx: 1 + Math.floor(rnd() * 2), // integer frequencies → seamless loop
      fy: 1 + Math.floor(rnd() * 2),
      ph: rnd() * TAU,
      r: 0.5 + rnd() * 1.3,
      a: 0.25 + rnd() * 0.5,
      tw: 1 + Math.floor(rnd() * 3), // twinkle frequency
      color: gold ? "212,170,70" : "255,255,255",
    };
  });

  let W = 0;
  let H = 0;
  let dpr = 1;
  function resize() {
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    W = canvas.clientWidth;
    H = canvas.clientHeight;
    canvas.width = Math.max(1, Math.round(W * dpr));
    canvas.height = Math.max(1, Math.round(H * dpr));
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  function draw(t) {
    const p = ((t % PERIOD) / PERIOD) * TAU;
    ctx.clearRect(0, 0, W, H); // transparent → the page's pure black shows through
    for (const s of specks) {
      const x = (s.x + s.ax * Math.sin(s.fx * p + s.ph)) * W;
      const y = (s.y + s.ay * Math.cos(s.fy * p + s.ph)) * H;
      const alpha = s.a * (0.55 + 0.45 * Math.sin(s.tw * p + s.ph));
      ctx.beginPath();
      ctx.arc(x, y, s.r, 0, TAU);
      ctx.fillStyle = `rgba(${s.color},${alpha.toFixed(3)})`;
      ctx.fill();
    }
  }

  resize();
  window.addEventListener("resize", resize);

  const reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (reduce) {
    draw(PERIOD * 0.3);
    window.addEventListener("resize", () => draw(PERIOD * 0.3));
    return;
  }

  const start = performance.now();
  let last = 0;
  let running = true;
  function frame(now) {
    if (!running) return;
    if (now - last >= 33) {
      last = now;
      draw(now - start);
    }
    requestAnimationFrame(frame);
  }
  document.addEventListener("visibilitychange", () => {
    running = !document.hidden;
    if (running) requestAnimationFrame(frame);
  });
  requestAnimationFrame(frame);
})();
