# Reading guide to the site

A guided tour of how this site is built — a reading path in the order that makes
the structure click, with the concept you need at each stop.

## The one big idea first

This is a **small, zero-dependency static site**. There is **no framework, no
build step, no server** — GitHub Pages serves the files as-is. The site started
as a single `index.html`; the styling and behavior have since been split into
sibling files so each language gets its own readable file:

| File | Lines (approx) | What it is |
|---|---|---|
| `index.html` | ~396 | Structure: `<head>` metadata + `<body>` markup |
| `styles.css` | ~1035 | The entire design system (CSS) |
| `data.js` | ~291 | The agent's knowledge base + routing tables (content) |
| `app.js` | ~206 | All behavior: scroll reveal, the agent, the canvas |

`index.html` wires them together with one `<link rel="stylesheet">` and two
`<script ... defer>` tags near the bottom. **Load order matters:** `data.js`
loads before `app.js`, because `app.js` reads constants (`KB`, `CHIPS`, …)
defined in `data.js`. `defer` guarantees both run after the HTML is parsed, in
order. If you ever reorder those two script tags, the agent breaks.

A second idea ties the whole thing together thematically: **the page is a "show,
don't tell" demo of his field.** The chatbox imitates a RAG agent; the
background animation visualizes an embedding space. A lot of the code exists to
*perform* "AI/ML engineer" rather than just claim it.

Read it in five stations, not top to bottom.

---

## Station 1 — The body skeleton (`index.html`)

**Look at: `index.html` lines ~125–157 (nav + hero), then skim the `<section>`
tags down to the footer (line ~390).**

Start here because the HTML is the thing you can actually see on the page, and
it's the simplest layer. Notice the shape:

```text
<nav>            ← top bar with anchor links (#about, #experience…)
<header class="hero">   ← big name + the chatbox + canvas
<section id="about">    ← numbered content blocks
<section id="experience">
… projects, publications, now, contact
<footer>
```

**Concepts to learn here:**

- **HTML document anatomy** — `<head>` is metadata the browser/crawlers read but
  users don't see; `<body>` is what renders. They never overlap.
- **Semantic HTML** — `<nav>`, `<header>`, `<section>`, `<footer>` aren't
  decorative; they tell browsers, screen readers, and search engines what each
  region *means*. (This is also why the SEO is strong.)
- **Anchor navigation** — the nav links are `href="#about"` etc., and each
  section has a matching `id`. Clicking scrolls to that id. No routing, no JS —
  pure HTML. The `html { scroll-behavior: smooth }` rule in `styles.css` makes
  it glide.

Note: the chatbox lives *inside* `<header class="hero">` (around line 135),
which is why the canvas animation can sit behind it.

---

## Station 2 — The design tokens (`styles.css`)

**Look at: `styles.css` lines 1–11, the `:root { --bg: …; --accent: #d8fb50; … }`
block.**

**Concept: CSS custom properties (variables).** Every color in the site is
defined once here as a variable, then referenced everywhere with
`var(--accent)`. Change `--accent` in one place and the whole site re-themes.
This is the single most useful CSS concept to grasp from this file — it's how the
"lime-on-black terminal" identity stays consistent.

Then skim the rules right after it to see the patterns repeat. The ones worth
understanding:

- **The cascade & selectors** — `.hero h1` means "an `h1` inside `.hero`".
  `.status.busy .pulse` means "a `.pulse` inside something that has *both*
  `.status` and `.busy`". Specificity is just "how targeted is this selector."
- **Flexbox** — `nav { display: flex; justify-content: space-between }`
  (line ~52) puts the name on the left and links on the right. Flexbox is the
  main 1-dimensional layout tool here.
- **`clamp()`** — `font-size: clamp(3rem, 8.5vw, 6.4rem)` (the `h1`, line ~160)
  means "scale with viewport width, but never below 3rem or above 6.4rem." This
  is how the design is responsive *without* media queries for type.
- **Media queries** — `@media(max-width:900px)` (line ~137) is the explicit
  "on small screens, change this" escape hatch (it hides the `herocap` on
  mobile).

---

## Station 3 — Positioning & stacking (`styles.css`)

**Look at: `.hero` (94), `.hero #cloud` (101), `.hero .hcontent` (111),
`.herocap` (116), `.agentbar` (143).**

This is worth its own stop because it explains the hero layout, and positioning
is the CSS concept people find most confusing.

**Concepts:**

- **`position: relative` vs `absolute`** — `.hero` is `relative`, which makes it
  the *reference frame*. The `#cloud` canvas inside it is
  `position: absolute; top:0; right:0; width:80%` — so it pins to the top-right
  of the hero and ignores normal document flow. That's why the animation can sit
  *behind and to the right* of the chatbox.
