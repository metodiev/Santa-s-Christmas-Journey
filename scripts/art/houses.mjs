// Houses, the goal Christmas tree, and other large buildings.

import {
  svgDoc, linearGradient, radialGradient, filterBlur, filterGlow, filterShadow,
  mulberry32, round, starPath, snowPile, snowCap, icicles, rgba,
} from './lib.mjs';
import { TOWN_PALETTES } from './palettes.mjs';

const HOUSE_W = 320;
const HOUSE_H = 260;
const SCALE = 1.5;

function frame(name, width, height, body, defs = '', scale = SCALE) {
  return {
    name,
    width,
    height,
    scale,
    svg: svgDoc(Math.round(width * scale), Math.round(height * scale), `0 0 ${width} ${height}`, defs, body),
  };
}

function wreath(cx, cy, r, accent = '#c93b47', accent2 = '#f4e2c6') {
  const rand = mulberry32(Math.round(cx * 3 + cy));
  let leaves = '';
  for (let i = 0; i < 16; i++) {
    const a = (i / 16) * Math.PI * 2;
    const x = cx + Math.cos(a) * r * 0.72;
    const y = cy + Math.sin(a) * r * 0.72;
    leaves += `<ellipse cx="${round(x)}" cy="${round(y)}" rx="${round(r * 0.24)}" ry="${round(r * 0.12)}" fill="${i % 2 ? '#1d5a45' : '#144436'}" transform="rotate(${round((a * 180) / Math.PI)} ${round(x)} ${round(y)})"/>`;
  }
  leaves += `<circle cx="${cx}" cy="${cy}" r="${r * 0.34}" fill="${'#0f3328'}"/>`;
  leaves += `<path d="M${cx - r * 0.5},${cy + r * 0.3} C${cx - r * 0.3},${cy + r * 0.75} ${cx + r * 0.35},${cy + r * 0.7} ${cx + r * 0.52},${cy + r * 0.2}" stroke="${accent}" stroke-width="${round(r * 0.17)}" fill="none" stroke-linecap="round"/>`;
  leaves += `<circle cx="${cx + r * 0.1}" cy="${cy + r * 0.66}" r="${round(r * 0.2)}" fill="${accent2}"/>`;
  leaves += `<path d="M${cx + r * 0.1},${cy + r * 0.5} L${cx + r * 0.1},${cy + r * 0.82} M${cx - r * 0.05},${cy + r * 0.66} L${cx + r * 0.25},${cy + r * 0.66}" stroke="${accent}" stroke-width="0.8"/>`;
  for (let i = 0; i < 4; i++) {
    const a = rand() * Math.PI * 2;
    leaves += `<circle cx="${round(cx + Math.cos(a) * r * 0.75)}" cy="${round(cy + Math.sin(a) * r * 0.75)}" r="1.1" fill="${accent2}" opacity="0.9"/>`;
  }
  return leaves;
}

function windowUnit(x, y, w, h, p, seed, arched = true) {
  const rand = mulberry32(seed);
  const r = w / 2;
  const winPath = arched
    ? `M${x},${y + r} C${x},${y} ${x + 4},${y - 4} ${x + r},${y - 4} C${x + w - 4},${y - 4} ${x + w},${y} ${x + w},${y + r} L${x + w},${y + h} L${x},${y + h} Z`
    : `M${x},${y} L${x + w},${y} L${x + w},${y + h} L${x},${y + h} Z`;
  let panes = '';
  for (let i = 1; i < 3; i++) {
    panes += `<path d="M${x + (w * i) / 3},${y + 2} L${x + (w * i) / 3},${y + h}" stroke="#4a2f1c" stroke-width="1.5" opacity="0.85"/>`;
  }
  panes += `<path d="M${x + 2},${y + h * 0.48} L${x + w - 2},${y + h * 0.48}" stroke="#4a2f1c" stroke-width="1.5" opacity="0.85"/>`;
  const curtains = `
    <path d="M${x + 2},${y + 2} C${x + w * 0.12},${y + h * 0.28} ${x + w * 0.13},${y + h * 0.68} ${x + 3},${y + h - 2} L${x + w * 0.22},${y + h - 2} C${x + w * 0.2},${y + h * 0.62} ${x + w * 0.2},${y + h * 0.3} ${x + w * 0.26},${y + 2} Z" fill="${rgba(p.accent2, 0.5)}"/>
    <path d="M${x + w - 2},${y + 2} C${x + w * 0.88},${y + h * 0.28} ${x + w * 0.87},${y + h * 0.68} ${x + w - 3},${y + h - 2} L${x + w * 0.78},${y + h - 2} C${x + w * 0.8},${y + h * 0.62} ${x + w * 0.8},${y + h * 0.3} ${x + w * 0.74},${y + 2} Z" fill="${rgba(p.accent2, 0.5)}"/>`;
  const silhouettes = rand() > 0.5
    ? `<path d="M${x + w * 0.52},${y + h - 2} L${x + w * 0.52},${y + h * 0.7} M${x + w * 0.52},${y + h * 0.72} l-4,-7 M${x + w * 0.52},${y + h * 0.62} l5,-7" stroke="#5a331c" stroke-width="1" opacity="0.35"/>`
    : '';
  return `
    <ellipse cx="${x + w / 2}" cy="${y + h * 0.55}" rx="${w * 0.85}" ry="${h * 0.72}" fill="${p.glow}" opacity="0.12" filter="url(#win-halo)"/>
    <path d="${winPath}" fill="url(#win-glow-${seed % 7})" stroke="${p.wall.dark}" stroke-width="4.2"/>
    <path d="${winPath}" fill="none" stroke="${p.windowDeep}" stroke-width="1.3" opacity="0.9"/>
    ${curtains}
    ${panes}
    ${silhouettes}
    <path d="M${x - 4},${y + h - 1} L${x + w + 4},${y + h - 1} L${x + w + 3},${y + h + 4} L${x - 3},${y + h + 4} Z" fill="url(#snow-grad)" opacity="0.95"/>
    <path d="M${x - 3},${y + h + 1} C${x + w * 0.3},${y + h + 4} ${x + w * 0.7},${y + h - 1} ${x + w + 3},${y + h + 1}" stroke="${p.snow.deep}" stroke-width="0.7" opacity="0.7" fill="none"/>
  `;
}

