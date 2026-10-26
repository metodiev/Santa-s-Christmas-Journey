// Parallax backgrounds, ground tiles and interactive set dressing.

import {
  svgDoc, linearGradient, radialGradient, filterBlur, filterGlow, filterShadow, filterFur,
  ridgePath, starField, snowPile, snowCap, icicles, furEdge, mulberry32, round, starPath, rgba, mix,
} from './lib.mjs';
import { TOWN_PALETTES, TOWN_ORDER } from './palettes.mjs';

function frame(name, width, height, body, defs = '', scale = 2) {
  return {
    name,
    width,
    height,
    scale,
    svg: svgDoc(Math.round(width * scale), Math.round(height * scale), `0 0 ${width} ${height}`, defs, body),
  };
}

/* ------------------------------------------------------------------ */
/* Backgrounds                                                         */
/* ------------------------------------------------------------------ */

function periodicBand(W, H, baseY, amp1, f1, amp2, f2, fill, phase = 0.4) {
  const yAt = (t) => baseY + Math.sin(2 * Math.PI * f1 * t + phase) * amp1 + Math.sin(2 * Math.PI * f2 * t + phase * 1.7) * amp2;
  let d = `M0,${H} L0,${round(yAt(0))}`;
  for (let i = 1; i <= 96; i++) {
    const t = i / 96;
    d += ` L${round(t * W)},${round(yAt(t))}`;
  }
  d += ` L${W},${H} Z`;
  return `<path d="${d}" fill="${fill}"/>`;
}

function mountain(x, baseY, width, height, fill, snow, rim, seed) {
  const rand = mulberry32(seed);
  const peakX = x + width * (0.35 + rand() * 0.3);
  const notch = width * 0.16;
  return `
    <path d="M${round(x)},${baseY} L${round(peakX - notch)},${round(baseY - height * 0.28)} L${round(peakX - width * 0.18)},${round(baseY - height * 0.55)} L${round(peakX)},${round(baseY - height)} L${round(peakX + width * 0.2)},${round(baseY - height * 0.52)} L${round(peakX + notch)},${round(baseY - height * 0.3)} L${round(x + width)},${baseY} Z" fill="${fill}"/>
    <path d="M${round(peakX)},${round(baseY - height)} L${round(peakX + width * 0.2)},${round(baseY - height * 0.52)} L${round(peakX + width * 0.07)},${round(baseY - height * 0.55)} L${round(peakX)},${round(baseY - height * 0.42)} L${round(peakX - width * 0.09)},${round(baseY - height * 0.58)} L${round(peakX - width * 0.18)},${round(baseY - height * 0.55)} Z" fill="${snow}" opacity="0.9"/>
    <path d="M${round(peakX - notch)},${round(baseY - height * 0.28)} L${round(peakX)},${round(baseY - height)} L${round(peakX + notch)},${round(baseY - height * 0.3)} L${round(peakX + width * 0.06)},${round(baseY - height * 0.34)} L${round(peakX)},${round(baseY - height * 0.62)} L${round(peakX - width * 0.07)},${round(baseY - height * 0.36)} Z" fill="${rim}" opacity="0.45"/>
  `;
}

function pineSilhouette(x, baseY, h, fill, snow, seed) {
  const rand = mulberry32(seed);
  const w = h * 0.46;
  let out = `<rect x="${round(x - h * 0.025)}" y="${round(baseY - h * 0.22)}" width="${round(h * 0.05)}" height="${round(h * 0.23)}" fill="${fill}"/>`;
  for (let i = 0; i < 3; i++) {
    const ty = baseY - h * (0.25 + i * 0.24);
    const tw = w * (1 - i * 0.2);
    out += `<path d="M${round(x - tw / 2)},${round(ty)} L${round(x)},${round(ty - h * 0.32)} L${round(x + tw / 2)},${round(ty)} Z" fill="${fill}"/>`;
    out += `<path d="M${round(x - tw * 0.36)},${round(ty - 2)} L${round(x)},${round(ty - h * 0.32 + 4)} L${round(x + tw * 0.36)},${round(ty - 2)} L${round(x + tw * 0.26)},${round(ty - h * 0.06)} L${round(x + tw * 0.08)},${round(ty - h * 0.1)} L${round(x)},${round(ty - h * 0.06)} L${round(x - tw * 0.13)},${round(ty - h * 0.11)} L${round(x - tw * 0.3)},${round(ty - h * 0.05)} Z" fill="${snow}" opacity="0.85"/>`;
    for (let k = 0; k < 4; k++) {
      out += `<circle cx="${round(x + (rand() - 0.5) * tw * 0.7)}" cy="${round(ty - rand() * h * 0.15)}" r="${round(0.8 + rand() * 1.3)}" fill="${snow}" opacity="0.5"/>`;
    }
  }
  return out;
}

function cottageSilhouette(x, baseY, s, fill, windowColor, snow) {
  const w = 64 * s;
  const h = 48 * s;
  return `
    <rect x="${round(x)}" y="${round(baseY - h)}" width="${round(w)}" height="${round(h)}" fill="${fill}"/>
    <path d="M${round(x - 6 * s)},${round(baseY - h)} L${round(x + w / 2)},${round(baseY - h - 24 * s)} L${round(x + w + 6 * s)},${round(baseY - h)} Z" fill="${fill}"/>
    <path d="M${round(x - 6 * s)},${round(baseY - h)} L${round(x + w / 2)},${round(baseY - h - 24 * s)} L${round(x + w + 6 * s)},${round(baseY - h)} L${round(x + w * 0.8)},${round(baseY - h + 3 * s)} L${round(x + w / 2)},${round(baseY - h - 14 * s)} L${round(x + w * 0.2)},${round(baseY - h + 3 * s)} Z" fill="${snow}" opacity="0.9"/>
    <rect x="${round(x + w * 0.18)}" y="${round(baseY - h * 0.62)}" width="${round(w * 0.2)}" height="${round(h * 0.28)}" fill="${windowColor}" opacity="0.9"/>
    <rect x="${round(x + w * 0.62)}" y="${round(baseY - h * 0.62)}" width="${round(w * 0.2)}" height="${round(h * 0.28)}" fill="${windowColor}" opacity="0.7"/>
    <rect x="${round(x + w * 0.28)}" y="${round(baseY - h * 0.62)}" width="${round(w * 0.02)}" height="${round(h * 0.28)}" fill="${fill}" opacity="0.5"/>
    <rect x="${round(x + w * 0.72)}" y="${round(baseY - h * 0.62)}" width="${round(w * 0.02)}" height="${round(h * 0.28)}" fill="${fill}" opacity="0.5"/>
    <rect x="${round(x + w * 0.44)}" y="${round(baseY - h * 0.8)}" width="${round(w * 0.12)}" height="${round(h * 0.2)}" fill="${fill}"/>
    <rect x="${round(x + w * 0.8)}" y="${round(baseY - h * 1.25)}" width="${round(w * 0.1)}" height="${round(h * 0.35)}" fill="${fill}"/>
    <path d="M${round(x + w * 0.78)},${round(baseY - h * 1.26)} L${round(x + w * 0.92)},${round(baseY - h * 1.26)} L${round(x + w * 0.9)},${round(baseY - h * 1.2)} L${round(x + w * 0.8)},${round(baseY - h * 1.2)} Z" fill="${snow}" opacity="0.8"/>
  `;
}

