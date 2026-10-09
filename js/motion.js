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
  // Adds .is-in once and fires "motion:in" so other effects can start with it
  document.querySelectorAll("[data-reveal]").forEach(el => {
    Motion.onEnter(el, target => {
      target.classList.add("is-in");
      target.dispatchEvent(new CustomEvent("motion:in"));
    });
  });

  /* ---------- Header: compact after 80px, scroll progress fallback ---------- */
  const header = document.querySelector(".site-header");
  if (header) {
    const progress = header.querySelector(".header-progress");
    const cssProgress = window.CSS && CSS.supports("animation-timeline: scroll()");
    let queued = false;
    const update = () => {
      queued = false;
      const y = window.scrollY;
      header.classList.toggle("is-compact", y > 80);
      if (progress && !cssProgress) {
        const max = document.documentElement.scrollHeight - innerHeight;
        progress.style.setProperty("--progress", max > 0 ? Math.min(1, y / max).toFixed(4) : "0");
      }
    };
    addEventListener("scroll", () => {
      if (!queued) { queued = true; requestAnimationFrame(update); }
    }, { passive: true });
    update();
  }

  /* ---------- Tags: each sticker settles at its own small tilt ---------- */
  document.querySelectorAll(".tag").forEach(tag => {
    tag.style.setProperty("--rot", (Math.random() * 6 - 3).toFixed(1) + "deg");
  });

  /* ---------- Research diagram: draw on view, replay on hover/click ---------- */
  const diagram = document.getElementById("diagram");
  const diagramProject = diagram && diagram.closest(".project");
  if (diagram && diagramProject) {
    const draw = () => {
      if (Motion.reduced()) return;
      diagram.classList.remove("draw");
      void diagram.getBoundingClientRect(); // restart the CSS animations
      diagram.classList.add("draw");
    };
    diagramProject.addEventListener("motion:in", draw);
    diagram.addEventListener("mouseenter", () => {
      if (diagramProject.classList.contains("is-in")) draw();
    });
    diagram.addEventListener("click", draw);
  }
})();
