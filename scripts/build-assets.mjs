// SVG -> retina PNG atlas pipeline.
// Rasterizes every hand-authored SVG, packs animation frames into Phaser
// atlases, emits per-town images, PWA icons and copies fonts.

import { readFile, writeFile, mkdir, rm, readdir, copyFile, stat } from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';

const root = path.resolve(import.meta.dirname, '..');
const svgRoot = path.join(root, 'assets/svg');
const outRoot = path.join(root, 'public/assets/generated');
const iconRoot = path.join(root, 'public/icons');
const ATLAS_GROUPS = new Set(['santa', 'enemies', 'props', 'ui']);
const PADDING = 2;
const MAX_ATLAS_WIDTH = 2040;

const manifest = JSON.parse(await readFile(path.join(svgRoot, 'manifest.json'), 'utf8'));

await rm(outRoot, { recursive: true, force: true });
await mkdir(outRoot, { recursive: true });
await mkdir(iconRoot, { recursive: true });

async function render(svgPath, width, height) {
  const svg = await readFile(svgPath);
  return sharp(svg)
    .resize({ width: Math.max(1, Math.round(width)), height: Math.max(1, Math.round(height)), fit: 'fill' })
    .png({ compressionLevel: 9 })
    .toBuffer();
}

function shelfPack(frames) {
  const sorted = [...frames].sort((a, b) => b.height - a.height || b.width - a.width);
  let x = PADDING;
  let y = PADDING;
  let rowH = 0;
  let usedW = 0;
  const placed = [];
  for (const f of sorted) {
    if (x + f.width + PADDING > MAX_ATLAS_WIDTH) {
      x = PADDING;
      y += rowH + PADDING;
      rowH = 0;
    }
    placed.push({ ...f, x, y });
    x += f.width + PADDING;
    usedW = Math.max(usedW, x);
    rowH = Math.max(rowH, f.height);
  }
  return {
    placed,
    width: Math.max(1, Math.ceil((usedW + PADDING) / 4) * 4),
    height: Math.max(1, Math.ceil((y + rowH + PADDING) / 4) * 4),
  };
}

async function buildAtlas(group) {
  const items = manifest.filter((m) => m.group === group);
  if (!items.length) return;
  const rendered = await Promise.all(items.map(async (item) => {
    const width = Math.round(item.width * item.scale);
    const height = Math.round(item.height * item.scale);
    const buffer = await render(path.join(svgRoot, item.dir, `${item.name}.svg`), width, height);
    return { ...item, pixelWidth: width, pixelHeight: height, buffer };
  }));
  const { placed, width, height } = shelfPack(rendered.map((r) => ({ ...r, width: r.pixelWidth, height: r.pixelHeight })));
  if (height > MAX_ATLAS_WIDTH) {
    throw new Error(`Atlas ${group} is ${width}x${height}, exceeds maximum texture height`);
  }
  const composites = placed.map((p) => ({ input: p.buffer, left: p.x, top: p.y }));
  const png = await sharp({
    create: { width, height, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } },
  }).composite(composites).png({ compressionLevel: 9 }).toBuffer();
  await writeFile(path.join(outRoot, `${group}.png`), png);
  const atlas = {
    frames: placed.map((p) => ({
      filename: p.name,
      frame: { x: p.x, y: p.y, w: p.pixelWidth, h: p.pixelHeight },
      rotated: false,
      trimmed: false,
      spriteSourceSize: { x: 0, y: 0, w: p.pixelWidth, h: p.pixelHeight },
      sourceSize: { w: p.pixelWidth, h: p.pixelHeight },
    })),
    meta: {
      app: 'Santa\'s Christmas Journey asset pipeline',
      version: '1.0',
      image: `${group}.png`,
      format: 'RGBA8888',
      size: { w: width, h: height },
      scale: '1',
    },
  };
  await writeFile(path.join(outRoot, `${group}.json`), JSON.stringify(atlas));
  console.log(`atlas ${group}: ${width}x${height}, ${items.length} frames`);
}

for (const group of ATLAS_GROUPS) await buildAtlas(group);

const imageGroups = manifest.filter((m) => !ATLAS_GROUPS.has(m.group));
const dirMap = {
  houses: 'houses',
  backgrounds: 'backgrounds',
  tiles: 'tiles',
};
for (const item of imageGroups) {
  const dir = path.join(outRoot, dirMap[item.group] ?? item.group);
  await mkdir(dir, { recursive: true });
  await writeFile(
    path.join(dir, `${item.name}.png`),
    await render(
      path.join(svgRoot, item.dir, `${item.name}.svg`),
      Math.round(item.width * item.scale),
      Math.round(item.height * item.scale),
    ),
  );
}
console.log(`images: ${imageGroups.length}`);

// Fonts (copied so they can be preloaded from the same origin).
const licenseOut = path.join(root, 'public/licenses');
await mkdir(licenseOut, { recursive: true });
for (const file of await readdir(path.join(root, 'assets/fonts'))) {
  if (file.startsWith('OFL-')) await copyFile(path.join(root, 'assets/fonts', file), path.join(licenseOut, file));
}

// PWA / store icons.
const iconSvg = await readFile(path.join(svgRoot, 'app-icon.svg'));
const iconSizes = [
  ['icon-192.png', 192],
  ['icon-512.png', 512],
  ['icon-1024.png', 1024],
  ['apple-touch-icon.png', 180],
  ['maskable-512.png', 512],
  ['favicon-64.png', 64],
];
for (const [name, size] of iconSizes) {
  await sharp(iconSvg).resize(size, size).png({ compressionLevel: 9 }).toFile(path.join(iconRoot, name));
}
await copyFile(path.join(svgRoot, 'app-icon.svg'), path.join(root, 'public/favicon.svg'));

// Build report.
const files = [];
async function walk(dir) {
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) await walk(full);
    else {
      const s = await stat(full);
      files.push({ file: path.relative(path.join(root, 'public'), full).split(path.sep).join('/'), bytes: s.size });
    }
  }
}
await walk(outRoot);
await walk(iconRoot);
const total = files.reduce((sum, f) => sum + f.bytes, 0);
await writeFile(path.join(outRoot, 'manifest.json'), JSON.stringify({ files, totalBytes: total }, null, 2));
console.log(`total generated: ${(total / 1024 / 1024).toFixed(2)} MB`);
