import { existsSync } from 'node:fs';
import { mkdir, rm, writeFile } from 'node:fs/promises';
import { execFileSync } from 'node:child_process';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const icons = join(root, 'public', 'icons');
const androidRes = join(root, 'android', 'app', 'src', 'main', 'res');
const iosAssets = join(root, 'ios', 'App', 'App', 'Assets.xcassets');
const buildDir = join(root, 'build');

const background = '#050b1c';
const backgroundDeep = '#02060f';
const accent = '#ffd166';

async function ensure(path) {
  await mkdir(path, { recursive: true });
}

async function iconBuffer(size) {
  return sharp(join(icons, 'icon-1024.png'))
    .resize(size, size, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png()
    .toBuffer();
}

async function circleIcon(size) {
  const mask = Buffer.from(
    `<svg width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg"><circle cx="${size / 2}" cy="${size / 2}" r="${size / 2}" fill="#fff"/></svg>`,
  );
  const art = await iconBuffer(size);
  return sharp(art).composite([{ input: mask, blend: 'dest-in' }]).png().toBuffer();
}

async function foregroundIcon(size) {
  const inner = Math.round(size * 0.62);
  const art = await iconBuffer(inner);
  return sharp({
    create: { width: size, height: size, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } },
  })
    .composite([{ input: art, left: Math.round((size - inner) / 2), top: Math.round((size - inner) / 2) }])
    .png()
    .toBuffer();
}

async function splashBuffer(width, height) {
  const iconSize = Math.round(Math.min(width, height) * 0.24);
  const art = await iconBuffer(iconSize);
  const snow = [];
  let seed = 20241224;
  const rand = () => {
    seed = (seed * 1664525 + 1013904223) % 4294967296;
    return seed / 4294967296;
  };
  for (let i = 0; i < 90; i++) {
    const x = Math.round(rand() * width);
    const y = Math.round(rand() * height);
    const r = (rand() * 2.2 + 0.6).toFixed(1);
    const o = (rand() * 0.55 + 0.12).toFixed(2);
    snow.push(`<circle cx="${x}" cy="${y}" r="${r}" fill="#eaf6ff" opacity="${o}"/>`);
  }
  const glow = `<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <radialGradient id="bg" cx="50%" cy="42%" r="75%">
        <stop offset="0%" stop-color="#12335c"/>
        <stop offset="55%" stop-color="#081a33"/>
        <stop offset="100%" stop-color="${backgroundDeep}"/>
      </radialGradient>
      <radialGradient id="halo" cx="50%" cy="50%" r="50%">
        <stop offset="0%" stop-color="${accent}" stop-opacity="0.34"/>
        <stop offset="100%" stop-color="${accent}" stop-opacity="0"/>
      </radialGradient>
    </defs>
    <rect width="100%" height="100%" fill="url(#bg)"/>
    ${snow.join('')}
    <ellipse cx="${width / 2}" cy="${height * 0.46}" rx="${iconSize * 1.2}" ry="${iconSize * 1.2}" fill="url(#halo)"/>
  </svg>`;
  return sharp(Buffer.from(glow))
    .composite([{ input: art, left: Math.round((width - iconSize) / 2), top: Math.round((height - iconSize) / 2) }])
    .png()
    .toBuffer();
}

async function buildAndroid() {
  const legacy = { mdpi: 48, hdpi: 72, xhdpi: 96, xxhdpi: 144, xxxhdpi: 192 };
  const adaptive = { mdpi: 108, hdpi: 162, xhdpi: 216, xxhdpi: 288, xxxhdpi: 432 };
  for (const [density, size] of Object.entries(legacy)) {
    const dir = join(androidRes, `mipmap-${density}`);
    await ensure(dir);
    await sharp(await iconBuffer(size)).png().toFile(join(dir, 'ic_launcher.png'));
    await sharp(await circleIcon(size)).png().toFile(join(dir, 'ic_launcher_round.png'));
  }
  for (const [density, size] of Object.entries(adaptive)) {
    const dir = join(androidRes, `mipmap-${density}`);
    await ensure(dir);
    await sharp(await foregroundIcon(size)).png().toFile(join(dir, 'ic_launcher_foreground.png'));
  }
  const splashDirs = [
    'drawable', 'drawable-land-mdpi', 'drawable-land-hdpi', 'drawable-land-xhdpi',
    'drawable-land-xxhdpi', 'drawable-land-xxxhdpi', 'drawable-port-mdpi',
    'drawable-port-hdpi', 'drawable-port-xhdpi', 'drawable-port-xxhdpi', 'drawable-port-xxxhdpi',
  ];
  const landscape = await splashBuffer(1920, 1080);
  const portrait = await splashBuffer(1080, 1920);
  for (const dirName of splashDirs) {
    const dir = join(androidRes, dirName);
    await ensure(dir);
    const buffer = dirName.includes('port') ? portrait : landscape;
    await writeFile(join(dir, 'splash.png'), buffer);
  }
}

async function buildIos() {
  const iconDir = join(iosAssets, 'AppIcon.appiconset');
  await ensure(iconDir);
  const flattened = await sharp(join(icons, 'icon-1024.png'))
    .resize(1024, 1024)
    .flatten({ background })
    .png()
    .toBuffer();
  await writeFile(join(iconDir, 'AppIcon-512@2x.png'), flattened);
  await writeFile(join(iosAssets, 'Splash.imageset', 'splash-2732x2732.png'), await splashBuffer(2732, 2732));
  await writeFile(join(iosAssets, 'Splash.imageset', 'splash-2732x2732-1.png'), await splashBuffer(2732, 2732));
  await writeFile(join(iosAssets, 'Splash.imageset', 'splash-2732x2732-2.png'), await splashBuffer(2732, 2732));
}

async function buildDesktop() {
  await ensure(buildDir);
  const png = await sharp(join(icons, 'icon-1024.png'))
    .resize(1024, 1024)
    .flatten({ background })
    .png()
    .toBuffer();
  await writeFile(join(buildDir, 'icon.png'), png);
  if (process.platform !== 'darwin') return;
  const iconset = join(buildDir, 'icon.iconset');
  await rm(iconset, { recursive: true, force: true });
  await ensure(iconset);
  const sizes = [16, 32, 64, 128, 256, 512, 1024];
  for (const size of sizes) {
    await sharp(png).resize(size, size).png().toFile(join(iconset, `icon_${size}x${size}.png`));
    if (size <= 512) {
      await sharp(png).resize(size * 2, size * 2).png().toFile(join(iconset, `icon_${size}x${size}@2x.png`));
    }
  }
  execFileSync('iconutil', ['-c', 'icns', iconset, '-o', join(buildDir, 'icon.icns')]);
  await rm(iconset, { recursive: true, force: true });
}

if (existsSync(androidRes)) await buildAndroid();
if (existsSync(iosAssets)) await buildIos();
await buildDesktop();
console.log('Native icons and splash screens generated.');
