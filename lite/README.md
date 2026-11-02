# JsUpdatr lite

Reactive state for server-rendered HTML in one `<script>` you paste into `<head>`. No install, no build, no import.
Attributes name **state keys** — never JavaScript expressions — so nothing is `eval`'d and it runs under a strict CSP.

2.8 KB minified · 1.4 KB gzipped · MPL-2.0 · readable source: [`jsupdatr-lite.js`](./jsupdatr-lite.js)

## 1. Paste this into `<head>`

```html
<script>(()=>{let r,p;const i=new Set,h=new WeakMap,m=new WeakMap,v=Symbol(),y=Symbol();function w(e,t){if(!r)return;let n=h.get(e);n||h.set(e,n=new Map);let s=n.get(t);s||n.set(t,s=new Set),s.add(r),r.deps.add(s)}function u(e,t){const n=h.get(e)?.get(t);n&&(n.forEach(s=>i.add(s)),p||(p=!0,queueMicrotask(x)))}function x(){let e=0;for(;i.size&&e++<100;){const t=[...i];i.clear(),t.forEach(n=>n())}i.size&&(i.clear(),console.error("JsUpdatr: effect loop")),p=!1}function g(e){const t=()=>{if(t.dead)return;t.deps.forEach(a=>a.delete(t)),t.deps.clear();const s=r;r=t;try{e(n)}finally{r=s}},n=()=>{t.dead=1,t.deps.forEach(s=>s.delete(t)),t.deps.clear()};return t.deps=new Set,t(),n}function b(e){return!e||typeof e!="object"||e[v]?e:(m.has(e)||m.set(e,new Proxy(e,{get:(t,n,s)=>n===v?t:(w(t,n),b(Reflect.get(t,n,s))),set(t,n,s,a){const o=Object.hasOwn(t,n),c=t[n],d=Reflect.set(t,n,s,a);return o?Object.is(c,s)||u(t,n):(u(t,y),Array.isArray(t)&&u(t,"length")),d},deleteProperty:(t,n)=>(Reflect.deleteProperty(t,n),u(t,n),u(t,y),!0),ownKeys:t=>(w(t,y),Reflect.ownKeys(t))})),m.get(e))}const f=(e,t)=>t.split(".").reduce((n,s)=>n?.[s],e),l=(e,t,n)=>{const s=t.split("."),a=s.pop();s.reduce((o,c)=>o[c],e)[a]=n},E=e=>e!==""&&!isNaN(e)?+e:e=="true"?!0:e=="false"?!1:e,A="[data-model],[data-watch],[data-show],[data-bind]",k=new WeakSet;function L(e,t){if(k.has(e))return;k.add(e);const n=e.dataset,s=a=>g(o=>e.isConnected?a():o());if(n.model){const a=e.type=="checkbox",o=e.type=="number"||e.type=="range";s(()=>{const c=f(t,n.model)??"";a?e.checked=!!c:e.value!=c&&(e.value=c)}),e.addEventListener("input",()=>l(t,n.model,a?e.checked:o&&e.value!==""?e.valueAsNumber:e.value))}n.watch&&s(()=>e.textContent=f(t,n.watch)??""),n.show&&s(()=>e.hidden=!f(t,n.show)),n.bind&&n.bind.split(/\s+/).forEach(a=>{const[o,c]=a.split(":");o&&c&&s(()=>{const d=f(t,c);d==null||d===!1?e.removeAttribute(o):e.setAttribute(o,d===!0?"":d)})})}function M(e,t){const n=a=>{a.matches?.(A)&&L(a,t),a.querySelectorAll?.(A).forEach(o=>L(o,t))};n(e),new MutationObserver(a=>a.forEach(o=>o.addedNodes.forEach(n))).observe(e,{childList:!0,subtree:!0});const s=(a,o)=>{const c=o.dataset.key||o.value,d=f(t,c);a=="--set"?l(t,o.dataset.key,E(o.value)):a=="--toggle"?l(t,c,!d):a=="--inc"?l(t,c,(d||0)+ +(o.dataset.step||1)):a=="--push"&&d.push(E(o.value))};return e.addEventListener("command",a=>a.command[0]=="-"&&s(a.command,a.source)),e.addEventListener("click",a=>{const o=a.target.closest('button[command^="--"]');o&&!("command"in o)&&s(o.getAttribute("command"),o)}),t}const O=()=>document.querySelectorAll('script[type="application/json"][data-state]').forEach(e=>M(document.getElementById(e.dataset.root)||document.body,window[e.dataset.state||"state"]=b(JSON.parse(e.textContent))));globalThis.JsUpdatr={reactive:b,effect:g,bind:M},typeof document<"u"&&(document.readyState=="loading"?addEventListener("DOMContentLoaded",O):O())})();</script>
```