function factorySilhouette(x, baseY, s, fill, windowColor, accent, snow) {
  const w = 70 * s;
  const h = 70 * s;
  return `
    <rect x="${round(x)}" y="${round(baseY - h)}" width="${round(w)}" height="${round(h)}" fill="${fill}"/>
    <path d="M${round(x)},${round(baseY - h)} L${round(x)},${round(baseY - h - 26 * s)} L${round(x + w * 0.2)},${round(baseY - h - 26 * s)} L${round(x + w * 0.2)},${round(baseY - h - 12 * s)} L${round(x + w * 0.55)},${round(baseY - h - 12 * s)} L${round(x + w * 0.55)},${round(baseY - h - 30 * s)} L${round(x + w * 0.75)},${round(baseY - h - 30 * s)} L${round(x + w * 0.75)},${round(baseY - h)} Z" fill="${fill}"/>
    <rect x="${round(x + w * 0.12)}" y="${round(baseY - h - 52 * s)}" width="${round(w * 0.12)}" height="${round(h * 0.4)}" fill="${fill}"/>
    <rect x="${round(x + w * 0.12)}" y="${round(baseY - h - 52 * s)}" width="${round(w * 0.12)}" height="${round(3 * s)}" fill="${accent}" opacity="0.8"/>
    <rect x="${round(x + w * 0.62)}" y="${round(baseY - h - 48 * s)}" width="${round(w * 0.1)}" height="${round(h * 0.35)}" fill="${fill}"/>
    <rect x="${round(x + w * 0.62)}" y="${round(baseY - h - 48 * s)}" width="${round(w * 0.1)}" height="${round(3 * s)}" fill="${accent}" opacity="0.8"/>
    <path d="M${round(x + w * 0.12)},${round(baseY - h - 52 * s)} C${round(x + w * 0.06)},${round(baseY - h - 64 * s)} ${round(x + w * 0.01)},${round(baseY - h - 60 * s)} ${round(x - 4 * s)},${round(baseY - h - 70 * s)}" stroke="${snow}" stroke-width="${round(2 * s)}" opacity="0.2" fill="none"/>
    ${[0, 1, 2].map((i) => `<rect x="${round(x + w * 0.28)}" y="${round(baseY - h * 0.72 + i * 14 * s)}" width="${round(w * 0.16)}" height="${round(7 * s)}" fill="${windowColor}" opacity="${0.8 - i * 0.15}"/>`).join('')}
    ${[0, 1, 2].map((i) => `<rect x="${round(x + w * 0.78)}" y="${round(baseY - h * 0.55 + i * 12 * s)}" width="${round(w * 0.1)}" height="${round(5 * s)}" fill="${windowColor}" opacity="${0.65 - i * 0.12}"/>`).join('')}
    <path d="M${round(x)},${round(baseY - h - 4 * s)} L${round(x + w)},${round(baseY - h - 4 * s)}" stroke="${snow}" stroke-width="${round(2.4 * s)}" opacity="0.55"/>
    <circle cx="${round(x + w * 0.38)}" cy="${round(baseY - h * 0.4)}" r="${round(9 * s)}" fill="none" stroke="${fill}" stroke-width="${round(2 * s)}" opacity="0.8"/>
    <circle cx="${round(x + w * 0.38)}" cy="${round(baseY - h * 0.4)}" r="${round(4 * s)}" fill="none" stroke="${accent}" stroke-width="${round(1.2 * s)}" opacity="0.5"/>
  `;
}

function crystalSpire(x, baseY, h, fill, snow, glow) {
  const w = h * 0.3;
  return `
    <path d="M${round(x - w / 2)},${round(baseY)} L${round(x - w * 0.18)},${round(baseY - h * 0.7)} L${round(x)},${round(baseY - h)} L${round(x + w * 0.16)},${round(baseY - h * 0.7)} L${round(x + w / 2)},${round(baseY)} Z" fill="${fill}"/>
    <path d="M${round(x)},${round(baseY - h)} L${round(x + w * 0.16)},${round(baseY - h * 0.7)} L${round(x + w * 0.34)},${round(baseY - h * 0.62)} L${round(x + w * 0.08)},${round(baseY - h * 0.5)} Z" fill="${snow}" opacity="0.6"/>
    <path d="M${round(x - w * 0.2)},${round(baseY - h * 0.1)} L${round(x - w * 0.02)},${round(baseY - h * 0.65)}" stroke="${glow}" stroke-width="1.2" opacity="0.4"/>
  `;
}

function background(town, layer) {
  const p = TOWN_PALETTES[town];
  const W = 1280;
  const H = 480;
  let content = '';
  let defs = '';

  if (layer === 'far') {
    defs = `
      ${linearGradient('far-haze', [[0, 'transparent'], [0.55, rgba(p.far.haze, 0.15)], [1, rgba(p.far.haze, 0.6)]], 0, 0, 0, 1)}
      ${linearGradient('far-glow', [[0, rgba(p.aurora[0], 0.16)], [1, 'transparent']], 0, 0, 0, 1)}
    `;
    content += `<rect x="0" y="260" width="${W}" height="220" fill="url(#far-haze)"/>`;
    content += mountain(-120, 470, 520, 300, p.far.dark, p.far.snow, p.far.rock, 11);
    content += mountain(280, 470, 620, 370, p.far.dark, p.far.snow, p.far.rock, 12);
    content += mountain(760, 470, 540, 290, p.far.dark, p.far.snow, p.far.rock, 13);
    content += mountain(1140, 470, 520, 330, p.far.dark, p.far.snow, p.far.rock, 14);
    content += mountain(-60, 470, 380, 240, p.far.rock, p.far.snow, p.far.dark, 15);
    content += mountain(520, 470, 500, 260, p.far.rock, p.far.snow, p.far.dark, 16);
    content += mountain(1040, 470, 430, 220, p.far.rock, p.far.snow, p.far.dark, 17);
    content += `<rect x="0" y="310" width="${W}" height="170" fill="url(#far-haze)" opacity="0.5"/>`;
    content += starField(W, 190, 42, 91, p.star);
    if (town === 'factory') {
      content += `<rect x="0" y="390" width="${W}" height="90" fill="${p.far.rock}" opacity="0.45"/>`;
    }
  } else if (layer === 'mid') {
    defs = `
      ${linearGradient('mid-glow', [[0, rgba(p.mid.window, 0.25)], [1, 'transparent']], 0, 0, 0, 1)}
      ${filterGlow('mid-window-glow', 4)}
    `;
    const rand = mulberry32(town.length * 47 + 3);
    const baseY = 462;

    if (town === 'pine') {
      for (let i = 0; i < 14; i++) {
        const x = i * 96 + rand() * 50;
        const h = 130 + rand() * 110;
        content += pineSilhouette(x, baseY, h, p.mid.fill, p.mid.snow, 100 + i);
      }
      content += cottageSilhouette(220, baseY, 1, p.mid.fill2, p.mid.window, p.mid.snow);
      content += cottageSilhouette(820, baseY, 1.15, p.mid.fill2, p.mid.window, p.mid.snow);
      content += cottageSilhouette(1120, baseY, 0.9, p.mid.fill2, p.mid.window, p.mid.snow);
      content += periodicBand(W, H, 434, 9, 5, 4, 11, p.mid.fill2, 0.4);
      content += periodicBand(W, H, 438, 6, 7, 3, 13, p.mid.snow, 1.4);
    } else if (town === 'ginger') {
      for (let i = 0; i < 10; i++) {
        const x = i * 134 + 20;
        const h = 150 + rand() * 100;
        content += `<g opacity="0.9">
          <path d="M${round(x)},${baseY} L${round(x)},${round(baseY - h * 0.4)}" stroke="${p.mid.fill}" stroke-width="4"/>
          <path d="M${round(x - h * 0.1)},${round(baseY - h * 0.45)} C${round(x - h * 0.12)},${round(baseY - h * 0.75)} ${round(x + h * 0.12)},${round(baseY - h * 0.85)} ${round(x + h * 0.06)},${round(baseY - h)}" stroke="${p.mid.fill}" stroke-width="4" fill="none"/>
          <circle cx="${round(x + h * 0.06)}" cy="${round(baseY - h)}" r="${round(6)}" fill="${p.mid.window}" opacity="0.5"/>
        </g>`;
      }
      for (let i = 0; i < 8; i++) {
        const x = i * 160 + rand() * 40;
        content += `<ellipse cx="${round(x)}" cy="${baseY - 30}" rx="${round(70 + rand() * 40)}" ry="${round(40 + rand() * 30)}" fill="${p.mid.fill}" opacity="0.7"/>`;
        content += `<ellipse cx="${round(x)}" cy="${baseY - 46}" rx="${round(50 + rand() * 30)}" ry="${round(22 + rand() * 20)}" fill="${p.mid.fill2}" opacity="0.7"/>`;
      }
      content += cottageSilhouette(180, baseY, 1.1, p.mid.fill2, p.mid.window, p.mid.snow);
      content += cottageSilhouette(650, baseY, 1.3, p.mid.fill2, p.mid.window, p.mid.snow);
      content += cottageSilhouette(1040, baseY, 1, p.mid.fill2, p.mid.window, p.mid.snow);
    } else if (town === 'factory') {
      for (let i = 0; i < 9; i++) {
        const x = i * 150 + rand() * 30;
        content += factorySilhouette(x, baseY, 0.9 + rand() * 0.6, p.mid.fill, p.mid.window, p.accent, p.mid.snow);
      }
      content += `<path d="M0,438 L1280,438 L1280,480 L0,480 Z" fill="${p.mid.fill2}"/>`;
      for (let i = 0; i < 18; i++) {
        const x = i * 72;
        content += `<rect x="${x}" y="446" width="44" height="6" rx="3" fill="${p.mid.window}" opacity="${i % 3 === 0 ? 0.5 : 0.18}"/>`;
      }
    } else if (town === 'forest') {
      for (let i = 0; i < 18; i++) {
        const x = i * 74 + rand() * 34;
        content += pineSilhouette(x, baseY, 170 + rand() * 140, p.mid.fill, p.mid.snow, 300 + i);
      }
      content += crystalSpire(140, baseY, 220, p.mid.fill2, p.mid.snow, p.aurora[0]);
      content += crystalSpire(1080, baseY, 250, p.mid.fill2, p.mid.snow, p.aurora[0]);
      content += periodicBand(W, H, 448, 8, 4, 4, 9, p.mid.fill2, 0.8);
      content += `<circle cx="360" cy="360" r="3" fill="${p.mid.window}" opacity="0.8"/><circle cx="900" cy="330" r="2" fill="${p.mid.window}" opacity="0.7"/><circle cx="1180" cy="390" r="2.4" fill="${p.mid.window}" opacity="0.8"/>`;
    } else {
      for (let i = 0; i < 12; i++) {
        content += crystalSpire(40 + i * 108 + rand() * 40, baseY, 130 + rand() * 210, p.mid.fill, p.mid.snow, p.aurora[0]);
      }
      content += periodicBand(W, H, 442, 7, 5, 4, 11, p.mid.fill2, 1.1);
      content += `<g opacity="0.5"><path d="M420,438 L452,350 L476,438 Z" fill="${p.mid.fill2}"/><path d="M452,350 L464,390 L452,438 L440,390 Z" fill="${p.aurora[0]}" opacity="0.3"/></g>`;
      content += `<circle cx="640" cy="300" r="2.4" fill="${p.aurora[0]}" opacity="0.7"/><circle cx="820" cy="260" r="2" fill="${p.aurora[1]}" opacity="0.6"/>`;
    }
    content += `<rect x="0" y="360" width="${W}" height="120" fill="url(#mid-glow)" opacity="0.4"/>`;
  } else {
    // near foreground snow banks
    defs = `
      ${linearGradient('near-grad', [[0, p.near.fill], [1, mix(p.near.fill, '#000', 0.35)]], 0, 0, 0, 1)}
      ${linearGradient('near-rim', [[0, p.near.rim], [1, 'transparent']], 0, 0, 0, 1)}
    `;
    const rand = mulberry32(311 + town.length);
    const top = 300;
    const yAt = (x) => top + Math.sin((x / W) * Math.PI * 12 + 0.4) * 22 + Math.sin((x / W) * Math.PI * 26) * 9;
    let d = `M0,${H} L0,${round(yAt(0))}`;
    for (let i = 1; i <= 96; i++) {
      const x = (i / 96) * W;
      d += ` L${round(x)},${round(yAt(x))}`;
    }
    d += ` L${W},${H} Z`;
    content += `<path d="${d}" fill="url(#near-grad)"/>`;
    content += `<path d="${d.replace(`L${W},${H} Z`, '')}" stroke="${p.near.snow}" stroke-width="5" opacity="0.5" fill="none"/>`;
    content += `<path d="${d}" fill="none" stroke="${p.near.rim}" stroke-width="1.5" opacity="0.4"/>`;
    for (let i = 0; i < 16; i++) {
      const x = rand() * W;
      const y = top + 40 + rand() * 120;
      content += `<path d="M${round(x)},${round(y)} C${round(x - 12)},${round(y + 10)} ${round(x - 16)},${round(y + 26)} ${round(x - 8)},${round(y + 36)}" stroke="${p.near.snow}" stroke-width="${round(1 + rand() * 2)}" opacity="${round(0.08 + rand() * 0.14)}" fill="none"/>`;
    }
    content += icicles(180, top + 26, 920, 10, 91, rgba(p.near.snow, 0.5));
  }
  const body = `<g id="bg-tile">${content}</g><use href="#bg-tile" x="-${W}"/><use href="#bg-tile" x="${W}"/>`;
  return frame(`bg-${town}-${layer}`, W, H, body, defs, 1);
}

