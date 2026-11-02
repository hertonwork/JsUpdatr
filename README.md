# JsUpdatr

Tiny reactive state + HTML attribute bindings for pages the server already rendered.
No build step, no dependencies, and nothing is `eval`'d — attributes name **state keys**, never JavaScript
expressions — so it runs under a strict Content-Security-Policy.

About 2 KB gzipped. MPL-2.0.

```html
<script type="application/json" data-state="app">{ "name": "", "count": 0, "showName": true }</script>

<input data-model="name" placeholder="Your name">
<p data-show="showName">Hello, <strong data-watch="name"></strong>!</p>
<button type="button" commandfor="root" command="--inc" value="count">clicked <span data-watch="count"></span> times</button>

<script type="module" src="https://cdn.jsdelivr.net/npm/js_updatr@3/dist/index.js"></script>
```

### Lite: paste one `<script>` and go

[`lite/`](./lite/) is a self-contained version (2.8 KB minified, 1.4 KB gzipped) you paste straight into `<head>` —
no install, no import, no build. Same attributes, same commands, smaller API.
See [`lite/README.md`](./lite/README.md) for the snippet and the full reference, and [`lite/example.html`](./lite/example.html)
for a working page.

## Install

Pick one:

```html
<!-- ES module (auto-boots) -->
<script type="module" src="https://cdn.jsdelivr.net/npm/js_updatr@3/dist/index.js"></script>

<!-- classic script: exposes window.JsUpdatr and auto-boots -->
<script src="https://cdn.jsdelivr.net/npm/js_updatr@3/dist/jsupdatr.min.js" defer></script>
```

```sh
npm install js_updatr
```

```js
import { reactive, effect, bind } from 'js_updatr';
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

Uses the HTML Invoker Commands API (`command` / `commandfor`, supported by all current browsers; a click fallback
covers older ones). `commandfor` must point at the bound root (`<body id="…">` or the `data-root` element), and use
`type="button"`.

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
| `--set` | `data-key`, `value` | `state[key] = value` (`"true"`, `"false"` and numeric strings are converted) |
| `--push` | `data-key` (an array), `value` | `state[key].push(value)` |

## JavaScript API

```js
import { reactive, effect, bind, tick } from 'js_updatr';

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

## Migrating from v2

- `JsUpdatr.observe(obj)` is now `reactive(obj)` and **returns a Proxy**. v2 mutated the object in place; v3 does not,
  so keep and use the returned object: `const state = reactive(document.state)`.
- `JsUpdatr.run(fn)` is now `effect(fn)`, which returns a stop function and batches re-runs in a microtask instead of
  running them synchronously.
- The `data-model` / `data-watch` / `data-watch-attributes` glue from the old README is now built in;
  `data-watch-attributes="smallest:min"` became `data-bind="min:smallest"` (attribute first).
- `JsUpdatr.observe` and `JsUpdatr.run` remain as aliases so old code keeps working after the one-line change above.

## Development

```sh
npm install
npm test               # builds dist/ (tsc + esbuild) and runs the node:test suite
npm run test:browser   # headless-Chromium checks against index.html (needs `npm i -D playwright`)
npm run test:lite      # the lite build's tests
```

The demo at [hertonwork.github.io/JsUpdatr](https://hertonwork.github.io/JsUpdatr) is `index.html` in this repo.

## License

[MPL-2.0](https://opensource.org/licenses/MPL-2.0)
