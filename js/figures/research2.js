/* Research 2 concept figures: terrain, balance grid, pages to scale, gravity overlay,
   movement, assimilation span and the double well. Each plays once in view, then the reader
   drives it; nothing runs offscreen; reduced motion shows the final state with controls working.
   Data comes from assets/data/research2 (fetched relative to the page); if it fails to load,
   the figure keeps its fallback and says why.
   Markup lives in pages/research2.html; styles in css/figures.css. Load with defer after js/figures/core.js. */
(() => {
  if (!window.Figures) return;
  const { reduced, el, stepper, onceInView, live } = window.Figures;

  const DATA = "../assets/data/research2/";
  const cache = {};
  const load = name => (cache[name] ||= fetch(DATA + name).then(r => {
    if (!r.ok) throw new Error(r.status);
    return r.json();
  }));
  // Keep the fallback on screen and add a short note under it
  const fail = fig => {
    const box = fig.querySelector(".ifig-fallback");
    if (box && !box.querySelector(".fig-error")) box.append(el("p", "fig-error", null, "Interactive version unavailable: the study data didn't load."));
  };
  const loadImage = src => new Promise((ok, no) => {
    const img = new Image();
    img.onload = () => ok(img);
    img.onerror = no;
    img.src = src;
  });

  /* ================= Fig 02 · From screenshot to terrain ================= */
  (() => {
    const fig = document.getElementById("cf-terrain");
    if (!fig) return;
    const stage = fig.querySelector(".r2-t-stage");
    const cv = stage.querySelector("canvas");
    const ctx = cv.getContext("2d");
    const cap = fig.querySelector(".r2-t-cap");
    const buttons = [...fig.querySelectorAll("[data-tstep]")];

    // White → cyan → teal → blue → ink, by feature points per cell
    const RAMP = [[255, 255, 255], [201, 246, 255], [96, 231, 255], [52, 135, 150], [33, 87, 169], [10, 10, 10]];
    const PAGE_W = 1788, PAGE_H = 1846;

    Promise.all([load("lenovo_matrix.json"), loadImage("../assets/images/cases/research2/lenovo_page.jpg")])
      .then(([data, pageImg]) => {
        const M = data.matrix, R = data.rows, C = data.cols, MAX = data.max;

        // Global center of mass, in cell units (cell centers at +.5)
        let tot = 0, mx = 0, my = 0;
        M.forEach((row, i) => row.forEach((v, j) => { tot += v; mx += v * (j + .5); my += v * (i + .5); }));
        const CMc = mx / tot, CMr = my / tot;

        const STEPS = [
          { img: 1,   cells: 0, iso: 0, cm: 0, cap: ["1 · The page", `The Lenovo cart page as people saw it: ${PAGE_W} × ${PAGE_H} px.`] },
          { img: .35, cells: 1, iso: 0, cm: 0, cap: ["2 · Density", `Feature points counted in ${data.cell_px} × ${data.cell_px} px cells. Darker cells hold more information.`] },
          { img: 0,   cells: 1, iso: 1, cm: 0, cap: ["3 · Terrain", "Density becomes height. Peaks are where information piles up."] },
          { img: 0,   cells: 1, iso: 1, cm: 1, cap: ["4 · Center of mass", `The balance point of the whole page: column ${CMc.toFixed(1)}, row ${CMr.toFixed(1)}, close to the middle.`] },
        ];

        const color = v => {
          const t = Math.min(1, v / MAX) * (RAMP.length - 1), k = Math.floor(t), f = t - k;
          const a = RAMP[k], b = RAMP[Math.min(k + 1, RAMP.length - 1)];
          return a.map((x, i) => Math.round(x + (b[i] - x) * f));
        };
        const shade = (c, s) => `rgb(${c.map(x => Math.round(x * s)).join(",")})`;

        let state = { ...STEPS[0] }, raf = 0;

        function draw() {
          const W = cv.clientWidth, H = cv.clientHeight;
          if (!W || !H) return;
          ctx.clearRect(0, 0, W, H);
          const s = state;
          const narrow = W < 560;

          // Flat placement: the page fitted into the stage
          const fh = H * .92, fw = fh * (PAGE_W / PAGE_H);
          const fx = (W - fw) / 2 - (narrow ? 0 : W * .08), fy = (H - fh) / 2;
          const cw = fw / C, ch = fh / R;
          // Isometric placement
          const tile = Math.min(W * .8 / ((C + R) / 2), H * .62 / ((C + R) / 4 + 10));
          const ox = W * .5 + (R - C) * tile / 4, zk = H * .26 / MAX;
          const oy = Math.max(H * .26, (H - (C + R) * tile / 4 + MAX * zk) / 2);
          // Each corner slides from its flat spot to its isometric spot as iso goes 0 → 1
          const P = (i, j, z) => {
            const px = fx + j * cw, py = fy + i * ch;
            const ix = ox + (j - i) * tile * .5, iy = oy + (j + i) * tile * .25 - z * zk * s.iso;
            return [px + (ix - px) * s.iso, py + (iy - py) * s.iso];
          };
          const quad = (pts, fill) => {
            ctx.fillStyle = fill;
            ctx.beginPath();
            pts.forEach((p, k) => k ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1]));
            ctx.closePath();
            ctx.fill();
          };

          if (s.img > .01) {
            ctx.globalAlpha = s.img;
            ctx.drawImage(pageImg, fx, fy, fw, fh);
            ctx.globalAlpha = 1;
            ctx.strokeStyle = "#0A0A0A";
            ctx.lineWidth = 2;
            ctx.strokeRect(fx, fy, fw, fh);
          }

          if (s.cells > .01) {
            ctx.globalAlpha = s.cells;
            // Back-to-front along the diagonals so nearer columns cover farther ones
            for (let k = 0; k < R + C - 1; k++) {
              for (let i = Math.max(0, k - C + 1); i <= Math.min(R - 1, k); i++) {
                const j = k - i, v = M[i][j];
                if (!v && s.iso > .5) continue;
                const c = color(v);
                const a = P(i, j, v), b = P(i, j + 1, v), c2 = P(i + 1, j + 1, v), d = P(i + 1, j, v);
                if (s.iso > .02 && v) {
                  const b0 = P(i, j + 1, 0), c0 = P(i + 1, j + 1, 0), d0 = P(i + 1, j, 0);
                  quad([d, c2, c0, d0], shade(c, .72));
                  quad([b, c2, c0, b0], shade(c, .86));
                }
                if (v) {
                  quad([a, b, c2, d], `rgb(${c.join(",")})`);
                  if (s.iso > .5 && v > 8) { ctx.strokeStyle = "rgba(10,10,10,.35)"; ctx.lineWidth = .6; ctx.stroke(); }
                }
              }
            }
            ctx.globalAlpha = 1;
            if (s.iso > .5) {
              const corners = [P(0, 0, 0), P(0, C, 0), P(R, C, 0), P(R, 0, 0)];
              ctx.strokeStyle = "rgba(10,10,10,.5)";
              ctx.lineWidth = 1.5;
              ctx.beginPath();
              corners.forEach((p, k) => k ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1]));
              ctx.closePath();
              ctx.stroke();
            }
          }

          if (s.cm > .01) {
            const base = P(CMr, CMc, 0), top = P(CMr, CMc, MAX * 1.15);
            ctx.globalAlpha = s.cm;
            ctx.strokeStyle = "#E0352B";
            ctx.lineWidth = 2.5;
            ctx.setLineDash([6, 5]);
            ctx.beginPath(); ctx.moveTo(base[0], base[1]); ctx.lineTo(top[0], top[1]); ctx.stroke();
            ctx.setLineDash([]);
            ctx.fillStyle = "rgba(224,53,43,.25)";
            ctx.beginPath(); ctx.ellipse(base[0], base[1], 34, 17, 0, 0, Math.PI * 2); ctx.fill();
            ctx.fillStyle = "#E0352B";
            ctx.strokeStyle = "#0A0A0A";
            ctx.lineWidth = 3;
            ctx.beginPath(); ctx.arc(top[0], top[1], 11, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
            ctx.font = '500 12px "Roboto Mono", monospace';
            ctx.fillStyle = "#0A0A0A";
            ctx.fillText("center of mass", top[0] + 18, top[1] + 4);
            ctx.globalAlpha = 1;
          }
        }

        function size() {
          const r = cv.getBoundingClientRect(), dpr = Math.min(devicePixelRatio || 1, 2);
          cv.width = Math.round(r.width * dpr);
          cv.height = Math.round(r.height * dpr);
          ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
          draw();
        }

        function setStep(n, animate = true) {
          const target = STEPS[n];
          cap.innerHTML = "";
          cap.append(el("b", null, null, target.cap[0]), document.createTextNode(target.cap[1]));
          buttons.forEach(b => b.setAttribute("aria-pressed", String(+b.dataset.tstep === n)));
          cancelAnimationFrame(raf);
          if (!animate || reduced()) { state = { ...target }; draw(); return; }
          const from = { ...state }, t0 = performance.now(), dur = 1100;
          const ease = t => 1 - Math.pow(1 - t, 3);
          const frame = now => {
            const p = Math.min(1, (now - t0) / dur), e = ease(p);
            for (const k of ["img", "cells", "iso", "cm"]) state[k] = from[k] + (target[k] - from[k]) * e;
            draw();
            if (p < 1) raf = requestAnimationFrame(frame);
          };
          raf = requestAnimationFrame(frame);
        }

        const timeline = stepper(fig, STEPS.length, 2000, i => setStep(i));
        buttons.forEach(b => b.addEventListener("click", () => { timeline.stop(); setStep(+b.dataset.tstep); }));

        live(fig);
        new ResizeObserver(size).observe(cv);
        if (reduced()) { setStep(STEPS.length - 1, false); return; }
        setStep(0, false);
        onceInView(stage, () => timeline.play(0));
      })
      .catch(() => fail(fig));
  })();

  /* ================= Fig 03 · Balance a page ================= */
  (() => {
    const fig = document.getElementById("cf-balance");
    if (!fig) return;
    const stage = fig.querySelector(".r2-b-stage");
    const presetButtons = [...fig.querySelectorAll("[data-preset]")];
    const COLS = 10, ROWS = 6;
    const PRESETS = {
      layout: ["3333333333", "2200001100", "2232203330", "2232203330", "0000000000", "1111111111"],
      two:    ["0000000000", "0330000000", "0330000000", "0000000330", "0000000330", "0000000000"],
      clear:  ["0000000000", "0000000000", "0000000000", "0000000000", "0000000000", "0000000000"],
    };

    // Grid: one tab stop, arrow keys move between cells (roving tabindex)
    const wrap = el("div", "r2-b-gridwrap");
    const grid = el("div", "r2-b-grid");
    grid.setAttribute("role", "group");
    grid.setAttribute("aria-label", "Grid of 60 cells, 10 columns by 6 rows. Use the arrow keys to move and Enter or Space to add mass; the red dot shows the center of mass.");
    const cells = [];
    for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c < COLS; c++) {
        const b = el("button", "r2-b-cell");
        b.type = "button";
        b.tabIndex = r === 0 && c === 0 ? 0 : -1;
        Object.assign(b.dataset, { r, c, m: 0 });
        grid.append(b);
        cells.push(b);
      }
    }
    const crossV = el("span", "r2-b-cross v"), crossH = el("span", "r2-b-cross h"), dot = el("span", "r2-b-dot");
    [crossV, crossH, dot].forEach(n => n.setAttribute("aria-hidden", "true"));
    grid.append(crossV, crossH, dot);
    wrap.append(grid);

    // Readout
    const read = el("div", "r2-b-read");
    read.setAttribute("aria-live", "polite");
    const massOut = el("strong", null, null, "0"), xyOut = el("strong", null, null, "—"), calc = el("p", "r2-b-calc");
    const block = (label, value) => { const d = el("div"); d.append(el("span", "k", null, label), value); return d; };
    const legend = el("div", "r2-b-legend");
    legend.setAttribute("aria-hidden", "true");
    [1, 2, 3].forEach(m => { const k = el("span", null, null, String(m)); k.prepend(el("i", "m" + m)); legend.append(k); });
    legend.append(el("span", null, null, "· click to add"));
    read.append(block("Total mass", massOut), block("Center of mass", xyOut), calc, legend);

    stage.append(wrap, read);

    const label = b => b.setAttribute("aria-label", `Row ${+b.dataset.r + 1}, column ${+b.dataset.c + 1}, mass ${b.dataset.m}`);

    function update() {
      let m = 0, sx = 0, sy = 0;
      cells.forEach(b => {
        const w = +b.dataset.m;
        m += w; sx += w * (+b.dataset.c + .5); sy += w * (+b.dataset.r + .5);
        label(b);
      });
      massOut.textContent = String(m);
      grid.classList.toggle("is-empty", m === 0);
      if (!m) {
        xyOut.textContent = "—";
        calc.textContent = "Add mass to see where the page balances.";
        return;
      }
      const x = sx / m, y = sy / m;
      const left = `${x / COLS * 100}%`, top = `${y / ROWS * 100}%`;
      Object.assign(dot.style, { left, top });
      crossV.style.left = left;
      crossH.style.top = top;
      xyOut.textContent = `(${x.toFixed(2)}, ${y.toFixed(2)})`;
      calc.replaceChildren(
        document.createTextNode(`x = ${sx.toFixed(1)} / ${m} = ${x.toFixed(2)}`), el("br"),
        document.createTextNode(`y = ${sy.toFixed(1)} / ${m} = ${y.toFixed(2)}`)
      );
    }

    const setPressed = key => presetButtons.forEach(b => b.setAttribute("aria-pressed", String(b.dataset.preset === key)));
    const applyPreset = key => {
      cells.forEach(b => { b.dataset.m = PRESETS[key][b.dataset.r][b.dataset.c]; });
      setPressed(key);
      update();
    };

    grid.addEventListener("click", e => {
      const b = e.target.closest(".r2-b-cell");
      if (!b) return;
      b.dataset.m = (+b.dataset.m + 1) % 4;
      cells.forEach(n => { n.tabIndex = n === b ? 0 : -1; });
      setPressed(null); // the grid no longer matches a preset
      update();
    });
    grid.addEventListener("keydown", e => {
      const b = e.target.closest(".r2-b-cell");
      if (!b) return;
      let r = +b.dataset.r, c = +b.dataset.c;
      if (e.key === "ArrowRight") c = Math.min(COLS - 1, c + 1);
      else if (e.key === "ArrowLeft") c = Math.max(0, c - 1);
      else if (e.key === "ArrowDown") r = Math.min(ROWS - 1, r + 1);
      else if (e.key === "ArrowUp") r = Math.max(0, r - 1);
      else if (e.key === "Home") c = 0;
      else if (e.key === "End") c = COLS - 1;
      else return;
      e.preventDefault();
      const next = cells[r * COLS + c];
      b.tabIndex = -1;
      next.tabIndex = 0;
      next.focus();
    });
    presetButtons.forEach(b => b.addEventListener("click", () => applyPreset(b.dataset.preset)));

    applyPreset("layout");
    live(fig);
  })();
  /* ================= Fig 04 · The six pages, to scale ================= */
  (() => {
    const fig = document.getElementById("cf-scale");
    if (!fig) return;
    const stage = fig.querySelector(".r2-s-stage");
    const MAX_H = 440; // px for the longest page

    load("local_centers_of_mass.json").then(data => {
      const pages = Object.values(data.pages);
      const [SW, SH] = data.screen;
      const SC = data.screenshot_width / SW; // CM y is in 1920-wide units; pages are 1788 wide
      const longest = Math.max(...pages.map(p => p.height_px));
      const k = MAX_H / longest;

      pages.forEach((p, n) => {
        const col = el("div", "r2-s-col", `--i:${n};`);
        const bar = el("div", "r2-s-bar", `height:${Math.max(24, p.height_px * k)}px;width:${data.screenshot_width * k}px;--scr:${SH * SC * k}px;`);
        p.cm.forEach(([x, y], i) => {
          const top = Math.min(99, y * SC / p.height_px * 100);
          bar.append(el("span", "r2-s-dot", `left:${x / SW * 100}%;top:${top}%;--d:${i};`));
        });
        const name = el("b");
        // Let "PlayStation" break at its capital on narrow screens
        p.name.split(/(?<=[a-z])(?=[A-Z])/).forEach((part, i) => { if (i) name.append(el("wbr")); name.append(part); });
        const meta = el("span");
        meta.append(p.category, el("br"), `${p.height_px.toLocaleString("en-US")} px`, el("br"), `${p.cm.length} CMs`);
        col.append(bar, name, meta);
        stage.append(col);
      });

      live(fig);
      if (reduced()) return;
      // Pages unroll top-down, then their centers of mass drop in, once
      stage.classList.add("is-waiting");
      onceInView(stage, () => stage.classList.replace("is-waiting", "is-in"));
    }).catch(() => fail(fig));
  })();
  /* ================= Fig 05 · Gravity overlay ================= */
  (() => {
    const fig = document.getElementById("cf-gravity");
    if (!fig) return;
    const stage = fig.querySelector(".r2-g-stage");
    const heat = stage.querySelector(".r2-g-heat");
    const layer = stage.querySelector(".r2-g-cm");
    const btn = key => fig.querySelector(`[data-layer="${key}"]`);
    const { svg } = window.Figures;

    load("local_centers_of_mass.json").then(data => {
      const SC = data.screenshot_width / data.screen[0];
      data.pages.lenovo.cm.forEach(([x, y], i) => {
        const cx = x * SC, cy = y * SC;
        const g = svg("g", { class: "r2-g-mark", style: `--i:${i};transform-origin:${cx}px ${cy}px;` });
        g.append(
          svg("circle", { cx, cy, r: 230, fill: "rgba(140,110,220,.28)", stroke: "#0A0A0A", "stroke-width": 6, "stroke-dasharray": "18 12" }),
          svg("circle", { cx, cy, r: 18, fill: "#E0352B", stroke: "#0A0A0A", "stroke-width": 6 }),
          svg("rect", { x: cx + 236, y: cy - 34, width: 400, height: 66, rx: 12, fill: "#FFFFFF", stroke: "#0A0A0A", "stroke-width": 5 })
        );
        const t = svg("text", { x: cx + 252, y: cy + 14, "font-size": 44, "font-family": "Roboto Mono, monospace", "font-weight": 500, fill: "#0A0A0A" });
        t.textContent = `CM · screen ${i + 1}`;
        g.append(t);
        layer.append(g);
      });

      // Page and Heatmap pick the base layer; Centers of mass toggles on top
      const state = { heat: true, cm: true };
      const update = () => {
        stage.classList.toggle("no-heat", !state.heat);
        stage.classList.toggle("no-cm", !state.cm);
        btn("page").setAttribute("aria-pressed", String(!state.heat));
        btn("heat").setAttribute("aria-pressed", String(state.heat));
        btn("cm").setAttribute("aria-pressed", String(state.cm));
      };
      btn("page").addEventListener("click", () => { state.heat = false; update(); });
      btn("heat").addEventListener("click", () => { state.heat = true; update(); });
      btn("cm").addEventListener("click", () => { state.cm = !state.cm; update(); });
      update();

      live(fig);
      if (reduced()) return;
      // The circles land on the heatmap once, the first time it's in view
      stage.classList.add("is-waiting");
      onceInView(stage, () => stage.classList.replace("is-waiting", "is-in"), .5);
    }).catch(() => fail(fig));
  })();
})();
