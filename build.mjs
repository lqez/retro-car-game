/**
 * Production build: bundle the ESM sources in src/ (with Three.js inlined)
 * into a single minified file under public/, and emit a self-contained
 * public/index.html that loads it — no importmap / CDN needed.
 *
 * Run with: node build.mjs   (or: npm run build)
 */
import { build } from 'esbuild';
import { readFile, writeFile, mkdir, rm, readdir, copyFile, stat } from 'node:fs/promises';
import { execSync } from 'node:child_process';

const OUT_DIR = 'public';
const BUNDLE = 'assets/main.js';

// Version: yyyymmdd-hhmm-serial (serial = git commit count)
const now = new Date();
const pad = (n, l=2) => String(n).padStart(l, '0');
const date = `${now.getFullYear()}${pad(now.getMonth()+1)}${pad(now.getDate())}`;
const time = `${pad(now.getHours())}${pad(now.getMinutes())}`;
let serial = 'unknown';
try { serial = execSync('git rev-parse --short=6 HEAD',{encoding:'utf8'}).trim(); } catch {}
const VERSION = `${date}-${time}-${serial}`;

// Fresh output directory
await rm(OUT_DIR, { recursive: true, force: true });
await mkdir(`${OUT_DIR}/assets`, { recursive: true });

// Bundle src/main.js → public/assets/main.js (Three.js resolved from node_modules)
await build({
  entryPoints: ['src/main.js'],
  outfile: `${OUT_DIR}/${BUNDLE}`,
  bundle: true,
  minify: true,
  format: 'esm',
  target: 'es2020',
  sourcemap: true,
  define: { __APP_VERSION__: JSON.stringify(VERSION) },
});

// Copy static assets (GLB models, subdirectories included) into public/assets/
async function copyDir(src, dest) {
  await mkdir(dest, { recursive: true });
  const entries = await readdir(src, { withFileTypes: true });
  await Promise.all(entries.map(e =>
    e.isDirectory()
      ? copyDir(`${src}/${e.name}`, `${dest}/${e.name}`)
      : copyFile(`${src}/${e.name}`, `${dest}/${e.name}`)
  ));
}
try { await copyDir('assets', `${OUT_DIR}/assets`); } catch {}

// Emit public/index.html from the root template, swapping the importmap +
// module script for a single tag that loads the bundle.
const html = await readFile('index.html', 'utf8');
const bundled = html.replace(
  /<script type="importmap">[\s\S]*?<\/script>\s*<script type="module"[\s\S]*?<\/script>/,
  `<script type="module" src="./${BUNDLE}"></script>`
);
await writeFile(`${OUT_DIR}/index.html`, bundled);

console.log(`Built ${OUT_DIR}/index.html + ${OUT_DIR}/${BUNDLE}`);
