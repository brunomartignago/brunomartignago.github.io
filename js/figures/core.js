/* Shared helpers for the interactive concept figures (js/figures/<case>.js).
   Load with defer before the case's figure script. Exposes window.Figures. */
window.Figures = (() => {
  const reduceMq = matchMedia("(prefers-reduced-motion: reduce)");
  const reduced = () => reduceMq.matches;
  const EASE_OUT = "cubic-bezier(.22,1,.36,1)";
  const EASE_LAND = "cubic-bezier(.34,1.56,.64,1)";

  const el = (tag, cls, style, text) => {
    const e = document.createElement(tag);
    if (cls) e.className = cls;
    if (style) e.setAttribute("style", style);
    if (text != null) e.textContent = text;
    return e;
  };
  const svg = (tag, attrs = {}) => {
    const e = document.createElementNS("http://www.w3.org/2000/svg", tag);
    Object.entries(attrs).forEach(([k, v]) => e.setAttribute(k, v));
    return e;
  };
  const pct = (x, y, w, h) => `left:${x}%;top:${y}%;width:${w}%;height:${h}%;`;
  const rnd = (a, b) => a + Math.random() * (b - a);
  const lerp = (a, b, t) => a + (b - a) * t;

  // Fires once, the first time the element is properly in view
  function onceInView(target, fn, threshold = 0.35) {
    if (!("IntersectionObserver" in window)) { fn(); return; }
    const io = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) { io.disconnect(); fn(); }
    }, { threshold });
    io.observe(target);
  }

  // Reports visibility changes (scrolling and tab switches)
  function watchVisible(target, fn, threshold = 0.25) {
    let onScreen = false;
    const report = () => fn(onScreen && !document.hidden);
    if ("IntersectionObserver" in window) {
      new IntersectionObserver(([entry]) => { onScreen = entry.isIntersecting; report(); }, { threshold }).observe(target);
    } else {
      onScreen = true;
    }
    document.addEventListener("visibilitychange", report);
    report();
  }

  // FLIP for a batch: read all, apply all, read all, then animate transforms back to rest
  function flip(nodes, apply, duration, easing = EASE_OUT) {
    const before = nodes.map(n => n.getBoundingClientRect());
    apply();
    if (reduced()) return;
    const after = nodes.map(n => n.getBoundingClientRect());
    nodes.forEach((n, i) => {
      const a = before[i], b = after[i];
      if (!b.width || !b.height || !a.width || !a.height) return;
      const dx = a.left - b.left, dy = a.top - b.top;
      const sx = a.width / b.width, sy = a.height / b.height;
      if (Math.abs(dx) < .5 && Math.abs(dy) < .5 && Math.abs(sx - 1) < .01 && Math.abs(sy - 1) < .01) return;
      n.animate(
        [{ transformOrigin: "0 0", transform: `translate(${dx}px, ${dy}px) scale(${sx}, ${sy})` },
         { transformOrigin: "0 0", transform: "none" }],
        { duration, easing }
      );
    });
  }

  // A small timeline that only advances while its figure is visible
  function stepper(fig, count, interval, onStep) {
    let visible = false, playing = false, timer = 0, at = 0;
    const tick = () => {
      clearTimeout(timer);
      if (!playing || at >= count - 1 || !visible) return;
      timer = setTimeout(() => {
        if (!playing || !visible) return;
        at++;
        onStep(at);
        tick();
      }, interval);
    };
    watchVisible(fig, v => { visible = v; tick(); }, 0.3);
    return {
      play(from = 0) { at = from; playing = true; tick(); },
      stop() { playing = false; clearTimeout(timer); },
    };
  }

  const live = fig => fig.classList.add("is-live");

  return { reduced, EASE_OUT, EASE_LAND, el, svg, pct, rnd, lerp, onceInView, watchVisible, flip, stepper, live };
})();