function garland(x1, x2, y, p, seed) {
  const rand = mulberry32(seed);
  const w = x2 - x1;
  let out = `<path d="M${x1},${y} Q${x1 + w * 0.25},${y + 10} ${x1 + w * 0.5},${y + 2} Q${x1 + w * 0.75},${y - 6} ${x2},${y}" stroke="#255c42" stroke-width="3.2" fill="none"/>`;
  for (let i = 0; i < 12; i++) {
    const x = x1 + (w * (i + 0.5)) / 12;
    const t = (i + 0.5) / 12;
    const yy = y + Math.sin(t * Math.PI * 2) * 2 + 4;
    const colors = [p.accent, p.accent2, '#7fe0c0', '#ffb3c6'];
    out += `<circle cx="${round(x)}" cy="${round(yy)}" r="2.1" fill="${colors[i % colors.length]}" opacity="0.95"/>`;
    out += `<circle cx="${round(x)}" cy="${round(yy)}" r="3.6" fill="${colors[i % colors.length]}" opacity="0.18"/>`;
    if (rand() > 0.6) out += `<path d="M${round(x - 1.6)},${round(yy - 3)} l1.2,-3 l1.2,3 Z" fill="#2b6b4e"/>`;
  }
  return out;
}

function chimney(p, town, seed) {
  const rand = mulberry32(seed);
  const brick = town === 'ginger' ? '#b5723b' : town === 'factory' ? '#68737d' : town === 'forest' ? '#5f7f82' : '#8a6a52';
  let texture = '';
  for (let row = 0; row < 5; row++) {
    for (let col = 0; col < 3; col++) {
      const x = 238 + col * 12 + (row % 2 ? 6 : 0);
      const y = 34 + row * 12;
      texture += `<rect x="${x}" y="${y}" width="11" height="10" rx="1" fill="${brick}" stroke="#000" stroke-opacity="0.12" stroke-width="0.6"/>`;
      texture += `<rect x="${x + 1}" y="${y + 1}" width="9" height="3" fill="#fff" opacity="0.07"/>`;
    }
  }
  const glow = `<ellipse cx="258" cy="26" rx="22" ry="13" fill="${p.glow}" opacity="0.25" filter="url(#soft-glow)"/>`;
  return `
    ${glow}
    <path d="M236,26 L280,26 L282,100 L234,100 Z" fill="#000" opacity="0.16"/>
    <path d="M238,26 L278,26 L280,98 L236,98 Z" fill="${brick}"/>
    ${texture}
    <path d="M238,26 L278,26 L278.5,33 L237.5,33 Z" fill="${p.roof.dark}"/>
    <path d="M232,20 L284,20 L285,28 L231,28 Z" fill="${p.roof.light}" stroke="${p.roof.dark}" stroke-width="0.8"/>
    <path d="M230,20 C240,16 250,19 258,18 C266,17 276,16 286,20 L286,24 L230,24 Z" fill="url(#snow-grad)"/>
    <path d="M234,30 C236,40 235,50 237,58" stroke="#000" stroke-width="1" opacity="0.15" fill="none"/>
    <path d="M262,22 C266,22 268,25 267,28" stroke="#fff" stroke-width="0.8" opacity="0.6" fill="none"/>
    ${rand() > 0.5 ? `<circle cx="270" cy="44" r="1.3" fill="${p.glow}" opacity="0.8"/>` : ''}
  `;
}

