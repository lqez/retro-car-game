/**
 * Production build: bundle the ESM sources in src/ (with Three.js inlined)
 * into a single minified file under public/, and emit a self-contained
 * public/index.html that loads it — no importmap / CDN needed.
 *
 * Run with: node build.mjs   (or: npm run build)
 */
import { build } from 'esbuild';
import { readFile, writeFile, mkdir, rm } from 'node:fs/promises';

const OUT_DIR = 'public';
const BUNDLE = 'assets/main.js';

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
});

// Emit public/index.html from the root template, swapping the importmap +
// module script for a single tag that loads the bundle.
const html = await readFile('index.html', 'utf8');
const bundled = html.replace(
  /<script type="importmap">[\s\S]*?<\/script>\s*<script type="module"[\s\S]*?<\/script>/,
  `<script type="module" src="./${BUNDLE}"></script>`
);
await writeFile(`${OUT_DIR}/index.html`, bundled);

console.log(`Built ${OUT_DIR}/index.html + ${OUT_DIR}/${BUNDLE}`);