/* ------------------------------------------------------------------ */
/* Tiles                                                               */
/* ------------------------------------------------------------------ */

function tileTextures(town) {
  const p = TOWN_PALETTES[town];
  const rand = mulberry32(town.length * 91 + 7);
  const isFactory = town === 'factory';
  const isGinger = town === 'ginger';
  const isForest = town === 'forest';
  const isSummit = town === 'summit';

  const baseFill = (() => {
    let s = `<rect width="64" height="64" fill="url(#fill-grad-${town})"/>`;
    for (let i = 0; i < 14; i++) {
      const x = rand() * 64;
      const y = rand() * 64;
      s += `<circle cx="${round(x)}" cy="${round(y)}" r="${round(0.6 + rand() * 1.7)}" fill="${p.ground.edge}" opacity="${round(0.1 + rand() * 0.2)}"/>`;
    }
    if (isFactory) {
      s += `<path d="M0,20 L64,20 M0,44 L64,44" stroke="${p.ground.edge}" stroke-width="1.5" opacity="0.7"/>`;
      s += `<path d="M8,20 L8,44 M36,20 L36,44" stroke="${p.ground.edge}" stroke-width="1" opacity="0.5"/>`;
      [8, 36, 60].forEach((x) => [10, 33, 55].forEach((y) => { s += `<circle cx="${x}" cy="${y}" r="1.4" fill="${p.metal}" opacity="0.7"/>`; }));
    } else if (isGinger) {
      s += `<path d="M4,14 C18,8 30,20 44,12 C52,8 60,14 64,10" stroke="${p.ground.fill2}" stroke-width="2" opacity="0.5" fill="none"/>`;
      s += `<path d="M10,34 C24,28 36,40 52,32" stroke="${p.ground.fill2}" stroke-width="1.4" opacity="0.4" fill="none"/>`;
      for (let i = 0; i < 5; i++) s += `<circle cx="${round(rand() * 64)}" cy="${round(rand() * 64)}" r="${round(0.8 + rand())}" fill="#fff3e0" opacity="0.4"/>`;
    } else if (isForest || isSummit) {
      s += `<path d="M0,18 L18,26 L34,14 L50,24 L64,16 M0,42 L14,48 L30,40 L48,48 L64,42" stroke="${p.ground.edge}" stroke-width="1" opacity="0.35" fill="none"/>`;
    } else {
      s += `<path d="M4,12 C16,16 24,8 36,12 C48,16 56,10 64,14" stroke="${p.ground.edge}" stroke-width="1.2" opacity="0.28" fill="none"/>`;
    }
    return s;
  })();

  const altFill = (() => {
    let s = `<rect width="64" height="64" fill="url(#alt-grad-${town})"/>`;
    if (isGinger) {
      s += `<path d="M0,16 L64,16 M0,34 L64,34 M0,52 L64,52" stroke="${p.alt.fill2}" stroke-width="2" opacity="0.35"/>`;
      s += `<path d="M10,0 L0,16 M42,16 L32,34 M58,34 L48,52" stroke="#fff2df" stroke-width="3" opacity="0.4"/>`;
    } else if (isFactory) {
      s += `<path d="M8,8 L56,8 L48,18 L8,18 Z" fill="${p.alt.top}" opacity="0.18"/>`;
      s += [12, 30, 48].map((x) => `<circle cx="${x}" cy="${x % 3 === 0 ? 28 : 48}" r="2" fill="${p.alt.top}" opacity="0.5"/>`).join('');
      s += `<path d="M0,26 L64,26" stroke="${p.alt.fill2}" stroke-width="1" opacity="0.5"/>`;
    } else {
      for (let i = 0; i < 5; i++) {
        const x1 = rand() * 64;
        const y1 = rand() * 64;
        s += `<path d="M${round(x1)},${round(y1)} l${round(4 + rand() * 8)},${round(4 + rand() * 8)} l${round(3 + rand() * 5)},${round(-2 - rand() * 5)}" stroke="#ffffff" stroke-width="0.8" opacity="0.35" fill="none"/>`;
        s += `<path d="M${round(rand() * 64)},${round(rand() * 64)} l${round(2 + rand() * 5)},${round(3 + rand() * 6)}" stroke="${p.alt.fill2}" stroke-width="1" opacity="0.35"/>`;
      }
      s += `<ellipse cx="18" cy="18" rx="12" ry="5" fill="#ffffff" opacity="0.12" transform="rotate(-25 18 18)"/>`;
    }
    return s;
  })();

  const topBase = (alt = false) => {
    const topColor = alt ? p.alt.top : p.ground.top;
    const deep = alt ? p.alt.fill2 : p.ground.fill2;
    let s = `<path d="M0,0 L64,0 L64,15 C54,20 44,13 34,17 C22,21 12,15 0,18 Z" fill="url(#top-grad-${town}${alt ? '-alt' : ''})"/>`;
    s += `<path d="M0,16 C12,13 20,19 32,16 C44,13 54,18 64,14 L64,20 C52,24 44,18 32,21 C20,24 12,19 0,22 Z" fill="${deep}" opacity="0.45"/>`;
    s += `<path d="M0,4 C12,7 22,2 34,5 C46,8 56,3 64,5" stroke="#ffffff" stroke-width="1.2" opacity="${alt ? 0.55 : 0.7}" fill="none"/>`;
    s += `<path d="M6,9 C18,12 24,7 36,10 C46,12 54,8 60,9" stroke="${topColor}" stroke-width="0.7" opacity="0.6" fill="none"/>`;
    if (alt) {
      s += `<path d="M12,5 L16,10 L12,15 M46,3 L42,9 L48,13" stroke="#ffffff" stroke-width="0.8" opacity="0.4" fill="none"/>`;
    } else {
      for (let i = 0; i < 4; i++) s += `<circle cx="${round(8 + rand() * 50)}" cy="${round(6 + rand() * 8)}" r="${round(0.5 + rand())}" fill="#ffffff" opacity="0.6"/>`;
    }
    return s;
  };

  const platform = (() => {
    let s = `<path d="M0,8 C10,4 20,9 32,6 C44,3 54,8 64,5 L64,18 L0,18 Z" fill="url(#snow-grad-${town})"/>`;
    s += `<path d="M0,16 L64,16 L64,28 L0,28 Z" fill="${isGinger ? '#b5525b' : isFactory ? p.platform.fill : p.platform.fill}"/>`;
    s += `<path d="M0,17 L64,17" stroke="${p.platform.edge}" stroke-width="1" opacity="0.7"/>`;
    if (isGinger) {
      s += `<path d="M8,16 L16,28 M24,16 L32,28 M40,16 L48,28 M56,16 L64,28" stroke="#fff4e2" stroke-width="3" opacity="0.6"/>`;
    } else if (isFactory) {
      s += `<path d="M6,22 L58,22" stroke="${p.metal}" stroke-width="1" opacity="0.6"/><circle cx="12" cy="24" r="1.4" fill="${p.metal}"/><circle cx="52" cy="24" r="1.4" fill="${p.metal}"/>`;
    } else {
      s += `<path d="M8,20 C20,23 30,19 40,22" stroke="${p.platform.edge}" stroke-width="0.8" fill="none" opacity="0.5"/>`;
    }
    s += `<path d="M4,28 L8,35 M22,28 L26,32 M44,28 L40,36 M58,28 L54,33" stroke="${p.snow.light}" stroke-width="1.4" opacity="0.5" stroke-linecap="round"/>`;
    return s;
  })();

  const block = (() => {
    let s = `<rect x="0" y="0" width="64" height="64" rx="7" fill="url(#block-grad-${town})" stroke="${p.block.edge}" stroke-width="2"/>`;
    s += `<path d="M3,8 C18,4 44,4 61,8 L60,16 C42,20 20,20 4,16 Z" fill="#ffffff" opacity="0.55"/>`;
    s += `<path d="M6,34 L58,34" stroke="${p.block.edge}" stroke-width="1.2" opacity="0.55"/>`;
    if (isGinger) {
      s += `<circle cx="20" cy="24" r="3.4" fill="${p.accent2}"/><circle cx="44" cy="45" r="3.4" fill="${p.accent}"/>`;
    } else if (isFactory) {
      s += `<circle cx="12" cy="12" r="1.6" fill="${p.metal}"/><circle cx="52" cy="12" r="1.6" fill="${p.metal}"/><path d="M18,44 L46,44" stroke="${p.accent}" stroke-width="3" opacity="0.6"/>`;
    } else {
      s += `<path d="M14,44 L26,50 L34,42 L46,48" stroke="#ffffff" stroke-width="1" opacity="0.4" fill="none"/>`;
    }
    s += `<path d="M4,58 L60,58" stroke="${p.block.edge}" stroke-width="1" opacity="0.35"/>`;
    return s;
  })();

  const defs = `
    ${linearGradient(`fill-grad-${town}`, [[0, p.ground.fill], [0.55, p.ground.fill2], [1, p.ground.edge]], 0, 0, 0.3, 1)}
    ${linearGradient(`alt-grad-${town}`, [[0, p.alt.fill], [1, p.alt.fill2]], 0, 0, 0.4, 1)}
    ${linearGradient(`top-grad-${town}`, [[0, p.ground.top], [0.55, p.snow.mid], [1, p.snow.deep]], 0, 0, 0.2, 1)}
    ${linearGradient(`top-grad-${town}-alt`, [[0, '#ffffff'], [0.4, p.alt.top], [1, p.alt.fill]], 0, 0, 0.2, 1)}
    ${linearGradient(`snow-grad-${town}`, [[0, '#ffffff'], [0.7, p.snow.mid], [1, p.snow.deep]], 0, 0, 0.2, 1)}
    ${linearGradient(`block-grad-${town}`, [[0, p.block.fill], [1, p.block.edge]], 0, 0, 0.3, 1)}
    ${filterFur(`tile-fur-${town}`, 0.9, 0.8, 4)}
  `;
  return [
    frame(`tile-${town}-top`, 64, 24, topBase(false), defs),
    frame(`tile-${town}-fill`, 64, 64, baseFill, defs),
    frame(`tile-${town}-alt-top`, 64, 24, topBase(true), defs),
    frame(`tile-${town}-alt-fill`, 64, 64, altFill, defs),
    frame(`tile-${town}-platform`, 64, 40, platform, defs),
    frame(`tile-${town}-block`, 64, 64, block, defs),
  ];
}

