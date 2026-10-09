# Cognitive load influence on page navigation (Part 2): article copy

Approved draft copy for `pages/research2.html`, exported from the working doc on 2026-10-09. This file is the source of truth for the page's text. The prototype (`research2-prototype.html`) uses a condensed version of the same copy. When the two differ, follow this file and apply the journal components: margin notes, highlights and captions. Facts confirmed by Bruno are listed at the end.

## Entry 01 — Context

This is the second part of a research project I've been working on since 2022. The first part, "Visual patterns in web page generation", focused on what a page is made of. This one focuses on how people move through it.

Let's go back to our axiom. We defined a web page as the combination of two pillars: visuals and content on one side, demographics and culture on the other. They influence each other. From the first two studies, we can already understand the first pillar: elements have form, function and component, they follow rules, and pages can be summarized into templates. The second pillar is still too hard to put into metrics.

We already know that the information on screen plays a big role in guiding us through the "flow" of navigation. But how, exactly?

That is the question behind the third round of tests, which we ran in 2024. Two of the questions I listed at the very beginning of this research were still open:

1. Does the position of an element on the page influence how people navigate it?
2. Does cognitive load influence page perception?

> Margin note — Part 1: "Visual patterns in web page generation" covers studies 1 and 2, the Form, Function, Component method and template summarization.

## Entry 02 — A page has weight

My hypothesis was simple to say and hard to test: people perceive a web page the way they perceive a physical object. Dense areas "weigh" more, and weight pulls attention.

To test it, we needed to give a flat page a third dimension. We used the information density mapping algorithm (developed by my research partner, behavioral scientist Annamarie Huttunen, and adapted for this study in 2023) to do three things:

1. Detect feature points on a screenshot of the page. Every edge of text, image or icon becomes a point. On the Lenovo cart page, that is thousands of points.
2. Group those points into a grid of 50 × 50 px cells and count them. The count in each cell is its density.
3. Use that density as the Z axis. The page stops being a flat image and becomes a terrain, with peaks where information piles up and valleys where there is white space.

The same algorithm also returns a Cognitive Load Index (CLI) from 0 to 100. It combines three measures: how far the information clusters are from each other, how many clusters there are, and how far the whitespace ratio is from an optimal 15%. The Lenovo cart page, for example, scored a CLI of 59.2.

Once a page is a 3D object with density, it has a center of mass.

> Margin note — Local vs global: we calculated the center of mass for the whole page (global) and for each 1920 × 1080 screen of it (local), because a visitor only ever sees one screen at a time.

## Entry 03 — Center of mass 101

This is an excuse for a mathematician to talk about math.

In a continuous system, the coordinates of the center of mass are the positions weighted by density, divided by the total mass:

CM_x = ∭ x · ρ(x, y, z) dV / ∭ ρ(x, y, z) dV

Our system is discrete: a grid of cells, each with its own mass (the density count). So the integrals become sums:

CM_x = Σ mᵢ xᵢ / Σ mᵢ        CM_y = Σ mᵢ yᵢ / Σ mᵢ

where mᵢ is the mass at each point (xᵢ, yᵢ). In practice, the center of mass is the point where the page would balance if you printed it on a sheet of uneven thickness and held it on a fingertip.

We calculated 51 local centers of mass across the six pages: 16 for Amazon, 17 for HP, 10 for Dell, 4 for Steam, and 2 each for Lenovo and PlayStation.

## Entry 04 — The eye-tracking study

With a center of mass for every screen, we could finally ask people's eyes whether it matters. The test worked like this:

1. We selected 6 random pages from the second round of tests: 2 pages from each category, 3 longer pages and 3 shorter ones.
2. We calculated all the local centers of mass for each screen (1920 × 1080 px).
3. We ran an eye-tracking test with no pre-determined tasks. People simply looked through each page, and we captured how they went over the information.
4. We compared the centers of mass with the test results.

No task was on purpose. A task tells people where to look. We wanted to see where the page itself takes them.

| Page | Category | Length | Screens (local CMs) |
| --- | --- | --- | --- |
| HP | Item detail | 17,053 px | 17 |
| Amazon | Item detail | 16,123 px | 16 |
| Dell | Item list | 9,886 px | 10 |
| Steam | Item list | 4,138 px | 4 |
| Lenovo | Cart | 1,846 px | 2 |
| PlayStation | Cart | 1,709 px | 2 |

