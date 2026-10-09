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
})();