/* ------------------------------------------------------------------ */
/* Props                                                               */
/* ------------------------------------------------------------------ */

function pineProp(town, variant) {
  const p = TOWN_PALETTES[town];
  const rand = mulberry32(400 + variant * 13 + town.length);
  const w = 150;
  const h = 240;
  const cx = w / 2;
  let layers = '';
  for (let i = 0; i < 5; i++) {
    const y = 58 + i * 32;
    const half = 24 + i * 12;
    layers += `<path d="M${cx - half},${y + 34} C${cx - half * 0.5},${y + 26} ${cx - half * 0.25},${y + 12} ${cx},${y} C${cx + half * 0.25},${y + 12} ${cx + half * 0.5},${y + 26} ${cx + half},${y + 34} Z" fill="url(#tree-leaf-${variant})"/>`;
    layers += `<path d="M${cx - half * 0.72},${y + 26} C${cx - half * 0.28},${y + 18} ${cx - half * 0.15},${y + 6} ${cx},${y + 2} C${cx + half * 0.15},${y + 6} ${cx + half * 0.28},${y + 18} ${cx + half * 0.72},${y + 26} C${cx + half * 0.4},${y + 28} ${cx + half * 0.1},${y + 22} ${cx},${y + 24} C${cx - half * 0.1},${y + 22} ${cx - half * 0.4},${y + 28} ${cx - half * 0.72},${y + 26} Z" fill="${p.tree.snow}" opacity="0.92"/>`;
    for (let k = 0; k < 5; k++) {
      const x = cx + (rand() - 0.5) * half * 1.5;
      const yy = y + 8 + rand() * 20;
      layers += `<circle cx="${round(x)}" cy="${round(yy)}" r="${round(1 + rand() * 2)}" fill="${p.tree.snow}" opacity="0.85"/>`;
      layers += `<circle cx="${round(x)}" cy="${round(yy)}" r="${round(2.5 + rand() * 3)}" fill="${p.tree.snow}" opacity="0.15"/>`;
    }
  }
  const body = `
    <g>
      <ellipse cx="${cx}" cy="232" rx="54" ry="9" fill="#000" opacity="0.22"/>
      ${snowPile(cx - 64, 216, 128, 26, 31 + variant, p.snow.mid)}
      <rect x="${cx - 7}" y="176" width="14" height="54" rx="3" fill="url(#tree-trunk)"/>
      <path d="M${cx - 6},${182} C${cx - 20},${174} ${cx - 26},${166} ${cx - 28},${156}" stroke="#5a3e2a" stroke-width="4" fill="none" stroke-linecap="round"/>
      ${layers}
      <path d="M${cx - 18},${202} C${cx - 2},${210} ${cx + 6},${208} ${cx + 18},${200}" stroke="${p.tree.snow}" stroke-width="3" opacity="0.6" fill="none"/>
    </g>`;
  const defs = `
    ${linearGradient(`tree-leaf-${variant}`, [[0, p.tree.leaf], [1, p.tree.leafDark]], 0, 0, 0.2, 1)}
    ${linearGradient('tree-trunk', [[0, '#7a5133'], [1, '#3d2616']], 0, 0, 0.2, 1)}
    ${filterFur('tree-fur', 0.7, 1, 6 + variant)}
  `;
  return frame(`tree-pine-${town}-${variant}`, w, h, body, defs);
}

