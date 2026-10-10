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
  /* ================= Fig 05 · The router at work ================= */
  (() => {
    const fig = document.getElementById("cf-router");
    if (!fig) return;
    const stage = fig.querySelector(".mk-r-stage");
    const buttons = [...fig.querySelectorAll("[data-brief]")];

    const BRIEFS = {
      study: "A request form with a left side navigation and a card. Serial number text field with helper text, a device type dropdown, a description text area, an attachment upload, a priority radio group, a toggle for status updates and a checkbox. Cancel and Submit request buttons. A validation error state with a summary message. A confirmation modal. A status screen with a status indicator, a progress trail of stages and quick actions.",
      modal: "A confirmation modal: “Submit this request?” with a short summary and Cancel and Submit request buttons.",
      custom: "A settings page with tabs, a toggle for email notifications, a date picker and a save button.",
    };
    const TIERS = [
      ["ROUTER.md", f => f === "ROUTER.md" || f === "CHANGELOG.md"],
      ["core/", f => f.startsWith("core/")],
      ["reference/", f => f.startsWith("reference/")],
      ["accessibility/", f => f.startsWith("accessibility/")],
      ["manifests/", f => f.startsWith("manifests/")],
      ["skills/", f => f.startsWith("skills/")],
    ];
    const KB = bytes => bytes / 1000; // decimal KB, as in the article
    const escRe = s => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

    Promise.all([load("kit_sizes.json"), load("router_rules.json")]).then(([kit, routing]) => {
      const SIZES = kit.files, ALWAYS = kit.always_loaded, TOTAL = kit.total_bytes;
      const rules = routing.rules.map(r => ({ ...r, res: r.triggers.map(t => new RegExp(`\\b${escRe(t)}`, "gi")) }));

      // ---- Brief side ----
      const left = el("div", "mk-r-brief");
      const briefLabel = el("span", "k", null, "The brief");
      const briefText = el("div", "mk-r-text");
      const inputId = "mk-r-input";
      const inputLabel = el("label", "k", null, "Type a brief");
      inputLabel.htmlFor = inputId;
      const input = el("textarea", "mk-r-input");
      input.id = inputId;
      input.rows = 4;
      input.placeholder = "e.g. A settings page with tabs, a toggle for notifications and a save button";
      const inputBox = el("div", "mk-r-inputbox");
      inputBox.append(inputLabel, input);
      inputBox.hidden = true;

      const meter = el("div", "mk-r-meter");
      const kbOut = el("b", null, null, "0");
      const ofOut = el("span", null, null, "");
      const num = el("div", "num");
      const left1 = el("span");
      left1.append(kbOut, " KB loaded");
      num.append(left1, ofOut);
      const bar = el("div", "bar");
      const fill = el("div", "fill");
      bar.append(fill);
      meter.append(num, bar);
      const summary = el("p", "sr-only");
      summary.setAttribute("aria-live", "polite");
      left.append(briefLabel, briefText, inputBox, meter, summary);

      // ---- Kit side ----
      const right = el("div", "mk-r-kit");
      right.append(el("span", "k", null, `The kit · ${kit.total_files} files`));
      const legend = el("div", "mk-r-legend");
      [["always", "always (core + router)"], ["on", "matched"], ["req", "required dependency"]].forEach(([c, t]) => {
        const s = el("span");
        s.append(el("i", c), t);
        legend.append(s);
      });
      right.append(legend);
      const chips = {};
      TIERS.forEach(([name, test]) => {
        const files = Object.keys(SIZES).filter(test).sort();
        const tier = el("div", "mk-r-tier");
        const h = el("h5", null, null, name);
        h.append(el("span", null, null, `${files.length} files · ${KB(files.reduce((a, f) => a + SIZES[f], 0)).toFixed(0)} KB`));
        const box = el("div", "mk-r-files");
        files.forEach(f => {
          const c = el("span", "mk-r-chip", null, f.split("/").pop().replace(/\.(md|json)$/, ""));
          c.title = `${f} · ${KB(SIZES[f]).toFixed(1)} KB`;
          box.append(c);
          chips[f] = c;
        });
        tier.append(h, box);
        right.append(tier);
      });
      right.setAttribute("aria-hidden", "true"); // the live summary speaks for the tree
      stage.append(left, right);

      // ---- Routing: match triggers anywhere in the brief, add one hop of requirements ----
      function route(text) {
        const matched = new Set(), req = new Set(), hits = [];
        rules.forEach(r => {
          if (!r.res.some(re => { re.lastIndex = 0; return re.test(text); })) return;
          r.load.forEach(f => matched.add(f));
          r.requires.forEach(f => req.add(f));
          r.res.forEach(re => { re.lastIndex = 0; let m; while ((m = re.exec(text))) hits.push([m.index, m.index + m[0].length]); });
        });
        matched.forEach(f => req.delete(f));
        ALWAYS.forEach(f => { matched.delete(f); req.delete(f); });
        return { matched, req, hits };
      }
      function highlight(text, hits) {
        hits.sort((a, b) => a[0] - b[0]);
        const merged = [];
        hits.forEach(h => { const last = merged[merged.length - 1]; if (last && h[0] <= last[1]) last[1] = Math.max(last[1], h[1]); else merged.push([...h]); });
        const frag = document.createDocumentFragment();
        let p = 0;
        merged.forEach(([s, e]) => { frag.append(text.slice(p, s), el("mark", null, null, text.slice(s, e))); p = e; });
        frag.append(text.slice(p));
        briefText.replaceChildren(frag);
      }

      let timers = [];
      function show(text, animate) {
        timers.forEach(clearTimeout);
        timers = [];
        const { matched, req, hits } = route(text);
        if (!briefText.hidden) highlight(text, hits);
        Object.values(chips).forEach(c => c.classList.remove("on", "req", "always"));
        const seq = [...ALWAYS.map(f => [f, "always"]), ...[...matched].map(f => [f, "on"]), ...[...req].map(f => [f, "req"])];
        let bytes = 0, n = 0;
        const apply = ([f, cls]) => {
          if (chips[f]) chips[f].classList.add(cls);
          bytes += SIZES[f] || 0;
          n++;
          const pct = Math.round(bytes / TOTAL * 100);
          kbOut.textContent = String(Math.round(KB(bytes)));
          ofOut.textContent = `of ${Math.round(KB(TOTAL))} KB · ${n} files · ${pct}%`;
          fill.style.setProperty("--w", `${(bytes / TOTAL * 100).toFixed(1)}%`);
        };
        const done = () => { summary.textContent = `This brief loads ${n} files: ${Math.round(KB(bytes))} KB, ${Math.round(bytes / TOTAL * 100)}% of the kit.`; };
        if (!animate || reduced()) { seq.forEach(apply); done(); return; }
        seq.forEach((s, i) => timers.push(setTimeout(() => { apply(s); if (i === seq.length - 1) done(); }, 60 * i)));
      }

      function setBrief(key, animate = true) {
        buttons.forEach(b => b.setAttribute("aria-pressed", String(b.dataset.brief === key)));
        const custom = key === "custom";
        inputBox.hidden = !custom;
        briefText.hidden = custom;
        if (custom) {
          if (!input.value) input.value = BRIEFS.custom;
          show(input.value, false);
          input.focus();
        } else {
          show(BRIEFS[key], animate);
        }
      }
      buttons.forEach(b => b.addEventListener("click", () => setBrief(b.dataset.brief)));
      input.addEventListener("input", () => show(input.value, false));

      live(fig);
      briefText.textContent = BRIEFS.study;
      if (reduced()) { setBrief("study", false); return; }
      // Files light up once the figure is in view
      onceInView(right.parentNode, () => setBrief("study"), .3);
    }).catch(() => fail(fig));
  })();
  /* ================= Fig 06 · Ask the manifest ================= */
  (() => {
    const fig = document.getElementById("cf-manifest");
    if (!fig) return;
    const input = fig.querySelector(".mk-m-input");
    const out = fig.querySelector(".mk-m-verdict");
    const tries = [...fig.querySelectorAll(".mk-m-try button")];

    const lev = (a, b) => {
      const d = Array.from({ length: a.length + 1 }, (_, i) => [i]);
      for (let j = 1; j <= b.length; j++) d[0][j] = j;
      for (let i = 1; i <= a.length; i++) {
        for (let j = 1; j <= b.length; j++) {
          d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
        }
      }
      return d[a.length][b.length];
    };

    load("manifest.json").then(man => {
      const exports = man.exports;
      const names = [...new Set(exports.map(e => e.n))];

      const verdict = (cls, big, ...body) => {
        out.className = `mk-m-verdict ${cls}`;
        const p = el("p");
        p.append(...body);
        out.replaceChildren(el("span", "big", null, big), p);
      };
      const name = n => el("b", null, null, n);

      function check(raw) {
        const v = raw.trim();
        if (!v) { verdict("", "?", "Type a component name, e.g. DDSButton."); return; }
        const hit = exports.find(e => e.n === v);
        if (hit) {
          const part = hit.c && hit.c.startsWith("part of");
          verdict(hit.u ? "v-close" : "v-real", hit.u ? "Unverified" : "Real",
            name(v), part ? ` is in the manifest, as a composition part (${hit.c}).` : ` is in the manifest · ${hit.c}.`,
            hit.u ? " Carried over from the first kit and not yet confirmed live: check before using it." : "");
          return;
        }
        // Not an exact name: try the same name in another case, then the closest within 3 edits
        const low = v.toLowerCase();
        const near = names.find(n => n.toLowerCase() === low)
          || names.map(n => [n, lev(n.toLowerCase(), low)]).sort((a, b) => a[1] - b[1]).find(([, d]) => d <= 3)?.[0];
        if (near) verdict("v-close", "Not real", name(v), " isn't in the manifest, so it doesn't exist. Did you mean ", name(near), "?");
        else verdict("v-fake", "Not real", name(v), " isn't in the manifest, so it doesn't exist. However plausible it sounds.");
      }

      input.addEventListener("input", () => check(input.value));
      tries.forEach(b => b.addEventListener("click", () => { input.value = b.textContent; check(b.textContent); }));
      check(input.value);
      live(fig);
    }).catch(() => fail(fig));
  })();
  /* ================= Fig 07 · Anatomy of button.md ================= */
  (() => {
    const fig = document.getElementById("cf-anatomy");
    if (!fig) return;
    const stage = fig.querySelector(".mk-a-stage");

    // Excerpts from the kit's reference/components/button.md (fixed content, so set as HTML)
    const SECTIONS = [
      ["Description", '<p>The primary interactive trigger for actions — submitting a form, opening a modal, confirming or canceling.</p><p class="mk-a-aside">Includes a correction note: this file previously listed incomplete <code>color</code> and <code>kind</code> values and defaulted <code>size</code> to <code>md</code>. Confirmed live now.</p>'],
      ["When to use / not", "<ul><li>Trigger an action on a page; complete tasks in forms and modals.</li><li><b>Not</b> for navigation to another page — use <code>DDSLink</code>.</li><li><b>Not</b> for metadata or filtering — use <code>DDSTag</code>.</li></ul>"],
      ["Props", '<div class="mk-a-table"><table><tr><th scope="col">Prop</th><th scope="col">Type</th><th scope="col">Default</th></tr><tr><td><code>kind</code></td><td>filled | outline | minimal | ghost</td><td>filled</td></tr><tr><td><code>size</code></td><td>xs | sm | md | lg</td><td><b>lg</b> — not md</td></tr><tr><td><code>color</code></td><td>brand | destructive | success | neutral</td><td>brand</td></tr><tr><td><code>iconOnly</code></td><td>boolean — requires aria-label</td><td>false</td></tr><tr><td><code>variant</code></td><td>default | ai</td><td>default</td></tr></table></div>'],
      ["Usage", '<pre>&lt;DDSButton kind="filled" color="brand" size="md"&gt;Primary action&lt;/DDSButton&gt;\n&lt;DDSButton kind="outline" color="neutral" size="md"&gt;Secondary action&lt;/DDSButton&gt;\n\n{/* Icon-only — requires aria-label, never bare */}\n&lt;DDSButton kind="ghost" size="sm" iconOnly aria-label="Clear search text"&gt;\n  &lt;DDSIcon name="close-x" size="xs" /&gt;\n&lt;/DDSButton&gt;</pre>'],
      ["Layout", "<ul><li>Inside modals, popovers and cards: right-aligned.</li><li>Maximum 2 visible buttons per content section — group the rest in a <code>DDSActionMenu</code>.</li><li><code>filled</code> for the primary action, <code>outline</code> secondary, <code>minimal</code> tertiary.</li></ul>"],
      ["States", '<div class="mk-a-table"><table><tr><th scope="col">State</th><th scope="col">Behavior</th></tr><tr><td>Rest</td><td>Starting/ending state</td></tr><tr><td>Hover</td><td>Highlight appears</td></tr><tr><td>Focus</td><td>Visible outline via keyboard navigation</td></tr><tr><td>Inactive</td><td>40% opacity — still needs 3:1 contrast</td></tr></table></div>'],
      ["Accessibility", "<ul><li>Labels unique and descriptive — never “Click Here”.</li><li><code>iconOnly</code> buttons always carry <code>aria-label</code>.</li><li>Destructive buttons pair with a non-color cue, and irreversible actions need a confirmation step.</li></ul>"],
      ["Content", "<ul><li>Fewer than 3 words, title case, starting with a verb.</li><li>One action per label — never “Save and Exit”.</li><li>No punctuation.</li></ul>"],
      ["Not a substitute for", '<div class="mk-a-table"><table><tr><th scope="col">Component</th><th scope="col">Because</th></tr><tr><td><code>DDSLink</code></td><td>Button triggers actions; Link navigates to another page</td></tr><tr><td><code>DDSTag</code></td><td>Button is an action trigger; Tag is metadata/filter display</td></tr></table></div>'],
    ];
    const NEW = 8; // "Not a substitute for" is the section the new kit added

    const list = el("div", "mk-a-tabs");
    list.setAttribute("role", "tablist");
    list.setAttribute("aria-label", "Sections of button.md");
    list.setAttribute("aria-orientation", "vertical");
    const panel = el("div", "mk-a-pane");
    panel.id = "mk-a-panel";
    panel.setAttribute("role", "tabpanel");
    panel.tabIndex = 0;

    const tabs = SECTIONS.map(([title], i) => {
      const t = el("button", "mk-a-tab");
      t.type = "button";
      t.id = `mk-a-tab-${i}`;
      t.setAttribute("role", "tab");
      t.setAttribute("aria-controls", panel.id);
      t.append(el("span", "n", null, String(i + 1)), el("span", "t", null, title));
      if (i === NEW) t.append(el("span", "new", null, "New"));
      list.append(t);
      return t;
    });
    stage.append(list, panel);

    function select(i, focus) {
      tabs.forEach((t, j) => {
        t.setAttribute("aria-selected", String(j === i));
        t.tabIndex = j === i ? 0 : -1;
      });
      panel.setAttribute("aria-labelledby", tabs[i].id);
      panel.innerHTML = `<h4>${i + 1} · ${SECTIONS[i][0]}${i === NEW ? ' <span class="new">New</span>' : ""}</h4>${SECTIONS[i][1]}`;
      if (focus) tabs[i].focus();
    }

    tabs.forEach((t, i) => {
      t.addEventListener("click", () => select(i));
      t.addEventListener("keydown", e => {
        const last = tabs.length - 1;
        let to = null;
        if (e.key === "ArrowDown" || e.key === "ArrowRight") to = i === last ? 0 : i + 1;
        else if (e.key === "ArrowUp" || e.key === "ArrowLeft") to = i === 0 ? last : i - 1;
        else if (e.key === "Home") to = 0;
        else if (e.key === "End") to = last;
        if (to === null) return;
        e.preventDefault();
        select(to, true);
      });
    });

    select(NEW);
    live(fig);
  })();
})();