function houseBody(town, variant) {
  const p = TOWN_PALETTES[town];
  const rand = mulberry32(1000 + variant * 17 + town.length);
  const wallX = 22;
  const wallW = 276;
  const wallTop = 88;
  const wallBottom = 258;
  const foundation = 232;

  let beams = '';
  if (town === 'pine' || town === 'forest' || town === 'summit') {
    beams = `
      <rect x="${wallX + 10}" y="${wallTop + 6}" width="7" height="${foundation - wallTop - 6}" fill="${p.trim}" opacity="0.85"/>
      <rect x="${wallX + wallW - 17}" y="${wallTop + 6}" width="7" height="${foundation - wallTop - 6}" fill="${p.trim}" opacity="0.85"/>
      <rect x="${wallX}" y="${wallTop + 10}" width="${wallW}" height="6" fill="${p.trim}" opacity="0.8"/>
      <path d="M${wallX + 20},${wallTop + 30} L${wallX + wallW - 20},${wallTop + 30}" stroke="${p.trim}" stroke-width="4" opacity="0.6"/>
      <path d="M${wallX + 10},${wallTop + 54} L${wallX + 90},${wallTop + 100}" stroke="${p.trim}" stroke-width="3" opacity="0.35"/>
      <path d="M${wallX + wallW - 10},${wallTop + 54} L${wallX + wallW - 90},${wallTop + 100}" stroke="${p.trim}" stroke-width="3" opacity="0.35"/>
    `;
  } else if (town === 'ginger') {
    beams = `
      <path d="M${wallX + 6},${wallTop + 8} C${wallX + 16},${wallTop + 20} ${wallX + 16},${wallTop + 32} ${wallX + 6},${wallTop + 42} L${wallX + 6},${wallTop + 8} Z" fill="#fff4e2" opacity="0.8"/>
      <path d="M${wallX + wallW - 6},${wallTop + 8} C${wallX + wallW - 16},${wallTop + 20} ${wallX + wallW - 16},${wallTop + 32} ${wallX + wallW - 6},${wallTop + 42} L${wallX + wallW - 6},${wallTop + 8} Z" fill="#fff4e2" opacity="0.8"/>
      <path d="M${wallX + 20},${wallTop + 4} C${wallX + 40},${wallTop + 14} ${wallX + 70},${wallTop + 6} ${wallX + 96},${wallTop + 12}" stroke="#fff4e2" stroke-width="4" opacity="0.7" fill="none" stroke-linecap="round"/>
      <g opacity="0.9">
        <circle cx="${wallX + 28}" cy="${wallTop + 42}" r="4" fill="#d64550"/><circle cx="${wallX + 28}" cy="${wallTop + 44}" r="1.2" fill="#fff" opacity="0.7"/>
        <circle cx="${wallX + wallW - 30}" cy="${wallTop + 46}" r="4" fill="#7fd9b4"/><circle cx="${wallX + wallW - 30}" cy="${wallTop + 48}" r="1.2" fill="#fff" opacity="0.7"/>
        <circle cx="${wallX + 56}" cy="${wallTop + 22}" r="2.6" fill="#f7cf6b"/>
      </g>
    `;
  } else if (town === 'factory') {
    beams = `
      <rect x="${wallX}" y="${wallTop + 8}" width="${wallW}" height="7" fill="#3c474f"/>
      <rect x="${wallX}" y="${foundation - 8}" width="${wallW}" height="8" fill="#3c474f"/>
      <path d="M${wallX + 12},${wallTop + 16} L${wallX + 12},${foundation - 10} M${wallX + wallW - 12},${wallTop + 16} L${wallX + wallW - 12},${foundation - 10}" stroke="#c9342f" stroke-width="4" opacity="0.8"/>
      ${Array.from({ length: 8 }, (_, i) => `<circle cx="${wallX + 30 + i * 31}" cy="${wallTop + 24}" r="1.4" fill="#cfd8de" opacity="0.7"/>`).join('')}
      <path d="M${wallX + 40},${wallTop + 50} L${wallX + 70},${wallTop + 50} L${wallX + 70},${wallTop + 54} L${wallX + 40},${wallTop + 54} Z" fill="#f0b64a" opacity="0.35"/>
    `;
  }
  const root = town === 'factory' ? `M${wallX},${foundation} L${wallX + 10},${foundation + 24} L${wallX + wallW - 10},${foundation + 24} L${wallX + wallW},${foundation}` : '';
  return `
    <path d="M${wallX + 6},${wallTop} L${wallX + wallW - 6},${wallTop} L${wallX + wallW},${wallTop + 8} L${wallX + wallW},${wallBottom} L${wallX},${wallBottom} L${wallX},${wallTop + 8} Z" fill="url(#wall-grad)" stroke="${p.wall.dark}" stroke-width="1"/>
    <rect x="${wallX}" y="${wallTop + 4}" width="${wallW}" height="10" fill="${p.wall.dark}" opacity="0.4"/>
    <path d="M${wallX + 4},${wallTop + 16} C${wallX + 80},${wallTop + 10} ${wallX + 150},${wallTop + 20} ${wallX + wallW - 4},${wallTop + 14} L${wallX + wallW - 4},${wallTop + 30} C${wallX + 150},${wallTop + 36} ${wallX + 80},${wallTop + 26} ${wallX + 4},${wallTop + 32} Z" fill="#fff" opacity="0.08"/>
    ${beams}
    <rect x="${wallX}" y="${foundation}" width="${wallW}" height="${wallBottom - foundation}" fill="url(#foundation-grad)"/>
    ${root}
    ${Array.from({ length: 12 }, (_, i) => `<rect x="${wallX + 8 + i * 23}" y="${foundation + 4 + (i % 2) * 8}" width="20" height="8" rx="2" fill="${p.wall.dark}" opacity="${round(0.25 + rand() * 0.25)}" stroke="#000" stroke-opacity="0.15" stroke-width="0.5"/>`).join('')}
    <path d="M${wallX + 4},${foundation} L${wallX + wallW - 4},${foundation}" stroke="${p.snow.light}" stroke-width="2.4" opacity="0.5"/>
    <path d="M${wallX},${wallBottom - 2} L${wallX + wallW},${wallBottom - 2}" stroke="#000" stroke-width="2" opacity="0.25"/>
  `;
}

