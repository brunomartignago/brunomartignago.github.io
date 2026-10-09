/* Cockpit concept figures: KPI card anatomy, the dashboard grid and the view modes.
   Each plays once in view, then the reader drives it; nothing runs offscreen; reduced motion
   shows the final state with controls working. Card moves use FLIP transforms.
   Markup lives in pages/cockpit.html; styles in css/figures.css. Load with defer after js/figures/core.js. */
(() => {
  if (!window.Figures) return;
  const { reduced, el, svg, flip, onceInView, stepper, live } = window.Figures;

  // Cards and values from the dashboard screenshots; sparklines are illustrative
  const CARDS = {
    visits:   { name: "Site Search Visits", value: "178,318", sub: "Avg 179,289 IB · 200K goal", desc: "Shows how many visits from users who went to dell.com and visited search.", c: "#60C2FF", cd: "#2157A9", line: [6, 22, 14, 20, 9, 26] },
    critical: { name: "Critical Vulnerability Count", value: "32.93%", sub: "Avg 29.12% IB · 40% goal", c: "#FFF260", cd: "#A9A03E", line: [18, 12, 20, 8, 14, 10] },
    nulls:    { name: "Null Results %", value: "13.64%", sub: "Week 19", c: "#FD93E2", cd: "#8B487A", line: [20, 18, 22, 16, 19, 14] },
    time:     { name: "Resolution Time", value: "1.5h", sub: "Avg 1h IB · 30 min goal", c: "#60FFA2", cd: "#318D57", line: [10, 16, 12, 22, 18, 20] },
    ctr:      { name: "1st Click CTR", value: "32.93%", sub: "Avg 29.12% IB · 40% goal", c: "#FFB37A", cd: "#9A4F1C", line: [14, 10, 18, 12, 22, 16] },
    searches: { name: "Site Searches", value: "295,825", sub: "", c: "#60E7FF", cd: "#348796", line: [24, 18, 20, 12, 14, 8] },
    csat:     { name: "CSAT", value: "80.65%", sub: "", c: "#D9D1CA", cd: "#5B524B", line: [16, 14, 12, 14, 10, 8] },
    rank:     { name: "Average Click Rank", value: "4.9", sub: "", c: "#60C2FF", cd: "#2157A9", line: [12, 18, 14, 16, 12, 18] },
    order:    { name: "Order Conversion", value: "16.51%", sub: "", c: "#FFF260", cd: "#A9A03E", line: [20, 16, 18, 10, 12, 6] },
    layout:   { name: "Cumulative Layout Shift", value: "0.04", sub: "", c: "#60FFA2", cd: "#318D57", line: [8, 10, 9, 12, 10, 11] },
  };

  const spark = (pts, color) => {
    const s = svg("svg", { viewBox: "0 0 100 30", preserveAspectRatio: "none", "aria-hidden": "true" });
    s.append(svg("polyline", { points: pts.map((y, i) => `${(i * 20).toFixed(0)},${y}`).join(" "), fill: "none", stroke: color, "stroke-width": "1.6", "vector-effect": "non-scaling-stroke" }));
    return s;
  };

  /* ================= C1 · KPI card anatomy ================= */
  (() => {
    const fig = document.getElementById("cf-card");
    if (!fig) return;
    const frame = fig.querySelector(".cf-k");
    const button = fig.querySelector("[data-k-toggle]");
    const set = on => {
      frame.classList.toggle("is-exploded", on);
      button.setAttribute("aria-pressed", String(on));
      button.textContent = on ? "Assemble card" : "Explode card";
    };
    button.addEventListener("click", () => set(!frame.classList.contains("is-exploded")));
    live(fig);
    if (reduced()) set(true);
    else onceInView(fig, () => setTimeout(() => set(true), 400));
  })();

  /* ================= C2 · The dashboard grid ================= */
  (() => {
    const fig = document.getElementById("cf-grid");
    if (!fig) return;
    const frame = fig.querySelector(".cf-g");
    const grid = fig.querySelector(".cf-g-grid");
    const sizesBtn = fig.querySelector("[data-g-sizes]");

    // Card sizes (columns × rows) are fixed; only positions change between arrangements.
    // 1×1 = 368 × 210, 1×2 = 368 × 436, 2×2 = 752 × 436
    const SIZE = { visits: [1, 2], critical: [1, 2], nulls: [1, 2], csat: [1, 1], rank: [1, 1], ctr: [1, 1], time: [2, 2], searches: [1, 1], order: [1, 1], layout: [1, 1] };
    const LABEL = { "1x1": "368 × 210", "1x2": "368 × 436", "2x2": "752 × 436" };
    // [card, column, row] for each arrangement; every one fills the 4 × 4 grid exactly
    const ARRANGEMENTS = [
      [["visits", 1, 1], ["critical", 2, 1], ["nulls", 3, 1], ["csat", 4, 1], ["rank", 4, 2], ["ctr", 1, 3], ["time", 2, 3], ["searches", 4, 3], ["order", 1, 4], ["layout", 4, 4]],
      [["time", 1, 1], ["csat", 3, 1], ["visits", 4, 1], ["rank", 3, 2], ["nulls", 1, 3], ["ctr", 2, 3], ["critical", 3, 3], ["searches", 4, 3], ["order", 2, 4], ["layout", 4, 4]],
      [["nulls", 1, 1], ["visits", 2, 1], ["csat", 3, 1], ["ctr", 4, 1], ["time", 3, 2], ["rank", 1, 3], ["critical", 2, 3], ["searches", 1, 4], ["order", 3, 4], ["layout", 4, 4]],
    ];

    const nodes = {};
    Object.entries(SIZE).forEach(([key, [w, h]], i) => {
      const C = CARDS[key];
      const card = el("div", "cf-g-card", `--c:${C.c};--cd:${C.cd};--i:${i};`);
      card.append(el("b", null, null, C.name), el("strong", null, null, C.value), el("span", "cf-g-size", null, LABEL[`${w}x${h}`]));
      grid.append(card);
      nodes[key] = card;
    });

    let current = 0;
    const place = n => ARRANGEMENTS[n].forEach(([key, col, row]) => {
      const [w, h] = SIZE[key];
      Object.assign(nodes[key].style, { gridColumn: `${col} / span ${w}`, gridRow: `${row} / span ${h}` });
    });
    function rearrange() {
      current = (current + 1) % ARRANGEMENTS.length;
      flip(Object.values(nodes), () => place(current), 650);
    }

    fig.querySelector("[data-g-rearrange]").addEventListener("click", rearrange);
    sizesBtn.addEventListener("click", () => {
      const on = !frame.classList.contains("show-sizes");
      frame.classList.toggle("show-sizes", on);
      sizesBtn.setAttribute("aria-pressed", String(on));
    });

    place(0);
    live(fig);
    if (reduced()) return;
    // Cards drop into their slots, staggered, the first time the grid is in view
    frame.classList.add("is-waiting");
    onceInView(fig, () => { frame.classList.remove("is-waiting"); setTimeout(() => frame.classList.add("is-in"), 1600); });
  })();

  /* ================= C3 · One dashboard, three modes ================= */
  (() => {
    const fig = document.getElementById("cf-modes");
    if (!fig) return;
    const frame = fig.querySelector(".cf-v");
    const dash = fig.querySelector(".cf-v-dash");
    const next = fig.querySelector("[data-v-next]");
    const count = fig.querySelector("[data-v-count]");
    const modeButtons = [...fig.querySelectorAll("[data-mode]")];

    const ORDER = ["visits", "critical", "nulls", "time", "ctr", "searches", "csat", "rank"];
    const DETAILED = 4; // the detailed view shows the first four, larger
    const cards = ORDER.map(key => {
      const C = CARDS[key];
      const card = el("div", "cf-v-card", `--cd:${C.cd};`);
      card.append(el("b", null, null, C.name), el("strong", null, null, C.value));
      if (C.sub) card.append(el("span", "sub", null, C.sub));
      if (C.desc) card.append(el("p", "desc", null, C.desc));
      card.append(spark(C.line, C.cd));
      dash.insertBefore(card, next);
      return card;
    });

    let mode = "detailed", slide = 0;
    const visibleIn = m => cards.map((_, i) => m === "compact" || (m === "detailed" && i < DETAILED) || (m === "slide" && i === slide));

    function apply(m, animate = true) {
      const before = visibleIn(mode);
      const after = visibleIn(m);
      const stay = cards.filter((_, i) => before[i] && after[i]);
      const update = () => {
        mode = m;
        frame.classList.remove("mode-detailed", "mode-compact", "mode-slide");
        frame.classList.add("mode-" + m);
        cards.forEach((c, i) => c.classList.toggle("is-hidden", !after[i]));
        modeButtons.forEach(b => b.setAttribute("aria-pressed", String(b.dataset.mode === m)));
        count.textContent = `${slide + 1} / ${cards.length}`;
      };
      if (!animate || reduced()) { update(); return; }
      flip(stay, update, 650);
      cards.forEach((c, i) => {
        if (after[i] && !before[i]) c.animate([{ opacity: 0, transform: "translateY(10px)" }, { opacity: 1, transform: "none" }], { duration: 400, easing: "ease-out" });
      });
    }

    const go = d => {
      const before = slide;
      slide = (slide + d + cards.length) % cards.length;
      if (mode !== "slide") return;
      cards[before].classList.add("is-hidden");
      cards[slide].classList.remove("is-hidden");
      count.textContent = `${slide + 1} / ${cards.length}`;
      if (!reduced()) cards[slide].animate([{ opacity: 0, transform: `translateX(${d * 24}px)` }, { opacity: 1, transform: "none" }], { duration: 350, easing: "ease-out" });
    };

    const MODES = ["detailed", "compact", "slide"];
    const timeline = stepper(fig, 3, 1900, i => apply(MODES[i]));
    modeButtons.forEach(b => b.addEventListener("click", () => { timeline.stop(); apply(b.dataset.mode); }));
    fig.querySelector("[data-v-prev]").addEventListener("click", () => { timeline.stop(); go(-1); });
    next.addEventListener("click", () => { timeline.stop(); go(1); });

    apply("detailed", false);
    live(fig);
    if (reduced()) return;
    onceInView(fig, () => timeline.play(0));
  })();
})();
