/* Featured project 2 visual: "Attention map".
   An eye-tracking style session over a page wireframe: numbered fixations follow a reading path
   while a heatmap builds underneath. Plays once when the project scrolls into view; on desktop,
   hovering makes the visitor's cursor the gaze. Replaces the <img data-gaze> it is given, so the
   original image stays if this script never runs. Needs js/motion.js (window.Motion). */
(() => {
  /* ---------- Data ---------- */

  // Reading paths: [x %, y %, fixation duration ms]
  const PATHS = [
    { name: "F-pattern", pts: [[12,21,300],[34,21,220],[56,21,180],[12,31,260],[30,31,200],[12,47,320],[24,54,180],[12,62,240],[22,70,200],[76,30,360],[72,82,260],[42,84,220]] },
    { name: "Z-pattern", pts: [[10,9,220],[48,9,180],[88,9,260],[66,30,240],[40,46,300],[18,62,260],[14,82,240],[46,84,200],[80,82,320],[78,62,220]] },
  ];
  const PLAY = 0; // which path plays on view

  // Static page wireframe: [x, y, w, h] in % of the body, plus fill
  const WIREFRAME = [
    [4, 4, 92, 7, "#ECE6E1"], [8, 18, 50, 6, "#C9C1BA"], [8, 28, 38, 6, "#C9C1BA"], [64, 18, 32, 28, "#ECE6E1"],
    [8, 44, 48, 3, "#DDD6D0"], [8, 50, 44, 3, "#DDD6D0"], [8, 56, 46, 3, "#DDD6D0"], [8, 62, 30, 3, "#DDD6D0"],
    [8, 69, 18, 7, "#BFE6FF"], [4, 80, 29, 14, "#ECE6E1"], [35.5, 80, 29, 14, "#ECE6E1"], [67, 80, 29, 14, "#ECE6E1"],
  ];

  // Heat color ramp: [position 0..1, [r, g, b, alpha 0..1]]
  const STOPS = [[0, [33,87,169,0]], [.18, [96,194,255,.45]], [.42, [96,255,162,.6]], [.68, [255,242,96,.72]], [1, [226,74,46,.82]]];

  const GRID_W = 100, GRID_H = 80;   // heat field resolution (matches the 5:4 body)
  const LIVE = { dwell: 320, radius: 3.5, maxFixations: 18, heatPerMs: 0.0018 };
  const RESUME_AFTER = 2200;         // ms after the pointer leaves before the session replays

  /* ---------- Setup ---------- */

  const Motion = window.Motion;
  const img = document.querySelector("img[data-gaze]");
  if (!img || !Motion || !document.createElement("canvas").getContext) return;

  // 256-entry RGBA lookup table for the heat ramp
  const LUT = (() => {
    const t = new Uint8ClampedArray(256 * 4);
    for (let i = 0; i < 256; i++) {
      const v = i / 255;
      let a = STOPS[0], b = STOPS[STOPS.length - 1];
      for (let k = 0; k < STOPS.length - 1; k++) {
        if (v >= STOPS[k][0] && v <= STOPS[k + 1][0]) { a = STOPS[k]; b = STOPS[k + 1]; break; }
      }
      const f = (v - a[0]) / ((b[0] - a[0]) || 1);
      for (let c = 0; c < 4; c++) {
        const val = a[1][c] + (b[1][c] - a[1][c]) * f;
        t[i * 4 + c] = c === 3 ? val * 255 : val;
      }
    }
    return t;
  })();

  const el = (tag, cls, text) => {
    const e = document.createElement(tag);
    if (cls) e.className = cls;
    if (text != null) e.textContent = text;
    return e;
  };
  const pct = (x, y, w, h) => `left:${x}%;top:${y}%;width:${w}%;height:${h}%;`;

  // Window chrome (same as the hero's page-anatomy window)
  const root = el("div", "gaze");
  root.setAttribute("role", "img");
  root.setAttribute("aria-label", "Animated eye-tracking diagram: numbered fixations follow an F-shaped reading path over a page layout while a heatmap of attention builds up");
  const viz = el("div", "viz");
  viz.setAttribute("aria-hidden", "true");
  const bar = el("div", "viz-bar");
  const dots = el("span", "viz-dots");
  ["#FD93E2", "#FFF260", "#60FFA2"].forEach(c => { const d = el("i"); d.style.setProperty("--dot", c); dots.append(d); });
  const chip = el("span", "viz-chip");
  bar.append(dots, el("span", "viz-title", "attention-map · session"), chip);
  const body = el("div", "viz-body");
  const foot = el("div", "viz-foot");
  const footLeft = el("span"), footRight = el("span");
  foot.append(footLeft, footRight);
  viz.append(bar, body, foot);
  root.append(viz);

  WIREFRAME.forEach(([x, y, w, h, bg]) => {
    const b = el("div", "gaze-wire");
    b.style.cssText = pct(x, y, w, h) + `background-color:${bg};`;
    body.append(b);
  });

  const canvas = el("canvas", "gaze-heat");
  canvas.width = GRID_W;
  canvas.height = GRID_H;
  const ctx = canvas.getContext("2d");
  const image = ctx.createImageData(GRID_W, GRID_H);
  const field = new Float32Array(GRID_W * GRID_H);

  const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  svg.setAttribute("class", "gaze-path");
  svg.setAttribute("viewBox", "0 0 100 100");
  svg.setAttribute("preserveAspectRatio", "none");
  const line = document.createElementNS("http://www.w3.org/2000/svg", "polyline");
  line.setAttribute("fill", "none");
  line.setAttribute("stroke", "#0A0A0A");
  line.setAttribute("stroke-width", "1.5");
  line.setAttribute("stroke-dasharray", "4 3");
  line.setAttribute("vector-effect", "non-scaling-stroke");
  svg.append(line);

  const hint = el("div", "gaze-hint", "hover to become the participant");
  body.append(canvas, svg, hint);

  img.replaceWith(root);

  /* ---------- Heat + fixations ---------- */

  let fixes = [], points = [], pending = [], dirty = false;

  function setChip(state, text) {
    chip.dataset.state = state;
    chip.textContent = text || state;
  }

  function addHeat(xp, yp, amount) {
    const cx = xp / 100 * GRID_W, cy = yp / 100 * GRID_H, r = 9;
    for (let y = Math.max(0, Math.floor(cy - r)); y < Math.min(GRID_H, cy + r); y++) {
      for (let x = Math.max(0, Math.floor(cx - r)); x < Math.min(GRID_W, cx + r); x++) {
        const d2 = ((x - cx) ** 2 + (y - cy) ** 2) / (r * r);
        if (d2 < 1) field[y * GRID_W + x] = Math.min(1.4, field[y * GRID_W + x] + amount * Math.exp(-d2 * 3.2));
      }
    }
    dirty = true;
  }

  function paint() {
    for (let i = 0; i < field.length; i++) {
      const v = Math.min(255, (field[i] / 1.1 * 255) | 0);
      image.data.set(LUT.subarray(v * 4, v * 4 + 4), i * 4);
    }
    ctx.putImageData(image, 0, 0);
    dirty = false;
  }

  function updateFoot() {
    if (!fixes.length) { footRight.textContent = "00 fixations"; return; }
    const mean = Math.round(fixes.reduce((sum, f) => sum + f.dur, 0) / fixes.length);
    const noun = fixes.length === 1 ? "fixation" : "fixations";
    footRight.textContent = `${String(fixes.length).padStart(2, "0")} ${noun} · ${mean}ms mean`;
  }

  function addFix(x, y, dur, animate) {
    const size = Math.round(16 + dur / 22);
    const f = el("div", animate ? "gaze-fix enter" : "gaze-fix", String(fixes.length + 1));
    f.style.cssText = `left:${x}%;top:${y}%;width:${size}px;height:${size}px;`;
    body.insertBefore(f, hint);
    fixes.push({ el: f, dur });
    points.push([x, y]);
    line.setAttribute("points", points.map(p => p.join(",")).join(" "));
    if (animate) requestAnimationFrame(() => requestAnimationFrame(() => f.classList.remove("enter")));
    updateFoot();
  }

  function reset() {
    fixes.forEach(f => f.el.remove());
    fixes = []; points = []; pending = [];
    line.setAttribute("points", "");
    field.fill(0);
    dirty = true;
    updateFoot();
  }

  function sessionLabel(i) {
    return `participant ${String(i + 1).padStart(2, "0")} · ${PATHS[i].name}`;
  }

  /* ---------- Reduced motion: the finished session, static ---------- */

  if (Motion.reduced()) {
    PATHS[PLAY].pts.forEach(([x, y, d]) => { addHeat(x, y, d / 260); addFix(x, y, d, false); });
    paint();
    hint.hidden = true;
    setChip("replay");
    footLeft.textContent = sessionLabel(PLAY);
    return;
  }

  /* ---------- Frame loop: runs only while heat is accruing or the visitor is the gaze ---------- */

  let raf = 0, last = 0, live = false, pointer = null, dwellStart = 0, dwellPos = null;

  function frame(now) {
    raf = 0;
    const dt = Math.min(50, now - last);
    last = now;

    // Spread each fixation's heat over its duration
    pending = pending.filter(p => {
      const a = Math.min(p.left, dt / p.dur * p.amount);
      addHeat(p.x, p.y, a);
      p.left -= a;
      return p.left > 0.001;
    });

    if (live && pointer) {
      addHeat(pointer[0], pointer[1], dt * LIVE.heatPerMs);
      const still = dwellPos && Math.hypot(pointer[0] - dwellPos[0], pointer[1] - dwellPos[1]) < LIVE.radius;
      if (still) {
        if (now - dwellStart > LIVE.dwell && !dwellPos.placed) {
          dwellPos.placed = true;
          addFix(pointer[0], pointer[1], Math.round(now - dwellStart), true);
          if (fixes.length > LIVE.maxFixations) {
            fixes.shift().el.remove();
            points.shift();
            fixes.forEach((f, i) => { f.el.textContent = i + 1; });
            line.setAttribute("points", points.map(p => p.join(",")).join(" "));
            updateFoot();
          }
        }
      } else {
        dwellPos = [...pointer];
        dwellStart = now;
      }
    }

    if (dirty) paint();
    if (live || pending.length) raf = requestAnimationFrame(frame);
  }

  function kick() {
    if (raf) return;
    last = performance.now();
    raf = requestAnimationFrame(frame);
  }

  /* ---------- Recorded session: plays once ---------- */

  const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));
  let token = 0;

  async function playOnce() {
    const my = ++token;
    const P = PATHS[PLAY];
    reset();
    setChip("replay");
    footLeft.textContent = sessionLabel(PLAY);
    await sleep(500);
    for (const [x, y, d] of P.pts) {
      if (my !== token) return;
      addFix(x, y, d, true);
      pending.push({ x, y, amount: d / 260, left: d / 260, dur: d * 1.6 });
      kick();
      await sleep(d + 160);
    }
  }

  // Idle state until the project scrolls into view
  setChip("ready");
  footLeft.textContent = sessionLabel(PLAY);
  updateFoot();

  const project = root.closest(".project");
  const startSoon = () => setTimeout(() => { if (!live) playOnce(); }, 500); // after the slide-in settles
  if (!project || project.classList.contains("is-in")) startSoon();
  else project.addEventListener("motion:in", startSoon, { once: true });

  /* ---------- Live mode: the visitor's cursor is the gaze (desktop only) ---------- */

  hint.hidden = !Motion.finePointer();
  let resumeTimer = 0;

  body.addEventListener("pointerenter", () => {
    if (!Motion.finePointer() || Motion.reduced()) return;
    clearTimeout(resumeTimer);
    token++; // cancel the recorded session
    live = true;
    reset();
    setChip("live", "live · you");
    footLeft.textContent = "participant · you";
    hint.style.opacity = 0;
    kick();
  });

  body.addEventListener("pointermove", e => {
    if (!live) return;
    const r = body.getBoundingClientRect();
    pointer = [(e.clientX - r.left) / r.width * 100, (e.clientY - r.top) / r.height * 100];
  });

  body.addEventListener("pointerleave", () => {
    if (!live) return;
    live = false;
    pointer = null;
    dwellPos = null;
    hint.style.opacity = "";
    setChip("paused");
    resumeTimer = setTimeout(playOnce, RESUME_AFTER);
  });
})();
