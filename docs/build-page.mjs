// Builds index.html (the GitHub Pages demo) from docs/index.template.html:
//   __MINIM__  → dist/minim.min.js, inlined, so the page makes no request for a script
//   __CHART__  → docs/size-inline.svg, inlined, so the chart follows the page's light/dark tokens with no image request
import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';

const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const read = (p) => readFile(path.join(root, p), 'utf8');

const [tpl, minim, chart] = await Promise.all([read('docs/index.template.html'), read('dist/minim.min.js'), read('docs/size-inline.svg')]);
if (minim.includes('</script')) throw new Error('minim.min.js contains </script and cannot be inlined');

const html = tpl.replace('__MINIM__', () => minim.trim()).replace('__CHART__', () => chart.trim());
await writeFile(path.join(root, 'index.html'), html);
console.log(`index.html: ${html.length} B (${(html.length / 1024).toFixed(1)} KB), Minim inlined at ${minim.trim().length} B`);
