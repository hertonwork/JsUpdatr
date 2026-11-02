import { test } from 'node:test';
import assert from 'node:assert/strict';
globalThis.document = { readyState: 'complete', querySelectorAll: () => [] };   // lite assumes a browser
await import('./minim.js');
const { reactive, effect } = globalThis.minim;
const tick = () => Promise.resolve();

test('basic', async () => {
  const s = reactive({ a: 1 }); let seen;
  effect(() => { seen = s.a; });
  s.a = 2; await tick();
  assert.equal(seen, 2);
});
test('nested effects keep outer tracking', async () => {
  const s = reactive({ i: 1, o: 1 }); let runs = 0;
  effect(() => { runs++; effect(() => { s.i; }); s.o; });
  s.o = 2; await tick();
  assert.equal(runs, 2);
});
test('late keys, nested objects, arrays', async () => {
  const s = reactive({ u: { n: 'a' }, l: [1] }); s.b = 1;
  let b, n, len;
  effect(() => { b = s.b; }); effect(() => { n = s.u.n; }); effect(() => { len = s.l.length; });
  s.b = 2; s.u.n = 'z'; s.l.push(2); await tick();
  assert.deepEqual([b, n, len], [2, 'z', 2]);
});
test('batching: 3 writes -> 1 re-run', async () => {
  const s = reactive({ x: 0, y: 0, z: 0 }); let runs = 0;
  effect(() => { runs++; s.x; s.y; s.z; });
  s.x = 1; s.y = 1; s.z = 1; await tick();
  assert.equal(runs, 2);
});
test('stop() disposes; stop passed into fn', async () => {
  const s = reactive({ v: 0 }); let a = 0, b = 0;
  const stop = effect(() => { a++; s.v; });
  effect(st => { b++; s.v; if (b == 2) st(); });
  stop(); s.v = 1; await tick(); s.v = 2; await tick();
  assert.deepEqual([a, b], [1, 2]);
});
test('conditional deps dropped', async () => {
  const s = reactive({ on: true, name: 'a' }); let runs = 0;
  effect(() => { runs++; if (s.on) s.name; });
  s.on = false; await tick(); s.name = 'b'; await tick();
  assert.equal(runs, 2);
});
test('Object.is + loop guard', async () => {
  const s = reactive({ n: NaN, c: 0 }); let runs = 0;
  effect(() => { runs++; s.n; }); s.n = NaN; await tick();
  assert.equal(runs, 1);
  const errs = []; const orig = console.error; console.error = m => errs.push(m);
  effect(() => { s.c = s.c + 1; }); await tick(); console.error = orig;
  assert.match(String(errs[0]), /effect loop/);
});
test('effect reading a key that does not exist yet re-runs when it is added', async () => {
  const s = reactive({}); let seen;
  effect(() => { seen = s.later; });
  s.later = 'now'; await tick();
  assert.equal(seen, 'now');
});
