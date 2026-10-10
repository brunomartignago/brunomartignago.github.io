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
})();
