// Regenerates lite/README.md and lite/example.html from their templates, inlining the current lite/minim.min.js,
// so the paste-in snippet in the README can never drift from the source. `node lite/build.mjs --size` prints sizes.
import { readFile, writeFile } from 'node:fs/promises';
import { gzipSync, brotliCompressSync, constants } from 'node:zlib';
import path from 'node:path';

const dir = path.dirname(new URL(import.meta.url).pathname);
const min = (await readFile(path.join(dir, 'minim.min.js'), 'utf8')).trim();
const gz = gzipSync(min, { level: 9 }).length;
const br = brotliCompressSync(min, { params: { [constants.BROTLI_PARAM_QUALITY]: 11 } }).length;
const kb = n => (n / 1024).toFixed(1) + ' KB';
const size = `${kb(min.length)} minified · ${kb(gz)} gzipped · ${kb(br)} brotli`;

if (process.argv.includes('--size')) {
  console.log(`lite/minim.min.js: ${min.length} B minified, ${gz} B gzip, ${br} B brotli`);
} else {
  for (const [tpl, out] of [['README.template.md', 'README.md'], ['example.template.html', 'example.html']]) {
    const src = await readFile(path.join(dir, tpl), 'utf8');
    await writeFile(path.join(dir, out), src.replace('__MIN__', () => min).replace('__SIZE__', size));
  }
  console.log(`lite: generated README.md and example.html (${size})`);
}