function candyCaneProp() {
  const body = `
    <g>
      <ellipse cx="34" cy="190" rx="30" ry="7" fill="#000" opacity="0.2"/>
      ${snowPile(2, 172, 62, 22, 44, '#f4fbff')}
      <path d="M34,182 L34,50 C34,22 64,18 74,38 C80,50 74,64 62,68" stroke="#f7f2ea" stroke-width="17" stroke-linecap="round" fill="none"/>
      <path d="M34,182 L34,50 C34,22 64,18 74,38 C80,50 74,64 62,68" stroke="#cf3a46" stroke-width="17" stroke-linecap="round" fill="none" stroke-dasharray="18 18" stroke-dashoffset="4"/>
      <path d="M34,182 L34,50 C34,22 64,18 74,38 C80,50 74,64 62,68" stroke="#ffffff" stroke-width="5" stroke-linecap="round" fill="none" stroke-dasharray="9 27" stroke-dashoffset="13" opacity="0.55"/>
      <path d="M27,170 L27,54" stroke="#ffffff" stroke-width="2" opacity="0.4"/>
      <path d="M34,178 L34,50" stroke="#9e2834" stroke-width="1" opacity="0.3"/>
      <circle cx="62" cy="68" r="8" fill="#f7f2ea"/>
      <circle cx="62" cy="68" r="4" fill="#cf3a46" opacity="0.5"/>
    </g>`;
  const defs = `${filterFur('cc-fur', 0.8, 0.8, 8)}`;
  return frame('prop-candy-cane', 80, 200, body, defs);
}

function lampProp(town) {
  const p = TOWN_PALETTES[town];
  const body = `
    <g>
      <ellipse cx="34" cy="202" rx="22" ry="5" fill="#000" opacity="0.2"/>
      ${snowPile(6, 188, 56, 18, 61, p.snow.mid)}
      <path d="M34,196 L34,70" stroke="#2f2a2a" stroke-width="6"/>
      <path d="M34,120 L34,190" stroke="#4a4242" stroke-width="2" opacity="0.6"/>
      <path d="M16,62 C16,40 52,40 52,62 L52,70 L16,70 Z" fill="${p.trim}" stroke="#231c18" stroke-width="1.5"/>
      <path d="M20,66 C20,46 48,46 48,66 Z" fill="url(#lamp-glow)"/>
      <path d="M16,62 L52,62 M34,40 L34,36" stroke="#231c18" stroke-width="2"/>
      <path d="M24,38 L34,30 L44,38 Z" fill="url(#snow-grad-lamp)"/>
      <circle cx="34" cy="44" r="16" fill="${p.glow}" opacity="0.12" filter="url(#lamp-soft)"/>
      <path d="M22,66 C24,56 30,52 34,52 C40,52 45,57 47,66" fill="#fff3cf" opacity="0.8"/>
      <path d="M34,196 L34,202" stroke="#231c18" stroke-width="10"/>
    </g>`;
  const defs = `
    ${radialGradient('lamp-glow', [[0, '#fff9e8'], [0.5, p.glow], [1, p.windowDeep]], 0.5, 0.4, 0.8)}
    ${linearGradient('snow-grad-lamp', [[0, '#fff'], [1, p.snow.deep]], 0, 0, 0, 1)}
    ${filterGlow('lamp-soft', 5)}
  `;
  return frame('prop-lamp', 68, 210, body, defs);
}

function snowmanProp() {
  const body = `
    <g>
      <ellipse cx="50" cy="146" rx="40" ry="7" fill="#000" opacity="0.2"/>
      <circle cx="50" cy="110" r="34" fill="url(#sm-body)"/>
      <circle cx="50" cy="66" r="26" fill="url(#sm-body)"/>
      <circle cx="50" cy="30" r="19" fill="url(#sm-body)"/>
      <circle cx="50" cy="108" r="22" fill="#ffffff" opacity="0.2"/>
      <path d="M50,84 C42,92 40,102 42,112" stroke="#dfeef8" stroke-width="1" opacity="0.6" fill="none"/>
      <ellipse cx="50" cy="122" rx="20" ry="8" fill="#d4e7f3" opacity="0.4"/>
      <circle cx="43" cy="25" r="2.8" fill="#252323"/><circle cx="57" cy="25" r="2.8" fill="#252323"/>
      <circle cx="42.3" cy="24.3" r="0.8" fill="#fff"/><circle cx="56.3" cy="24.3" r="0.8" fill="#fff"/>
      <path d="M50,29 L64,33 L50,37 Z" fill="#e58a3a"/>
      <circle cx="40" cy="34" r="3.4" fill="#f2a0a0" opacity="0.5"/><circle cx="60" cy="34" r="3.4" fill="#f2a0a0" opacity="0.5"/>
      ${[0, 1, 2].map((i) => `<circle cx="50" cy="${58 + i * 8}" r="2.4" fill="#252323"/>`).join('')}
      <path d="M32,48 C38,40 62,40 68,48 L70,56 C60,62 40,62 30,56 Z" fill="#cf3a46"/>
      <path d="M62,54 L82,66 L80,72 L60,62 Z" fill="#b12d39"/>
      <path d="M66,58 L78,66" stroke="#f5e6c8" stroke-width="2" opacity="0.6"/>
      <path d="M20,56 C10,48 4,38 6,28 C14,34 22,42 26,50" stroke="#6b4a35" stroke-width="4" fill="none" stroke-linecap="round"/>
      <path d="M80,56 C90,46 96,36 94,26" stroke="#6b4a35" stroke-width="4" fill="none" stroke-linecap="round"/>
      <path d="M12,30 L2,22 M88,28 L98,20" stroke="#6b4a35" stroke-width="3" stroke-linecap="round"/>
      <path d="M56,12 C62,8 72,8 78,12 L76,20 L58,20 Z" fill="#3c3a44"/>
      <path d="M52,12 L82,12 L82,15 L52,15 Z" fill="#252323"/>
      <path d="M50,20 C54,16 72,16 76,20 Z" fill="#fff" opacity="0.2"/>
      <path d="M28,104 C36,100 44,100 50,102 C56,100 64,100 72,104" stroke="#f4fbff" stroke-width="2" opacity="0.5" fill="none"/>
    </g>`;
  const defs = `
    ${radialGradient('sm-body', [[0, '#ffffff'], [0.6, '#f0f9ff'], [1, '#c9dfee']], 0.4, 0.3, 0.7)}
    ${filterFur('sm-fur', 0.5, 1, 5)}
  `;
  return frame('prop-snowman', 100, 156, body, defs);
}