- **`z-index` / stacking** — `.hcontent` has `z-index: 1`, the canvas has none
  (so it's effectively behind). That's the mechanism that puts the name +
  chatbox *on top of* the animation. The chatbox sits inside `.hcontent`, so it
  inherits that stacking — which is why "they belong together" works visually.
- **Why the chatbox stays narrow** — `.agentbar { max-width: 680px }`. The hero
  is full-width, the canvas fills the right 80%, but the console caps at 680px on
  the left, leaving the animation visible to its right. That gap *is* the effect.

---

## Station 4 — The "agent" (`data.js` + `app.js`)

This is the heart of the site, and it's deliberately split across two files: the
**content** in `data.js`, the **engine** in `app.js`.

**(a) The data — `data.js`.** `KB` (line 15) is an array of objects, each with
`id`, `k` (trigger keywords), `src` (the fake "retrieved source" label), and `a`
(the answer). This is just a hand-written FAQ. Below it are the lookup tables:
`FALLBACK`/`GREETING` (227–228), `EXACT` (231, one-word inputs like "hi"),
`CHIPS` (233, the suggestion buttons), `SECTION` (242), and `NEXT` (255,
follow-up suggestions per topic). **This is the file you edit to change what the
agent says** — no engine code involved.

**(b) The brain — `route()` in `app.js` (line 27).** This is the conceptually
important function. Given a typed question, it:

1. lowercases/cleans it,
2. scores every `KB` entry by how many of its keywords appear (phrase match
   scores higher than substring),
3. falls back to **`editDistance()` (`app.js` line 11) — bounded Levenshtein
   distance** — to catch typos ("backgound" → "background"),
4. returns the best-scoring entry and a confidence score.

**Concept to really get:** this is a **deterministic keyword router dressed up as
a RAG agent.** There is no model, no network call, no embeddings — it's
`if keyword in question`. But it's *staged* to look like retrieval-augmented
generation: it shows a "▸ retrieved context: profile/about" line, animates a
plan→retrieve→respond pipeline, and types the answer out word by word.
Understanding the gap between *what it looks like* and *what it is* is the single
most illuminating thing in this project.

**(c) The performance — `submit()` in `app.js` (line 97).** This is what runs
when you hit Enter. Read it as a sequence:

- mark busy, echo your message,
- light up `plan` node → wait → `retrieve` node (and call `window.cloudPing()`
  at line 105 to make the animation react!) → run `route()` → show the fake
  "retrieved source" → `respond` node → type out the answer → render follow-up
  buttons.

**Concepts here:**

- **The DOM API** — `document.getElementById`, `createElement`, `appendChild`.
  This is how JS builds HTML on the fly with no framework. Compare `addMsg()`
  (`app.js` line 62): it manually constructs a `<div><span>…</span></div>` and
  attaches it.
- **`async`/`await` + Promises** —
  `const wait = ms => new Promise(r => setTimeout(r, …))` plus `await wait(400)`
  is how it *paces* the fake pipeline. `async function submit()` lets it "pause"
  between stages without freezing the browser. This is the JS timing concept
  worth learning.
- **Event listeners** — the `sendBtn.onclick` and `keydown` Enter handlers (just
  below `submit`) are how user actions trigger code.

---

## Station 5 — The canvas animation (`app.js`)

**Look at: `app.js` lines ~133–204 (the final IIFE).** This is the hardest part;
save it for last and aim for the *gist*, not every line.

**What it represents:** an **embedding space** — the high-dimensional vector
space where an AI model places concepts. Similar things cluster together;
"retrieval" means finding the nearest neighbors to a query point. The animation
literally builds `K = 7` clusters of points, picks a query point, finds its
nearest neighbors by squared distance (`newQuery()`, line 163), and draws lines
to them. When the chatbox "retrieves," `window.cloudPing()` (line 169) fires a
fresh query — **that's the link between Station 4 and this one.** The two demos
are wired together through that one global function.

**Concepts (gist-level is fine):**

- **The `requestAnimationFrame` loop** — `frame()` (line 173) reschedules itself
  ~60×/sec via `requestAnimationFrame(frame)` (line 202). This is *the* pattern
  for all browser animation.
- **3D → 2D projection** — inside `frame()` each point is rotated (yaw/tilt using
  `cos`/`sin`) and divided by depth (`pe = 2.2/(2.2+z2)`) to fake perspective.
  You don't need the math; just know "rotate the cloud, then squish far points
  smaller."
- **`<canvas>` 2D drawing** — `ctx.beginPath()/arc()/fill()` draws each dot;
  `moveTo/lineTo/stroke` draws neighbor links. Canvas is an immediate-mode pixel
  surface — you redraw everything every frame (`ctx.clearRect`).
- **Device-pixel-ratio** (`resize()`) — the trick that keeps it crisp on Retina
  screens.

---

## The cross-cutting concept: progressive enhancement & accessibility

Worth noticing because it's woven through all five stations:

- **`const reduce = window.matchMedia('(prefers-reduced-motion: reduce)')`
  (`app.js` line 5)** appears in the typing animation *and* the canvas — if a
  user's OS says "reduce motion," typing is instant and the cloud barely moves.
  Respecting user preferences.
- **`IntersectionObserver` (`app.js` line 7)** adds a `.in` class to `.reveal`
  elements when they scroll into view — that's the fade-in-on-scroll effect, done
  efficiently without scroll listeners.
- **`aria-label`, `aria-live="polite"` (on the transcript, in `index.html`)**
  make the chatbox usable by screen readers.
- Because the content is **real HTML**, the page is fully readable even if the JS
  never runs — the agent and animation are *enhancements*, not load-bearing.
  (This is also why it's so SEO-friendly.)

---

## Suggested order, in one line

**Body skeleton (`index.html`) → CSS variables (`styles.css` top) → positioning/
stacking (`styles.css`) → the agent (`data.js` then `app.js`) → the canvas
(`app.js`)**, then notice the accessibility thread running through all of them.

> Line numbers are approximate and drift as you edit. The anchors that stay
> valid are the names: files (`styles.css`, `data.js`, `app.js`), selectors
> (`.hero`, `.hcontent`, `.agentbar`), constants (`KB`, `CHIPS`), and functions
> (`route`, `submit`, `editDistance`, `newQuery`, `frame`).
