// Builds example.html (minified lite inlined in <head>) and drives it in headless Chromium.
import { chromium } from 'playwright';
import { createServer } from 'node:http';
import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';

const dir = path.resolve('.');
// Rebuild example.html from the template when present (keeps the inlined snippet in sync with the .min.js)
try {
  const min = (await readFile(path.join(dir, 'jsupdatr-lite.min.js'), 'utf8')).trim();
  const tpl = await readFile(path.join(dir, 'example.template.html'), 'utf8');
  await writeFile(path.join(dir, 'example.html'), tpl.replace('__MIN__', () => min));
} catch {}

const server = createServer(async (req, res) => {
  try {
    const body = await readFile(path.join(dir, req.url === '/' ? 'example.html' : req.url));
    res.writeHead(200, { 'content-type': 'text/html',
      'content-security-policy': "default-src 'self'; script-src 'unsafe-inline'; style-src 'unsafe-inline'" }); // inline ok, eval NOT ok
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

const out = [];
const check = (label, ok) => out.push(`${ok ? 'PASS' : 'FAIL'}  ${label}`);
const text = sel => page.locator(sel).first().textContent();

check('script ran from <head> and booted after parse (window.app exists)', await page.evaluate(() => typeof app === 'object'));
check('initial render', (await text('[data-watch="text"]')) === 'fruit salad');
check('data-bind min/max', await page.evaluate(() => { const n = document.querySelector('[data-model="number"]'); return n.min === '11' && n.max === '23'; }));
check('data-show hidden initially', await page.evaluate(() => document.querySelector('[data-show]').hidden));
await page.fill('[data-model="name"]', 'Herton');
check('typing updates state', await page.evaluate(() => app.name === 'Herton'));
await page.fill('[data-model="user.city"]', 'Naples');
check('nested path round-trip', await page.evaluate(() => app.user.city === 'Naples') && (await text('[data-watch="user.city"]')) === 'Naples');
await page.fill('[data-model="smallest"]', '5');
check('number input stores a Number', await page.evaluate(() => app.smallest === 5));
check('dependent attribute follows', await page.evaluate(() => document.querySelector('[data-model="number"]').min === '5'));
await page.fill('[data-model="number"]', '1.');  // partially typed decimal must not be clobbered
await page.type('[data-model="number"]', '5');
check('typing a decimal is not clobbered mid-way', await page.evaluate(() => app.number === 1.5));
await page.click('button[command="--inc"]:not([data-step])');
await page.click('button[command="--inc"]:not([data-step])');
await page.click('button[command="--inc"][data-step="-1"]');
check('--inc / --inc step -1', (await text('[data-watch="count"]')) === '1');
await page.click('button[command="--toggle"]');
check('--toggle', await page.evaluate(() => app.showName === true && !document.querySelector('[data-show]').hidden));
await page.click('button[command="--set"]');
check('--set', (await text('[data-watch="text"]')) === 'tiramisu');
await page.click('button[command="--push"]');
check('--push updates todos.length', (await text('[data-watch="todos.length"]')) === '2');
await page.evaluate(() => { app.text = 'from console'; });
check('console write re-renders', (await text('[data-watch="text"]')) === 'from console');
await page.click('#inject'); await page.waitForTimeout(20);
check('late DOM binds itself', (await text('[data-late] em')) === 'Herton');
await page.fill('[data-model="name"]', 'H2');
check('late DOM keeps updating', (await text('[data-late] em')) === 'H2');
await page.click('#remove'); await page.waitForTimeout(20);
await page.fill('[data-model="name"]', 'H3');
check('removed element gone, no errors', (await page.locator('[data-late]').count()) === 0);
check('no errors under CSP without unsafe-eval', errors.length === 0);
if (errors.length) out.push('errors: ' + errors.join(' | '));

console.log(out.join('\n'));
await browser.close(); server.close();
