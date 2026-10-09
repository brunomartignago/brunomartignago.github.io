/* AI Orchestration concept figures: From searching to being served, the engagement loop,
   data density and the amorphous profile. Each plays once in view, then the reader drives it;
   nothing runs offscreen; reduced motion shows the final state with controls working.
   Markup lives in pages/aiorc.html; styles in css/figures.css. Load with defer after js/figures/core.js. */
(() => {
  if (!window.Figures) return;
  const { reduced, svg, lerp, onceInView, watchVisible, stepper, live } = window.Figures;

  /* ================= A1 · From searching to being served ================= */
  (() => {
    const fig = document.getElementById("cf-search");
    if (!fig) return;
    const frame = fig.querySelector(".cf-s");
    const buttons = [...fig.querySelectorAll("[data-phase]")];
    const side = {
      small: fig.querySelector("[data-s-when]"),
      title: fig.querySelector("[data-s-title]"),
      text: fig.querySelector("[data-s-text]"),
      tags: fig.querySelector("[data-s-tags]"),
      fill: fig.querySelector("[data-s-effort]"),
      count: fig.querySelector(".cf-s-count"),
    };

    // Titles, descriptions and tags are from ui_phases.png; the effort values are illustrative
    const PHASES = [
      { when: "Past", title: "Keyword Search", text: "Requires the user to be able to know how to find relevant information.", tags: ["Keywords & Tags", "SEO"], effort: .92, count: "1,000,000 results" },
      { when: "Present", title: "Filtering through Conversation", text: "Helps the user find the information quicker by conversation filtering.", tags: ["Scripted Bots", "Automated Routing"], effort: .5, count: "" },
      { when: "Future", title: "Autonomous Delivery", text: "Nothing to type: options arrive, ranked good, better and best.", tags: ["Good", "Better", "Best"], effort: .08, count: "delivered for you" },
    ];

    function set(i) {
      const P = PHASES[i];
      frame.classList.remove("ph-0", "ph-1", "ph-2");
      frame.classList.add("ph-" + i);
      side.small.textContent = P.when;
      side.title.textContent = P.title;
      side.text.textContent = P.text;
      side.tags.replaceChildren(...P.tags.map(t => Object.assign(document.createElement("span"), { textContent: t })));
      side.fill.style.setProperty("--w", P.effort);
      side.count.textContent = P.count;
      buttons.forEach(b => b.setAttribute("aria-pressed", String(+b.dataset.phase === i)));
    }

    const timeline = stepper(fig, 3, 2200, set);
    buttons.forEach(b => b.addEventListener("click", () => { timeline.stop(); set(+b.dataset.phase); }));
    live(fig);

    if (reduced()) { set(2); return; }
    set(0);
    onceInView(fig, () => timeline.play(0));
  })();

  /* ================= A2 · The engagement loop ================= */
  (() => {
    const fig = document.getElementById("cf-loop");
    if (!fig) return;
    const token = fig.querySelector("[data-l-token]");
    const rings = fig.querySelector("[data-l-rings]");
    const edges = [...fig.querySelectorAll("[data-l-edge]")];
    const lapOut = fig.querySelector("[data-l-lap]");
    const runBtn = fig.querySelector("[data-l-run]");
    const resetBtn = fig.querySelector("[data-l-reset]");

    // Experience → Collection → Training → back (Interaction, Transformation, Workflow)
    const V = [[50, 12], [88, 78], [12, 78]];
    const LAP_MS = 3000, MAX_RINGS = 5;
    let lap = 0, raf = 0;

    const place = (x, y) => { token.setAttribute("cx", x.toFixed(2)); token.setAttribute("cy", y.toFixed(2)); };
    const light = (i, t) => edges[i].style.strokeDashoffset = (1 - t).toFixed(3);
    function addRing() {
      if (rings.childElementCount >= MAX_RINGS) return;
      rings.append(svg("circle", { class: "cf-l-ring", cx: 50, cy: 54, r: (13.5 + rings.childElementCount * 3.4).toFixed(1) }));
    }
    function finishLap() {
      lap++;
      addRing();
      lapOut.textContent = String(lap);
      runBtn.disabled = false;
    }

    function run() {
      cancelAnimationFrame(raf);
      runBtn.disabled = true;
      edges.forEach((_, i) => light(i, 0));
      if (reduced()) { edges.forEach((_, i) => light(i, 1)); place(...V[0]); finishLap(); return; }
      const t0 = performance.now();
      const frame = now => {
        const p = Math.min(1, (now - t0) / LAP_MS);
        const seg = Math.min(2, Math.floor(p * 3)), t = p * 3 - seg;
        const a = V[seg], b = V[(seg + 1) % 3];
        place(lerp(a[0], b[0], seg === 2 && p === 1 ? 1 : t), lerp(a[1], b[1], seg === 2 && p === 1 ? 1 : t));
        edges.forEach((_, i) => light(i, i < seg ? 1 : i === seg ? t : 0));
        if (p < 1) raf = requestAnimationFrame(frame);
        else finishLap();
      };
      raf = requestAnimationFrame(frame);
    }

    function reset() {
      cancelAnimationFrame(raf);
      rings.replaceChildren();
      lap = 0;
      lapOut.textContent = "0";
      edges.forEach((_, i) => light(i, 0));
      place(...V[0]);
      runBtn.disabled = false;
    }

    runBtn.addEventListener("click", run);
    resetBtn.addEventListener("click", reset);
    live(fig);
    reset();

    if (reduced()) {
      for (let i = 0; i < 3; i++) addRing();
      lap = 3;
      lapOut.textContent = "3";
      edges.forEach((_, i) => light(i, 1));
      return;
    }
    onceInView(fig, run);
  })();

  /* ================= A3 · Data density ================= */
  (() => {
    const fig = document.getElementById("cf-density");
    if (!fig) return;
    const sources = [...fig.querySelectorAll("[data-src]")];
    const lines = [...fig.querySelectorAll(".cf-dd-pipes line")];
    const sharp = fig.querySelector(".cf-dd-orb.sharp");
    const fill = fig.querySelector("[data-dd-meter]");
    const count = fig.querySelector("[data-dd-count]");

    function update() {
      const on = sources.map(s => s.getAttribute("aria-pressed") === "true");
      const n = on.filter(Boolean).length;
      lines.forEach((l, i) => l.classList.toggle("on", on[i]));
      sharp.style.setProperty("--sharp", (n / 4).toFixed(2));
      // Illustrative: each added source more than doubles the meter (2^n - 1 of 15)
      fill.style.setProperty("--w", ((2 ** n - 1) / 15).toFixed(3));
      count.textContent = `${n} of 4 sources`;
    }
    const press = (i, v) => { sources[i].setAttribute("aria-pressed", String(v)); update(); };

    const timeline = stepper(fig, 5, 750, i => press(i - 1, true));
    sources.forEach((s, i) => s.addEventListener("click", () => {
      timeline.stop();
      press(i, s.getAttribute("aria-pressed") !== "true");
    }));
    live(fig);

    if (reduced()) { sources.forEach((_, i) => press(i, true)); return; }
    update();
    onceInView(fig, () => { press(0, true); timeline.play(1); });
  })();

  /* ================= A4 · The amorphous profile ================= */
  (() => {
    const fig = document.getElementById("cf-profile");
    if (!fig) return;
    const shape = fig.querySelector("[data-p-shape]");
    const input = fig.querySelector("[data-p-time]");
    const signals = fig.querySelector("[data-p-signals]");
    const preset = [...fig.querySelectorAll(".cf-p-preset i")];

    // Axes from parts.png; the shapes, times and signals are illustrative
    const AXES = ["Attributes", "Density", "History", "Pattern", "Dimensionality"];
    const KEYS = [
      { at: 0, r: [.62, .7, .42, .55, .62] },
      { at: .5, r: [.86, .84, .36, .78, .46] },
      { at: 1, r: [.58, .62, .92, .82, .86] },
    ];
    const SIGNALS = [
      { from: 0, to: .33, list: ["location · home", "time · morning"] },
      { from: .33, to: .8, list: ["location · office", "time · meetings"] },
      { from: .8, to: 1.01, list: ["location · home", "purchase · monitor"] },
    ];
    const START = 8 * 60 + 30, END = 20 * 60 + 32; // minutes

    const radiiAt = t => {
      const k = t <= .5 ? 0 : 1, a = KEYS[k], b = KEYS[k + 1];
      const f = (t - a.at) / (b.at - a.at);
      return a.r.map((r, i) => lerp(r, b.r[i], f));
    };
    const point = (i, r) => {
      const ang = (-90 + i * 72) * Math.PI / 180;
      return [50 + Math.cos(ang) * 40 * r, 50 + Math.sin(ang) * 40 * r];
    };
    let lastSignals = -1;

    function render(t) {
      const radii = radiiAt(t);
      shape.setAttribute("points", radii.map((r, i) => point(i, r).map(v => v.toFixed(2)).join(",")).join(" "));
      preset.forEach((bar, i) => bar.style.setProperty("--h", (i < 5 ? radii[i] : radii.reduce((a, b) => a + b) / 5).toFixed(2)));
      const minutes = Math.round(START + (END - START) * t);
      const clock = `${String(Math.floor(minutes / 60)).padStart(2, "0")}:${String(minutes % 60).padStart(2, "0")}`;
      input.setAttribute("aria-valuetext", clock);
      const s = SIGNALS.findIndex(x => t >= x.from && t < x.to);
      if (s !== lastSignals) {
        lastSignals = s;
        signals.replaceChildren(...SIGNALS[s].list.map(x => Object.assign(document.createElement("span"), { textContent: x })));
      }
    }

    // Static grid and labels
    const grid = fig.querySelector("[data-p-grid]");
    [1, .5].forEach(r => grid.append(svg("polygon", { points: AXES.map((_, i) => point(i, r).join(",")).join(" "), fill: "none", stroke: "#4A5466", "stroke-width": ".5" })));
    AXES.forEach((name, i) => {
      const [x, y] = point(i, 1);
      grid.append(svg("line", { x1: 50, y1: 50, x2: x, y2: y, stroke: "#4A5466", "stroke-width": ".4" }));
      const [lx, ly] = point(i, 1.2);
      const label = svg("text", { x: lx.toFixed(1), y: (ly + 1.5).toFixed(1), "text-anchor": i === 0 ? "middle" : i < 3 ? "start" : "end" });
      label.textContent = name.toUpperCase();
      if (i === 2 || i === 3) label.setAttribute("text-anchor", i === 2 ? "start" : "end");
      grid.append(label);
    });

    let raf = 0, playing = false, visible = false, t = 0;
    input.addEventListener("input", () => { playing = false; cancelAnimationFrame(raf); t = input.value / 100; render(t); });

    function play() {
      if (!playing || !visible) return;
      let last = performance.now();
      const frame = now => {
        if (!playing || !visible) return;
        t = Math.min(1, t + (now - last) / 4500);
        last = now;
        input.value = Math.round(t * 100);
        render(t);
        if (t < 1) raf = requestAnimationFrame(frame);
        else playing = false;
      };
      raf = requestAnimationFrame(frame);
    }

    live(fig);
    if (reduced()) { input.value = 100; render(1); return; }
    input.value = 0;
    render(0);
    watchVisible(fig, v => { visible = v; if (v) play(); else cancelAnimationFrame(raf); }, 0.3);
    onceInView(fig, () => { playing = true; play(); });
  })();
})();