function houseDecor(town, variant, p) {
  if (town === 'ginger') {
    return `
      <g transform="translate(210,190)">
        <path d="M0,0 L0,48" stroke="#fff4e2" stroke-width="7"/>
        <path d="M0,4 C-4,-2 -2,-7 2,-10" stroke="#d64550" stroke-width="7" fill="none"/>
        <path d="M0,10 C5,4 7,-2 3,-6" stroke="#7fd9b4" stroke-width="6" fill="none"/>
        <path d="M-2,20 C-7,16 -8,12 -6,8" stroke="#f7cf6b" stroke-width="4" fill="none"/>
      </g>
      <path d="M20,252 C40,244 62,246 82,252" stroke="#fff4e2" stroke-width="4" opacity="0.8" fill="none"/>
    `;
  }
  if (town === 'factory') {
    return `
      <path d="M290,84 L296,84 L296,150 L290,150 Z" fill="#68737d"/>
      <path d="M288,120 L298,120 M288,138 L298,138" stroke="#4a555e" stroke-width="2"/>
      <circle cx="293" cy="112" r="3" fill="#9aa7b5"/>
      <path d="M24,190 L24,250 M34,190 L34,250" stroke="#4a555e" stroke-width="3"/>
      <path d="M24,200 C18,196 16,190 18,184 C22,188 26,192 28,196" stroke="#9aa7b5" stroke-width="2" fill="none"/>
      <rect x="258" y="204" width="22" height="14" rx="2" fill="#3c474f" stroke="#c9342f" stroke-width="0.8"/>
      <circle cx="264" cy="211" r="2" fill="#f0b64a"/><circle cx="274" cy="211" r="2" fill="#f0b64a"/>
    `;
  }
  if (town === 'forest') {
    return `
      <g opacity="0.85">
        <path d="M30,190 C36,200 34,214 28,224 C22,214 22,200 30,190 Z" fill="#d9f6fa" opacity="0.5"/>
        <path d="M284,168 C290,178 288,194 282,204 C276,194 276,178 284,168 Z" fill="#d9f6fa" opacity="0.5"/>
        <path d="M24,168 C30,174 30,184 26,190" stroke="#d9f6fa" stroke-width="2" fill="none" opacity="0.6"/>
      </g>
      <g transform="translate(286,236)">
        <path d="M0,0 C10,-6 18,-2 20,4 C12,8 4,6 0,0 Z" fill="#8fb2b2" opacity="0.7"/>
      </g>
    `;
  }
  if (town === 'summit') {
    return `
      <g transform="translate(36,228)">
        <path d="M0,0 L6,-18 L12,0 Z" fill="#ffd166" opacity="0.9"/>
        <path d="M2,-2 L6,-14 L10,-2 Z" fill="#fff2c0" opacity="0.8"/>
      </g>
      <path d="M20,${variant === 1 ? 140 : 220} C34,${variant === 1 ? 148 : 228} 48,${variant === 1 ? 146 : 226} 58,${variant === 1 ? 140 : 220}" stroke="#e8c976" stroke-width="2" opacity="0.6" fill="none"/>
    `;
  }
  return `
    <g transform="translate(292,220)">
      <path d="M0,0 L0,24" stroke="#4b3324" stroke-width="4"/>
      <path d="M-8,4 L8,4 L6,16 L-6,16 Z" fill="#3d2a1e"/>
      <rect x="-4" y="6" width="8" height="8" rx="1" fill="#ffd982" opacity="0.9"/>
      <path d="M-7,2 L0,-3 L7,2" stroke="#f4fbff" stroke-width="2" fill="none"/>
    </g>
    <g transform="translate(36,238)">
      <circle cx="0" cy="0" r="12" fill="#e6f4fb" opacity="0.7"/>
      <circle cx="-5" cy="-8" r="7" fill="#f4fbff"/><circle cx="7" cy="-6" r="6" fill="#f4fbff"/>
      <path d="M-7,2 L7,2" stroke="#cfe4f3" stroke-width="1"/>
    </g>
  `;
}