## 2. Put your state in the page as JSON

```html
<script type="application/json" data-state="app">
  { "name": "", "count": 0, "showName": false, "user": { "city": "Naples" }, "todos": [] }
</script>
```

This becomes a live `window.app`. Change it anywhere (`app.count++` in the console) and the page updates.
Optional `data-root="some-id"` limits binding to that element instead of `<body>`.

From PHP: `<script type="application/json" data-state="app"><?= json_encode($state, JSON_HEX_TAG|JSON_HEX_AMP) ?></script>`

## 3. Bind HTML with `data-` attributes

| Attribute | On | Does |
|---|---|---|
| `data-model="key"` | `input`, `textarea`, `select` | Two-way. Checkboxes use `checked`; `type=number`/`range` store Numbers. |
| `data-watch="key"` | any element | Sets `textContent` to the value. |
| `data-show="key"` | any element | Toggles the `hidden` attribute (truthy = shown). |
| `data-bind="attr:key attr2:key2"` | any element | Mirrors values into attributes. `false`/`null` removes the attribute, `true` sets it empty. |

Keys can be dotted paths: `data-model="user.city"`, `data-watch="todos.length"`.

## 4. Buttons without any JavaScript

Uses the HTML Invoker Commands API (`command` / `commandfor`, supported by all current browsers; a click fallback covers older ones).
`commandfor` must point at the bound root (`<body id="…">` or the `data-root` element), and use `type="button"`.

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

## 5. Complete example

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <script>/* paste jsupdatr-lite.min.js here */</script>
  <script type="application/json" data-state="app">{ "name": "", "count": 0, "showName": true }</script>
</head>
<body id="root">
  <input data-model="name" placeholder="Your name">
  <p data-show="showName">Hello, <strong data-watch="name"></strong>!</p>
  <button type="button" commandfor="root" command="--toggle" value="showName">toggle</button>
  <button type="button" commandfor="root" command="--inc" value="count">clicked <span data-watch="count"></span> times</button>
</body>
</html>
```

## JavaScript API (optional)

```js
const state = JsUpdatr.reactive({ count: 0, items: [] });   // deep: nested objects, arrays, new keys all react
const stop  = JsUpdatr.effect(() => console.log(state.count)); // runs now, re-runs when what it read changes
JsUpdatr.bind(document.getElementById('widget'), state);      // bind a subtree yourself (also watches for new nodes)
stop();                                                        // stop an effect; effects also get `stop` as their argument
```

## Good to know

- Writes are batched: ten changes in a row cause one re-render, in a microtask. Read the DOM after `await Promise.resolve()`.
- Markup inserted later (`fetch` + `insertAdjacentHTML`, htmx swaps, PHP fragments) is bound automatically. Elements removed from the DOM release their bindings on the next update.
- An effect that writes what it reads is stopped after 100 rounds with a `console.error`, not a frozen tab.
- Needs a browser from 2022+ (`Proxy`, `Object.hasOwn`, optional chaining). No IE.
- Want expressions, loops or templates? That's deliberately out of scope — reach for Alpine.js or Vue. JsUpdatr lite is for pages the server already rendered.
