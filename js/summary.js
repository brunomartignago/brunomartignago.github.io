/* Featured project 1 visual: "Template summary".
   The whole template method from study 2, in one window:
   raw pages → segment → summarize → stack → archetype → incidences.
   Loops through SAMPLES while on screen (same rhythm as the hero's page anatomy).
   Hovering a class in the legend highlights it on the pages.
   Replaces the static image inside #summary. Needs js/motion.js (window.Motion). */
(() => {
  /* ---------- Data ---------- */

  // Same palette as the hero's classifier: fill, dark (shadow / label)
  const CLASSES = {
    header: { fill: "#60C2FF", dark: "#2157A9", label: "HEADER" },
    sub:    { fill: "#FD93E2", dark: "#8B487A", label: "SUBHEADER" },
    col1:   { fill: "#FFF260", dark: "#847E30", label: "COLUMN 1" },
    col2:   { fill: "#60E7FF", dark: "#348796", label: "COLUMN 2" },
    panel:  { fill: "#FFB37A", dark: "#9A4F1C", label: "PANEL" },
    col0:   { fill: "#60FFA2", dark: "#318D57", label: "COLUMN 0" },
    footer: { fill: "#D9D1CA", dark: "#5B524B", label: "FOOTER" },
  };
  const ORDER = ["header", "sub", "col1", "col2", "panel", "col0", "footer"];

  // A page is a list of sections: [class, top, bottom, left?, right?] as fractions of the page.
  // `raw` keeps the long page's proportions, `sum` is the same page summarized into a square.
  // Page lengths (px) are real study-2 pages. The cart's 4-page heights and every section
  // proportion are illustrative. The summarized structures and incidence counts follow
  // Figs. 24–26 of the research1 case.
  const top2 = (a, b, split, right, t0, t1) => [[a, t0, t1, 0, split], [right, t0, t1, split, 1]];
  const detail = right => ({
    raw: [["header", 0, .03], ["sub", .03, .05], ...top2("col1", 0, right === "col2" ? .5 : .75, right, .05, .37), ["col0", .37, .89], ["footer", .89, 1]],
    sum: [["header", 0, .07], ["sub", .07, .12], ...top2("col1", 0, right === "col2" ? .5 : .75, right, .12, .51), ["col0", .51, .9], ["footer", .9, 1]],
  });
  const list = (rawTop, rawMid) => ({
    raw: [["header", 0, .05], ["sub", .05, .08], ["panel", .08, rawTop, 0, .25], ["col1", .08, rawTop, .25, 1], ["col0", rawTop, rawMid], ["footer", rawMid, 1]],
    sum: [["header", 0, .08], ["sub", .08, .13], ["panel", .13, .51, 0, .25], ["col1", .13, .51, .25, 1], ["col0", .51, .9], ["footer", .9, 1]],
  });
  const cart = (hasSub, right) => {
    const split = right === "col2" ? .5 : .75;
    const rs = hasSub ? .14 : .1, ss = hasSub ? .11 : .08;
    return {
      raw: [["header", 0, .1], ...(hasSub ? [["sub", .1, .14]] : []), ...top2("col1", 0, split, right, rs, .62), ["col0", .62, .82], ["footer", .82, 1]],
      sum: [["header", 0, .08], ...(hasSub ? [["sub", .08, .11]] : []), ...top2("col1", 0, split, right, ss, .5), ["col0", .5, .88], ["footer", .88, 1]],
    };
  };

  // incidences: indexes of the pages that are distinct variations (the rest merge into them)
  const SAMPLES = [
    { name: "item detail", px: [18482, 19432], pages: [detail("col2"), detail("panel")], incidences: [0, 1] },
    { name: "item list", px: [9886, 4138], pages: [list(.52, .9), list(.6, .86)], incidences: [0] },
    { name: "cart", rel: [1, .93, 1.12, .97], pages: [cart(true, "panel"), cart(true, "col2"), cart(false, "panel"), cart(false, "col2")], incidences: [0, 1, 2, 3] },
  ];

  const TIMING = { enter: 700, rawHold: 600, scan: 1700, segHold: 450, morph: 950, sumHold: 900, stackHold: 1100, archHold: 1900, incHold: 3000, exit: 550 };

  /* ---------- Layout (all in % of the window body; the body is 5:4, so a square is h = w × 1.25) ---------- */

  const sq = (x, w, cy = 48) => ({ x, w, h: w * 1.25, y: cy - (w * 1.25) / 2 });

  function rawBoxes(s) {
    const n = s.pages.length;
    const rel = s.px ? s.px.map(v => v / Math.max(...s.px)) : s.rel.map(v => v / Math.max(...s.rel));
    const gap = n > 2 ? 5 : 8, w = n > 2 ? 11 : 17;
    const total = n * w + (n - 1) * gap, x0 = 2 + (64 - total) / 2;
    return rel.map((r, i) => ({ x: x0 + i * (w + gap), y: 6, w, h: 86 * r }));
  }

  function sumBoxes(n) {
    if (n <= 2) return [sq(4, 30), sq(37, 30)].slice(0, n);
    return [sq(10, 22, 26), sq(38, 22, 26), sq(10, 22, 72), sq(38, 22, 72)];
  }

  const STACK = sq(14, 40);
  const ARCH = sq(5, 27);

  function incBoxes(n) {
    if (n === 1) return [sq(56, 32)];
    if (n === 2) return [sq(44, 25), sq(72, 25)];
    return [sq(52, 20, 26), sq(76, 20, 26), sq(52, 20, 72), sq(76, 20, 72)];
  }

  /* ---------- DOM ---------- */

  const root = document.getElementById("summary");
  const Motion = window.Motion;
  if (!root || !Motion) return;

  const body = root.querySelector(".viz-body");
  const chip = root.querySelector(".viz-chip");
  const [footLeft, footRight] = root.querySelectorAll(".viz-foot span");
  body.querySelectorAll(".summary-static").forEach(n => n.remove());

  const el = (cls, css) => {
    const e = document.createElement("div");
    e.className = cls;
    if (css) e.style.cssText = css;
    return e;
  };
  const box = (e, b) => Object.assign(e.style, { left: b.x + "%", top: b.y + "%", width: b.w + "%", height: b.h + "%" });

  const stage = el("sm-stage");
  const scan = el("sm-scan");
  const frame = el("sm-frame");
  const frameLabel = document.createElement("span");
  frameLabel.className = "sm-frame-label";
  frame.append(frameLabel);
  const arrow = el("sm-arrow");
  arrow.innerHTML = '<svg viewBox="0 0 40 16" aria-hidden="true"><path d="M2 8H36M29 2l7 6-7 6" fill="none" stroke="#0A0A0A" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/></svg>';
  const incLabel = el("sm-inc-label");

  // Legend: one row per class, idle (dashed) until found
  const legend = el("sm-legend");
  const legendHead = el("sm-legend-head");
  legendHead.textContent = "classes";
  legend.append(legendHead);
  const keys = {};
  ORDER.forEach(k => {
    const c = CLASSES[k];
    // Pointer-only enhancement: the window is aria-hidden, so these are not focusable
    const row = document.createElement("span");
    row.className = "sm-key";
    row.style.cssText = `--c:${c.fill};--cd:${c.dark};`;
    row.innerHTML = `<i></i><span>${c.label}</span>`;
    row.addEventListener("pointerenter", () => focusClass(k));
    row.addEventListener("pointerleave", () => focusClass(null));
    legend.append(row);
    keys[k] = row;
  });

  body.append(stage, frame, arrow, incLabel, scan, legend);

  function focusClass(k) {
    root.classList.toggle("is-focus", !!k);
    stage.querySelectorAll(".sm-sec").forEach(s => s.classList.toggle("is-hot", s.dataset.k === k));
    Object.entries(keys).forEach(([kk, row]) => row.classList.toggle("is-hot", kk === k));
  }

  function setChip(state, text) {
    chip.dataset.state = state;
    chip.textContent = text || state;
  }

  const fmt = n => n.toLocaleString("en-US");
  const sampleLabel = i => `sample ${String(i + 1).padStart(2, "0")} · ${SAMPLES[i].name}`;
  const plural = (n, w) => `${n} ${w}${n === 1 ? "" : w === "incidence" ? "s" : "s"}`;

  /* ---------- Pages ---------- */

  function place(sec, [, t, b, l = 0, r = 1]) {
    Object.assign(sec.style, { top: t * 100 + "%", height: (b - t) * 100 + "%", left: l * 100 + "%", width: (r - l) * 100 + "%" });
  }

  function makePage(p, i, withLines) {
    const page = el("sm-page");
    const secs = p.raw.map((s, j) => {
      const [k, t, b] = s;
      const c = CLASSES[k];
      const sec = el("sm-sec", `--c:${c.fill};--cd:${c.dark};`);
      sec.dataset.k = k;
      if (withLines) {
        const n = Math.max(1, Math.min(4, Math.round((b - t) * 14)));
        for (let q = 0; q < n; q++) sec.append(el("sm-ln", `top:${18 + q * (64 / n)}%;width:${48 + ((q * 37 + i * 13 + j * 7) % 40)}%;`));
      }
      place(sec, s);
      page.append(sec);
      return sec;
    });
    return { page, secs, data: p };
  }

  function build(s) {
    stage.textContent = "";
    const raws = rawBoxes(s);
    return s.pages.map((p, i) => {
      const pg = makePage(p, i, true);
      pg.page.classList.add("enter");
      box(pg.page, raws[i]);
      stage.append(pg.page);
      return pg;
    });
  }

  const toSum = pg => pg.data.sum.forEach((s, j) => place(pg.secs[j], s));

  function clear() {
    stage.textContent = "";
    frame.classList.remove("on");
    arrow.classList.remove("on");
    incLabel.classList.remove("on");
    scan.classList.remove("on");
    root.classList.remove("st-seg", "st-sum", "st-stack", "st-arch", "st-inc");
    Object.values(keys).forEach(k => k.classList.remove("found"));
  }

  // The archetype: a grey copy of the stack, outlines only, so repeated edges read as one line
  // and variations as extra lines
  function makeArchetype(pages) {
    const arch = el("sm-arch");
    box(arch, STACK);
    pages.forEach(pg => {
      const copy = pg.page.cloneNode(true);
      copy.classList.remove("is-over", "enter", "out");
      copy.removeAttribute("style");
      copy.querySelectorAll(".sm-ln").forEach(n => n.remove());
      arch.append(copy);
    });
    // Variation lines: edges that only some of the pages have, drawn dashed on top
    const count = new Map();
    pages.forEach(pg => {
      const edges = new Set(), rows = new Map();
      pg.data.sum.forEach(([, t, b, l = 0, r = 1]) => {
        // A row's top line runs across every section in that row, so key it by height only
        if (t > 0) rows.set(t, [Math.min(l, (rows.get(t) || [1])[0]), Math.max(r, (rows.get(t) || [0, 0])[1])]);
        if (l > 0) edges.add(`v|${l}|${t}|${b}`);
      });
      rows.forEach(([l, r], t) => edges.add(`h|${t}|${l}|${r}`));
      edges.forEach(e => count.set(e, (count.get(e) || 0) + 1));
    });
    count.forEach((c, e) => {
      if (c === pages.length) return;
      const [dir, a, b0, b1] = e.split("|").map((v, i) => (i ? +v * 100 : v));
      const line = el("sm-var " + dir);
      if (dir === "h") Object.assign(line.style, { top: a + "%", left: b0 + "%", width: (b1 - b0) + "%" });
      else Object.assign(line.style, { left: a + "%", top: b0 + "%", height: (b1 - b0) + "%" });
      arch.append(line);
    });
    stage.append(arch);
    return arch;
  }

  /* ---------- Steps ---------- */

  function summarize(pages) {
    const b = sumBoxes(pages.length);
    pages.forEach((pg, i) => { box(pg.page, b[i]); toSum(pg); });
  }

  function stack(pages) {
    pages.forEach((pg, i) => {
      box(pg.page, STACK);
      pg.page.classList.toggle("is-over", i > 0);
    });
    frameLabel.textContent = "stacked templates";
    box(frame, { x: STACK.x - 2.4, y: STACK.y - 3, w: STACK.w + 4.8, h: STACK.h + 6 });
  }

  function archetype() {
    frameLabel.textContent = "archetype";
  }

  function incidences(s, pages, arch) {
    box(arch, ARCH);
    box(frame, { x: ARCH.x - 2, y: ARCH.y - 2.6, w: ARCH.w + 4, h: ARCH.h + 5.2 });
    const boxes = incBoxes(s.incidences.length);
    pages.forEach((pg, i) => {
      const slot = s.incidences.indexOf(i);
      pg.page.classList.remove("is-over");
      if (slot >= 0) box(pg.page, boxes[slot]);
      else { box(pg.page, boxes[0]); pg.page.classList.add("merged"); }
    });
    const ib = boxes.reduce((a, b) => ({ x: Math.min(a.x, b.x), y: Math.min(a.y, b.y), r: Math.max(a.r, b.x + b.w) }), { x: 100, y: 100, r: 0 });
    Object.assign(incLabel.style, { left: ib.x + "%", top: Math.max(1.5, ib.y - 7) + "%", width: (ib.r - ib.x) + "%" });
    const ax = ARCH.x + ARCH.w + 3;
    Object.assign(arrow.style, { left: ax + "%", width: (ib.x - ax - 3) + "%", top: "48%" });
    incLabel.textContent = plural(s.incidences.length, "incidence");
  }

  /* ---------- Static state (reduced motion): sample 01 at its last step ---------- */

  function renderStatic() {
    clear();
    const s = SAMPLES[0];
    const pages = build(s);
    pages.forEach(pg => { pg.page.classList.remove("enter"); pg.secs.forEach(x => x.classList.add("seg")); toSum(pg); });
    root.classList.add("st-seg", "st-sum", "st-stack");
    stack(pages);
    const arch = makeArchetype(pages);
    archetype();
    root.classList.add("st-arch", "st-inc");
    incidences(s, pages, arch);
    frame.classList.add("on"); arrow.classList.add("on"); incLabel.classList.add("on");
    setChip("incidences");
    footLeft.textContent = sampleLabel(0);
    footRight.textContent = `1 archetype → ${plural(s.incidences.length, "incidence")}`;
  }

  /* ---------- Cancellable timeline (same shape as js/anatomy.js) ---------- */

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
  let index = 0;

  async function loop(r) {
    while (!r.stop) {
      const i = index % SAMPLES.length;
      const s = SAMPLES[i];
      const n = s.pages.length;

      // 1. Raw pages of one type drop in, at their relative lengths
      clear();
      setChip("raw");
      footLeft.textContent = sampleLabel(i);
      footRight.textContent = s.px ? s.px.map(fmt).join(" · ") + " px" : `${n} pages`;
      const pages = build(s);
      await r.sleep(40);
      pages.forEach((pg, k) => r.later(k * 110, () => pg.page.classList.remove("enter")));
      await r.sleep(TIMING.enter + TIMING.rawHold);
      if (r.stop) return;

      // 2. Segment: a scan runs down the pages; sections take their class as it passes
      setChip("scanning", "segmenting");
      root.classList.add("st-seg");
      const raws = rawBoxes(s);
      const yTop = Math.min(...raws.map(b => b.y)), yBot = Math.max(...raws.map(b => b.y + b.h));
      Object.assign(scan.style, { left: (raws[0].x - 2) + "%", width: (raws[n - 1].x + raws[n - 1].w - raws[0].x + 4) + "%" });
      scan.classList.add("on");
      const t0 = performance.now();
      await new Promise(resolve => {
        const tick = now => {
          if (r.stop) return;
          const p = Math.min(1, (now - t0) / TIMING.scan);
          const y = yTop + (yBot - yTop) * (1 - Math.pow(1 - p, 2));
          scan.style.top = y + "%";
          pages.forEach((pg, k) => {
            const b = raws[k];
            pg.secs.forEach((sec, j) => {
              const [cls, t] = pg.data.raw[j];
              if (!sec.classList.contains("seg") && b.y + t * b.h <= y) {
                sec.classList.add("seg");
                keys[cls].classList.add("found");
              }
            });
          });
          if (p < 1) r.rafs.push(requestAnimationFrame(tick));
          else resolve();
        };
        r.rafs.push(requestAnimationFrame(tick));
      });
      scan.classList.remove("on");
      const found = new Set(s.pages.flatMap(p => p.raw.map(x => x[0]))).size;
      footRight.textContent = `${found} classes found`;
      await r.sleep(TIMING.segHold);
      if (r.stop) return;

      // 3. Summarize: every page becomes the same square frame
      setChip("summarized");
      root.classList.add("st-sum");
      summarize(pages);
      footRight.textContent = "same-size frames";
      await r.sleep(TIMING.morph + TIMING.sumHold);
      if (r.stop) return;

      // 4. Stack: overlay the templates
      setChip("stacked");
      root.classList.add("st-stack");
      stack(pages);
      r.later(TIMING.morph - 250, () => frame.classList.add("on"));
      footRight.textContent = `${n} templates stacked`;
      await r.sleep(TIMING.morph + TIMING.stackHold);
      if (r.stop) return;

      // 5. Archetype: outlines only; where the pages agree the lines coincide, variations show as extra lines
      setChip("archetype");
      const arch = makeArchetype(pages);
      root.classList.add("st-arch");
      archetype();
      footRight.textContent = s.incidences.length > 1 ? "variation lines found" : "no variation found";
      await r.sleep(TIMING.archHold);
      if (r.stop) return;

      // 6. Incidences: the distinct variations step out of the archetype, in color
      setChip("incidences");
      root.classList.add("st-inc");
      incidences(s, pages, arch);
      r.later(500, () => { arrow.classList.add("on"); incLabel.classList.add("on"); });
      footRight.textContent = `1 archetype → ${plural(s.incidences.length, "incidence")}`;
      await r.sleep(TIMING.morph + TIMING.incHold);
      if (r.stop) return;

      // 7. Out
      [arch, ...pages.map(pg => pg.page)].forEach((p, k) => r.later(k * 70, () => p.classList.add("out")));
      frame.classList.remove("on");
      arrow.classList.remove("on");
      incLabel.classList.remove("on");
      await r.sleep(TIMING.exit);
      if (r.stop) return;
      index++;
    }
  }

  function start() {
    if (run) return;
    run = makeRun();
    loop(run);
  }

  function stop() {
    if (!run) return;
    run.cancel();
    run = null;
    clear();
  }

  /* ---------- Play only while visible ---------- */

  if (Motion.reduced()) {
    renderStatic();
    return;
  }

  let onScreen = false;
  const update = () => (onScreen && !document.hidden ? start() : stop());
  if ("IntersectionObserver" in window) {
    new IntersectionObserver(entries => {
      onScreen = entries[entries.length - 1].isIntersecting;
      update();
    }, { threshold: 0.35 }).observe(root);
  } else {
    onScreen = true;
    update();
  }
  document.addEventListener("visibilitychange", update);
})();