function house(town, variant) {
  const p = TOWN_PALETTES[town];
  const rand = mulberry32(600 + variant * 31 + town.length * 7);
  const roofY = 50;
  const chimneyX = 258;
  let win1;
  let win2;
  let door = '';
  let extra = '';

  if (variant === 0) {
    win1 = windowUnit(44, 122, 62, 68, p, 11);
    win2 = windowUnit(124, 122, 62, 68, p, 17);
    door = `
      <path d="M228,258 L228,204 C228,186 240,176 256,176 C272,176 284,186 284,204 L284,258 Z" fill="url(#door-grad)" stroke="${p.trim}" stroke-width="3"/>
      <path d="M234,258 L234,206 C234,192 243,184 256,184 C269,184 278,192 278,206 L278,258 Z" fill="none" stroke="#000" stroke-width="1" opacity="0.2"/>
      <circle cx="272" cy="224" r="2.6" fill="${p.accent}" stroke="#5b3d1e" stroke-width="0.5"/>
      <path d="M232,214 C242,210 250,210 256,212 C262,210 272,210 280,214" stroke="#f4e2c6" stroke-width="2" opacity="0.6" fill="none"/>
      <g transform="translate(256,208)">${wreath(0, 0, 13, p.accent2, p.snow.light)}</g>
    `;
    extra = `<g transform="translate(204,224)"><path d="M-2,0 L-2,26" stroke="#3b2b1f" stroke-width="3"/><rect x="-10" y="0" width="16" height="18" rx="2" fill="#3b2b1f"/><rect x="-7" y="3" width="10" height="12" rx="1" fill="${p.window}" opacity="0.85"/><path d="M-10,0 L-2,-5 L6,0" stroke="${p.trim}" stroke-width="2" fill="none"/></g>`;
  } else if (variant === 1) {
    win1 = windowUnit(46, 128, 116, 60, p, 23, false);
    win2 = windowUnit(178, 128, 64, 60, p, 29, false);
    door = `
      <path d="M248,258 L248,208 C248,194 256,186 268,186 C280,186 288,194 288,208 L288,258 Z" fill="url(#door-grad)" stroke="${p.trim}" stroke-width="3"/>
      <circle cx="280" cy="226" r="2.4" fill="${p.accent}"/>
      <g transform="translate(268,208)">${wreath(0, 0, 10, p.accent2, p.snow.light)}</g>
    `;
    extra = `
      <path d="M30,116 L196,116 L210,132 L16,132 Z" fill="${p.accent2}" stroke="${p.trim}" stroke-width="1.5"/>
      ${Array.from({ length: 7 }, (_, i) => `<path d="M${26 + i * 27},116 L${36 + i * 27},132 L${50 + i * 27},116 Z" fill="${i % 2 ? p.snow.light : p.accent}" opacity="0.9"/>`).join('')}
      <rect x="30" y="96" width="164" height="18" rx="4" fill="${p.trim}" stroke="#000" stroke-opacity="0.2"/>
      <path d="M38,100 L186,100" stroke="${p.snow.light}" stroke-width="1" opacity="0.3"/>
      <g transform="translate(112,106) scale(1.3)"><path d="${starPath(0, 0, 7, 3.2)}" fill="${p.accent}"/></g>
    `;
  } else {
    win1 = windowUnit(44, 120, 54, 60, p, 37);
    win2 = windowUnit(112, 120, 54, 60, p, 41);
    door = `
      <path d="M206,258 L206,206 C206,192 214,182 228,182 C242,182 250,192 250,206 L250,258 Z" fill="url(#door-grad)" stroke="${p.trim}" stroke-width="3"/>
      <circle cx="242" cy="226" r="2.4" fill="${p.accent}"/>
      <g transform="translate(228,204)">${wreath(0, 0, 11, p.accent2, p.snow.light)}</g>
    `;
    extra = `
      <path d="M28,162 L188,162 L188,174 L28,174 Z" fill="${p.trim}" opacity="0.8"/>
      <path d="M32,166 L184,166" stroke="${p.snow.light}" stroke-width="2" opacity="0.55"/>
      ${[0, 1, 2, 3].map((i) => `<rect x="${48 + i * 34}" y="164" width="4" height="8" fill="${p.trim}"/>`).join('')}
      <g transform="translate(262,150)">
        <path d="M0,0 L0,26" stroke="${p.trim}" stroke-width="4"/>
        <path d="M-7,2 L7,2 L5,16 L-5,16 Z" fill="${p.trim}"/>
        <rect x="-4" y="4" width="8" height="9" fill="${p.window}" opacity="0.85"/>
      </g>
      ${windowUnit(174, 120, 32, 40, p, 43, false)}
    `;
  }

  const snowRoof = `
    <path d="M4,60 C4,48 14,42 30,41 L290,41 C306,42 316,48 316,60 L316,82 C282,88 38,88 4,82 Z" fill="url(#roof-grad)"/>
    <path d="M2,45 C16,36 48,34 80,36 C112,38 148,32 184,35 C220,38 258,33 288,37 C304,39 316,45 318,54 C300,48 278,49 260,52 C232,57 204,49 176,51 C144,54 112,47 84,50 C58,53 26,57 2,45 Z" fill="url(#snow-grad)"/>
    <path d="M4,58 C48,64 104,64 148,61 C198,58 258,60 316,66" stroke="${p.snow.deep}" stroke-width="1" opacity="0.5" fill="none"/>
    <path d="M10,68 C72,74 150,74 212,71 C252,69 290,70 312,73" stroke="#ffffff" stroke-width="0.8" opacity="0.5" fill="none"/>
    <path d="M8,80 C80,86 148,86 216,83 C264,81 294,82 314,84" stroke="${p.roof.dark}" stroke-width="1.2" opacity="0.45" fill="none"/>
    ${icicles(10, 82, 292, 14, 55, p.snow.light)}
    ${garland(10, 310, 84, p, 71)}
  `;

  const body = `
    <g>
      ${chimney(p, town, 5)}
      ${houseBody(town, variant)}
      ${snowRoof}
      ${extra}
      ${win1}
      ${win2}
      ${door}
      ${houseDecor(town, variant, p)}
      ${snowPile(8, 238, 74, 26, 101, p.snow.light)}
      ${snowPile(232, 242, 80, 22, 107, p.snow.mid)}
      ${Array.from({ length: 9 }, (_, i) => `<circle cx="${round(30 + i * 33 + rand() * 8)}" cy="${round(250 - rand() * 4)}" r="${round(1 + rand() * 2.5)}" fill="${p.snow.light}" opacity="${round(0.35 + rand() * 0.5)}"/>`).join('')}
      <path d="M22,256 C100,262 220,262 298,256" stroke="${p.snow.mid}" stroke-width="2" opacity="0.5" fill="none"/>
      <ellipse cx="258" cy="${roofY}" rx="8" ry="3" fill="${p.glow}" opacity="0.35"/>
    </g>`;
  const defs = `
    ${linearGradient('wall-grad', [[0, p.wall.light], [0.45, p.wall.mid], [1, p.wall.dark]], 0, 0, 0.2, 1)}
    ${linearGradient('foundation-grad', [[0, p.wall.dark], [1, '#3a2f28']], 0, 0, 0, 1)}
    ${linearGradient('roof-grad', [[0, p.roof.light], [1, p.roof.dark]], 0, 0, 0.1, 1)}
    ${linearGradient('door-grad', [[0, p.door], [1, '#2f1c13']], 0, 0, 0.3, 1)}
    ${linearGradient('snow-grad', [[0, p.snow.light], [0.6, p.snow.mid], [1, p.snow.deep]], 0, 0, 0.3, 1)}
    ${radialGradient('win-glow-0', [[0, '#fffce8'], [0.45, p.window], [0.8, p.windowDeep], [1, '#a85c1e']], 0.5, 0.35, 0.75)}
    ${radialGradient('win-glow-1', [[0, '#fffce8'], [0.45, p.window], [0.8, p.windowDeep], [1, '#a85c1e']], 0.5, 0.35, 0.75)}
    ${radialGradient('win-glow-2', [[0, '#fffce8'], [0.45, p.window], [0.8, p.windowDeep], [1, '#a85c1e']], 0.5, 0.35, 0.75)}
    ${radialGradient('win-glow-3', [[0, '#fffce8'], [0.45, p.window], [0.8, p.windowDeep], [1, '#a85c1e']], 0.5, 0.35, 0.75)}
    ${radialGradient('win-glow-4', [[0, '#fffce8'], [0.45, p.window], [0.8, p.windowDeep], [1, '#a85c1e']], 0.5, 0.35, 0.75)}
    ${radialGradient('win-glow-5', [[0, '#fffce8'], [0.45, p.window], [0.8, p.windowDeep], [1, '#a85c1e']], 0.5, 0.35, 0.75)}
    ${radialGradient('win-glow-6', [[0, '#fffce8'], [0.45, p.window], [0.8, p.windowDeep], [1, '#a85c1e']], 0.5, 0.35, 0.75)}
    ${filterBlur('soft-glow', 5)}
    ${filterBlur('win-halo', 6)}
    ${filterShadow('house-shadow', 5, 6, 0.25)}
  `;
  return frame(`house-${town}-${variant}`, HOUSE_W, HOUSE_H, body, defs);
}

