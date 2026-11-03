---
name: minim-page
description: >-
  Build a web page that scores 100/100/100/100 on Google PageSpeed (Lighthouse) with zero external JavaScript or CSS
  requests: one HTML file, Minim (a 1.2–2.5 KB reactive library) inlined, tokens-based inline CSS, system fonts, native
  dialogs and buttons, CSS-only animation. Use this whenever someone asks for a landing page, demo, product page,
  waitlist, form, settings screen, small dashboard, prototype or "quick page" that must be fast, work with no build step,
  pass PageSpeed or Core Web Vitals, run under a strict CSP, or sit on server-rendered HTML (PHP, Rails, Django, htmx) —
  and whenever a page "loads too much JS", "needs to score 100", or "should not pull in React/Vue/Alpine for this".
  Also use it to add interactivity (lists, toggles, counters, live previews, modals) to an existing static page.
---

# Minim page

A page built this way is one `.html` file. The state is a JSON tag, the HTML binds to it by key with `data-*`
attributes, Minim is pasted inline at the end of `<body>`, the CSS is inline and driven by custom properties, fonts are
the system's, images are inline SVG or sized `<img>`s. The browser makes one request for the document and nothing else.
That is why it scores 100: there is nothing to block rendering, nothing to shift, nothing to download, and no framework
to execute. It also means no bundler, no `npm install` for the page, and a strict Content-Security-Policy works because
nothing is `eval`'d — Minim's attributes name keys, never expressions.

Read `references/minim.md` for the full attribute, command and API reference, and `references/design.md` for the
visual rules before writing CSS. The starter page in `assets/starter.html` already has the structure, tokens and slots.

## Build order

Work in this order; each step is cheap to redo and the later ones depend on the earlier ones.

### 1. State first

Write the whole state as one JSON object before any markup — every value the page shows or edits, with its initial
value. Keep it flat where you can and use nested objects only for real groups (`"user": { "city": "" }`). Arrays hold
list items; objects in arrays when items have fields (`{ "text": "", "done": false }`), plain strings when they don't.

```html
<script type="application/json" data-state="app" data-root="root">
  { "name": "", "plan": "monthly", "seats": 3, "agreed": false, "items": [] }
</script>
```

`data-state` names the global (`window.app`), `data-root` limits binding to an element (default `<body>`). From a
server language, emit it with the HTML-safe flags: PHP `json_encode($state, JSON_HEX_TAG|JSON_HEX_AMP)`, Rails
`raw state.to_json.gsub('</', '<\/')`, Django `json_script`.

### 2. Markup that binds by key

Write semantic HTML and bind with attributes whose values are **keys**, never expressions:

| Need | Attribute |
|---|---|
| Show a value | `<b data-watch="seats">3</b>` |
| Edit a value | `<input data-model="name">` (checkbox → boolean, `type=number`/`range` → Number) |
| Show/hide | `<p data-show="agreed" hidden>` |
| Attribute or CSS variable follows state | `<input data-bind="max:seats">`, `<div data-bind="--pct:progress">` |
| Class follows state | `<li data-class="done:$.done">` |
| A list | `<template data-each="items"> … $ $.field $i … </template>` |
| A button that changes state | `<button type="button" commandfor="root" command="--inc" value="seats">` |
| Any event changes state | `<input data-command="keydown.Enter:--push" data-key="items" data-as="text">` |

Commands: `--set` (`data-key` + `value`), `--toggle`, `--inc` (`data-step`), `--push` (`data-as="text"` pushes
`{ text: value }` so new items match object items in the list), `--remove` (`value` = index).
`commandfor` must point at the bound root's id. Native commands work too: `command="show-modal"` / `"close"` on a
`<dialog>`, `"toggle-popover"` on a popover — use them instead of writing a modal.

**Pre-render the initial state into the markup.** Put the initial value as the text of every `data-watch` element and
`hidden` on every `data-show` element that starts hidden. Minim then only keeps the page in sync, and nothing moves
when it binds — this is what keeps Cumulative Layout Shift at 0. An empty `<span data-watch="count"></span>` that
fills with "0" after load is a layout shift; `<span data-watch="count">0</span>` is not.

Don't reach for JavaScript when the platform already has the thing: `<dialog>` + `command`, `<details>`, `popover`,
`<form>` with native validation and a real `action`, `input type=color/range/date`, `<meter>` / `<progress>`,
`scroll-snap`, `:has()`, view transitions. A page built this way usually needs no script of its own at all; if it does
need one (a fetch, a clipboard copy), keep it to a few lines inline at the end of `<body>` and have it write to the
state so Minim renders the result.

### 3. Style with tokens, animate with CSS

Start from the `:root` tokens in `assets/starter.html` and change the values, not the names: one ground, one surface
(a tone step, not a border), one ink, one muted ink for secondary notes, one accent plus `--accent-text` (darker, for
small text on surfaces — the plain accent fails the 4.5:1 contrast audit on a light surface), and the dark-mode set
under `prefers-color-scheme: dark`. Everything downstream references tokens only.

Animation is the stylesheet's job; state only flips a class or a variable:

- `data-class` + `transition` / `@keyframes` for anything that turns on and off.
- `data-bind="--pct:value"` + `width: calc(var(--pct) * 1%)` + `transition` for meters and gauges.
- `@starting-style` for anything inserted later (list items, fragments), so it eases in with no script.
- `data-each` re-renders through the View Transitions API automatically; `::view-transition-group(*)` sets its duration.
- Entrance motion: `animation-timeline: view()` inside `@supports`, **transform only**. An opacity fade on off-screen
  content makes Lighthouse's contrast audit read the faded colors and fail the page.
- Always a `prefers-reduced-motion: reduce` block that zeroes durations.

Read `references/design.md` for the look: large display type in one family, headlines of two lines or fewer, sections
that each have their own composition, surfaces separated by tone, no gradients, shadows, hairlines, eyebrows,
monospace labels or emoji. The point is not restraint for its own sake: those are the things that make a page read as
generated, and the audits catch several of them (contrast, heading order, tap targets) anyway.

### 4. Inline Minim

Pick the build:

- `assets/minim-lite.min.js` (1.2 KB gzipped): `data-model`, `data-watch`, `data-show`, `data-bind`, the four basic
  commands. Enough for forms, toggles, counters, live previews.
- `assets/minim.min.js` (2.5 KB gzipped): adds `data-each`, `data-class`, CSS-variable binds, `data-command`,
  `--remove`, a click fallback for browsers without `command` events. Use it when the page has a list or animation.

Paste its contents into `<script>…</script>` **at the end of `<body>`**. There it binds immediately, before the first
paint; in `<head>` it has to wait for the DOM. `scripts/inline.mjs page.html` does the paste for you (it replaces
`<!--minim-->` or an existing inlined copy) and refuses if the file contains `</script`.

No `<script src>`, no `<link rel=stylesheet>`, no web fonts, no CDN anything. Each external file is a request that can
block rendering and a point the score can drop; the whole method is that there are none.

### 5. Check, then look

```bash
node <skill>/scripts/check.mjs page.html            # static preflight: the rules above, in seconds
node <skill>/scripts/check.mjs page.html --lighthouse  # also runs Lighthouse if `lighthouse` is installed (npm i -g lighthouse)
```

Fix every line the checker prints — they map one-to-one onto Lighthouse audits that cost points. If you run Lighthouse
against your own local server instead, make it answer `404` for every path but `/`: Lighthouse also fetches
`/robots.txt`, `/llms.txt` and a manifest, and a server that returns the page for those gets SEO docked to 92. Then open the page at
a phone width and a desktop width and look: no horizontal scroll, headline on two lines or fewer, every control
labelled and reachable by keyboard, dark mode readable. Lighthouse runs the page cold on a throttled phone profile, so
anything that only looks right after a script runs will be caught.

The final check is the real one: deploy and run https://pagespeed.web.dev/ on the live URL. Expect 100 in all four
categories on mobile and desktop; if a category is lower, the report names the audit, and the list in step 5 of this
file covers every one we have hit.

## What a page needs, as a checklist

- `<!DOCTYPE html>`, `<html lang>`, `<meta charset>`, `<meta name="viewport">`, `<title>`, `<meta name="description">`,
  `<link rel="canonical">`, `<meta name="color-scheme" content="light dark">`
- A favicon as a `data:` SVG (no request)
- Exactly one `<h1>` on the first screen; `<h2>` for sections; no skipped levels (panel titles are `<p>`, not `<h3>`)
- A `<label>` for every input (or `aria-label` on inputs that stand alone); `aria-label` on icon-only buttons;
  `type="button"` on every non-submit button
- Text contrast ≥ 4.5:1 (3:1 for large text) in both themes; no text at reduced opacity
- Images: inline SVG, or `<img>` with `width`, `height`, `alt`, and `loading="lazy"` below the fold
- `.cols > * { min-width: 0 }` on grids that hold `<pre>` or long words, so nothing overflows on phones
- Links with real `href`s; buttons that do things
- The JSON state tag, the bound markup with initial values pre-rendered, Minim inlined at the end of `<body>`

## Pitfalls we hit

- **Layout shift from binding.** Fixed by pre-rendering initial values (step 2) and inlining Minim at the end of
  `<body>` (step 4). Reserve height for lists that start empty if the design needs it.
- **Contrast failures on off-screen text** from opacity-based entrance animations. Transform only.
- **Contrast failure on accent-colored small text** over a surface. Use `--accent-text`.
- **Heading order** audit when a panel's title is an `<h3>` before the first `<h2>`.
- **Horizontal overflow on phones** from a `<pre>` inside a grid column. `min-width: 0`.
- **Class collisions**: a `.bar` nav and a `.bar` meter. Name things for what they are.
- **`data-show` and transitions**: `hidden` can't animate. Use `data-class` with a transition when it should.
- **Editing list items with `data-model="$"`** re-renders the list on every keystroke (the list effect reads every
  index). Make items objects and bind `$.field`; the list re-renders only on add/remove.
- **`Object.keys(state)` inside an effect** is tracked by the module build, not by lite.