function gearProp() {
  let teeth = '';
  for (let i = 0; i < 12; i++) {
    const a = (i / 12) * Math.PI * 2;
    const x = 60 + Math.cos(a) * 47;
    const y = 60 + Math.sin(a) * 47;
    teeth += `<rect x="${round(x - 7)}" y="${round(y - 7)}" width="14" height="14" rx="2" fill="url(#gear-grad)" transform="rotate(${round((a * 180) / Math.PI)} ${round(x)} ${round(y)})"/>`;
  }
  const body = `
    <g>
      ${teeth}
      <circle cx="60" cy="60" r="42" fill="url(#gear-grad)" stroke="#3a4650" stroke-width="2"/>
      <circle cx="60" cy="60" r="33" fill="#5d6a74" stroke="#aebbc4" stroke-width="1.4"/>
      <circle cx="60" cy="60" r="25" fill="url(#gear-inner)"/>
      <circle cx="60" cy="60" r="14" fill="#2d363e" stroke="#8f9ca6" stroke-width="2"/>
      <circle cx="60" cy="60" r="6" fill="#14191d"/>
      ${[0, 1, 2, 3, 4, 5].map((i) => {
        const a = (i / 6) * Math.PI * 2;
        return `<circle cx="${round(60 + Math.cos(a) * 34)}" cy="${round(60 + Math.sin(a) * 34)}" r="2.2" fill="#cfd9df"/>`;
      }).join('')}
      <path d="M60,36 C70,40 76,48 78,58" stroke="#d9e2e8" stroke-width="1.4" opacity="0.5" fill="none"/>
      <path d="M40,74 C46,82 54,86 62,86" stroke="#2f383f" stroke-width="1" opacity="0.4" fill="none"/>
    </g>`;
  const defs = `
    ${radialGradient('gear-grad', [[0, '#b6c3cc'], [0.55, '#7d8b96'], [1, '#4f5b64']], 0.35, 0.3, 0.75)}
    ${radialGradient('gear-inner', [[0, '#7d8b96'], [1, '#46525b']], 0.4, 0.3, 0.7)}
  `;
  return frame('prop-gear', 120, 120, body, defs);
}

function icicleProp() {
  const body = `
    <g>
      <path d="M2,4 C10,0 20,2 26,4 L26,10 C20,12 8,12 2,10 Z" fill="#dff4ff" opacity="0.9"/>
      <path d="M6,10 C8,22 9,38 10,54 C11,66 12,74 13,80 C14,72 15,64 16,52 C17,36 18,20 20,10 Z" fill="url(#ic-grad)"/>
      <path d="M13,12 C13,28 13,44 13,62 C13,70 13,76 13,80" stroke="#ffffff" stroke-width="1" opacity="0.7" fill="none"/>
      <path d="M13,18 C13,36 13,52 13,68" stroke="#8fd6f0" stroke-width="0.7" opacity="0.5" fill="none"/>
    </g>`;
  const defs = `${linearGradient('ic-grad', [[0, '#f4fdff'], [0.5, '#c6eeff'], [1, '#67b9d7']], 0, 0, 0.4, 1)}`;
  return frame('prop-icicle', 30, 84, body, defs);
}

function steamVentProp() {
  const body = `
    <g>
      ${snowPile(2, 32, 84, 16, 71, '#e8f2f8')}
      <rect x="8" y="24" width="72" height="24" rx="5" fill="url(#vent-grad)" stroke="#3d474f" stroke-width="1.6"/>
      <rect x="16" y="16" width="56" height="14" rx="3" fill="#7d8b96" stroke="#3d474f" stroke-width="1.4"/>
      ${[0, 1, 2, 3].map((i) => `<rect x="${22 + i * 12}" y="19" width="7" height="8" rx="1.5" fill="#2c343b"/>`).join('')}
      <path d="M12,30 C18,26 24,32 30,28" stroke="#c9d6df" stroke-width="1" opacity="0.5" fill="none"/>
      <circle cx="68" cy="40" r="3" fill="#f0b64a"/><circle cx="68" cy="40" r="1.3" fill="#5a3b10"/>
    </g>`;
  const defs = `${linearGradient('vent-grad', [[0, '#aebcc6'], [0.5, '#7d8b96'], [1, '#515c64']], 0, 0, 0.3, 1)}`;
  return frame('prop-steam-vent', 90, 52, body, defs);
}

function springProp() {
  const body = `
    <g>
      ${snowPile(2, 38, 76, 14, 73, '#e8f2f8')}
      <rect x="6" y="34" width="68" height="18" rx="4" fill="url(#spring-base)" stroke="#3d474f" stroke-width="1.5"/>
      <path d="M18,34 L22,22 L30,30 L38,18 L46,28 L54,18 L60,30 L64,34" stroke="#c7d4dd" stroke-width="3" fill="none" stroke-linejoin="round"/>
      <rect x="10" y="16" width="60" height="9" rx="4" fill="#c9342f" stroke="#7f1a1a" stroke-width="1.2"/>
      <path d="M16,19 C28,16 46,22 62,18" stroke="#ff9a8a" stroke-width="1.2" opacity="0.6" fill="none"/>
      <path d="M62,8 L70,4 M64,14 L73,13" stroke="#f0b64a" stroke-width="1.6" stroke-linecap="round"/>
    </g>`;
  const defs = `${linearGradient('spring-base', [[0, '#9aa7b5'], [1, '#4d5862']], 0, 0, 0.3, 1)}`;
  return frame('prop-spring-box', 84, 56, body, defs);
}

function trainProp() {
  const body = `
    <g>
      <ellipse cx="90" cy="82" rx="80" ry="7" fill="#000" opacity="0.2"/>
      <rect x="8" y="30" width="164" height="14" rx="3" fill="#5a4a3a"/>
      ${[20, 44, 68].map((x) => `<circle cx="${x}" cy="46" r="7" fill="#2d2a2e" stroke="#8f9ca6" stroke-width="1.4"/><circle cx="${x}" cy="46" r="2.4" fill="#c9d6df"/>`).join('')}
      <path d="M36,28 L36,12 L58,12 L58,28 Z" fill="#c9342f"/>
      <path d="M38,14 L38,6 L56,6 L56,14 Z" fill="#2d2a2e"/>
      <path d="M40,6 C44,0 52,0 54,6" fill="none" stroke="#8f9ca6" stroke-width="2"/>
      <path d="M62,30 C62,18 76,10 92,10 C108,10 122,18 122,30" fill="#c9342f"/>
      <rect x="70" y="22" width="44" height="8" rx="3" fill="#f0b64a"/>
      <circle cx="80" cy="26" r="3" fill="#2d2a2e"/><circle cx="104" cy="26" r="3" fill="#2d2a2e"/>
      <path d="M92,10 C88,4 92,0 98,0 C104,0 106,4 104,8" fill="none" stroke="#f0b64a" stroke-width="3"/>
      <circle cx="98" cy="2" r="3" fill="#ffd166"/>
      <rect x="128" y="22" width="34" height="14" rx="2" fill="#3d8a62"/>
      <rect x="134" y="12" width="22" height="10" rx="2" fill="#2f6d4d"/>
      <rect x="128" y="36" width="42" height="8" rx="2" fill="#8f5a2a"/>
      <path d="M12,44 L12,38 L28,38 L28,44" fill="none" stroke="#8f5a2a" stroke-width="3"/>
      <circle cx="150" cy="46" r="8" fill="#2d2a2e" stroke="#8f9ca6" stroke-width="1.4"/>
      <circle cx="150" cy="46" r="3" fill="#c9d6df"/>
      <path d="M16,36 C30,32 46,38 60,34" stroke="#ffb3a8" stroke-width="1.4" opacity="0.6" fill="none"/>
      <circle cx="48" cy="20" r="4" fill="#ffd166" stroke="#a26a1e" stroke-width="0.8"/>
      <path d="M28,24 C24,20 20,22 20,26" stroke="#e7edf2" stroke-width="2" opacity="0.4" fill="none"/>
      <path d="M92,82 L92,74 M116,82 L116,74" stroke="#3d474f" stroke-width="3"/>
    </g>`;
  const defs = `${linearGradient('train-glow', [[0, '#f0b64a'], [1, '#8f5a2a']], 0, 0, 0, 1)}`;
  return frame('prop-train', 180, 90, body, defs);
}

