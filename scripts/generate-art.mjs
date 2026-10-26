import { mkdir, writeFile, readdir } from 'node:fs/promises';
import path from 'node:path';
import { buildSanta } from './art/santa.mjs';
import { buildEnemies } from './art/enemies.mjs';
import { buildHouses } from './art/houses.mjs';
import { buildEnvironment } from './art/environment.mjs';
import { buildUi, appIcon } from './art/ui.mjs';

const root = path.resolve(import.meta.dirname, '..');
const manifest = [];

async function emit(dir, group, frames) {
  const outDir = path.join(root, 'assets/svg', dir);
  await mkdir(outDir, { recursive: true });
  for (const frame of frames) {
    await writeFile(path.join(outDir, `${frame.name}.svg`), frame.svg);
    manifest.push({ group, dir, name: frame.name, width: frame.width, height: frame.height, scale: frame.scale });
  }
}

await emit('characters/santa', 'santa', buildSanta());
await emit('characters/enemies', 'enemies', buildEnemies());
await emit('environments/houses', 'houses', buildHouses());
await emit('environments', 'props', buildEnvironment().filter((f) => !/^bg-|^tile-/.test(f.name)));
await emit('environments/backgrounds', 'backgrounds', buildEnvironment().filter((f) => /^bg-/.test(f.name)));
await emit('environments/tiles', 'tiles', buildEnvironment().filter((f) => /^tile-/.test(f.name)));
await emit('ui', 'ui', buildUi());
await mkdir(path.join(root, 'assets/svg'), { recursive: true });
await writeFile(path.join(root, 'assets/svg/app-icon.svg'), appIcon());
const names = new Set();
for (const entry of manifest) {
  if (names.has(entry.name)) throw new Error(`Duplicate art frame name: ${entry.name}`);
  names.add(entry.name);
}
await writeFile(path.join(root, 'assets/svg/manifest.json'), JSON.stringify(manifest, null, 2));

// Developer contact sheet (not shipped).
const groups = ['characters/santa', 'characters/enemies', 'environments/houses', 'ui'];
const sections = [];
for (const dir of groups) {
  const files = (await readdir(path.join(root, 'assets/svg', dir))).filter((f) => f.endsWith('.svg')).sort();
  sections.push(`<h2>${dir} (${files.length})</h2><div class="grid">` + files.slice(0, 80).map((f) => `<figure><img src="../assets/svg/${dir}/${f}" loading="lazy" style="max-width:160px;max-height:190px"><figcaption>${f.replace('.svg', '')}</figcaption></figure>`).join('') + '</div>');
}
await mkdir(path.join(root, 'dev'), { recursive: true });
await writeFile(path.join(root, 'dev/art-preview.html'), `<!doctype html><meta charset="utf-8"><title>Art preview</title>
<style>body{margin:0;background:#101a2c;color:#cde;font:12px system-ui;padding:12px}h2{font-size:14px;margin:18px 0 8px}.grid{display:flex;flex-wrap:wrap;gap:8px}figure{margin:0;background:#1a2740;padding:6px;border-radius:8px;min-width:96px;text-align:center}img{display:block;margin:auto;background:radial-gradient(circle at 50% 30%,#315078,#0a1222)}figcaption{text-align:center;padding-top:4px}</style>${sections.join('')}`);

console.log(`Wrote ${manifest.length} SVG frames`);
