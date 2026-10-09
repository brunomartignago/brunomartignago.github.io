/* Cross-document View Transitions: a homepage "Other Projects" tile morphs into its case page's
   hero media, and back again. Progressive enhancement only; the CSS opt-in is in layout.css.

   Load this in <head> WITHOUT defer (pageswap/pagereveal can fire before deferred scripts run),
   together with <link rel="expect" blocking="render"> so the elements exist at first render.

   Only one element per page carries the shared name, and only if it is on screen: morphing into
   media below the fold would look like the tile falls off the page, so that case just crossfades. */
(() => {
  if (!("onpagereveal" in window)) return;

  const NAME = "case-hero";

  const tiles = () => [...document.querySelectorAll(".project-tile")];
  const caseHero = () => document.querySelector("[data-vt-hero]");

  const inView = el => {
    const r = el.getBoundingClientRect();
    return r.bottom > 0 && r.top < innerHeight;
  };

  // Homepage: the tile linking to `url`. Case page: its hero media.
  function target(url) {
    return caseHero() || tiles().find(t => url && t.href === url.split("#")[0]) || null;
  }

  function nameFor(el, transition) {
    // Clear leftovers (e.g. a page restored from the back/forward cache) so names stay unique
    [...tiles(), caseHero()].forEach(e => { if (e) e.style.viewTransitionName = ""; });
    if (!el || !inView(el)) return;

    // Case-page media that would otherwise still be waiting for its scroll reveal
    if (el.classList.contains("reveal")) {
      el.style.transition = "none";
      el.classList.add("is-visible");
    }

    el.style.viewTransitionName = NAME;
    transition.finished.finally(() => { el.style.viewTransitionName = ""; });
  }

  addEventListener("pageswap", e => {
    if (e.viewTransition) nameFor(target(e.activation && e.activation.entry.url), e.viewTransition);
  });

  addEventListener("pagereveal", e => {
    if (!e.viewTransition) return;
    const from = window.navigation && navigation.activation && navigation.activation.from;
    nameFor(target(from && from.url), e.viewTransition);
  });
})();
