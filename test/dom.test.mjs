// Drives the repo's index.html (Minim, dist/index.js) in headless Chromium: npm run test:browser (needs playwright).
import { chromium } from 'playwright';
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import path from 'node:path';

const dir = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');   // repo root
const server = createServer(async (req, res) => {
  const file = path.join(dir, req.url === '/' ? 'index.html' : req.url);
  try {
    const body = await readFile(file);
    res.writeHead(200, { 'content-type': file.endsWith('.js') ? 'text/javascript' : 'text/html',
      // strict CSP: no inline scripts allowed except our hashed/none… we use 'self' only → demo-only inline
      // scripts would be blocked, so allow 'unsafe-inline' for the demo helpers but NO unsafe-eval.
      'content-security-policy': "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline' https://cdn.jsdelivr.net" });
    res.end(body);
  } catch { res.writeHead(404); res.end(); }
}).listen(0);
const port = server.address().port;

const browser = await chromium.launch();
const page = await browser.newPage();
const errors = [];
page.on('pageerror', e => errors.push(String(e)));
page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
await page.goto(`http://localhost:${port}/`);

const results = [];
const check = (label, ok) => results.push(`${ok ? 'PASS' : 'FAIL'}  ${label}`);
const text = sel => page.locator(sel).first().textContent();

check('chromium version ' + browser.version(), true);
check('Invoker Commands supported', await page.evaluate(() => 'command' in HTMLButtonElement.prototype));

// initial render from JSON state
check('data-watch rendered initial text', (await text('[data-watch="text"]')) === 'fruit salad');
check('data-bind set min/max attributes', await page.evaluate(() => {
  const n = document.querySelector('[data-model="number"]'); return n.min === '11' && n.max === '23';
}));
check('data-show hides when false', await page.evaluate(() => document.querySelector('[data-show]').hidden === true));

// two-way model + batched re-render
await page.fill('[data-model="name"]', 'Herton');
check('typing updates state', await page.evaluate(() => app.name === 'Herton'));
check('nested path model: user.city', (await text('[data-watch="user.city"]')) === 'Punta Gorda');
await page.fill('[data-model="user.city"]', 'Naples');
check('nested path round-trips', await page.evaluate(() => app.user.city === 'Naples') && (await text('[data-watch="user.city"]')) === 'Naples');

// number inputs stay numbers
await page.fill('[data-model="smallest"]', '5');
check('number input stores a Number, not a string', await page.evaluate(() => typeof app.smallest === 'number' && app.smallest === 5));
check('dependent attribute updated', await page.evaluate(() => document.querySelector('[data-model="number"]').min === '5'));

// commands: zero JS on the page
await page.click('button[command="--inc"]:not([data-step])');
await page.click('button[command="--inc"]:not([data-step])');
await page.click('button[command="--inc"][data-step="-1"]');
check('--inc / step commands', (await text('[data-watch="count"]')) === '1');
await page.click('button[command="--toggle"]');
check('--toggle shows the hidden block', await page.evaluate(() => app.showName === true && document.querySelector('[data-show]').hidden === false));
await page.click('button[command="--set"]');
check('--set writes a value', (await text('[data-watch="text"]')) === 'tiramisu');
await page.click('button[command="--push"]');
check('--push on an array updates todos.length', (await text('[data-watch="todos.length"]')) === '2');

// console-driven state change (the "fun" part)
await page.evaluate(() => { app.favorites = '🍉'; });
check('state changed from outside re-renders', (await text('[data-watch="favorites"]')) === '🍉');

// late DOM binds itself; removed DOM releases its effect
await page.click('#inject');
await page.waitForTimeout(20);
check('late-inserted element bound by MutationObserver', (await text('[data-todo] em')) === 'Herton');
await page.fill('[data-model="name"]', 'H2');
check('late element keeps updating', (await text('[data-todo] em')) === 'H2');
await page.click('#remove');
await page.waitForTimeout(20);
await page.fill('[data-model="name"]', 'H3');
check('removed element no longer in DOM and no errors after update', (await page.locator('[data-todo]').count()) === 0);

check('no page errors under strict CSP (no unsafe-eval)', errors.length === 0);
if (errors.length) results.push('errors: ' + errors.join(' | '));

console.log(results.join('\n'));
await browser.close();
server.close();