We ran the test in iMotions with my research partner Annamarie Huttunen, who developed the density mapping and analysis, operated the software and collaborated on the findings. I had the theory; she had the tools. Each page was shown for 60 seconds, and each heatmap aggregates 14 participants recruited through UserTesting.com.

> Margin note — Why these pages: they come from the 30-page sample of study 2, so every page already had its Form, Function, Component classification and summarized template.

## Entry 05 — Gravity

The first and most important finding: people are drawn towards the center of mass. Overlaying the heatmaps with the local centers of mass, the hottest areas of attention cluster around the circle drawn at each screen's center of mass.

This was especially true in longer and more complicated pages. The more information a page carries, the stronger its pull. Behind each heatmap are two measures for every area of the page: how many times it was looked at, and when. Together they show fixation and looping around the centers of mass, which Entry 08 explores.

## Entry 06 — Movement

On long pages, the gaze doesn't scan evenly from top to bottom. It travels. Each screen has its own center of mass, and attention moves from one to the next, like stepping stones down the page.

The arrows on Amazon, Dell and HP show the same behavior: a focal group forms around a screen's center, then the gaze drops to the next one.

## Entry 07 — Assimilation span

Short pages behave differently. In smaller pages, people start paying attention to the content only after realizing there isn't more of the page to explore. The time between their first observation and the read-through is what I call the assimilation span.

The Lenovo cart page shows it clearly across 60 seconds:

1. 0–15 s: observing the top half, with 2 focal groups.
2. 15–35 s: dissipation. The gaze spreads out to observe the bottom half.
3. 35–60 s: assimilation. The focal groups come back, and this time people read the information.

On a long page, the pattern never completes. People observe the top scroll section for the first 15 seconds, and from 15 to 60 seconds the gaze only dissipates. They never reach the point where they know they've seen it all.

> Margin note — Compare the Lenovo heatmaps for 0–20 s and 40–60 s: same page, same people, two very different maps.

## Entry 08 — Attractors

Gravity explained where people look. It didn't explain how they move between those places. For that, I went back to physics, and then to chaos theory.

We mapped the order in which the gaze first entered each area of interest (AOI). Hit time is the average time that passed from the AOI start time until the gaze entered that AOI for the first time. The page was divided into a grid of 36 AOIs: columns A to F, rows 0 to 5, so B1 is column B, row 1. Looking at the first 18 AOIs, three things stood out:

1. Clockwise motion around the center of mass.
2. Dissipation when the gaze sits between two centers of mass.
3. Focal groups in specific areas around each center of mass.

The revisits told the same story. In the top 10 AOIs by number of revisits, the gaze cycles: people keep coming back to the same areas, and the number of revisits and the dwell time are directly proportional. There is one outlier: E1 has around 50% fewer revisits than B1, but the same dwell time.

This looks a lot like an attractor model. Think of a ball rolling over a surface with two wells. It orbits, crosses between them, and eventually settles in one. The Lorenz attractor is the famous example: a set of chaotic solutions where tiny changes in the starting point evolve into completely different trajectories. Our gaze paths share that shape: a few stable centers, constant orbiting, and paths that are never exactly the same twice.

## Entry 09 — What's next

In all honesty, this is the beginning, not a conclusion. Six pages and 14 people are enough to see a pattern, not to prove a law. But the data is promising, and we are ready for bigger experiments.

There are great opportunities in studying the relationship between human gaze behavior and attractor models. If attention really behaves like mass and gravity, then a layout isn't only arranged. It is balanced, and its balance can be measured before anyone sees it.

That brings us back to where this whole research started. How does human behavior impact visual generation and navigation? Our main objective is to understand and capture enough data to create an AI that can generate great page and flow design: one that knows not only what goes on a page, but where people's eyes will go.

If this got you interested in the subject, please reach out. There are lots of opportunities to help in this research.

> Margin note — Thanks: Annamarie Huttunen (behavioral scientist and research partner) and Leonardo Souza (product designer).

---

## Confirmed facts (from Bruno)

- The term is "assimilation span" (a span of time). The old decks say "spam"; that was a typo.
- Categories: Amazon and HP are item detail; Dell and Steam are item lists; Lenovo and PlayStation are carts.
- Eye tracking ran in iMotions, operated by Annamarie Huttunen, who also developed the density mapping and analysis. Credit her as **research partner**.
- 60 seconds per page. 14 participants, recruited through UserTesting.com.
- AOI grid: columns A–F, rows 0–5.
- Gravity is supported by per-area look counts and timelines (fixation and looping). There is no single percentage, so don't invent one.
- The heatmaps and screenshots of these public sites are approved for publication.
