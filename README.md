# Minim

**The smallest HTML-first reactive library.** 0.5 KB core, 1.2 KB with attribute bindings, zero JavaScript on the page.
No build step, no dependencies, and nothing is `eval`'d — attributes name **state keys**, never expressions — so it runs
under a strict Content-Security-Policy. Made for pages the server already rendered (PHP, Rails, Django, htmx…).

```html
<script type="application/json" data-state="app">{ "name": "", "count": 0, "showName": true }</script>

<input data-model="name" placeholder="Your name">
<p data-show="showName">Hello, <strong data-watch="name"></strong>!</p>
<button type="button" commandfor="root" command="--inc" value="count">clicked <span data-watch="count"></span> times</button>

<script type="module" src="https://cdn.jsdelivr.net/npm/minimjs@3/dist/index.js"></script>
```

A *minim* is the smallest unit of liquid measure. It's also a palindrome. MPL-2.0. Formerly published as JsUpdatr.

## Size

Everything below measured the same way: latest npm source, terser, `gzip -9` / brotli 11.

| | minified | gzip | brotli | what's inside |
|---|---|---|---|---|
| usignal | 1,900 | 882 | 797 | signals only |
| **Minim core** (`reactive` + `effect`) | **868** | **516** | **471** | deep reactive state + effects |
| VanJS core | 2,365 | 1,153 | 1,046 | state + `tags` DOM builder (UI is built in JS) |
| hyperactiv | 2,328 | 1,220 | 1,104 | observable objects + computed |
| **Minim lite** (everything, paste-in) | **2,385** | **1,260** | **1,131** | core + `data-*` bindings + buttons + late-DOM binding + JSON boot |
| nanostores | 5,247 | 2,339 | 2,126 | stores |
| Alpine.js 3.17 (`cdn.min.js`) | 55,935 | 19,911 | 18,029 | HTML directives with expressions, needs `unsafe-eval` |

Minim is the only one of these where the page needs no JavaScript at all.

## Three ways to use it

```html
<!-- 1. Paste-in (lite/): one <script> in <head>, 1.2 KB gzipped. See lite/README.md for the snippet. -->

<!-- 2. ES module (auto-boots) -->
<script type="module" src="https://cdn.jsdelivr.net/npm/minimjs@3/dist/index.js"></script>

<!-- 3. Classic script: exposes window.minim and auto-boots -->
<script src="https://cdn.jsdelivr.net/npm/minimjs@3/dist/minim.min.js" defer></script>
```

```sh
npm install minimjs
```

```js
import { reactive, effect, bind } from 'minimjs';
```

## 1. State is JSON in the page

```html
<script type="application/json" data-state="app">
  { "name": "", "count": 0, "user": { "city": "Naples" }, "todos": [] }
</script>
```

Every such tag becomes a live, deep-reactive `window.app` (the name comes from `data-state`). Change it anywhere —
`app.count++` in the console — and the page updates. Optional `data-root="some-id"` limits binding to that element
instead of `<body>`.

From PHP: `<script type="application/json" data-state="app"><?= json_encode($state, JSON_HEX_TAG|JSON_HEX_AMP) ?></script>`

## 2. Bind HTML with `data-` attributes

| Attribute | On | Does |
|---|---|---|
| `data-model="key"` | `input`, `textarea`, `select` | Two-way. Checkboxes use `checked`; `type=number`/`range` store Numbers. |
| `data-watch="key"` | any element | Sets `textContent` to the value. |
| `data-show="key"` | any element | Toggles the `hidden` attribute (truthy = shown). |
| `data-bind="attr:key attr2:key2"` | any element | Mirrors values into attributes. `false`/`null` removes the attribute, `true` sets it empty. |

Keys can be dotted paths: `data-model="user.city"`, `data-watch="todos.length"`.

Markup inserted later (`fetch` + `insertAdjacentHTML`, htmx swaps, server fragments) is bound automatically;
elements removed from the DOM release their bindings.

## 3. Buttons without JavaScript

Uses the HTML Invoker Commands API (`command` / `commandfor`, supported by all current browsers; the module build adds
a click fallback for older ones). `commandfor` must point at the bound root (`<body id="…">` or the `data-root`
element), and use `type="button"`.

```html
<body id="root">
  <button type="button" commandfor="root" command="--inc"    value="count">+1</button>
  <button type="button" commandfor="root" command="--inc"    value="count" data-step="-1">−1</button>
  <button type="button" commandfor="root" command="--toggle" value="showName">show/hide</button>
  <button type="button" commandfor="root" command="--set"    data-key="user.city" value="Miami">Miami</button>
  <button type="button" commandfor="root" command="--push"   data-key="todos" value="buy milk">add</button>
```

| Command | Reads | Effect |
|---|---|---|
| `--inc` | `value` = key, `data-step` (default 1) | `state[key] += step` |
| `--toggle` | `value` = key | `state[key] = !state[key]` |
| `--set` | `data-key`, `value` | `state[key] = value` (numeric strings become Numbers) |
| `--push` | `data-key` (an array), `value` | `state[key].push(value)` |

## JavaScript API

```js
import { reactive, effect, bind, tick } from 'minimjs';

const state = reactive({ count: 0, items: [] });   // deep: nested objects, arrays and new keys all react

const stop = effect(() => console.log(state.count)); // runs now, re-runs when what it read changes
state.count++;                                       // writes are batched into one re-run per microtask
await tick();                                        // wait for pending effects (tests)
stop();

const ctrl = new AbortController();
effect(() => { /* … */ }, { signal: ctrl.signal });  // or stop it through an AbortSignal…
bind(document.getElementById('widget'), state);       // …bind a subtree yourself; returns an AbortController
ctrl.abort();                                         // that tears down every effect and listener it created
```

An effect that writes what it reads is stopped after 100 rounds with a `console.error` instead of freezing the tab.
Types ship with the package (`dist/index.d.ts`).

**Module build vs lite:** same attributes and commands. The module build also tracks `Object.keys(state)` inside
effects, has a click fallback for browsers without `command` events, and exposes `AbortController` teardown.

## Migrating from JsUpdatr v2

- `JsUpdatr.observe(obj)` is now `reactive(obj)` and **returns a Proxy**. v2 mutated the object in place; v3 does not,
  so keep and use the returned object: `const state = reactive(document.state)`.
- `JsUpdatr.run(fn)` is now `effect(fn)`, which returns a stop function and batches re-runs in a microtask instead of
  running them synchronously.
- The `data-model` / `data-watch` / `data-watch-attributes` glue from the old README is now built in;
  `data-watch-attributes="smallest:min"` became `data-bind="min:smallest"` (attribute first).
- `JsUpdatr`, `JsUpdatr.observe` and `JsUpdatr.run` remain as aliases so old code keeps working after the one-line change above.

## Development

```sh
npm install
npm test               # builds dist/ and lite/ (tsc + esbuild), regenerates lite/README.md, runs the node:test suite
npm run test:browser   # headless-Chromium checks against index.html (needs `npm i -D playwright`)
npm run test:lite      # the lite build's tests
npm run size           # current lite size
```

The demo at [hertonwork.github.io/minim](https://hertonwork.github.io/minim) is `index.html` in this repo.

## License

[MPL-2.0](https://opensource.org/licenses/MPL-2.0)
