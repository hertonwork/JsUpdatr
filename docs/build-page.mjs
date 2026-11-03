// Builds index.html (the GitHub Pages demo) from docs/index.template.html:
//   <!--sscss-->  → <style data-sscss> with exactly the sscss rules this page uses (hertonwork/sscss), generated here
//   __MINIM__     → dist/minim.min.js, inlined, so the page makes no request for a script
//   __CHART__     → docs/size-inline.svg, inlined, so the chart follows the page's light/dark tokens with no image request
import { readFile, writeFile } from 'node:fs/promises';
import { gzipSync } from 'node:zlib';
import path from 'node:path';
import { cssFor, classesIn } from '@labs_kai/sscss';

const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const read = (p) => readFile(path.join(root, p), 'utf8');
const gz = (s) => gzipSync(s, { level: 9 }).length;

const [tpl, minim, chart] = await Promise.all([read('docs/index.template.html'), read('dist/minim.min.js'), read('docs/size-inline.svg')]);
if (minim.includes('</script')) throw new Error('minim.min.js contains </script and cannot be inlined');

let html = tpl.replace('__MINIM__', () => minim.trim()).replace('__CHART__', () => chart.trim());
const used = classesIn(html);
const own = new Set([...html.replace(/<!--[\s\S]*?-->/g, '').matchAll(/<style(?![^>]*data-sscss)[^>]*>([\s\S]*?)<\/style>/g)].flatMap((s) => [...s[1].matchAll(/\.(-?[_a-zA-Z][\w-]*)/g)].map((m) => m[1])));
const { css, unknown } = cssFor([...used]);
const stray = unknown.filter((c) => !own.has(c));
if (stray.length) throw new Error(`classes neither in sscss nor styled by the page: ${stray.join(' ')}`);
html = html.replace('<!--sscss-->', () => `<style data-sscss>${css}</style>`);
await writeFile(path.join(root, 'index.html'), html);
console.log(`index.html: ${html.length} B (${(html.length / 1024).toFixed(1)} KB, ${gz(html)} B gzipped); Minim ${minim.trim().length} B; sscss ${used.size - unknown.length} utilities → ${css.length} B (${gz(css)} B gzipped)`);
