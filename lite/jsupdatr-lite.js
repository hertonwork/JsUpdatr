/* JsUpdatr lite — paste in <head>. Reactive state + HTML attribute bindings. No deps, no build, nothing eval'd.
   Attributes name state KEYS (never expressions):  data-model  data-watch  data-show  data-bind="attr:key"
   State: <script type="application/json" data-state="app">{...}</script>  ->  window.app (live, deep)
   Buttons: <button type="button" commandfor="ROOT_ID" command="--inc|--toggle|--set|--push" value="key">   */
(() => {
  let active, flushing;
  const queue = new Set, deps = new WeakMap, proxies = new WeakMap, RAW = Symbol(), ALL = Symbol();

  /* ---- reactive core ---- */
  function track(t, k) {
    if (!active) return;
    let m = deps.get(t); if (!m) deps.set(t, m = new Map);
    let s = m.get(k);    if (!s) m.set(k, s = new Set);
    s.add(active); active.deps.add(s);
  }
  function trigger(t, k) {
    const s = deps.get(t)?.get(k);
    if (!s) return;
    s.forEach(e => queue.add(e));                       // Set = many writes, one re-run
    if (!flushing) { flushing = true; queueMicrotask(flush); }
  }
  function flush() {
    let n = 0;
    while (queue.size && n++ < 100) { const b = [...queue]; queue.clear(); b.forEach(e => e()); }
    if (queue.size) { queue.clear(); console.error('JsUpdatr: effect loop'); }
    flushing = false;
  }
  function effect(fn) {                                 // fn(stop) runs now and whenever what it read changes
    const run = () => {
      if (run.dead) return;
      run.deps.forEach(s => s.delete(run)); run.deps.clear();   // re-track from scratch (conditional reads)
      const prev = active; active = run;                          // save + restore: nesting works
      try { fn(stop); } finally { active = prev; }
    };
    const stop = () => { run.dead = 1; run.deps.forEach(s => s.delete(run)); run.deps.clear(); };
    run.deps = new Set; run(); return stop;
  }
  function reactive(o) {                                // deep Proxy: nested objects, arrays, new keys
    if (!o || typeof o != 'object' || o[RAW]) return o;
    if (!proxies.has(o)) proxies.set(o, new Proxy(o, {
      get: (t, k, r) => k === RAW ? t : (track(t, k), reactive(Reflect.get(t, k, r))),
      set(t, k, v, r) {
        const had = Object.hasOwn(t, k), old = t[k], ok = Reflect.set(t, k, v, r);
        if (!had) { trigger(t, ALL); Array.isArray(t) && trigger(t, 'length'); }
        else if (!Object.is(old, v)) trigger(t, k);
        return ok;
      },
      deleteProperty: (t, k) => (Reflect.deleteProperty(t, k), trigger(t, k), trigger(t, ALL), true),
      ownKeys: t => (track(t, ALL), Reflect.ownKeys(t)),
    }));
    return proxies.get(o);
  }

  /* ---- DOM bindings ---- */
  const get = (o, p) => p.split('.').reduce((o, k) => o?.[k], o);
  const set = (o, p, v) => { const ks = p.split('.'), l = ks.pop(); ks.reduce((o, k) => o[k], o)[l] = v; };
  const num = s => s !== '' && !isNaN(s) ? +s : s == 'true' ? true : s == 'false' ? false : s;
  const SEL = '[data-model],[data-watch],[data-show],[data-bind]', bound = new WeakSet;

  function bindEl(el, S) {
    if (bound.has(el)) return; bound.add(el);
    const d = el.dataset, live = f => effect(stop => el.isConnected ? f() : stop());   // self-retire when removed
    if (d.model) {
      const chk = el.type == 'checkbox', n = el.type == 'number' || el.type == 'range';
      live(() => { const v = get(S, d.model) ?? ''; chk ? el.checked = !!v : el.value != v && (el.value = v); });
      el.addEventListener('input', () => set(S, d.model, chk ? el.checked : n && el.value !== '' ? el.valueAsNumber : el.value));
    }
    if (d.watch) live(() => el.textContent = get(S, d.watch) ?? '');
    if (d.show)  live(() => el.hidden = !get(S, d.show));
    if (d.bind)  d.bind.split(/\s+/).forEach(p => {
      const [a, k] = p.split(':');
      a && k && live(() => { const v = get(S, k); v == null || v === false ? el.removeAttribute(a) : el.setAttribute(a, v === true ? '' : v); });
    });
  }

  function bind(root, S) {
    const scan = n => { n.matches?.(SEL) && bindEl(n, S); n.querySelectorAll?.(SEL).forEach(e => bindEl(e, S)); };
    scan(root);
    new MutationObserver(ms => ms.forEach(m => m.addedNodes.forEach(scan))).observe(root, { childList: true, subtree: true });
    const cmd = (c, b) => {                             // Invoker Commands: zero JS on the page
      const k = b.dataset.key || b.value, v = get(S, k);
      c == '--set' ? set(S, b.dataset.key, num(b.value)) : c == '--toggle' ? set(S, k, !v)
      : c == '--inc' ? set(S, k, (v || 0) + +(b.dataset.step || 1)) : c == '--push' && v.push(num(b.value));
    };
    root.addEventListener('command', e => e.command[0] == '-' && cmd(e.command, e.source));
    root.addEventListener('click', e => { const b = e.target.closest('button[command^="--"]'); b && !('command' in b) && cmd(b.getAttribute('command'), b); });
    return S;
  }

  /* ---- boot: every <script type="application/json" data-state="name" data-root="id"> becomes window.name ---- */
  const boot = () => document.querySelectorAll('script[type="application/json"][data-state]').forEach(s =>
    bind(document.getElementById(s.dataset.root) || document.body, window[s.dataset.state || 'state'] = reactive(JSON.parse(s.textContent))));
  globalThis.JsUpdatr = { reactive, effect, bind };
  typeof document != 'undefined' && (document.readyState == 'loading' ? addEventListener('DOMContentLoaded', boot) : boot());
})();
