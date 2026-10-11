# DDS v3 Make Kit: article copy

This is the approved copy for `pages/makekit.html`, and the source of truth for the page's text. The prototype (`makekit-prototype.html`) uses a condensed version of the same copy. Where they differ, follow this file. Confirmed facts and publishing rules are at the end.

## Cover

Lede: "Figma Make turns a written prompt into a working prototype. To build with Dell's own design system instead of generic parts, it reads a set of guidelines called a Make Kit. This is how I rebuilt that kit after a study showed where the first version was failing, and how its new structure makes every generation cheaper and more trustworthy."

Index card adds a System row: "Dell Design System (DDS) v3, in Figma Make". Throughout the page, the earlier kit is called "the first kit", never "the old kit".

## Entry 01 — Context

Page title: "A design system, an AI builder and the kit between them". Contents label: "Context". This entry is written for readers who have never heard of DDS, Figma Make or the first kit.

Dell's product teams design and build with a shared design system called DDS, the Dell Design System. It's the one source for every button, form field, modal and navigation pattern, and for the tokens behind them: the named colors, spacing and type sizes that make Dell's products look and behave like one family. Version 3 is the current one.

Figma Make is Figma's AI builder. You describe a screen in plain language, and it writes a working, clickable prototype in code. On its own, it reaches for generic parts. To build with a specific design system, it needs a Make Kit.

> Dictionary entry (DEF. 01) — **Make Kit**, noun · Figma Make. A package that teaches Figma Make to build with one design system. It has two halves: (1) the system's real code components, the only parts Make is allowed to build with; (2) written guidelines Make reads before it generates anything: which components exist, which settings (props) they take, which tokens are allowed, and when to use each one. See also: this case is about the second half.

Those guidelines decide whether a prototype only looks like a Dell product or is built like one. When they're right, designers explore ideas with the real components, the real accessibility behavior and the real tokens, and what they make is close to what engineering can ship. When they're wrong, Make doesn't hesitate. It fills the gaps with things that sound right. When the kit is wrong, Make is wrong with total confidence.

> Margin note — Tokens: named values like `--dds-*` instead of raw hex codes or pixel sizes, so a change in the system reaches every screen at once.

## Entry 02 — Confident, but wrong

The first DDS Make Kit got designers building with the system in Figma Make. But it had been written partly from memory and from an older reference copy, and over time it drifted from what DDS v3 actually ships. Designers felt it as a pattern: ask for a screen, and Make would come back with a component using a setting that doesn't exist, or a hand-built imitation of a component that was there all along.

Four examples, checked against the live system (shown on the page as Fig. 02):

- `DDSButton` was missing an entire `kind` value (`minimal`) and had the wrong default size.
- `DDSModal` documented three props that don't exist in v3.
- `DDSProgressTracker`, a real, fully built component, wasn't documented anywhere.
- `DDSSidenav` was consistently guessed as `DDSSideNav`, because the correct casing was never written down.

The structure didn't help either. The first kit was one entry file with a fixed reading list, plus a folder of component pages to open by exact path. There was no map of what existed, and nothing said which guidance belonged with which component.

None of this was anyone's fault. It's what happens when documentation gets copied forward instead of re-checked.

## Entry 03 — The study

I designed and ran a study before rewriting anything, because I wanted to know what the guidance was actually doing. So we asked a narrower question: does built-in accessibility guidance change what gets built?

Four designers built the same brief twice, an internal "Device Support Request" tool: a request form, its validation-error state and a confirmation modal, plus a status screen as a stretch goal. One build used the full kit. The other used an identical copy with the accessibility guidance removed. Only the kit changed between rounds.

To separate the kit from "people get better on their second try", the order was mixed: three designers built with the reduced kit first, one with the full kit first. Then we read all eight builds line by line and compared the code with what the designers said in a group interview.

> Margin note — The brief: one screen or state per prompt, stay inside Make, no hand-fixing in Figma Design. Being blocked counted as a finding.

## Entry 04 — What the code said

The headline finding was a caution, not a win. Across the accessibility patterns we could check in code (labels, errors linked to their fields, heading structure, dialog semantics), the full kit's builds were not more accessible than the reduced kit's.

The one difference that held up went the other way. For the two required groups of options on the form, the reduced kit's builds used the real `DDSFieldset` and `DDSLegend` components in 3 of 4 builds. The full kit's builds did it in 1 of 4.

Feelings and code also diverged. The group felt the full kit was more accessible and consistent. The code mostly didn't agree. Some problems showed up in all eight builds, whichever kit was used:

- every build invented the same undocumented sub-parts for the modal and the side navigation;
- every build invented plausible but non-existent `--dds-*` tokens;
- most builds hand-rolled a progress trail, because the real component was undocumented.

That changed the plan. More guidance wasn't the lever. Structure and truth were: the right file at the right moment, and nothing in it that isn't real.

> Margin note — Small sample: 4 designers, 8 builds, static code review. We treated every finding as a lead, not a law.

## Entry 05 — Back to the source

We didn't patch a few prop tables. We went back to the live DDS v3 source and checked every component against it: its Storybook entries, its rendered examples, its actual props, before a line of guidance was written.

| Number | What it counts |
| --- | --- |
| 50 | components documented, up from 46 |
| 49 | components independently verified against the live system |
| 36 | documentation pairs merged from two independent sources |
| 20 | broken cross-references fixed |

