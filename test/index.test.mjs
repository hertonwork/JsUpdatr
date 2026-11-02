import { test } from 'node:test';
import assert from 'node:assert/strict';
import minim, { JsUpdatr, reactive, effect, tick } from '../dist/index.js';

test('basic: effect re-runs on change', async () => {
  const s = reactive({ a: 1 }); let seen;
  effect(() => { seen = s.a; });
  s.a = 2; await tick();
  assert.equal(seen, 2);
});

test('nested effects keep the outer tracking', async () => {
  const s = reactive({ inner: 1, outer: 1 }); let outerRuns = 0;
  effect(() => { outerRuns++; effect(() => { s.inner; }); s.outer; });
  s.outer = 2; await tick();
  assert.equal(outerRuns, 2);
});

test('keys added after reactive() are reactive', async () => {
  const s = reactive({ a: 1 }); s.b = 1; let runs = 0;
  effect(() => { runs++; s.b; });
  s.b = 2; await tick();
  assert.equal(runs, 2);
});

test('nested objects are reactive', async () => {
  const s = reactive({ user: { name: 'ann' } }); let runs = 0;
  effect(() => { runs++; s.user.name; });
  s.user.name = 'bob'; await tick();
  assert.equal(runs, 2);
});

test('array push is reactive', async () => {
  const s = reactive({ list: [1, 2] }); let len;
  effect(() => { len = s.list.length; });
  s.list.push(3); await tick();
  assert.equal(len, 3);
});

test('batching: 3 writes -> 1 re-run', async () => {
  const s = reactive({ x: 0, y: 0, z: 0 }); let runs = 0;
  effect(() => { runs++; s.x; s.y; s.z; });
  s.x = 1; s.y = 1; s.z = 1; await tick();
  assert.equal(runs, 2);
});

test('AbortSignal and the returned stop() both dispose', async () => {
  const s = reactive({ v: 0 }); let a = 0, b = 0;
  const ctrl = new AbortController();
  effect(() => { a++; s.v; }, { signal: ctrl.signal });
  const stop = effect(() => { b++; s.v; });
  ctrl.abort(); stop();
  s.v = 1; await tick();
  assert.deepEqual([a, b], [1, 1]);
});

test('conditional deps are dropped on re-run', async () => {
  const s = reactive({ on: true, name: 'a' }); let runs = 0;
  effect(() => { runs++; if (s.on) s.name; });
  s.on = false; await tick();
  s.name = 'b'; await tick();
  assert.equal(runs, 2);
});

test('NaN -> NaN does not re-trigger', async () => {
  const s = reactive({ n: NaN }); let runs = 0;
  effect(() => { runs++; s.n; });
  s.n = NaN; await tick();
  assert.equal(runs, 1);
});

test('Object.keys / delete are tracked', async () => {
  const s = reactive({ a: 1 }); let keys;
  effect(() => { keys = Object.keys(s).join(); });
  s.b = 2; await tick(); delete s.a; await tick();
  assert.equal(keys, 'b');
});

test('effect loop is reported, not a stack overflow', async () => {
  const s = reactive({ n: 0 }); const errors = [];
  const orig = console.error; console.error = m => errors.push(m);
  effect(() => { s.n = s.n + 1; });
  await tick(); console.error = orig;
  assert.match(String(errors[0]), /effect loop/);
});

test('effect reading a key that does not exist yet re-runs when it is added', async () => {
  const s = reactive({}); let seen;
  effect(() => { seen = s.later; });
  s.later = 'now'; await tick();
  assert.equal(seen, 'now');
});

test('JsUpdatr v2 aliases: observe / run, and the JsUpdatr export', async () => {
  assert.equal(JsUpdatr, minim);
  const state = JsUpdatr.observe({ name: 'bob', age: 22 });
  const result = {};
  JsUpdatr.run(() => { result.string = state.name; });
  state.name = 'jorge'; await tick();
  assert.equal(result.string, 'jorge');
  JsUpdatr.run(() => { result.number = state.age; });
  state.age = 23; await tick();
  assert.equal(result.number, 23);
});
