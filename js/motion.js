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

  /* ---------- Footer headline: split into per-letter spans (before the reveal observes it) ---------- */
  const talk = document.querySelector(".talk");
  if (talk) {
    const words = talk.textContent.trim().split(/\s+/);
    talk.textContent = "";
    let i = 0;
    words.forEach(word => {
      const wd = document.createElement("span");
      wd.className = "wd";
      wd.setAttribute("aria-hidden", "true");
      [...word].forEach(letter => {
        const ch = document.createElement("span");
        ch.className = "ch";
        ch.style.setProperty("--i", i++);
        ch.textContent = letter;
        wd.append(ch);
      });
      talk.append(wd);
    });
  }

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

  /* ---------- Magnetic footer buttons (desktop only) ---------- */
  const footer = document.querySelector(".footer-cta");
  const mags = footer ? [...footer.querySelectorAll(".mag")] : [];
  if (mags.length) {
    const REACH = 160; // px
    const MAX = 8;     // px
    const clampPull = v => Math.max(-MAX, Math.min(MAX, v));
    footer.addEventListener("pointermove", e => {
      if (!Motion.finePointer() || Motion.reduced()) return;
      mags.forEach(mag => {
        const r = mag.getBoundingClientRect();
        const dx = e.clientX - (r.left + r.width / 2);
        const dy = e.clientY - (r.top + r.height / 2);
        const dist = Math.hypot(dx, dy);
        if (dist < REACH) {
          const f = (1 - dist / REACH) * 0.35;
          mag.style.transform = `translate(${clampPull(dx * f).toFixed(1)}px, ${clampPull(dy * f).toFixed(1)}px)`;
        } else {
          mag.style.transform = "";
        }
      });
    });
    footer.addEventListener("pointerleave", () => mags.forEach(mag => { mag.style.transform = ""; }));
  }

  /* ---------- Other Projects case cards: video preview on hover/focus (desktop only) ---------- */
  // The video sits in the card's main piece (.cc-main); src is set on first hover (preload="none")
  // and the card gets .is-playing once the video is actually playing
  document.querySelectorAll("a.case-card").forEach(tile => {
    const video = tile.querySelector(".tile-video");
    if (!video) return;
    let active = false;
    video.addEventListener("playing", () => {
      if (active) tile.classList.add("is-playing");
    });
    const start = () => {
      if (!Motion.finePointer() || Motion.reduced()) return;
      active = true;
      if (!video.getAttribute("src")) video.src = video.dataset.src;
      const p = video.play();
      if (p) p.catch(() => {});
      if (!video.paused && video.readyState > 2) tile.classList.add("is-playing");
    };
    const stop = () => {
      active = false;
      tile.classList.remove("is-playing");
      video.pause();
    };
    tile.addEventListener("pointerenter", start);
    tile.addEventListener("focus", start);
    tile.addEventListener("pointerleave", stop);
    tile.addEventListener("blur", stop);
  });

})();