function boulderProp() {
  const rand = mulberry32(717);
  let lumps = '';
  for (let i = 0; i < 10; i++) {
    const a = (i / 10) * Math.PI * 2;
    lumps += `<circle cx="${round(55 + Math.cos(a) * 42)}" cy="${round(55 + Math.sin(a) * 40)}" r="${round(7 + rand() * 8)}" fill="#e8f6ff" opacity="0.9"/>`;
  }
  const body = `
    <g>
      ${lumps}
      <circle cx="55" cy="55" r="46" fill="url(#boulder-grad)"/>
      <path d="M20,30 C30,16 48,10 62,14 C48,22 38,32 32,46 C28,56 30,68 38,78 C24,70 18,52 20,30 Z" fill="#ffffff" opacity="0.4"/>
      <path d="M36,38 L48,48 L44,62 L58,70 M64,22 L58,34 L70,40" stroke="#7fa9c2" stroke-width="1.2" opacity="0.5" fill="none"/>
      <path d="M26,64 C36,72 48,76 62,76" stroke="#ffffff" stroke-width="1.4" opacity="0.4" fill="none"/>
    </g>`;
  const defs = `${radialGradient('boulder-grad', [[0, '#ffffff'], [0.5, '#e7f6ff'], [1, '#a8cbe0']], 0.35, 0.3, 0.8)}`;
  return frame('prop-snow-boulder', 110, 110, body, defs);
}

function spikesProp(town) {
  const p = TOWN_PALETTES[town];
  const body = `
    <g>
      ${snowPile(0, 30, 100, 14, 81, p.snow.mid)}
      ${[12, 32, 52, 72].map((x, i) => `
        <path d="M${x},32 L${x + 10},4 L${x + 20},32 Z" fill="url(#spike-grad)"/>
        <path d="M${x + 8},28 L${x + 10},8 L${x + 12},24" stroke="#ffffff" stroke-width="1" opacity="0.6"/>
      `).join('')}
      <path d="M0,32 L100,32 L100,40 L0,40 Z" fill="${p.alt.fill2}" opacity="0.6"/>
    </g>`;
  const defs = `${linearGradient('spike-grad', [[0, '#ffffff'], [0.5, '#c6eeff'], [1, '#5da6c1']], 0, 0, 0.4, 1)}`;
  return frame('prop-ice-spikes', 100, 44, body, defs);
}

function gumPuddleProp() {
  const rand = mulberry32(818);
  let bubbles = '';
  for (let i = 0; i < 8; i++) {
    const x = 10 + rand() * 100;
    const y = 8 + rand() * 24;
    bubbles += `<circle cx="${round(x)}" cy="${round(y)}" r="${round(2 + rand() * 5)}" fill="#ffd7e5" opacity="${round(0.2 + rand() * 0.25)}"/>`;
  }
  const body = `
    <g>
      <path d="M2,30 C8,12 26,4 44,8 C54,2 72,4 82,10 C100,6 116,18 118,28 C118,34 104,38 60,38 C16,38 2,36 2,30 Z" fill="url(#gum-grad)"/>
      <path d="M6,28 C26,22 48,26 66,22 C86,18 102,22 114,26" stroke="#ffffff" stroke-width="1.4" opacity="0.5" fill="none"/>
      ${bubbles}
      <path d="M20,28 C26,18 40,14 52,18" stroke="#ffffff" stroke-width="2" opacity="0.35" fill="none"/>
      <circle cx="96" cy="18" r="2.2" fill="#ffffff" opacity="0.7"/>
    </g>`;
  const defs = `${radialGradient('gum-grad', [[0, '#ffd0de'], [0.5, '#f48ca8'], [1, '#c85578']], 0.4, 0.3, 0.8)}`;
  return frame('prop-gum-puddle', 120, 40, body, defs);
}

function signProp(town) {
  const p = TOWN_PALETTES[town];
  const body = `
    <g>
      <ellipse cx="45" cy="108" rx="24" ry="5" fill="#000" opacity="0.2"/>
      ${snowPile(10, 96, 70, 14, 91, p.snow.mid)}
      <path d="M30,102 L30,40 L60,40 L60,102" stroke="${p.wood}" stroke-width="6" fill="none"/>
      <rect x="6" y="18" width="78" height="48" rx="4" fill="url(#sign-wood)" stroke="${p.wood}" stroke-width="3"/>
      <path d="M12,26 C30,22 56,28 78,24" stroke="#ffffff" stroke-width="1" opacity="0.2" fill="none"/>
      <path d="M10,18 L80,18 L78,10 L12,10 Z" fill="${p.snow.light}"/>
      <path d="M12,12 C28,8 58,14 78,11" stroke="${p.snow.deep}" stroke-width="0.7" opacity="0.6" fill="none"/>
      <path d="M16,34 L74,34 M16,44 L68,44 M16,54 L60,54" stroke="${p.wood}" stroke-width="1.2" opacity="0.3"/>
    </g>`;
  const defs = `${linearGradient('sign-wood', [[0, '#8a6141'], [1, '#5c3e27']], 0, 0, 0.3, 1)}`;
  return frame('prop-sign', 90, 110, body, defs);
}

function archProp(town) {
  const p = TOWN_PALETTES[town];
  const body = `
    <g>
      <path d="M20,140 L20,56 C20,24 48,8 90,8 C132,8 160,24 160,56 L160,140 L138,140 L138,58 C138,34 120,24 90,24 C60,24 42,34 42,58 L42,140 Z" fill="url(#arch-ice)" stroke="${p.alt.fill2}" stroke-width="2"/>
      <path d="M26,140 L26,60 C26,30 52,16 90,16 C128,16 154,30 154,60 L154,140" stroke="#ffffff" stroke-width="2" opacity="0.55" fill="none"/>
      <path d="M32,130 C32,96 40,74 58,60" stroke="#ffffff" stroke-width="3" opacity="0.35" fill="none"/>
      <circle cx="90" cy="46" r="9" fill="${p.glow}" opacity="0.35"/>
      <circle cx="90" cy="46" r="4" fill="#fffbe8" opacity="0.8"/>
      ${icicles(30, 136, 30, 5, 93, p.snow.light)}
      ${icicles(120, 136, 30, 5, 94, p.snow.light)}
      ${snowPile(8, 126, 60, 18, 95, p.snow.mid)}
      ${snowPile(112, 126, 60, 18, 96, p.snow.mid)}
    </g>`;
  const defs = `
    ${linearGradient('arch-ice', [[0, '#e8fbff'], [0.5, '#a7ddec'], [1, '#5b9fb6']], 0.2, 0, 0.8, 1)}
    ${filterGlow('arch-glow', 4)}
  `;
  return frame('prop-secret-arch', 180, 146, body, defs);
}

function checkpoint(on) {
  const cloth = on ? '#cf3a46' : '#6f8798';
  const trim = on ? '#f4c756' : '#9fb2c0';
  const body = `
    <g>
      <ellipse cx="28" cy="172" rx="24" ry="5" fill="#000" opacity="0.2"/>
      ${snowPile(4, 158, 54, 18, on ? 12 : 13, '#eef8ff')}
      <path d="M28,168 L28,30" stroke="#5b4a3a" stroke-width="7" stroke-linecap="round"/>
      <path d="M28,40 L28,20" stroke="#8a6a4a" stroke-width="3"/>
      <circle cx="28" cy="18" r="4.5" fill="${trim}" stroke="#8a6a1e" stroke-width="0.8"/>
      <path d="M30,34 C52,24 62,42 78,32 L78,72 C62,80 52,62 30,74 Z" fill="${cloth}" stroke="#00000033" stroke-width="1"/>
      <path d="M30,34 C52,24 62,42 78,32" stroke="#ffffff" stroke-width="1.6" opacity="0.4" fill="none"/>
      ${on ? `<path d="${starPath(55, 52, 9, 4)}" fill="${trim}" opacity="0.9"/><circle cx="55" cy="52" r="14" fill="${trim}" opacity="0.12"/>` : `<path d="M46,48 L64,58 M64,48 L46,58" stroke="#c3d2dc" stroke-width="2" opacity="0.5"/>`}
      <path d="M32,76 C46,84 60,72 76,74" stroke="#ffffff" stroke-width="1" opacity="0.3" fill="none"/>
      ${on ? `<circle cx="28" cy="10" r="10" fill="${trim}" opacity="0.15" filter="url(#cp-glow)"/>` : ''}
    </g>`;
  const defs = `
    ${filterGlow('cp-glow', 4)}
  `;
  return frame(`prop-checkpoint-${on ? 'on' : 'off'}`, 84, 180, body, defs);
}

