/* Shared motion helpers for the homepage.
   Exposes window.Motion for the other homepage scripts (load this one first, with defer). */
(() => {
  const root = document.documentElement;
  root.classList.add("js"); // also set inline in <head> to avoid a flash before this runs

  const reduceMq = matchMedia("(prefers-reduced-motion: reduce)");
  const fineMq = matchMedia("(hover: hover) and (pointer: fine)");

  /* One shared IntersectionObserver; each element fires its callback once. */
  const callbacks = new Map();
  const io = "IntersectionObserver" in window
    ? new IntersectionObserver(entries => {
        entries.forEach(entry => {
          // Elements already scrolled past (e.g. after an anchor jump) count as seen
          const passed = entry.boundingClientRect.bottom < 0;
          if (!entry.isIntersecting && !passed) return;
          const cb = callbacks.get(entry.target);
          io.unobserve(entry.target);
          callbacks.delete(entry.target);
          if (cb) cb(entry.target);
        });
      }, { threshold: 0.2 })
    : null;

  const Motion = {
    reduced: () => reduceMq.matches,
    finePointer: () => fineMq.matches,

    onEnter(el, cb) {
      if (!el) return;
      if (!io) { cb(el); return; }
      callbacks.set(el, cb);
      io.observe(el);
    },
  };
  window.Motion = Motion;

  /* ---------- Reveal ---------- */
  document.querySelectorAll("[data-reveal]").forEach(el => {
    Motion.onEnter(el, target => target.classList.add("is-in"));
  });
})();