Part of the rebuild merged a second, independently written pass at the same documentation. Where the two disagreed on a fact, the rule was simple: re-verify against the live source, and if it's still uncertain, say so in the file. A kit that quietly resolves conflicts looks equally confident either way. This one doesn't.

> Margin note — New first-class components: `DDSTable`, `DDSSearch`, `DDSTimePicker` and `DDSViewMoreLess`.

## Entry 06 — One kit, five tiers

Instead of one fixed reading list, the new kit is organized in tiers, so Figma Make only loads what a task needs:

- `ROUTER.md`: the front door, read first in every session.
- `core/`: always loaded. Hard rules, setup, best practices.
- `reference/`: one file per component, one consistent shape.
- `accessibility/`: cross-cutting guidance by category, pulled in as a dependency.
- `manifests/`: machine-checkable JSON, the closed set of what's real.
- `skills/`: rare, situational guidance, like AI mode, dark mode and carousels.

Every file carries a small frontmatter block: its tier, the phrases that should trigger it, and what it requires. The accessibility guidance that sat orphaned in the first kit is now a hard dependency of the components that need it.

> Margin note — One hop only: if A requires B and B requires C, C isn't pulled in. Chasing chains is the unbounded reading this design avoids.

## Entry 07 — Load only what the brief needs

The router scans the whole brief against a trigger table. A brief that mentions a date picker loads `date-picker.md`, and also `form-field.md`, because that's a hard dependency, not optional reading.

That's where "cheaper" comes from. The kit grew to 69 guideline files and 474 KB, but no session reads all of it:

- The full study brief (a form with ten field types, a side nav, a modal and a status screen) loads 29 files: 175 KB, 37% of the kit.
- A single confirmation modal loads 9 files: 63 KB, 13% of the kit.

Less to read means fewer tokens per session, and fewer chances for the model to latch onto guidance meant for something else.

> Margin note — Measured from the kit files. Manifests are only opened on demand, e.g. to check whether a token or icon exists.

## Entry 08 — If it's not in the manifest, it doesn't exist

Documentation alone didn't stop invention. In the study, every build made up plausible `--dds-*` tokens, even with the full guidance loaded. So the kit now has an enforcement layer.

`manifests/components.json` is a closed set. If a `DDS*` name isn't in there, it does not exist, no matter how plausible it sounds. The same goes for tokens and icons. An AI code generator can no longer confidently invent a component that merely sounds real.

## Entry 09 — Same nine sections, every time

Every component file now follows the same shape, so you always know where to look: Description · When to use / when not to use · Props · Usage · Layout · States · Accessibility · Content · Not a substitute for.

The last section is new, and one of the most useful: a quick table saying why this isn't the component you want if you're tempted to use it for the wrong job. `DDSTag` is not a substitute for `DDSBadge`, because Tag is interactive and dismissible, and Badge is a non-interactive status display.

The study's gaps became files too. The modal and side-nav compositions every build had to guess are now documented, and loaded automatically whenever their parent component is.

## Entry 10 — Results and what's next

The biggest difference you feel with the new kit is confidence: fewer invented props, fewer hand-rolled substitutes for components that already exist, and an explicit signal whenever something is genuinely uncertain, instead of everything sounding equally sure.

The kit is now integrated for every designer at Dell, and other design system teams have used it as the base for bringing their own guidance up to the same standard. In our weekly meetings with Figma, their team described it as one of the most advanced Make Kits among the companies using Figma Make.

Documentation solves half the problem. The other half is getting matching code out of Figma Make. Figma's MCP server gives an AI coding agent the real structure, variables and Code Connect mappings of a design. The Make Kit gives it the real components and props. Together, the agent never has to guess either one.

Next: bring the kit and the MCP workflow to more teams, treat every conflict note in the kit as an open question, and check every new DDS release the same way: live source first, always.

> Margin note — Thanks: Miguel Wermuth and Selina Nie, our main user testers and evangelists; Sasha Souza, Karim Merchant and Itee Sharma; the accessibility team; and everyone who took part in the study this kit is built on.

---

## Confirmed facts and publishing rules (from Bruno)

- **Publishing:** it's OK to say this is work for Dell, but keep the case about how the project and its output were made. Cite nothing sensitive: no internal URLs, internal package names, internal repos, connectors or tool names. Component names (`DDSButton`, etc.) and the kit's own folder and file names are fine.
- **No dates:** the page carries no release date or any other date that shows when the project happened.
- **Participants:** study participants appear only as Designer 1–4. Never attach a real name to study data.
- **Credits:** Miguel Wermuth and Selina Nie (main user testers and evangelists); Sasha Souza, Karim Merchant, Itee Sharma; the accessibility team; the study participants.
- **Role:** Bruno designed and ran the study, rebuilt the kit, and wrote the router and manifests. Index card role: "Researcher & designer".
- **Adoption:** integrated for all designers at Dell, and used by other design system teams as a base. The Figma remark is a paraphrase of what Figma's team said in weekly meetings. Never present it as a verbatim quote.
- **Numbers:**
  - 50 components (up from 46), 49 verified live, 36 doc pairs merged, 20 broken references fixed.
  - 69 files and 474 KB in total; the study brief loads 29 files and 175 KB (37%); a modal loads 9 files and 63 KB (13%).
  - All of these come from the kit files.
