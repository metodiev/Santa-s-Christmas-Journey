// Shared helpers for the hand-authored SVG art. Coordinates are authored in
// display units; files are rasterized at 2x for retina screens.

export function mulberry32(seed) {
  let a = seed >>> 0;
  return function rand() {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
export const round = (v) => Math.round(v * 100) / 100;

export function pick(arr, rand) {
  return arr[Math.floor(rand() * arr.length) % arr.length];
}

export function svgDoc(width, height, viewBox, defs, body) {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="${viewBox}" fill="none">` +
    `<defs>${defs}</defs>${body}</svg>`;
}

export function linearGradient(id, stops, x1 = 0, y1 = 0, x2 = 0, y2 = 1) {
  return `<linearGradient id="${id}" x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}">` +
    stops.map(([offset, color, opacity = 1]) => `<stop offset="${offset}" stop-color="${color}" stop-opacity="${opacity}"/>`).join('') +
    `</linearGradient>`;
}

export function radialGradient(id, stops, cx = 0.5, cy = 0.5, r = 0.5) {
  return `<radialGradient id="${id}" cx="${cx}" cy="${cy}" r="${r}">` +
    stops.map(([offset, color, opacity = 1]) => `<stop offset="${offset}" stop-color="${color}" stop-opacity="${opacity}"/>`).join('') +
    `</radialGradient>`;
}

export function filterFur(id, freq = 0.75, scale = 1.6, seed = 3) {
  return `<filter id="${id}" x="-15%" y="-15%" width="130%" height="130%" color-interpolation-filters="sRGB">` +
    `<feTurbulence type="fractalNoise" baseFrequency="${freq}" numOctaves="3" seed="${seed}" result="noise"/>` +
    `<feDisplacementMap in="SourceGraphic" in2="noise" scale="${scale}" xChannelSelector="R" yChannelSelector="G"/>` +
    `</filter>`;
}

export function filterBlur(id, stdDeviation) {
  return `<filter id="${id}" x="-40%" y="-40%" width="180%" height="180%"><feGaussianBlur stdDeviation="${stdDeviation}"/></filter>`;
}

export function filterShadow(id, dy = 2, blur = 2, opacity = 0.35, color = '#000') {
  return `<filter id="${id}" x="-40%" y="-40%" width="180%" height="180%">` +
    `<feDropShadow dx="0" dy="${dy}" stdDeviation="${blur}" flood-color="${color}" flood-opacity="${opacity}"/>` +
    `</filter>`;
}

export function filterGlow(id, stdDeviation = 2.5) {
  return `<filter id="${id}" x="-80%" y="-80%" width="260%" height="260%">` +
    `<feGaussianBlur stdDeviation="${stdDeviation}" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>` +
    `</filter>`;
}

export function velvetPattern(id, color = '#ffffff', opacity = 0.035) {
  return `<pattern id="${id}" width="3.2" height="3.2" patternUnits="userSpaceOnUse" patternTransform="rotate(18)">` +
    `<rect width="3.2" height="3.2" fill="${color}" fill-opacity="${opacity}"/>` +
    `<circle cx="1.1" cy="1.1" r="0.38" fill="#000" fill-opacity="0.05"/>` +
    `</pattern>`;
}

export function starPath(cx, cy, outer, inner, points = 5, rotation = -90) {
  const pts = [];
  for (let i = 0; i < points * 2; i++) {
    const r = i % 2 === 0 ? outer : inner;
    const a = ((rotation + (i * 180) / points) * Math.PI) / 180;
    pts.push(`${round(cx + Math.cos(a) * r)},${round(cy + Math.sin(a) * r)}`);
  }
  return `M${pts.join('L')}Z`;
}

export function hexToRgb(hex) {
  const h = hex.replace('#', '');
  const v = h.length === 3 ? h.split('').map((c) => c + c).join('') : h;
  return [parseInt(v.slice(0, 2), 16), parseInt(v.slice(2, 4), 16), parseInt(v.slice(4, 6), 16)];
}

export function rgba(hex, alpha = 1) {
  const [r, g, b] = hexToRgb(hex);
  return `rgba(${r},${g},${b},${alpha})`;
}

export function shade(hex, amount) {
  const [r, g, b] = hexToRgb(hex);
  const f = (v) => clamp(Math.round(v + 255 * amount), 0, 255);
  return `#${[f(r), f(g), f(b)].map((v) => v.toString(16).padStart(2, '0')).join('')}`;
}

export function mix(hexA, hexB, t) {
  const a = hexToRgb(hexA);
  const b = hexToRgb(hexB);
  const f = (i) => Math.round(a[i] + (b[i] - a[i]) * t);
  return `#${[f(0), f(1), f(2)].map((v) => v.toString(16).padStart(2, '0')).join('')}`;
}

/** Seamlessly tileable ridge line made of layered sines. */
export function ridgePath(width, height, baseY, amplitude, seed, points = 5) {
  const rand = mulberry32(seed);
  const waves = Array.from({ length: points }, (_, i) => ({
    k: i + 1,
    amp: amplitude * (0.62 / (i + 1)),
    phase: rand() * Math.PI * 2,
  }));
  const steps = 80;
  let d = `M0,${height} L0,${round(baseY)}`;
  for (let i = 1; i <= steps; i++) {
    const x = (i / steps) * width;
    const t = (i / steps) * Math.PI * 2;
    const y = waves.reduce((sum, w) => sum + Math.sin(t * w.k + w.phase) * w.amp, 0);
    d += ` L${round(x)},${round(baseY + y)}`;
  }
  d += ` L${width},${height} Z`;
  return d;
}

/** Deterministic decorative sparkle / star field. */
export function starField(width, height, count, seed, color = '#fff') {
  const rand = mulberry32(seed);
  let out = '';
  for (let i = 0; i < count; i++) {
    const x = rand() * width;
    const y = rand() * height;
    const r = 0.4 + rand() * 1.4;
    const o = 0.25 + rand() * 0.6;
    out += `<circle cx="${round(x)}" cy="${round(y)}" r="${round(r)}" fill="${color}" opacity="${round(o)}"/>`;
    if (r > 1.2) {
      out += `<path d="M${round(x - 2.4)},${round(y)}H${round(x + 2.4)}M${round(x)},${round(y - 2.4)}V${round(y + 2.4)}" stroke="${color}" stroke-width="0.4" opacity="${round(o * 0.7)}"/>`;
    }
  }
  return out;
}

export function snowCap(x, y, w, h, seed, color = '#f4fbff') {
  const rand = mulberry32(seed);
  let d = `M${x},${y + h} Q${x},${y + h * 0.25} ${x + w * 0.25},${y + h * 0.18} `;
  const lumps = 6;
  for (let i = 0; i < lumps; i++) {
    const px = x + (w * (i + 1)) / lumps;
    const py = y + (rand() - 0.5) * h * 0.3;
    d += `Q${round(px - w / lumps / 2)},${round(py - h * 0.35)} ${round(px)},${round(py)} `;
  }
  d += `Q${x + w},${y + h * 0.1} ${x + w},${y + h} Z`;
  return `<path d="${d}" fill="${color}"/>`;
}

export function snowPile(x, y, w, h, seed, color = '#f2faff') {
  const rand = mulberry32(seed);
  let d = `M${x},${y + h} Q${x},${y + h * 0.4} ${x + w * 0.2},${y + h * 0.2} `;
  for (let i = 0; i < 4; i++) {
    const px = x + w * (0.2 + i * 0.2);
    d += `Q${round(px - w * 0.1)},${round(y - rand() * h * 0.3)} ${round(px)},${round(y + rand() * h * 0.12)} `;
  }
  d += `Q${x + w},${y + h * 0.35} ${x + w},${y + h} Z`;
  return `<path d="${d}" fill="${color}"/>`;
}

export function icicles(x, y, w, count, seed, color = '#dff4ff') {
  const rand = mulberry32(seed);
  let out = '';
  for (let i = 0; i < count; i++) {
    const ix = x + (w * (i + 0.5)) / count + (rand() - 0.5) * 4;
    const len = 6 + rand() * 16;
    const iw = 1.8 + rand() * 2.4;
    out += `<path d="M${round(ix - iw)},${y} Q${round(ix - iw * 0.6)},${round(y + len * 0.6)} ${round(ix)},${round(y + len)} Q${round(ix + iw * 0.6)},${round(y + len * 0.6)} ${round(ix + iw)},${y} Z" fill="${color}" opacity="0.9"/>`;
    out += `<path d="M${round(ix - iw * 0.3)},${y + 1} L${round(ix)},${round(y + len - 2)}" stroke="#ffffff" stroke-width="0.5" opacity="0.75"/>`;
  }
  return out;
}

export function furEdge(x1, x2, y, amplitude, seed, color = '#eef5fb') {
  const rand = mulberry32(seed);
  const steps = Math.max(6, Math.round(Math.abs(x2 - x1) / 3));
  let d = `M${x1},${y}`;
  for (let i = 1; i <= steps; i++) {
    const px = x1 + ((x2 - x1) * i) / steps;
    const py = y + (rand() - 0.5) * amplitude;
    d += ` Q${round(px - (x2 - x1) / steps / 2)},${round(y + (rand() - 0.5) * amplitude * 2.2)} ${round(px)},${round(py)}`;
  }
  return `<path d="${d}" stroke="${color}" stroke-width="${round(1.2 + amplitude * 0.4)}" stroke-linecap="round" opacity="0.95"/>`;
}
