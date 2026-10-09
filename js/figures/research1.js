/* research1 concept figures: Two layers, From people to pages, Variation vs rules,
   Template summarization. Each figure plays once in view, then the reader drives it.
   Nothing runs while a figure is offscreen or the tab is hidden; reduced motion shows each
   figure's most informative final state with its controls still working. Movement of boxes
   and pages uses FLIP (measure → apply → animate the transform), never animated layout.
   Markup lives in pages/research1.html; styles in css/figures.css. Load with defer after js/figures/core.js. */
(() => {
  if (!window.Figures) return;
  const { reduced, EASE_OUT, el, pct, rnd, onceInView, watchVisible, flip, live } = window.Figures;

  /* ================= Two layers ================= */
  (() => {
    const fig = document.getElementById("cf-layers");
    if (!fig) return;
    const frame = fig.querySelector(".cf-a");
    const content = fig.querySelector(".cf-a-content");
    const culture = fig.querySelector(".cf-a-culture");
    const button = fig.querySelector("[data-a-toggle]");

    // Graphic components: [x, y, w, h, fill, shadow] in % of the layer
    const BLOCKS = [
      [6, 5, 88, 9, "#60C2FF", "#2157A9"], [6, 18, 54, 30, "#FFF260", "#A9A03E"], [64, 18, 30, 30, "#FD93E2", "#8B487A"],
      [6, 52, 27, 20, "#60FFA2", "#318D57"], [36.5, 52, 27, 20, "#60FFA2", "#318D57"], [67, 52, 27, 20, "#60FFA2", "#318D57"],
      [6, 76, 60, 7, "#60E7FF", "#348796"], [6, 87, 88, 8, "#D9D1CA", "#5B524B"],
    ];
    // Culture traits (illustrative): [label, x, y]
    const TRAITS = [["pt-BR", 8, 8], ["R$ · BRL", 54, 20], ["Age 25–44", 12, 40], ["Mobile-first", 50, 52], ["Local holidays", 8, 70], ["Trust signals", 52, 84]];

    BLOCKS.forEach(([x, y, w, h, c, cd]) => content.append(el("div", "cf-a-blk", pct(x, y, w, h) + `--c:${c};--cd:${cd};`)));
    TRAITS.forEach(([t, x, y]) => culture.append(el("span", "cf-a-trait", `left:${x}%;top:${y}%;`, t)));

    const set = on => {
      frame.classList.toggle("is-exploded", on);
      button.setAttribute("aria-pressed", String(on));
      button.textContent = on ? "Assemble page" : "Explode layers";
    };
    button.addEventListener("click", () => set(!frame.classList.contains("is-exploded")));
    live(fig);

    if (reduced()) set(true);
    else onceInView(fig, () => setTimeout(() => set(true), 500));
  })();

  /* ================= From people to pages ================= */
  (() => {
    const fig = document.getElementById("cf-phases");
    if (!fig) return;
    const mini = fig.querySelector(".cf-b-mini");
    const sequence = [...fig.querySelectorAll("[data-b-step]")];

    // The stage-3 page is assembled from stage-2 components: [x, y, w, h, fill] in %
    const PAGE = [[6, 5, 88, 10, "#60C2FF"], [6, 20, 55, 32, "#FFF260"], [65, 20, 29, 32, "#FD93E2"], [6, 57, 41, 22, "#60FFA2"], [53, 57, 41, 22, "#60FFA2"], [6, 84, 88, 11, "#D9D1CA"]];
    PAGE.forEach(([x, y, w, h, c], i) => mini.append(el("span", "cf-b-mp", pct(x, y, w, h) + `--c:${c};transition-delay:${i * 110}ms;`)));

    let timers = [];
    function play() {
      timers.forEach(clearTimeout);
      timers = [];
      sequence.forEach(s => s.classList.remove("is-on"));
      if (reduced()) { sequence.forEach(s => s.classList.add("is-on")); return; }
      void fig.offsetWidth; // restart the transitions
      sequence.forEach((s, i) => timers.push(setTimeout(() => s.classList.add("is-on"), 150 + i * 750)));
    }
    fig.querySelector("[data-b-replay]").addEventListener("click", play);
    live(fig);

    if (reduced()) play();
    else onceInView(fig, play);
  })();

  /* ================= Variation vs rules ================= */
  (() => {
    const fig = document.getElementById("cf-variation");
    if (!fig) return;
    const frame = fig.querySelector(".cf-c");
    const field = fig.querySelector(".cf-c-field--culture");
    const page = fig.querySelector(".cf-c-field--content");
    const sampleNo = fig.querySelector("[data-c-sample]");
    const fillCulture = fig.querySelector("[data-c-fill='culture']");
    const fillContent = fig.querySelector("[data-c-fill='content']");
    const rulesBtn = fig.querySelector("[data-c-rules]");

    const TRAITS = ["pt-BR", "EN-US", "Age 18–24", "Age 55+", "Rural", "Urban", "R$", "€", "RTL", "Gen Z", "Low bandwidth", "Faith", "Holidays", "Formal", "Slang", "Family"];
    const PALETTE = ["#FD93E2", "#FFF260", "#60FFA2", "#60C2FF", "#FFB37A", "#60E7FF", "#FFFFFF"];
    const COLORS = {
      header: ["#60C2FF", "#2157A9"], hero: ["#FFF260", "#A9A03E"], media: ["#FD93E2", "#8B487A"],
      text: ["#60E7FF", "#348796"], footer: ["#D9D1CA", "#5B524B"], card: ["#60FFA2", "#318D57"],
    };

    const tokens = TRAITS.map(t => { const e = el("span", "cf-c-tok", null, t); field.append(e); return e; });
    const blocks = {};
    ["header", "hero", "media", "c0", "c1", "c2", "c3", "text", "footer"].forEach(k => {
      const [c, cd] = COLORS[k] || COLORS.card;
      blocks[k] = el("div", "cf-c-pb", `--c:${c};--cd:${cd};`);
      page.append(blocks[k]);
    });
    page.append(
      el("span", "cf-c-rule", "top:6px;", "header · always top"),
      el("span", "cf-c-rule", "bottom:6px;", "footer · always bottom"),
      el("span", "cf-c-rule", "top:46%;", "12-col grid"),
    );

    // Culture: every sample scatters the traits anew (transforms only)
    function shuffleCulture() {
      const W = field.clientWidth, H = field.clientHeight;
      tokens.forEach(t => {
        const s = rnd(.7, 1.45), r = rnd(-40, 40);
        t.style.transform = `translate(${rnd(-10, W - 40).toFixed(0)}px, ${rnd(-6, H - 20).toFixed(0)}px) rotate(${r.toFixed(0)}deg) scale(${s.toFixed(2)})`;
        t.style.backgroundColor = PALETTE[(Math.random() * PALETTE.length) | 0];
        t.style.borderRadius = Math.random() < .4 ? "999px" : Math.random() < .5 ? "0" : "8px";
        t.style.transitionDelay = reduced() ? "0ms" : (Math.random() * 180).toFixed(0) + "ms";
      });
      fillCulture.style.setProperty("--w", (rnd(6, 30) / 100).toFixed(2));
    }

    // Content: varies, but the header stays on top, the footer at the bottom, all on a 12-col grid
    const col = n => n * (100 - 8) / 12;
    function layoutContent() {
      const place = (b, x, y, w, h) => {
        Object.assign(b.style, { left: x + "%", top: y + "%", width: w + "%", height: h + "%" });
        b.classList.remove("is-ghost");
      };
      place(blocks.header, 4, 4, 92, 9);
      const imageLeft = Math.random() < .5, heroH = Math.round(rnd(24, 32));
      const heroCols = Math.random() < .5 ? 7 : 8;
      const heroW = col(heroCols) - 1.5, mediaW = col(12 - heroCols) - 1.5;
      if (imageLeft) { place(blocks.media, 4, 17, mediaW, heroH); place(blocks.hero, 4 + col(12 - heroCols) + 1.5, 17, heroW, heroH); }
      else { place(blocks.hero, 4, 17, heroW, heroH); place(blocks.media, 4 + col(heroCols) + 1.5, 17, mediaW, heroH); }
      const n = [2, 3, 4][(Math.random() * 3) | 0], cy = 17 + heroH + 4, ch = Math.round(rnd(16, 22)), span = 12 / n;
      ["c0", "c1", "c2", "c3"].forEach((k, i) => {
        if (i < n) place(blocks[k], 4 + col(span * i) + (i ? 1 : 0), cy, col(span) - (i ? 1 : 0) - (i < n - 1 ? 1 : 0), ch);
        else blocks[k].classList.add("is-ghost");
      });
      const ty = cy + ch + 4;
      place(blocks.text, 4, ty, col(Math.random() < .5 ? 8 : 6), Math.max(4, 85 - ty - 3));
      place(blocks.footer, 4, 87, 92, 9);
      fillContent.style.setProperty("--w", (rnd(86, 94) / 100).toFixed(2));
    }

    let sample = 1;
    function nextSample(animate = true) {
      shuffleCulture();
      const nodes = Object.values(blocks).filter(b => !b.classList.contains("is-ghost"));
      if (animate) flip(nodes, layoutContent, 650);
      else layoutContent();
    }

    fig.querySelector("[data-c-next]").addEventListener("click", () => {
      sample++;
      sampleNo.textContent = "sample " + String(sample).padStart(2, "0");
      nextSample();
    });
    rulesBtn.addEventListener("click", () => {
      const on = !frame.classList.contains("show-rules");
      frame.classList.toggle("show-rules", on);
      rulesBtn.setAttribute("aria-pressed", String(on));
    });

    live(fig);
    nextSample(false);
    addEventListener("resize", shuffleCulture);
    if (reduced()) return;

    // Auto-resample every 2.6s, only while visible, not hovered and the tab is shown
    let hovered = false, visible = false, timer = 0;
    const schedule = () => {
      clearTimeout(timer);
      if (visible && !hovered && !reduced()) {
        timer = setTimeout(() => {
          sample++;
          sampleNo.textContent = "sample " + String(sample).padStart(2, "0");
          nextSample();
          schedule();
        }, 2600);
      }
    };
    frame.addEventListener("pointerenter", () => { hovered = true; schedule(); });
    frame.addEventListener("pointerleave", () => { hovered = false; schedule(); });
    frame.addEventListener("focusin", () => { hovered = true; schedule(); });
    frame.addEventListener("focusout", () => { hovered = false; schedule(); });
    watchVisible(fig, v => { visible = v; schedule(); }, 0.3);
  })();

  /* ================= Template summarization ================= */
  (() => {
    const fig = document.getElementById("cf-summary");
    if (!fig) return;
    const frame = fig.querySelector(".cf-d");
    const stage = fig.querySelector(".cf-stage");
    const cap = fig.querySelector(".cf-d-cap");
    const legend = fig.querySelector(".cf-d-legend");
    const steps = [...fig.querySelectorAll("[data-step]")];

    // Real Dell item-detail heights from the study; section bands are fractions of page height.
    // Proportions are illustrative (marked in the figure).
    const PAGES = {
      a: { name: "Item detail · Dell 1", px: 18482, secs: [["header", 0, .03], ["sub", .03, .05], ["col1", .05, .37], ["col0", .37, .89], ["footer", .89, 1]], panel: [.72, 1] },
      b: { name: "Item detail · Dell 2", px: 19432, secs: [["header", 0, .025], ["sub", .025, .045], ["col1", .045, .31], ["col0", .31, .87], ["footer", .87, 1]], panel: [.75, 1] },
    };
    const SUMMARY = {
      a: [["header", 0, .08], ["sub", .08, .13], ["col1", .13, .48], ["col0", .48, .87], ["footer", .87, 1]],
      b: [["header", 0, .07], ["sub", .07, .12], ["col1", .12, .46], ["col0", .46, .88], ["footer", .88, 1]],
    };
    const LEGEND = { header: "#9A9A9A", sub: "#5C2A7A", col1: "#BB6720", col0: "#BA2121", footer: "#1E0A28", panel: "#1C3397" };
    const CAPTIONS = [
      ["Raw pages", "Same page type, same site, similar products. The lengths still differ, so sections land at different heights."],
      ["Segment", "Each page is split into template sections: header, subheader, columns, panels and footer."],
      ["Summarize", "Every page becomes a same-size frame, with each section as a solid block in the legend colors."],
      ["Stack", "Overlaying the summarized templates shows the structure that item-detail pages share."],
    ];

    const D = {};
    ["a", "b"].forEach(k => {
      const pg = el("div", "cf-d-pg " + k);
      const secs = PAGES[k].secs.map(([type]) => {
        const s = el("div", "cf-d-sec", `--sc:${LEGEND[type]};`);
        for (let i = 0; i < 3; i++) s.append(el("span", "ln", `top:${25 + i * 22}%;width:${(50 + Math.random() * 35).toFixed(0)}%;`));
        pg.append(s);
        return s;
      });
      const panel = el("div", "cf-d-sec", `--sc:${LEGEND.panel};border-left:1px solid #C9C1BA;`);
      pg.append(panel);
      const label = el("div", "cf-d-lbl");
      stage.append(pg, label);
      D[k] = { pg, secs, panel, label, bands: PAGES[k].secs, panelBand: PAGES[k].panel };
    });

    let step = 0;

    function layout(next, animate) {
      const W = stage.clientWidth, H = stage.clientHeight;
      const narrow = W < 640;
      const pgs = ["a", "b"].map(k => D[k].pg);

      // Section bands: old fractions, for the child half of the FLIP
      const oldBands = ["a", "b"].map(k => D[k].bands.map(b => [b[1], b[2]]));
      const oldPanel = ["a", "b"].map(k => [D[k].panelTop, D[k].panelH]);

      // Step chrome first, so the caption's height is known before placing the pages
      cap.innerHTML = `<b>${CAPTIONS[next][0]}</b>${CAPTIONS[next][1]}`;
      legend.classList.toggle("is-on", next >= 2);
      steps.forEach(b => b.setAttribute("aria-pressed", String(+b.dataset.step === next)));
      const top = narrow ? cap.offsetHeight + 24 : 30;
      const maxH = H - top - 60;
      const labelHalf = D.a.label.offsetWidth / 2;

      const apply = () => {
        step = next;
        frame.classList.remove("st-raw", "st-seg", "st-sum", "st-stack");
        frame.classList.add(["st-raw", "st-seg", "st-sum", "st-stack"][step]);

        ["a", "b"].forEach((k, i) => {
          const P = PAGES[k], d = D[k];
          let w, h, x, y;
          if (step < 2) {
            const gap = narrow ? 36 : 70;
            h = maxH * (P.px / 19432);
            w = h * (1788 / P.px) * 2.2; // widened a little so the sections stay visible
            if (narrow) w = Math.min(w, (W - 40 - gap) / 2);
            const pairW = 2 * w + gap;
            x = (narrow ? (W - pairW) / 2 : W * .55) + i * (w + gap);
            y = top;
          } else if (step === 2) {
            const gap = 40;
            h = Math.min(maxH * .85, W * (narrow ? .36 : .24));
            if (narrow) h = Math.min(h, (W - 40 - gap) / 2);
            w = h;
            x = (narrow ? (W - (2 * w + gap)) / 2 : W * .44) + i * (w + gap);
            y = narrow ? top + (H - top - h - 70) / 2 : (H - h) / 2 - 16;
          } else {
            h = Math.min(maxH * .85, W * (narrow ? .42 : .26)); w = h;
            x = W * (narrow ? .5 : .56) - w / 2;
            y = narrow ? top + (H - top - h - 70) / 2 : (H - h) / 2 - 16;
          }
          Object.assign(d.pg.style, { left: x.toFixed(1) + "px", top: y.toFixed(1) + "px", width: w.toFixed(1) + "px", height: h.toFixed(1) + "px" });

          const bands = step >= 2 ? SUMMARY[k] : P.secs;
          d.bands = bands;
          bands.forEach(([type, y0, y1], j) => {
            d.secs[j].style.top = (y0 * 100) + "%";
            d.secs[j].style.height = ((y1 - y0) * 100) + "%";
            if (type === "col1") {
              d.panelTop = y0; d.panelH = y1 - y0;
              Object.assign(d.panel.style, {
                top: (y0 * 100) + "%", height: ((y1 - y0) * 100) + "%",
                left: (d.panelBand[0] * 100) + "%", width: ((d.panelBand[1] - d.panelBand[0]) * 100) + "%",
              });
            }
          });

          // Raw pages differ in height: line both labels up under the taller one
          const labelY = step < 2 ? top + maxH + 10 : y + h + 10;
          d.label.style.transform = `translate(${(x + w / 2 - labelHalf).toFixed(1)}px, ${labelY.toFixed(1)}px)`;
          d.label.style.opacity = step === 3 && i === 1 ? "0" : "1";
          d.label.innerHTML = step === 3 && i === 0
            ? "<b>Stacked templates</b>item detail pages"
            : `<b>${narrow ? P.name.split(" · ")[1] : P.name}</b>${step >= 2 ? "summarized template" : "1788 × " + P.px.toLocaleString("en-US") + " px"}`;
        });
      };

      if (!animate || reduced()) { apply(); return; }

      // Pages: FLIP between boxes
      flip(pgs, apply, 900);
      // Sections: inverse transform in the page's final coordinates (fractions × final height),
      // so they ride the page's own FLIP and land on their new bands
      ["a", "b"].forEach((k, i) => {
        const d = D[k], H1 = d.pg.clientHeight;
        d.bands.forEach(([, y0, y1], j) => {
          const [t0, b0] = oldBands[i][j];
          const h0 = b0 - t0, h1 = y1 - y0;
          if (!h1 || (Math.abs(t0 - y0) < .001 && Math.abs(h0 - h1) < .001)) return;
          d.secs[j].animate(
            [{ transform: `translateY(${((t0 - y0) * H1).toFixed(1)}px) scaleY(${(h0 / h1).toFixed(3)})` }, { transform: "none" }],
            { duration: 900, easing: EASE_OUT }
          );
        });
        const [pt0, ph0] = oldPanel[i];
        if (pt0 != null && d.panelH) {
          d.panel.animate(
            [{ transformOrigin: "0 0", transform: `translateY(${((pt0 - d.panelTop) * H1).toFixed(1)}px) scaleY(${(ph0 / d.panelH).toFixed(3)})` }, { transformOrigin: "0 0", transform: "none" }],
            { duration: 900, easing: EASE_OUT }
          );
        }
      });
    }

    // Autoplay once in view (Raw → Segment → Summarize → Stack); waits while offscreen or hidden
    let visible = false, playing = false, timer = 0;
    const advance = () => {
      clearTimeout(timer);
      if (!playing || step >= 3) { playing = false; return; }
      if (!visible) return; // resumes when visible again
      timer = setTimeout(() => {
        if (!playing || !visible) return;
        layout(step + 1, true);
        advance();
      }, 1900);
    };
    const stopAuto = () => { playing = false; clearTimeout(timer); };

    steps.forEach(b => b.addEventListener("click", () => { stopAuto(); layout(+b.dataset.step, true); }));

    live(fig);
    layout(reduced() ? 2 : 0, false);
    addEventListener("resize", () => layout(step, false));

    if (reduced()) return;
    watchVisible(fig, v => { visible = v; if (v && playing) advance(); }, 0.3);
    onceInView(fig, () => { playing = true; advance(); });
  })();
})();