function gift(variant) {
  const colors = [
    ['#cf3a46', '#f4c756'],
    ['#3f8fc4', '#f4e2c6'],
    ['#4caf82', '#f4c756'],
  ];
  const [box, ribbon] = colors[variant % colors.length];
  const body = `
    <g>
      <rect x="4" y="14" width="36" height="28" rx="3" fill="${box}" stroke="#00000033" stroke-width="1"/>
      <rect x="18" y="14" width="8" height="28" fill="${ribbon}"/>
      <rect x="4" y="24" width="36" height="7" fill="${ribbon}"/>
      <path d="M22,14 C12,4 6,12 15,14 M22,14 C32,4 38,12 29,14" stroke="${ribbon}" stroke-width="5" fill="none" stroke-linecap="round"/>
      <path d="M6,18 C18,20 28,18 38,20" stroke="#ffffff" stroke-width="1.2" opacity="0.4" fill="none"/>
      <path d="M8,38 L36,38" stroke="#000" stroke-width="1" opacity="0.2"/>
      <circle cx="22" cy="14" r="2" fill="#ffffff" opacity="0.6"/>
    </g>`;
  return frame(`prop-gift-${variant}`, 44, 44, body, '');
}

function particle(key, kind) {
  const size = 24;
  let body;
  let defs = '';
  if (kind === 'snow') {
    body = `<circle cx="12" cy="12" r="5" fill="#ffffff" opacity="0.95"/><circle cx="12" cy="12" r="8" fill="#ffffff" opacity="0.2"/>`;
  } else if (kind === 'spark') {
    defs = `${filterGlow('pt-glow', 2)}`;
    body = `<g filter="url(#pt-glow)"><path d="${starPath(12, 12, 10, 3.4, 4)}" fill="#fffbe0"/><circle cx="12" cy="12" r="3.4" fill="#ffffff"/></g>`;
  } else if (kind === 'dust') {
    body = `<circle cx="12" cy="12" r="4" fill="#ffffff" opacity="0.5"/><circle cx="9" cy="9" r="2" fill="#ffffff" opacity="0.35"/><circle cx="16" cy="14" r="2.4" fill="#ffffff" opacity="0.3"/>`;
  } else if (kind === 'star') {
    defs = `${filterGlow('pt-star', 1.5)}`;
    body = `<path d="${starPath(12, 12, 10, 4)}" fill="#ffd166" filter="url(#pt-star)"/>`;
  } else if (kind === 'coal') {
    body = `<path d="M6,7 L15,4 L20,9 L18,17 L10,20 L4,14 Z" fill="#2f2f38"/><path d="M8,9 L15,7" stroke="#9a9aa8" stroke-width="1" opacity="0.5"/>`;
  } else if (kind === 'leaf') {
    body = `<path d="M12,3 C20,8 20,16 12,21 C4,16 4,8 12,3 Z" fill="#7fd9b4" opacity="0.8"/>`;
  } else {
    body = `<circle cx="12" cy="12" r="10" fill="url(#glow-grad)"/>`;
    defs = `${radialGradient('glow-grad', [[0, '#ffffff', 0.9], [0.45, '#ffffff', 0.35], [1, '#ffffff', 0]])}`;
  }
  return frame(`particle-${key}`, size, size, body, defs);
}

function glow(key, size) {
  const defs = `${radialGradient('glow-grad', [[0, '#ffffff', 0.9], [0.4, '#ffffff', 0.35], [1, '#ffffff', 0]])}`;
  const body = `<circle cx="${size / 2}" cy="${size / 2}" r="${size / 2}" fill="url(#glow-grad)"/>`;
  return frame(key, size, size, body, defs);
}

function starProp() {
  const body = `<g><circle cx="24" cy="24" r="22" fill="#ffd166" opacity="0.18"/><path d="${starPath(24, 24, 20, 8)}" fill="url(#star-gold)" stroke="#b9862a" stroke-width="1"/><path d="${starPath(24, 24, 12, 5)}" fill="#fff3c0" opacity="0.55"/></g>`;
  const defs = `${linearGradient('star-gold', [[0, '#fff7cc'], [0.5, '#ffd166'], [1, '#d9a334']], 0, 0, 0.2, 1)}`;
  return frame('prop-star', 48, 48, body, defs);
}

function snowflakeProp() {
  let arms = '';
  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * Math.PI * 2;
    const x2 = 20 + Math.cos(a) * 16;
    const y2 = 20 + Math.sin(a) * 16;
    const bx = 20 + Math.cos(a) * 10;
    const by = 20 + Math.sin(a) * 10;
    const p1x = bx + Math.cos(a + 0.7) * 5;
    const p1y = by + Math.sin(a + 0.7) * 5;
    const p2x = bx + Math.cos(a - 0.7) * 5;
    const p2y = by + Math.sin(a - 0.7) * 5;
    arms += `<path d="M20,20 L${round(x2)},${round(y2)} M${round(bx)},${round(by)} L${round(p1x)},${round(p1y)} M${round(bx)},${round(by)} L${round(p2x)},${round(p2y)}" stroke="#dff8ff" stroke-width="2.4" stroke-linecap="round"/>`;
  }
  return frame('prop-snowflake', 40, 40, `<g>${arms}<circle cx="20" cy="20" r="3.4" fill="#ffffff"/></g>`, '');
}

function bellProp() {
  const body = `
    <g>
      <path d="M30,14 L30,8" stroke="#8a6a1e" stroke-width="3"/>
      <path d="M12,48 C12,34 18,26 30,26 C42,26 48,34 48,48 L54,54 L6,54 Z" fill="url(#bell-gold)" stroke="#8a6a1e" stroke-width="1.4"/>
      <path d="M18,44 C20,34 24,30 30,30" stroke="#fff3c0" stroke-width="2" opacity="0.7" fill="none"/>
      <circle cx="30" cy="58" r="5" fill="#b9862a"/>
      <circle cx="30" cy="58" r="2.4" fill="#6f4d12"/>
      <path d="M10,52 L50,52" stroke="#8a6a1e" stroke-width="1.2" opacity="0.7"/>
    </g>`;
  const defs = `${linearGradient('bell-gold', [[0, '#ffe9a8'], [0.5, '#e2b455'], [1, '#a77a24']], 0, 0, 0.2, 1)}`;
  return frame('prop-bell', 60, 64, body, defs);
}

export function buildEnvironment() {
  const out = [];
  for (const town of TOWN_ORDER) {
    for (const layer of ['far', 'mid', 'near']) out.push(background(town, layer));
    out.push(...tileTextures(town));
    out.push(pineProp(town, 0));
    out.push(pineProp(town, 1));
  }
  out.push(lampProp('pine'));
  out.push(candyCaneProp());
  out.push(snowmanProp());
  out.push(gearProp());
  out.push(icicleProp());
  out.push(steamVentProp());
  out.push(springProp());
  out.push(trainProp());
  out.push(boulderProp());
  out.push(spikesProp('forest'));
  out.push(gumPuddleProp());
  out.push(signProp('pine'));
  out.push(archProp('pine'));
  out.push(checkpoint(false));
  out.push(checkpoint(true));
  out.push(gift(0));
  out.push(gift(1));
  out.push(gift(2));
  out.push(particle('snow', 'snow'));
  out.push(particle('spark', 'spark'));
  out.push(particle('dust', 'dust'));
  out.push(particle('star', 'star'));
  out.push(particle('coal', 'coal'));
  out.push(particle('leaf', 'leaf'));
  out.push(glow('glow-soft', 128));
  out.push(glow('glow-small', 48));
  out.push(starProp());
  out.push(snowflakeProp());
  out.push(bellProp());
  return out;
}
