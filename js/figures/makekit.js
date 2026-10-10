/* Make Kit concept figures: first kit vs live source, build order, eight builds, the router at work,
   ask the manifest and the anatomy of button.md. Data comes from assets/data/makekit (fetched
   relative to the page). Markup lives in pages/makekit.html; styles in css/figures.css.
   Load with defer after js/figures/core.js. */
(() => {
  if (!window.Figures) return;
  const { reduced, el, svg, onceInView, watchVisible, live } = window.Figures;

  const DATA = "../assets/data/makekit/";
  const cache = {};
  const load = name => (cache[name] ||= fetch(DATA + name).then(r => {
    if (!r.ok) throw new Error(r.status);
    return r.json();
  }));
  // Keep the fallback on screen and add a short note under it
  const fail = fig => {
    const box = fig.querySelector(".ifig-fallback");
    if (box && !box.querySelector(".fig-error")) box.append(el("p", "fig-error", null, "Interactive version unavailable: the kit data didn't load."));
  };
  /* ================= Fig 02 · First kit vs live source ================= */
  (() => {
    const fig = document.getElementById("cf-claims");
    if (!fig) return;
    const frame = fig.querySelector(".mk-c");
    const rows = [...fig.querySelectorAll(".mk-claim")];
    let timers = [];

    // Rows are fully visible without JS; "armed" hides each correction until its row is checked
    function run() {
      timers.forEach(clearTimeout);
      timers = [];
      rows.forEach(r => r.classList.remove("checked", "scanning"));
      if (reduced()) { frame.classList.remove("is-armed"); return; }
      frame.classList.add("is-armed");
      rows.forEach((r, i) => {
        timers.push(setTimeout(() => r.classList.add("scanning"), 200 + i * 800));
        timers.push(setTimeout(() => { r.classList.remove("scanning"); r.classList.add("checked"); }, 850 + i * 800));
      });
    }

    fig.querySelector("[data-c-run]").addEventListener("click", run);
    if (reduced()) return;
    frame.classList.add("is-armed");
    onceInView(fig, run, .4);
  })();
  /* ================= Fig 03 · Build order ================= */
  (() => {
    const fig = document.getElementById("cf-order");
    if (!fig || reduced()) return;
    // The chips are visible without JS; with motion they drop in once, build by build
    const grid = fig.querySelector(".mk-o-grid");
    [...grid.querySelectorAll(".kit")].forEach((k, i) => k.style.setProperty("--i", i));
    grid.classList.add("is-waiting");
    onceInView(grid, () => grid.classList.replace("is-waiting", "is-in"), .5);
  })();
  /* ================= Fig 04 · Eight builds ================= */
  (() => {
    const fig = document.getElementById("cf-builds");
    if (!fig) return;
    const stage = fig.querySelector(".mk-b-stage");
    const buttons = [...fig.querySelectorAll("[data-m]")];

    // From the study report, in Designer order D1–D4 (1 = the build did it)
    const MEASURES = {
      fieldset: { label: "Used real DDSFieldset + DDSLegend for the two option groups", red: [1, 1, 0, 1], full: [0, 1, 0, 0], c: "#60FFA2", note: "Reduced kit 3 of 4, full kit 1 of 4: the one kit difference that held up, in the unexpected direction." },
      tokens:   { label: "Invented a non-existent --dds-* token", red: [1, 1, 1, 1], full: [1, 1, 1, 1], c: "#FD93E2", note: "All 8 builds, both kits. Full guidance did not stop it, so the new kit adds a closed manifest of real tokens." },
      parts:    { label: "Guessed the undocumented modal and side-nav sub-parts", red: [1, 1, 1, 1], full: [1, 1, 1, 1], c: "#FFF260", note: "All 8 builds reached for the same sub-parts. They were the real pattern, just undocumented. Now they are." },
      tracker:  { label: "Hand-rolled a progress trail", red: [1, 1, 0, 1], full: [1, 1, 0, 1], c: "#60C2FF", note: "6 of 8 builds. DDSProgressTracker existed the whole time, it just wasn’t documented. Designer 3 used DDSProgressBar instead." },
    };
    // Which round each kit was in, per designer (Designer 4 ran the full kit first)
    const ROUND = { red: ["Build 1", "Build 1", "Build 1", "Build 2"], full: ["Build 2", "Build 2", "Build 2", "Build 1"] };
    const KITS = [["red", "Reduced kit"], ["full", "Full kit"]];
    const sum = a => a.reduce((x, y) => x + y, 0);

    const matrix = el("div", "mk-b-matrix");
    matrix.setAttribute("role", "img");
    const cols = {}, counts = {};
    KITS.forEach(([key, name]) => {
      const col = el("div", "mk-b-col");
      const head = el("h4");
      counts[key] = el("b");
      head.append(el("span", null, null, name), counts[key]);
      const dots = el("div", "mk-b-dots");
      cols[key] = [0, 1, 2, 3].map(i => {
        const d = el("div", "mk-b-dot", `--i:${i};`);
        d.append(`D${i + 1}`, el("small", null, null, ROUND[key][i]));
        dots.append(d);
        return d;
      });
      col.append(head, dots);
      matrix.append(col);
    });
    matrix.querySelectorAll("*").forEach(n => n.setAttribute("aria-hidden", "true"));
    const desc = el("p", "mk-b-desc");
    desc.setAttribute("aria-live", "polite");
    stage.append(matrix, desc);

    function set(key) {
      const m = MEASURES[key];
      stage.style.setProperty("--yes", m.c);
      KITS.forEach(([k]) => {
        counts[k].textContent = `${sum(m[k])}/4`;
        cols[k].forEach((d, i) => d.classList.toggle("yes", !!m[k][i]));
      });
      matrix.setAttribute("aria-label", `${m.label}: reduced kit ${sum(m.red)} of 4 builds, full kit ${sum(m.full)} of 4 builds.`);
      desc.replaceChildren(el("b", null, null, `${m.label}.`), ` ${m.note}`);
      buttons.forEach(b => b.setAttribute("aria-pressed", String(b.dataset.m === key)));
    }
    buttons.forEach(b => b.addEventListener("click", () => set(b.dataset.m)));
    set("fieldset");
    live(fig);
  })();
})();