/* ------------------------------------------------------------------ */
/* Goal Christmas tree                                                 */
/* ------------------------------------------------------------------ */

function goalTree() {
  const rand = mulberry32(777);
  const p = TOWN_PALETTES.pine;
  const tiers = [
    { y: 96, w: 250, h: 130 },
    { y: 158, w: 300, h: 150 },
    { y: 232, w: 350, h: 160 },
    { y: 318, w: 390, h: 160 },
  ];
  let tree = '';
  [...tiers].reverse().forEach((t, i) => {
    const x0 = 210 - t.w / 2;
    const x1 = 210 + t.w / 2;
    tree += `<path d="M${x0},${t.y + t.h} C${x0 + t.w * 0.18},${t.y + t.h * 0.7} ${x0 + t.w * 0.22},${t.y + t.h * 0.45} ${210},${t.y} C${x0 + t.w * 0.78},${t.y + t.h * 0.45} ${x0 + t.w * 0.82},${t.y + t.h * 0.7} ${x1},${t.y + t.h} Z" fill="url(#gt-green-${i % 2})"/>`;
    tree += `<path d="M${x0 + 10},${t.y + t.h - 6} C${x0 + t.w * 0.2},${t.y + t.h * 0.72} ${x0 + t.w * 0.28},${t.y + t.h * 0.48} ${210},${t.y + 4} C${x0 + t.w * 0.72},${t.y + t.h * 0.48} ${x1 - 10},${t.y + t.h - 6} ${x0 + t.w * 0.86},${t.y + t.h - 10}" stroke="#2f7d67" stroke-width="2" opacity="0.35" fill="none"/>`;
    tree += `<path d="M${x0 + 4},${t.y + t.h} C${x0 + t.w * 0.2},${t.y + t.h - 24} ${x0 + t.w * 0.34},${t.y + t.h - 14} ${210},${t.y + t.h - 28} C${x0 + t.w * 0.68},${t.y + t.h - 14} ${x1 - 6},${t.y + t.h - 22} ${x1},${t.y + t.h} Z" fill="url(#gt-snow)" opacity="0.95"/>`;
    for (let k = 0; k < 10; k++) {
      const x = x0 + 20 + rand() * (t.w - 40);
      const y = t.y + 22 + rand() * (t.h - 40);
      tree += `<circle cx="${round(x)}" cy="${round(y)}" r="${round(2.4 + rand() * 3)}" fill="${['#ffd166', '#ef476f', '#7fe3ff', '#9fefc0', '#ffb3c6'][Math.floor(rand() * 5)]}"/>`;
      tree += `<circle cx="${round(x)}" cy="${round(y)}" r="${round(4.6 + rand() * 3)}" fill="${['#ffd166', '#ef476f', '#7fe3ff', '#9fefc0'][Math.floor(rand() * 4)]}" opacity="0.18"/>`;
      if (rand() > 0.6) tree += `<path d="M${round(x)},${round(y - 3)} L${round(x)},${round(y - 7)}" stroke="#d9b46a" stroke-width="0.7"/>`;
    }
  });
  const gifts = Array.from({ length: 7 }, (_, i) => {
    const x = 54 + i * 48 + rand() * 8;
    const y = 440 + rand() * 34;
    const w = 22 + rand() * 14;
    const h = 16 + rand() * 10;
    const color = ['#c93b47', '#3f8fc4', '#4caf82', '#e2b455', '#a97bff'][i % 5];
    return `<g transform="translate(${round(x)},${round(y)})">
      <rect x="0" y="0" width="${round(w)}" height="${round(h)}" rx="2" fill="${color}"/>
      <rect x="${round(w * 0.38)}" y="0" width="${round(w * 0.16)}" height="${round(h)}" fill="#f4d47c"/>
      <rect x="0" y="${round(h * 0.42)}" width="${round(w)}" height="${round(h * 0.14)}" fill="#f4d47c"/>
      <path d="M${round(w * 0.42)},0 C${round(w * 0.2)},-8 ${round(w * 0.1)},-2 ${round(w * 0.4)},2 M${round(w * 0.55)},0 C${round(w * 0.7)},-8 ${round(w * 0.84)},-1 ${round(w * 0.58)},2" stroke="#f4d47c" stroke-width="2" fill="none" stroke-linecap="round"/>
      <path d="M2,3 L${round(w - 3)},3" stroke="#fff" stroke-width="1" opacity="0.25"/>
    </g>`;
  }).join('');
  const body = `
    <g>
      <ellipse cx="210" cy="500" rx="190" ry="24" fill="#081c30" opacity="0.5"/>
      <ellipse cx="210" cy="490" rx="172" ry="34" fill="url(#gt-snow)"/>
      <ellipse cx="210" cy="502" rx="150" ry="18" fill="#cfe4f3" opacity="0.7"/>
      <path d="M188,430 L188,486 C188,492 232,492 232,486 L232,430 Z" fill="url(#gt-trunk)"/>
      <path d="M196,430 L196,470 M222,436 L222,474" stroke="#3d2618" stroke-width="2" opacity="0.5"/>
      ${tree}
      <path d="M38,372 C66,360 90,366 106,378 C82,384 58,380 38,372 Z" fill="#f4fbff" opacity="0.85"/>
      <path d="M316,402 C338,392 360,396 374,408 C352,414 332,410 316,402 Z" fill="#f4fbff" opacity="0.75"/>
      <g transform="translate(210,42)">
        <circle cx="0" cy="0" r="30" fill="#ffd166" opacity="0.2" filter="url(#gt-glow)"/>
        <path d="${starPath(0, 0, 34, 14)}" fill="url(#gt-star)" stroke="#b9862a" stroke-width="1.2"/>
        <path d="${starPath(0, 0, 22, 9)}" fill="#fff3c0" opacity="0.55"/>
        <circle cx="0" cy="0" r="4" fill="#fffbe8"/>
      </g>
      ${Array.from({ length: 24 }, () => {
        const x = 40 + rand() * 340;
        const y = 100 + rand() * 340;
        return `<circle cx="${round(x)}" cy="${round(y)}" r="${round(1 + rand() * 1.8)}" fill="#fff8d8" opacity="${round(0.35 + rand() * 0.5)}"/>`;
      }).join('')}
      ${gifts}
      <path d="M20,470 C70,486 130,490 176,488" stroke="#ffffff" stroke-width="2" opacity="0.5" fill="none"/>
      <path d="M244,488 C300,486 356,478 396,462" stroke="#ffffff" stroke-width="2" opacity="0.4" fill="none"/>
      <g transform="translate(42,468)">
        <path d="M0,0 L0,28" stroke="#fff" stroke-width="5"/>
        <path d="M0,4 C-4,-2 -2,-7 2,-10" stroke="#d64550" stroke-width="5" fill="none"/>
        <path d="M0,10 C5,4 7,-2 3,-6" stroke="#7fd9b4" stroke-width="4" fill="none"/>
      </g>
    </g>`;
  const defs = `
    ${linearGradient('gt-green-0', [[0, '#2f7d67'], [0.5, '#1d5a4a'], [1, '#0e3a30']], 0.2, 0, 0.8, 1)}
    ${linearGradient('gt-green-1', [[0, '#3a8a70'], [0.5, '#256750'], [1, '#123f33']], 0.2, 0, 0.8, 1)}
    ${linearGradient('gt-snow', [[0, '#ffffff'], [0.6, '#f0f9ff'], [1, '#cfe4f3']], 0, 0, 0.2, 1)}
    ${linearGradient('gt-trunk', [[0, '#7a5133'], [1, '#3f2917']], 0, 0, 0.2, 1)}
    ${linearGradient('gt-star', [[0, '#fff7cc'], [0.4, '#ffd166'], [1, '#c9902a']], 0, 0, 0.2, 1)}
    ${filterGlow('gt-glow', 8)}
    ${filterBlur('gt-soft', 2)}
  `;
  return frame('goal-tree', 420, 520, body, defs, 1.5);
}

export function buildHouses() {
  const out = [];
  for (const town of Object.keys(TOWN_PALETTES)) {
    for (let variant = 0; variant < 3; variant++) out.push(house(town, variant));
  }
  out.push(goalTree());
  return out;
}

export const HOUSE_META = {
  width: HOUSE_W,
  height: HOUSE_H,
  roofTop: 50,
  chimneyX: 258,
  chimneyTop: 20,
};
