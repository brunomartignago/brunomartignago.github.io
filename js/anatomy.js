/* Hero visual: "Page anatomy".
   A page layout is drawn as grey wireframe blocks, scanned top to bottom, and each element
   is classified into a category, on a loop through LAYOUTS.
   Edit CATEGORIES and LAYOUTS to change what it shows. Needs js/motion.js (window.Motion). */
(() => {
  /* ---------- Data ---------- */

  // fill: classified background · dark: shadow, dashed outline and label color
  const CATEGORIES = {
    nav:    { fill: "#60C2FF", dark: "#2157A9", label: "NAV" },
    hero:   { fill: "#FFF260", dark: "#847E30", label: "HERO" },
    media:  { fill: "#FD93E2", dark: "#8B487A", label: "MEDIA" },
    card:   { fill: "#60FFA2", dark: "#318D57", label: "CARD" },
    text:   { fill: "#60E7FF", dark: "#348796", label: "TEXT" },
    cta:    { fill: "#FFB37A", dark: "#9A4F1C", label: "CTA" },
    footer: { fill: "#D9D1CA", dark: "#5B524B", label: "FOOTER" },
  };

  // Each element: [category, x, y, width, height] in % of the window body
  const LAYOUTS = [
    { name: "landing page", els: [
      ["nav", 4, 4, 92, 8], ["hero", 4, 16, 55, 31], ["media", 62, 16, 34, 31],
      ["card", 4, 51, 29, 22], ["card", 35.5, 51, 29, 22], ["card", 67, 51, 29, 22],
      ["text", 4, 77, 58, 8], ["cta", 66, 77, 30, 8], ["footer", 4, 89, 92, 7] ] },
    { name: "product page", els: [
      ["nav", 4, 4, 92, 8], ["media", 4, 16, 46, 50], ["text", 54, 16, 42, 10], ["cta", 54, 30, 22, 8],
      ["text", 54, 42, 42, 24], ["card", 4, 70, 21.5, 15], ["card", 27.5, 70, 21.5, 15], ["card", 51, 70, 21.5, 15], ["card", 74.5, 70, 21.5, 15],
      ["footer", 4, 89, 92, 7] ] },
    { name: "dashboard", els: [
      ["nav", 4, 4, 19, 92], ["hero", 26, 4, 70, 9], ["card", 26, 17, 22, 17], ["card", 50, 17, 22, 17], ["card", 74, 17, 22, 17],
      ["media", 26, 38, 70, 31], ["text", 26, 73, 46, 23], ["cta", 75, 73, 21, 9], ["footer", 75, 86, 21, 10] ] },
  ];

  // ms
  const TIMING = {
    enterStagger: 60, settle: 900, scan: 1700, beforeClassify: 250,
    classifyStagger: 70, hold: 2600, exitStagger: 35, exit: 650,
  };

  /* ---------- DOM ---------- */

  const root = document.getElementById("anatomy");
  const Motion = window.Motion;
  if (!root || !Motion) return;

  const body = root.querySelector(".viz-body");
  const scan = root.querySelector(".anatomy-scan");
  const chip = root.querySelector(".viz-chip");
  const [footLeft, footRight] = root.querySelectorAll(".viz-foot span");

  function setChip(state) {
    chip.dataset.state = state;
    chip.textContent = state;
  }

  function summary(layout) {
    const classes = new Set(layout.els.map(e => e[0])).size;
    return `${layout.els.length} elements · ${classes} classes`;
  }

  function sampleLabel(i) {
    return `sample ${String(i + 1).padStart(2, "0")} · ${LAYOUTS[i].name}`;
  }

  function build(layout, entering) {
    return layout.els.map(([type, x, y, w, h]) => {
      const cat = CATEGORIES[type];
      const el = document.createElement("div");
      el.className = entering ? "ae enter" : "ae";
      el.style.cssText = `left:${x}%;top:${y}%;width:${w}%;height:${h}%;--c:${cat.fill};--cd:${cat.dark};`;
      const box = document.createElement("span");
      box.className = "ae-box";
      const label = document.createElement("span");
      label.className = "ae-label";
      label.textContent = cat.label;
      el.append(box, label);
      el.dataset.mid = y + h / 2;
      body.insertBefore(el, scan);
      return el;
    });
  }

  function clearBlocks() {
    body.querySelectorAll(".ae").forEach(el => el.remove());
    scan.classList.remove("on");
  }

  /* ---------- Static state (reduced motion) ---------- */

  function renderStatic() {
    clearBlocks();
    build(LAYOUTS[0], false).forEach(el => el.classList.add("det", "cls"));
    setChip("classified");
    footLeft.textContent = sampleLabel(0);
    footRight.textContent = summary(LAYOUTS[0]);
  }

  /* ---------- Cancellable timeline ---------- */

  function makeRun() {
    const run = { stop: false, timers: [], rafs: [] };
    run.sleep = ms => new Promise(resolve => { run.timers.push(setTimeout(resolve, ms)); });
    run.later = (ms, fn) => { run.timers.push(setTimeout(fn, ms)); };
    run.cancel = () => {
      run.stop = true;
      run.timers.forEach(clearTimeout);
      run.rafs.forEach(cancelAnimationFrame);
    };
    return run;
  }

  let run = null;
  let index = 0; // advances only after a layout completes, so a paused loop resumes on the same one

  async function loop(r) {
    while (!r.stop) {
      const i = index % LAYOUTS.length;
      const layout = LAYOUTS[i];

      // 1. Wireframes lift in
      footLeft.textContent = sampleLabel(i);
      footRight.textContent = "— elements";
      setChip("loading");
      const els = build(layout, true);
      await r.sleep(40);
      els.forEach((el, n) => r.later(n * TIMING.enterStagger, () => el.classList.remove("enter")));
      await r.sleep(TIMING.settle);
      if (r.stop) return;

      // 2. Scan sweep: detect each element as the line passes its midpoint
      setChip("scanning");
      scan.classList.add("on");
      const t0 = performance.now();
      await new Promise(resolve => {
        const frame = now => {
          if (r.stop) return;
          const p = Math.min(1, (now - t0) / TIMING.scan);
          const y = p * 100;
          scan.style.transform = `translateY(${(y / 100) * body.clientHeight}px)`;
          let found = 0;
          els.forEach(el => {
            if (+el.dataset.mid <= y) el.classList.add("det");
            if (el.classList.contains("det")) found++;
          });
          footRight.textContent = `${found} ${found === 1 ? "element" : "elements"}`;
          if (p < 1) r.rafs.push(requestAnimationFrame(frame));
          else resolve();
        };
        r.rafs.push(requestAnimationFrame(frame));
      });
      scan.classList.remove("on");
      if (r.stop) return;

      // 3. Classify
      await r.sleep(TIMING.beforeClassify);
      if (r.stop) return;
      setChip("classified");
      els.forEach((el, n) => r.later(n * TIMING.classifyStagger, () => el.classList.add("cls")));
      footRight.textContent = summary(layout);

      // 4. Hold, then drop out
      await r.sleep(TIMING.hold);
      if (r.stop) return;
      els.forEach((el, n) => r.later(n * TIMING.exitStagger, () => el.classList.add("out")));
      await r.sleep(TIMING.exit);
      if (r.stop) return;
      els.forEach(el => el.remove());
      index++;
    }
  }

  function start() {
    if (run) return;
    clearBlocks();
    run = makeRun();
    loop(run);
  }

  function stop() {
    if (!run) return;
    run.cancel();
    run = null;
    clearBlocks();
  }

  /* ---------- Play only while visible ---------- */

  if (Motion.reduced()) {
    renderStatic();
  } else {
    let onScreen = false;
    const update = () => (onScreen && !document.hidden ? start() : stop());
    if ("IntersectionObserver" in window) {
      new IntersectionObserver(entries => {
        onScreen = entries[entries.length - 1].isIntersecting;
        update();
      }).observe(root);
    } else {
      onScreen = true;
      update();
    }
    document.addEventListener("visibilitychange", update);
  }

  /* ---------- Tilt toward the cursor (desktop only) ---------- */

  const hero = root.closest(".hero");
  const MAX_TILT = 4;      // deg
  const BASE_SHADOW = 8;   // px
  const SHADOW_SHIFT = 5;  // px
  let targetX = 0, targetY = 0, x = 0, y = 0, tiltRaf = 0;

  const canTilt = () => Motion.finePointer() && !Motion.reduced() && innerWidth > 900;
  const clamp = v => Math.max(-1, Math.min(1, v));

  function tick() {
    x += (targetX - x) * 0.1;
    y += (targetY - y) * 0.1;
    const settled = Math.abs(targetX - x) < 0.001 && Math.abs(targetY - y) < 0.001;
    if (settled) { x = targetX; y = targetY; }

    if (settled && x === 0 && y === 0) {
      root.style.removeProperty("transform");
      root.style.removeProperty("--sx");
      root.style.removeProperty("--sy");
    } else {
      root.style.transform = `rotateY(${(x * MAX_TILT).toFixed(2)}deg) rotateX(${(-y * MAX_TILT).toFixed(2)}deg)`;
      root.style.setProperty("--sx", (BASE_SHADOW - x * SHADOW_SHIFT).toFixed(1) + "px");
      root.style.setProperty("--sy", (BASE_SHADOW - y * SHADOW_SHIFT).toFixed(1) + "px");
    }
    tiltRaf = settled ? 0 : requestAnimationFrame(tick);
  }

  const kick = () => { if (!tiltRaf) tiltRaf = requestAnimationFrame(tick); };

  if (hero) {
    hero.addEventListener("pointermove", e => {
      if (!canTilt()) return;
      const r = root.getBoundingClientRect();
      const hr = hero.getBoundingClientRect();
      targetX = clamp((e.clientX - (r.left + r.width / 2)) / (hr.width / 2));
      targetY = clamp((e.clientY - (r.top + r.height / 2)) / (hr.height / 2));
      kick();
    });
    hero.addEventListener("pointerleave", () => {
      targetX = 0;
      targetY = 0;
      kick();
    });
  }
})();
