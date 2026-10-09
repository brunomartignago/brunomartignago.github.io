/* Case pages: the research journal.
   Reveals (text fade-up, figure placement, highlighter), stat count-up, Contents scrollspy,
   "N min left", the Contents <details> on small screens, sticky-note tilt and the figure lightbox.
   Load with defer after js/motion.js, which provides window.Motion and the progress bar fallback. */
(() => {
  const root = document.documentElement;
  root.classList.add("js");

  const reduceMq = matchMedia("(prefers-reduced-motion: reduce)");
  const reduced = () => reduceMq.matches;
  const WPM = 220;

  /* ---------- Reveals ---------- */
  // Own observer with threshold 0: some figures are taller than several screens and would never
  // reach the 20% the homepage observer waits for.
  function countUp(el) {
    if (el.dataset.counted) return;
    el.dataset.counted = "1";
    const target = parseFloat(el.dataset.count);
    const decimals = el.dataset.decimals != null ? +el.dataset.decimals : 2;
    const suffix = el.dataset.suffix || "";
    const render = v => { el.textContent = v.toFixed(decimals) + suffix; };
    if (reduced()) { render(target); return; }
    const t0 = performance.now(), dur = 1100;
    const frame = now => {
      const p = Math.min(1, (now - t0) / dur);
      render(target * (1 - Math.pow(1 - p, 3)));
      if (p < 1) requestAnimationFrame(frame);
    };
    requestAnimationFrame(frame);
  }

  const reveal = el => {
    el.classList.add("in");
    if (el.matches("[data-count]")) countUp(el);
    el.querySelectorAll("[data-count]").forEach(countUp);
  };

  const targets = document.querySelectorAll(".rv");
  if ("IntersectionObserver" in window) {
    const io = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        const passed = entry.boundingClientRect.bottom < 0;
        if (!entry.isIntersecting && !passed) return;
        reveal(entry.target);
        io.unobserve(entry.target);
      });
    }, { threshold: 0, rootMargin: "0px 0px -8% 0px" });
    targets.forEach(el => io.observe(el));
  } else {
    targets.forEach(reveal);
  }

  /* ---------- Sticky notes: a small, fixed tilt per note (between -1.6deg and 1.6deg) ---------- */
  const TILTS = [1.2, -1.4, 0.8, -1, 1.6, -0.6, 1, -1.6];
  document.querySelectorAll(".mnote").forEach((note, i) => {
    note.style.setProperty("--r", TILTS[i % TILTS.length] + "deg");
  });

  /* ---------- Read time + "N min left" ---------- */
  const article = document.querySelector("main");
  const words = article ? article.textContent.trim().split(/\s+/).length : 0;
  const totalMin = Math.max(1, Math.round(words / WPM));
  document.querySelectorAll("[data-read-time]").forEach(el => { el.textContent = `~${totalMin} min`; });
  const readLeft = document.querySelector("[data-read-left]");

  /* ---------- Contents scrollspy ---------- */
  const links = [...document.querySelectorAll(".toc a[href^='#']")];
  const sections = links.map(a => document.getElementById(a.getAttribute("href").slice(1)));

  let queued = false;
  function onScroll() {
    queued = false;
    const max = document.documentElement.scrollHeight - innerHeight;
    const p = max > 0 ? Math.min(1, scrollY / max) : 0;
    if (readLeft) {
      readLeft.textContent = p > 0.97
        ? "Finished · thanks for reading"
        : `${Math.max(1, Math.round(totalMin * (1 - p)))} min left`;
    }
    let active = 0;
    sections.forEach((s, i) => { if (s && s.getBoundingClientRect().top < innerHeight * 0.35) active = i; });
    links.forEach((a, i) => {
      if (i === active) a.setAttribute("aria-current", "true");
      else a.removeAttribute("aria-current");
    });
  }
  addEventListener("scroll", () => {
    if (!queued) { queued = true; requestAnimationFrame(onScroll); }
  }, { passive: true });
  addEventListener("resize", onScroll);
  onScroll();

  links.forEach(a => a.addEventListener("click", e => {
    const target = document.getElementById(a.getAttribute("href").slice(1));
    if (!target) return;
    e.preventDefault();
    target.scrollIntoView({ behavior: reduced() ? "auto" : "smooth" });
    history.replaceState(null, "", a.getAttribute("href"));
    if (smallScreen.matches && toc) toc.open = false;
  }));

  /* ---------- Contents: always open on wide screens, collapsed by default below 900px ---------- */
  const toc = document.querySelector("details.toc");
  const smallScreen = matchMedia("(max-width: 900px)");
  if (toc) {
    const summary = toc.querySelector("summary");
    const sync = () => {
      toc.open = !smallScreen.matches;
      // On wide screens the summary is just a heading, not a toggle
      if (smallScreen.matches) summary.removeAttribute("tabindex");
      else summary.setAttribute("tabindex", "-1");
    };
    summary.addEventListener("click", e => { if (!smallScreen.matches) e.preventDefault(); });
    smallScreen.addEventListener("change", sync);
    sync();
  }

  /* ---------- Hero videos respect reduced motion ---------- */
  if (reduced()) {
    document.querySelectorAll("video[autoplay]").forEach(v => {
      v.pause();
      v.removeAttribute("autoplay");
      v.controls = true;
    });
  }

  /* ---------- Lightbox ---------- */
  const zoomButtons = document.querySelectorAll(".fig-zoom");
  if (zoomButtons.length && typeof HTMLDialogElement === "function") {
    const box = document.createElement("dialog");
    box.className = "lightbox";
    box.setAttribute("aria-label", "Enlarged figure");
    box.innerHTML =
      '<button type="button" class="lightbox-close">Close · Esc</button>' +
      "<figure><img alt=\"\"><figcaption></figcaption></figure>";
    document.body.append(box);
    const img = box.querySelector("img");
    const cap = box.querySelector("figcaption");
    let opener = null;

    zoomButtons.forEach(btn => btn.addEventListener("click", () => {
      const source = btn.querySelector("img");
      if (!source) return;
      const caption = btn.closest("figure").querySelector(":scope > figcaption");
      img.src = source.currentSrc || source.src;
      img.alt = source.alt;
      cap.innerHTML = caption ? caption.innerHTML : "";
      box.classList.toggle("is-tall", source.naturalHeight > source.naturalWidth * 2.2);
      opener = btn;
      box.showModal();
      box.scrollTop = 0;
      box.querySelector(".lightbox-close").focus();
    }));

    const close = () => box.close();
    box.addEventListener("click", close);
    box.addEventListener("close", () => {
      img.removeAttribute("src");
      if (opener) opener.focus();
    });
  }

  window.Journal = { reduced };
})();
