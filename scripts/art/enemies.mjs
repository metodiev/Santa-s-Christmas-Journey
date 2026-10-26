// Enemy cast: hand-authored vector characters with multiple animation frames.
// Each frame is authored in display units and rasterized at 2x.

import {
  svgDoc, linearGradient, radialGradient, filterFur, filterGlow, filterBlur, filterShadow,
  mulberry32, round, starPath, icicles, snowCap,
} from './lib.mjs';

const SCALE = 2;

function frame(name, width, height, body, defs = '') {
  return {
    name,
    width,
    height,
    scale: SCALE,
    svg: svgDoc(width * SCALE, height * SCALE, `0 0 ${width} ${height}`, defs, body),
  };
}

function eyePair(cxL, cxR, cy, r, iris = '#1b2430', glint = '#ffffff') {
  return `
    <circle cx="${cxL}" cy="${cy}" r="${r + 1.2}" fill="#ffffff" opacity="0.92"/>
    <circle cx="${cxR}" cy="${cy}" r="${r + 1.2}" fill="#ffffff" opacity="0.92"/>
    <circle cx="${cxL}" cy="${cy}" r="${r}" fill="${iris}"/>
    <circle cx="${cxR}" cy="${cy}" r="${r}" fill="${iris}"/>
    <circle cx="${cxL - r * 0.3}" cy="${cy - r * 0.35}" r="${r * 0.32}" fill="${glint}"/>
    <circle cx="${cxR - r * 0.3}" cy="${cy - r * 0.35}" r="${r * 0.32}" fill="${glint}"/>
  `;
}

function snowDust(cx, cy, seed, color = '#f4fbff') {
  const rand = mulberry32(seed);
  let out = '';
  for (let i = 0; i < 7; i++) {
    const x = cx + (rand() - 0.5) * 40;
    const y = cy + rand() * 4;
    out += `<circle cx="${round(x)}" cy="${round(y)}" r="${round(0.8 + rand() * 1.6)}" fill="${color}" opacity="${round(0.25 + rand() * 0.4)}"/>`;
  }
  return out;
}

/* ------------------------------------------------------------------ */
/* Penguin                                                             */
/* ------------------------------------------------------------------ */

function penguin(i) {
  const bob = [0, 0.8][i];
  const flipper = [-4, 7][i];
  const foot = [[0, 1], [1, 0]][i];
  const body = `
    <g transform="translate(0,${bob})">
      ${snowDust(48, 91, 3 + i)}
      <g transform="translate(${28 + foot[0] * 2},86) rotate(${foot[0] ? -8 : 4})">
        <path d="M-9,0 C-14,2 -14,7 -9,8 C-5,9 8,9 12,7 C16,5 15,1 10,0 Z" fill="url(#p-foot)"/>
        <path d="M-4,1 L-5,7 M2,1 L2,7 M8,1 L9,6" stroke="#a34d15" stroke-width="0.8" opacity="0.6"/>
      </g>
      <g transform="translate(${58 - foot[1] * 2},86) rotate(${foot[1] ? 8 : -4})">
        <path d="M-9,0 C-14,2 -14,7 -9,8 C-5,9 8,9 12,7 C16,5 15,1 10,0 Z" fill="url(#p-foot)"/>
        <path d="M-4,1 L-5,7 M2,1 L2,7 M8,1 L9,6" stroke="#a34d15" stroke-width="0.8" opacity="0.6"/>
      </g>
      <path d="M48,14 C28,14 18,31 19,52 C20,70 30,84 48,88 C66,84 76,70 77,52 C78,31 68,14 48,14 Z" fill="url(#p-body)"/>
      <path d="M48,14 C36,14 27,22 23,34 C32,30 42,30 48,31 C54,30 64,30 73,34 C69,22 60,14 48,14 Z" fill="#354b63" opacity="0.55"/>
      <path d="M48,38 C35,38 28,53 29,67 C30,78 38,85 48,87 C58,85 66,78 67,67 C68,53 61,38 48,38 Z" fill="url(#p-belly)"/>
      <path d="M35,50 C38,46 44,46 46,49 M50,49 C53,46 58,46 61,50" stroke="#d9e6ea" stroke-width="0.8" opacity="0.6" fill="none"/>
      <path d="M31,65 C35,62 42,62 46,64 M50,64 C55,62 61,62 65,65 M35,74 C39,71 44,72 47,74 M50,74 C54,72 59,72 63,74" stroke="#e2edf1" stroke-width="0.55" opacity="0.55" fill="none"/>
      <ellipse cx="40.5" cy="33" rx="8.4" ry="10.5" fill="#f4f9f8"/>
      <ellipse cx="56" cy="33" rx="8.4" ry="10.5" fill="#f4f9f8"/>
      ${eyePair(40.5, 56, 33, 2.7)}
      <path d="M32,25 C36,22 43,22 46,25" stroke="#1c2a38" stroke-width="2.1" stroke-linecap="round" fill="none"/>
      <path d="M50,25 C54,22 61,22 64,25" stroke="#1c2a38" stroke-width="2.1" stroke-linecap="round" fill="none"/>
      <path d="M42,38 C45,36 51,36 54,38 L48,46 Z" fill="url(#p-beak)"/>
      <path d="M44,38.5 C46,38 50,38 52,38.5" stroke="#ffb56b" stroke-width="0.6" opacity="0.8"/>
      <g transform="translate(0,51)">
        <path d="M25,0 C34,4 62,4 71,0 L70,7 C61,10 35,10 26,7 Z" fill="#cf3944"/>
        <path d="M28,-1 C35,2 44,3 48,3 C52,3 61,2 68,-1" stroke="#f2d9bc" stroke-width="1.4" opacity="0.8" fill="none"/>
        <path d="M69,3 C76,4 80,8 82,13 C78,12 74,13 71,16 C70,12 69,8 66,5 Z" fill="#b52d38"/>
        <path d="M26,3 C20,5 17,9 15,14 C19,13 23,14 26,17 C27,12 28,8 30,5 Z" fill="#b52d38"/>
        <path d="M30,7 L32,9 M36,8 L38,10 M42,8.5 L44,10.5" stroke="#f2d9bc" stroke-width="0.7" opacity="0.7"/>
      </g>
      <g transform="translate(19,40) rotate(${flipper})">
        <path d="M0,0 C-7,8 -10,22 -6,34 C-2,40 2,38 2,31 C1,20 3,9 5,3 Z" fill="url(#p-flipper)"/>
        <path d="M-1,6 C-4,16 -4,25 -2,32" stroke="#4d6a85" stroke-width="0.7" opacity="0.5" fill="none"/>
      </g>
      <g transform="translate(77,40) rotate(${flipper}) scale(-1,1)">
        <path d="M0,0 C-7,8 -10,22 -6,34 C-2,40 2,38 2,31 C1,20 3,9 5,3 Z" fill="url(#p-flipper)"/>
        <path d="M-1,6 C-4,16 -4,25 -2,32" stroke="#4d6a85" stroke-width="0.7" opacity="0.5" fill="none"/>
      </g>
      <ellipse cx="48" cy="15" rx="10" ry="4" fill="#ffffff" opacity="0.18"/>
    </g>`;
  const defs = `
    ${linearGradient('p-body', [[0, '#3d5874'], [0.45, '#243649'], [1, '#0d1622']], 0.15, 0, 0.8, 1)}
    ${linearGradient('p-belly', [[0, '#ffffff'], [0.6, '#eef6f8'], [1, '#cfe0e7']], 0.3, 0, 0.7, 1)}
    ${linearGradient('p-flipper', [[0, '#2f4a63'], [1, '#0d1723']], 0, 0, 0.6, 1)}
    ${linearGradient('p-beak', [[0, '#ffbe75'], [0.6, '#f39546'], [1, '#c76720']], 0.2, 0, 0.7, 1)}
    ${linearGradient('p-foot', [[0, '#f8b26b'], [0.55, '#e88a3c'], [1, '#b95516']], 0, 0, 0.2, 1)}
    ${radialGradient('p-glow', [[0, '#ffffff', 0.4], [1, '#ffffff', 0]])}
  `;
  return frame(`penguin-${i}`, 96, 96, body, defs);
}

/* ------------------------------------------------------------------ */
/* Runaway snowball                                                    */
/* ------------------------------------------------------------------ */

function snowball(i) {
  const rand = mulberry32(70 + i);
  const lumps = Array.from({ length: 7 }, (_, k) => {
    const a = (k / 7) * Math.PI * 2 + i * 0.25;
    const r = 34 + rand() * 3;
    return `<circle cx="${round(40 + Math.cos(a) * r)}" cy="${round(40 + Math.sin(a) * r)}" r="${round(4 + rand() * 4)}" fill="#eff9ff" opacity="0.85"/>`;
  }).join('');
  const cracks = Array.from({ length: 5 }, () => {
    const x = 20 + rand() * 40;
    const y = 26 + rand() * 34;
    return `<path d="M${round(x)},${round(y)} l${round((rand() - 0.5) * 8)},${round(3 + rand() * 6)} l${round((rand() - 0.5) * 8)},${round(2 + rand() * 6)}" stroke="#9fc3da" stroke-width="0.8" opacity="0.65" fill="none" stroke-linecap="round"/>`;
  }).join('');
  const body = `
    <g transform="translate(0,${[0, 1][i]})">
      ${lumps}
      <circle cx="40" cy="42" r="32" fill="url(#sb-body)"/>
      <path d="M15,52 C20,30 34,14 52,12 C36,20 26,34 24,54 C21,65 26,72 34,76 C24,74 16,64 15,52 Z" fill="#ffffff" opacity="0.55"/>
      <circle cx="40" cy="42" r="31" fill="url(#sb-shade)"/>
      ${cracks}
      <g transform="translate(0,2)">
        <path d="M27,37 C30,34 35,35 37,38 M43,38 C45,35 50,34 53,37" stroke="#233447" stroke-width="1.8" stroke-linecap="round" fill="none"/>
        <ellipse cx="31.5" cy="43" rx="3.4" ry="3.8" fill="#1c2b3b"/>
        <ellipse cx="48.5" cy="43" rx="3.4" ry="3.8" fill="#1c2b3b"/>
        <circle cx="30.4" cy="41.8" r="1.1" fill="#ffffff"/>
        <circle cx="47.4" cy="41.8" r="1.1" fill="#ffffff"/>
        <path d="M34,53 C37,56 43,56 46,53" stroke="#2a3c4e" stroke-width="1.5" stroke-linecap="round" fill="none"/>
        <path d="M36,55 L35,59 M40,56 L40,60 M44,55 L45,59" stroke="#8badc4" stroke-width="1" opacity="0.8"/>
      </g>
      <path d="M14,31 C8,27 4,27 1,29 M8,38 C3,37 0,39 -1,42" stroke="#7b5a3f" stroke-width="1.5" stroke-linecap="round" opacity="0.85"/>
      <path d="M66,31 C72,27 76,27 79,29 M72,38 C77,37 80,39 81,42" stroke="#7b5a3f" stroke-width="1.5" stroke-linecap="round" opacity="0.85"/>
      <ellipse cx="31" cy="27" rx="9" ry="5" fill="#ffffff" opacity="0.6" transform="rotate(-28 31 27)"/>
      <path d="M13,62 C20,70 30,76 40,77" stroke="#ffffff" stroke-width="1.6" opacity="0.6" fill="none"/>
    </g>`;
  const defs = `
    ${radialGradient('sb-body', [[0, '#ffffff'], [0.45, '#f2fbff'], [0.78, '#d7eaf6'], [1, '#a8c9de']], 0.34, 0.28, 0.8)}
    ${radialGradient('sb-shade', [[0, '#ffffff', 0], [0.6, '#a8c9de', 0], [1, '#5f879f', 0.45]], 0.35, 0.3, 0.8)}
    ${filterFur('sb-fur', 0.5, 0.8, 9 + i)}
  `;
  return frame(`snowball-${i}`, 80, 80, body, defs);
}

/* ------------------------------------------------------------------ */
/* Gingerbread man                                                     */
/* ------------------------------------------------------------------ */

function gingerbread(i) {
  const phase = (i / 4) * Math.PI * 2;
  const swing = Math.sin(phase) * 16;
  const legSwing = Math.sin(phase) * 12;
  const bob = -Math.abs(Math.sin(phase)) * 1.5;
  const body = `
    <g transform="translate(0,${round(bob)})">
      ${snowDust(48, 92, 21 + i, '#f7e8d6')}
      <g transform="translate(41,68) rotate(${legSwing})">
        <rect x="-6" y="-2" width="12" height="22" rx="5" fill="url(#gb-body)"/>
        <path d="M-6,12 C-1,10 4,10 6,12" stroke="#a45f25" stroke-width="0.8" opacity="0.7" fill="none"/>
        <rect x="-7" y="13" width="14" height="5" rx="2.5" fill="#fff7ea"/>
        <path d="M-5,15 L5,15" stroke="#e8d3b5" stroke-width="0.6" stroke-dasharray="1.5 1"/>
        <path d="M-7,18 C-7,23 -4,25 0,25 C4,25 7,23 7,18 Z" fill="#7a3c15"/>
      </g>
      <g transform="translate(57,68) rotate(${-legSwing})">
        <rect x="-6" y="-2" width="12" height="22" rx="5" fill="url(#gb-body)"/>
        <path d="M-6,12 C-1,10 4,10 6,12" stroke="#a45f25" stroke-width="0.8" opacity="0.7" fill="none"/>
        <rect x="-7" y="13" width="14" height="5" rx="2.5" fill="#fff7ea"/>
        <path d="M-5,15 L5,15" stroke="#e8d3b5" stroke-width="0.6" stroke-dasharray="1.5 1"/>
        <path d="M-7,18 C-7,23 -4,25 0,25 C4,25 7,23 7,18 Z" fill="#7a3c15"/>
      </g>
      <g transform="translate(32,45) rotate(${swing})">
        <rect x="-4" y="-1" width="9" height="27" rx="4.5" fill="url(#gb-body)"/>
        <rect x="-5.5" y="21" width="12" height="5.5" rx="2.7" fill="#fff7ea"/>
        <circle cx="0" cy="30" r="4.6" fill="url(#gb-body)"/>
      </g>
      <g transform="translate(65,45) rotate(${-swing})">
        <rect x="-5" y="-1" width="9" height="27" rx="4.5" fill="url(#gb-body)"/>
        <rect x="-6.5" y="21" width="12" height="5.5" rx="2.7" fill="#fff7ea"/>
        <circle cx="0" cy="30" r="4.6" fill="url(#gb-body)"/>
      </g>
      <rect x="33" y="40" width="30" height="32" rx="10" fill="url(#gb-body)"/>
      <circle cx="48" cy="28" r="17" fill="url(#gb-body)"/>
      <path d="M33,45 C39,42 44,42 48,43 C52,42 58,42 63,45" stroke="#fff7ea" stroke-width="2" stroke-linecap="round" fill="none" opacity="0.9"/>
      <path d="M37,70 C41,67 45,67 48,68 C51,67 56,67 60,70" stroke="#fff7ea" stroke-width="1.8" stroke-linecap="round" fill="none" opacity="0.9"/>
      <circle cx="42" cy="27" r="4.2" fill="#fffdf6"/>
      <circle cx="54" cy="27" r="4.2" fill="#fffdf6"/>
      <circle cx="42.4" cy="27.4" r="1.7" fill="#40220f"/>
      <circle cx="53.6" cy="27.4" r="1.7" fill="#40220f"/>
      <circle cx="41.7" cy="26.5" r="0.55" fill="#ffffff"/>
      <circle cx="52.9" cy="26.5" r="0.55" fill="#ffffff"/>
      <path d="M41,33 C44,36 52,36 55,33" stroke="#fffdf6" stroke-width="1.8" stroke-linecap="round" fill="none"/>
      <path d="M33,34 C36,33 39,33 41,35 M55,35 C57,33 60,33 63,34" stroke="#e9b68a" stroke-width="1.6" stroke-linecap="round" opacity="0.8"/>
      <circle cx="34.5" cy="38" r="2.4" fill="#e0696f" opacity="0.6"/>
      <circle cx="61.5" cy="38" r="2.4" fill="#e0696f" opacity="0.6"/>
      <circle cx="48" cy="48" r="2.6" fill="#d8494f"/>
      <circle cx="48" cy="56" r="2.6" fill="#57b78b"/>
      <circle cx="48" cy="64" r="2.6" fill="#d8494f"/>
      <path d="M46.8,47 L49.2,47 M46.8,55 L49.2,55 M46.8,63 L49.2,63" stroke="#ffffff" stroke-width="0.5" opacity="0.7"/>
      <path d="M34,42 C36,54 36,62 34,68 M62,42 C60,54 60,62 62,68" stroke="#8f501e" stroke-width="1" opacity="0.6"/>
      <g transform="translate(38,86) rotate(${legSwing * 0.4})">
        <path d="M-3,0 C-6,2 -7,5 -5,6 L-2,6 L-2,2 Z" fill="#fff7ea"/>
      </g>
      <g transform="translate(58,86) rotate(${-legSwing * 0.4})">
        <path d="M3,0 C6,2 7,5 5,6 L2,6 L2,2 Z" fill="#fff7ea"/>
      </g>
    </g>`;
  const defs = `
    ${linearGradient('gb-body', [[0, '#e8a866'], [0.35, '#d08a45'], [0.8, '#a96428'], [1, '#894a16']], 0.15, 0, 0.8, 1)}
    ${filterBlur('gb-soft', 0.4)}
  `;
  return frame(`gingerbread-${i}`, 96, 96, body, defs);
}

/* ------------------------------------------------------------------ */
/* Gumdrop slime                                                       */
/* ------------------------------------------------------------------ */

function gumdrop(i) {
  const sx = [1, 1.08, 0.94][i];
  const sy = [1, 0.9, 1.06][i];
  const rand = mulberry32(300 + i);
  const sugar = Array.from({ length: 12 }, () => {
    const x = 14 + rand() * 68;
    const y = 22 + rand() * 38;
    return `<circle cx="${round(x)}" cy="${round(y)}" r="${round(0.5 + rand() * 0.9)}" fill="#ffffff" opacity="${round(0.35 + rand() * 0.4)}"/>`;
  }).join('');
  const body = `
    <g transform="translate(48,68) scale(${sx},${sy}) translate(-48,-68)">
      ${snowDust(48, 68, 41 + i, '#e5fff4')}
      <path d="M18,64 C10,52 12,34 26,24 C34,18 43,14 48,13 C53,14 62,18 70,24 C84,34 86,52 78,64 C72,68 62,70 48,70 C34,70 24,68 18,64 Z" fill="url(#gd-body)"/>
      <path d="M20,60 C16,48 18,34 30,25 C38,19 44,16 48,15 C44,26 38,36 34,50 C31,59 31,65 33,69 C26,68 22,65 20,60 Z" fill="#ffffff" opacity="0.28"/>
      <ellipse cx="33" cy="33" rx="12" ry="7" fill="#ffffff" opacity="0.35" transform="rotate(-28 33 33)"/>
      ${sugar}
      <path d="M24,62 C34,66 62,66 72,62" stroke="#ffffff" stroke-width="0.7" opacity="0.3" fill="none"/>
      <path d="M33,42 C36,39 41,39 44,42" stroke="#183d33" stroke-width="1.7" stroke-linecap="round" fill="none"/>
      <path d="M53,42 C56,39 61,39 64,42" stroke="#183d33" stroke-width="1.7" stroke-linecap="round" fill="none"/>
      <circle cx="38.5" cy="47" r="3" fill="#17332b"/>
      <circle cx="58.5" cy="47" r="3" fill="#17332b"/>
      <circle cx="37.5" cy="46" r="0.9" fill="#ffffff"/>
      <circle cx="57.5" cy="46" r="0.9" fill="#ffffff"/>
      <path d="M44,55 C47,58 51,58 54,55" stroke="#17332b" stroke-width="1.4" stroke-linecap="round" fill="none"/>
      <circle cx="31" cy="52" r="3.2" fill="#ff8f9a" opacity="0.35"/>
      <circle cx="66" cy="52" r="3.2" fill="#ff8f9a" opacity="0.35"/>
    </g>`;
  const defs = `
    ${linearGradient('gd-body', [[0, '#c9ffe9'], [0.3, '#84e9c2'], [0.75, '#3fbf92'], [1, '#1e8a65']], 0.2, 0, 0.8, 1)}
    ${filterFur('gd-fur', 0.4, 0.5, 5 + i)}
  `;
  return frame(`gumdrop-${i}`, 96, 80, body, defs);
}

/* ------------------------------------------------------------------ */
/* Tin robot                                                           */
/* ------------------------------------------------------------------ */

function robot(i) {
  const phase = (i / 4) * Math.PI * 2;
  const legSwing = Math.sin(phase) * 14;
  const bob = -Math.abs(Math.sin(phase)) * 1.2;
  const body = `
    <g transform="translate(0,${round(bob)})">
      ${snowDust(52, 96, 61 + i, '#dfe9f2')}
      <g transform="translate(40,78) rotate(${legSwing})">
        <rect x="-7" y="-2" width="14" height="16" rx="2" fill="url(#rb-metal)"/>
        <rect x="-9" y="11" width="18" height="7" rx="3" fill="#3b4652"/>
        <path d="M-8,14 L8,14" stroke="#7d8b98" stroke-width="0.8" opacity="0.7"/>
      </g>
      <g transform="translate(64,78) rotate(${-legSwing})">
        <rect x="-7" y="-2" width="14" height="16" rx="2" fill="url(#rb-metal)"/>
        <rect x="-9" y="11" width="18" height="7" rx="3" fill="#3b4652"/>
        <path d="M-8,14 L8,14" stroke="#7d8b98" stroke-width="0.8" opacity="0.7"/>
      </g>
      <rect x="30" y="42" width="44" height="40" rx="8" fill="url(#rb-metal)"/>
      <path d="M34,46 C39,44 44,44 48,44 C55,44 62,44 68,47 L68,52 C61,49 55,49 48,49 C41,49 37,50 34,52 Z" fill="#ffffff" opacity="0.45"/>
      <rect x="37" y="54" width="30" height="17" rx="3" fill="#25303b"/>
      <circle cx="46" cy="62.5" r="4.6" fill="#e34b4b"/>
      <circle cx="46" cy="62.5" r="2.4" fill="#ffb3a0"/>
      <path d="M54,58 L63,58 M54,61 L61,61 M54,64 L63,64" stroke="#7fa0b5" stroke-width="1" opacity="0.7"/>
      <rect x="41" y="36" width="28" height="10" rx="3" fill="#4b5866"/>
      <rect x="34" y="20" width="42" height="24" rx="7" fill="url(#rb-metal)"/>
      <rect x="38" y="25" width="34" height="14" rx="4" fill="#1e2731"/>
      <circle cx="46" cy="32" r="4.2" fill="#ff6a4d"/>
      <circle cx="58" cy="32" r="4.2" fill="#ff6a4d"/>
      <circle cx="46" cy="32" r="1.8" fill="#ffe2c4"/>
      <circle cx="58" cy="32" r="1.8" fill="#ffe2c4"/>
      <path d="M46,29 L58,29" stroke="#7c2d24" stroke-width="0.7" opacity="0.6"/>
      <path d="M55,18 L55,11" stroke="#68768a" stroke-width="2.2"/>
      <circle cx="55" cy="8.5" r="3.4" fill="#e5b34a"/>
      <circle cx="55" cy="8.5" r="1.5" fill="#fff3bf"/>
      <circle cx="35" cy="27" r="1.1" fill="#9caab7"/>
      <circle cx="76" cy="27" r="1.1" fill="#9caab7"/>
      <rect x="22" y="48" width="10" height="24" rx="5" fill="url(#rb-metal)" transform="rotate(12 27 60)"/>
      <rect x="72" y="48" width="10" height="24" rx="5" fill="url(#rb-metal)" transform="rotate(-12 77 60)"/>
      <path d="M25,71 C20,75 20,80 25,82 L31,82 L31,77 L28,77 C25,76 26,73 28,72 Z" fill="#75828d"/>
      <path d="M81,71 C86,75 86,80 81,82 L75,82 L75,77 L78,77 C81,76 80,73 78,72 Z" fill="#75828d"/>
      <path d="M32,46 C31,55 31,65 33,74 M68,46 C69,55 69,65 67,74" stroke="#3c4752" stroke-width="0.8" opacity="0.7" fill="none"/>
      <circle cx="34" cy="46" r="1.3" fill="#aebac5"/>
      <circle cx="70" cy="46" r="1.3" fill="#aebac5"/>
      <path d="M62,74 L74,74 L72,80 L64,80 Z" fill="#c5d0d8" opacity="0.7"/>
    </g>`;
  const defs = `
    ${linearGradient('rb-metal', [[0, '#c3d0da'], [0.25, '#96a6b4'], [0.6, '#687785'], [1, '#44505c']], 0.15, 0, 0.85, 1)}
    ${filterBlur('rb-soft', 0.4)}
  `;
  return frame(`robot-${i}`, 104, 104, body, defs);
}

/* ------------------------------------------------------------------ */
/* Wind-up soldier                                                     */
/* ------------------------------------------------------------------ */

function soldier(i) {
  const phase = (i / 4) * Math.PI * 2;
  const swing = Math.sin(phase) * 18;
  const bob = -Math.abs(Math.sin(phase)) * 1.2;
  const body = `
    <g transform="translate(0,${round(bob)})">
      ${snowDust(48, 100, 81 + i, '#f0e6d8')}
      <g transform="translate(41,78) rotate(${swing})">
        <rect x="-6" y="0" width="12" height="17" rx="2" fill="#2f3c58"/>
        <path d="M-7,15 L7,15 L9,25 L-9,25 Z" fill="#1b1d28"/>
        <path d="M-9,22 L9,22" stroke="#4d5263" stroke-width="0.8"/>
      </g>
      <g transform="translate(57,78) rotate(${-swing})">
        <rect x="-6" y="0" width="12" height="17" rx="2" fill="#2f3c58"/>
        <path d="M-7,15 L7,15 L9,25 L-9,25 Z" fill="#1b1d28"/>
        <path d="M-9,22 L9,22" stroke="#4d5263" stroke-width="0.8"/>
      </g>
      <path d="M35,44 C33,56 33,68 36,80 L60,80 C63,68 63,56 61,44 Z" fill="url(#sd-coat)"/>
      <path d="M48,44 L48,80" stroke="#7e121c" stroke-width="1" opacity="0.6"/>
      <path d="M40,58 C42,69 42,75 41,80 M56,58 C54,69 54,75 55,80" stroke="#f2d7a2" stroke-width="0.7" opacity="0.5" fill="none"/>
      <rect x="33" y="54" width="30" height="6" fill="#22232e"/>
      <rect x="43" y="53" width="10" height="8" rx="1.5" fill="url(#sd-gold)"/>
      <circle cx="48" cy="50" r="2.2" fill="url(#sd-gold)"/>
      <circle cx="48" cy="60" r="2.2" fill="url(#sd-gold)"/>
      <circle cx="48" cy="69" r="2.2" fill="url(#sd-gold)"/>
      <path d="M34,44 C38,40 58,40 62,44 L60,48 L36,48 Z" fill="#d9b05a"/>
      <circle cx="34" cy="45" r="4" fill="#f0cf82"/>
      <circle cx="62" cy="45" r="4" fill="#f0cf82"/>
      <path d="M26,48 C22,52 22,58 26,60 L31,62 L33,56 L29,55 C27,54 28,51 30,50 Z" fill="#b21f2b"/>
      <path d="M70,48 C74,52 74,58 70,60 L65,62 L63,56 L67,55 C69,54 68,51 66,50 Z" fill="#b21f2b"/>
      <circle cx="30" cy="65" r="4.2" fill="#f2e2c8"/>
      <circle cx="66" cy="65" r="4.2" fill="#f2e2c8"/>
      <circle cx="48" cy="33" r="14" fill="url(#sd-skin)"/>
      <path d="M34,33 C34,23 40,17 48,17 C56,17 62,23 62,33 L60,36 L36,36 Z" fill="url(#sd-hat)"/>
      <rect x="34" y="34" width="28" height="5" rx="1.5" fill="#15161e"/>
      <rect x="43" y="31" width="10" height="9" rx="1" fill="url(#sd-gold)"/>
      <path d="M46,34 L50,34 L50,37 L46,37 Z" fill="#4b3513"/>
      <path d="M44,16 L48,8 L52,16 Z" fill="#15161e"/>
      <circle cx="48" cy="7" r="2.2" fill="#d9b05a"/>
      <circle cx="42" cy="44" r="2.8" fill="#ffb3a8" opacity="0.55"/>
      <circle cx="54" cy="44" r="2.8" fill="#ffb3a8" opacity="0.55"/>
      <path d="M41,40 C43,38 46,38 47.5,40 M48.5,40 C50,38 53,38 55,40" stroke="#4c2a1a" stroke-width="1.3" stroke-linecap="round" fill="none"/>
      <circle cx="44" cy="41.5" r="1.5" fill="#2b1a12"/>
      <circle cx="52" cy="41.5" r="1.5" fill="#2b1a12"/>
      <circle cx="43.4" cy="40.9" r="0.45" fill="#ffffff"/>
      <circle cx="51.4" cy="40.9" r="0.45" fill="#ffffff"/>
      <path d="M46,47 C47.5,48.6 50,48.6 51.5,47" stroke="#a63c34" stroke-width="0.9" stroke-linecap="round" fill="none"/>
      <g transform="translate(63,70) rotate(${swing * 0.3})">
        <path d="M0,-4 L8,-8 M0,-1 L9,-1 M0,2 L8,6" stroke="#c3ccd4" stroke-width="1.6" stroke-linecap="round"/>
      </g>
      <g transform="translate(48,78)">
        <circle cx="0" cy="4" r="8" fill="none" stroke="#d9b05a" stroke-width="2.4"/>
        <path d="M0,4 L0,-4 M0,4 L6,8" stroke="#d9b05a" stroke-width="2" stroke-linecap="round"/>
        <circle cx="0" cy="4" r="1.8" fill="#f6dda0"/>
      </g>
    </g>`;
  const defs = `
    ${linearGradient('sd-coat', [[0, '#e1434f'], [0.5, '#b31f2d'], [1, '#7f111c']], 0.2, 0, 0.8, 1)}
    ${linearGradient('sd-hat', [[0, '#39435a'], [1, '#151a26']], 0.2, 0, 0.8, 1)}
    ${linearGradient('sd-gold', [[0, '#ffe7a8'], [0.5, '#d9b05a'], [1, '#9c7628']], 0.2, 0, 0.7, 1)}
    ${radialGradient('sd-skin', [[0, '#fff0dc'], [0.55, '#f0cfb4'], [1, '#cfa183']], 0.4, 0.3, 0.7)}
    ${filterBlur('sd-soft', 0.35)}
  `;
  return frame(`soldier-${i}`, 96, 104, body, defs);
}

/* ------------------------------------------------------------------ */
/* Ice wolf                                                            */
/* ------------------------------------------------------------------ */

function wolf(i) {
  const phase = (i / 4) * Math.PI * 2;
  const legA = Math.sin(phase) * 26;
  const legB = Math.sin(phase + Math.PI) * 26;
  const bob = -Math.abs(Math.sin(phase)) * 1.6;
  const body = `
    <g transform="translate(0,${round(bob)})">
      ${snowDust(64, 90, 101 + i, '#dff4ff')}
      <g transform="translate(32,70) rotate(${legA})">
        <path d="M-5,-2 C-7,10 -7,18 -5,24 L2,24 C4,16 5,8 4,-2 Z" fill="#a5d8ea"/>
        <path d="M-6,22 C-8,25 -7,27 -4,27 L4,27 C6,27 6,24 4,23 Z" fill="#e9faff"/>
      </g>
      <g transform="translate(46,72) rotate(${legB})">
        <path d="M-5,-2 C-7,10 -7,17 -5,22 L2,22 C4,15 5,8 4,-2 Z" fill="#7cbcd2"/>
        <path d="M-6,20 C-8,23 -7,25 -4,25 L4,25 C6,25 6,22 4,21 Z" fill="#d9f4ff"/>
      </g>
      <g transform="translate(78,70) rotate(${legB})">
        <path d="M-5,-2 C-7,10 -7,18 -5,24 L2,24 C4,16 5,8 4,-2 Z" fill="#a5d8ea"/>
        <path d="M-6,22 C-8,25 -7,27 -4,27 L4,27 C6,27 6,24 4,23 Z" fill="#e9faff"/>
      </g>
      <g transform="translate(90,72) rotate(${legA})">
        <path d="M-5,-2 C-7,10 -7,17 -5,22 L2,22 C4,15 5,8 4,-2 Z" fill="#7cbcd2"/>
        <path d="M-6,20 C-8,23 -7,25 -4,25 L4,25 C6,25 6,22 4,21 Z" fill="#d9f4ff"/>
      </g>
      <path d="M22,46 C24,36 34,30 48,30 C60,30 70,24 82,23 C92,22 100,26 102,34 C104,42 100,50 92,53 L78,55 C74,68 62,76 46,74 C32,72 22,62 22,46 Z" fill="url(#wf-body)"/>
      <path d="M24,48 C30,34 44,32 58,34 C70,35 82,30 92,30 C84,38 74,42 62,44 C50,46 38,48 34,58 C28,62 24,56 24,48 Z" fill="#eaffff" opacity="0.45"/>
      <path d="M26,50 C20,52 14,58 10,64 C16,64 20,62 24,58 C26,56 27,53 26,50 Z" fill="#9ed4e6"/>
      <path d="M24,42 C18,41 12,43 8,47 C14,49 20,47 24,44 Z" fill="#c5ebf5"/>
      <path d="M78,54 C84,60 88,68 87,76 C82,72 78,68 75,62 Z" fill="#8ec9dd"/>
      <path d="M102,34 C108,30 114,31 117,35 C113,37 108,38 103,37 Z" fill="#c9eef9"/>
      <path d="M103,30 L111,22 L109,31 Z" fill="#a5d8ea"/>
      <path d="M93,26 L99,18 L99,27 Z" fill="#a5d8ea"/>
      <path d="M80,31 L83,23 L87,30 Z" fill="#b7e2ef"/>
      <path d="M86,49 L96,48 L92,53 L83,54 Z" fill="#2a4558" opacity="0.35"/>
      <path d="M74,62 L80,58 L82,63 Z" fill="#2a4558" opacity="0.3"/>
      <path d="M100,29 C104,30 106,33 104,35 C101,36 98,34 97,32" fill="none" stroke="#5b92a8" stroke-width="0.7" opacity="0.7"/>
      <circle cx="86" cy="38" r="2.2" fill="#e7ffff"/>
      <circle cx="86" cy="38" r="1.3" fill="#5cf0ff"/>
      <circle cx="85.6" cy="37.6" r="0.45" fill="#ffffff"/>
      <path d="M77,44 C84,40 92,40 98,44" stroke="#5b92a8" stroke-width="0.6" opacity="0.6" fill="none"/>
      <path d="M28,54 C36,50 42,50 48,52 M32,62 C38,59 44,59 50,61" stroke="#6ea9bd" stroke-width="0.7" opacity="0.5" fill="none"/>
      <path d="M34,36 C38,32 44,31 48,32 M60,33 C66,30 72,29 78,30" stroke="#ffffff" stroke-width="0.8" opacity="0.7" fill="none"/>
      <g transform="translate(88,58)">
        <path d="M0,0 C5,3 8,8 6,12 C4,8 1,5 -2,3 Z" fill="#a5d8ea"/>
        <path d="M2,3 C4,6 5,8 5,10" stroke="#eaffff" stroke-width="0.5" opacity="0.8"/>
      </g>
    </g>`;
  const defs = `
    ${linearGradient('wf-body', [[0, '#e8fbff'], [0.3, '#bfe9f5'], [0.7, '#82c2d8'], [1, '#4c8ca6']], 0.2, 0, 0.8, 1)}
    ${filterFur('wf-fur', 0.6, 0.9, 13 + i)}
  `;
  return frame(`wolf-${i}`, 128, 96, body, defs);
}

/* ------------------------------------------------------------------ */
/* Snow owl                                                            */
/* ------------------------------------------------------------------ */

function owl(i) {
  const wing = i === 0 ? -24 : 16;
  const bob = i === 0 ? -1 : 1;
  const body = `
    <g transform="translate(0,${bob})">
      <g transform="translate(18,44) rotate(${wing})">
        <path d="M0,0 C-12,-8 -20,-2 -22,8 C-23,18 -16,24 -8,25 C-3,24 0,18 2,10 Z" fill="url(#ow-wing)"/>
        <path d="M-18,4 C-22,10 -22,18 -16,22 M-12,0 C-17,6 -18,14 -13,20" stroke="#8aa9bd" stroke-width="0.7" opacity="0.6" fill="none"/>
      </g>
      <g transform="translate(78,44) rotate(${-wing})">
        <path d="M0,0 C12,-8 20,-2 22,8 C23,18 16,24 8,25 C3,24 0,18 -2,10 Z" fill="url(#ow-wing)"/>
        <path d="M18,4 C22,10 22,18 16,22 M12,0 C17,6 18,14 13,20" stroke="#8aa9bd" stroke-width="0.7" opacity="0.6" fill="none"/>
      </g>
      <path d="M48,12 C30,12 20,26 20,44 C20,66 32,82 48,84 C64,82 76,66 76,44 C76,26 66,12 48,12 Z" fill="url(#ow-body)"/>
      <path d="M48,30 C38,30 32,40 32,52 C32,66 39,76 48,78 C57,76 64,66 64,52 C64,40 58,30 48,30 Z" fill="url(#ow-belly)"/>
      <path d="M33,31 L28,14 L40,24 Z" fill="#d9edf7"/>
      <path d="M63,31 L68,14 L56,24 Z" fill="#d9edf7"/>
      <path d="M34,29 L32,20 L38,25 Z" fill="#a8c6d8"/>
      <path d="M62,29 L64,20 L58,25 Z" fill="#a8c6d8"/>
      <circle cx="40" cy="40" r="9.4" fill="#f8fdff"/>
      <circle cx="56" cy="40" r="9.4" fill="#f8fdff"/>
      <circle cx="40" cy="40" r="6.4" fill="#f3c55c"/>
      <circle cx="56" cy="40" r="6.4" fill="#f3c55c"/>
      <circle cx="40" cy="40" r="3.2" fill="#1a2a36"/>
      <circle cx="56" cy="40" r="3.2" fill="#1a2a36"/>
      <circle cx="38.8" cy="38.6" r="1.1" fill="#ffffff"/>
      <circle cx="54.8" cy="38.6" r="1.1" fill="#ffffff"/>
      <path d="M34,33 C37,30 42,30 45,32 M51,32 C54,30 59,30 62,33" stroke="#93b3c6" stroke-width="0.9" opacity="0.8" fill="none"/>
      <path d="M48,44 L44,49 L48,52 L52,49 Z" fill="#e6a33e"/>
      <path d="M46,49 L50,49" stroke="#b77622" stroke-width="0.7"/>
      <path d="M35,58 C40,61 45,61 48,59 M48,59 C51,61 56,61 61,58" stroke="#c5dce9" stroke-width="0.8" opacity="0.7" fill="none"/>
      <path d="M28,60 C33,64 40,65 48,65 C56,65 63,64 68,60" stroke="#ffffff" stroke-width="0.8" opacity="0.55" fill="none"/>
      <path d="M33,72 C38,76 44,77 48,77 C52,77 58,76 63,72" stroke="#b8d3e2" stroke-width="0.7" opacity="0.6" fill="none"/>
      <path d="M44,84 L43,89 M48,84 L48,90 M52,84 L53,89" stroke="#d9a24a" stroke-width="1" opacity="0.7"/>
    </g>`;
  const defs = `
    ${radialGradient('ow-body', [[0, '#ffffff'], [0.5, '#e3f1f8'], [1, '#b9d3e1']], 0.45, 0.3, 0.8)}
    ${radialGradient('ow-belly', [[0, '#ffffff'], [1, '#dcebf3']], 0.5, 0.35, 0.7)}
    ${linearGradient('ow-wing', [[0, '#e8f3f8'], [0.55, '#c2d9e5'], [1, '#8fb1c4']], 0.2, 0, 0.8, 1)}
    ${filterBlur('ow-soft', 0.3)}
  `;
  return frame(`owl-${i}`, 96, 96, body, defs);
}

/* ------------------------------------------------------------------ */
/* Icicle golem                                                        */
/* ------------------------------------------------------------------ */

function golem(i) {
  const phase = (i / 4) * Math.PI * 2;
  const bob = -Math.abs(Math.sin(phase)) * 1.4;
  const arm = Math.sin(phase) * 8;
  const rand = mulberry32(500 + i);
  const shards = Array.from({ length: 9 }, () => {
    const x = 22 + rand() * 100;
    const y = 18 + rand() * 40;
    return `<path d="M${round(x)},${round(y)} l${round(3 + rand() * 4)},${round(8 + rand() * 12)} l${round(3 + rand() * 4)},${round(-6 - rand() * 8)} Z" fill="#bfeaff" opacity="${round(0.4 + rand() * 0.4)}"/>`;
  }).join('');
  const body = `
    <g transform="translate(0,${round(bob)})">
      ${snowDust(72, 142, 201 + i, '#dff6ff')}
      <g transform="translate(50,118) rotate(${arm})">
        <path d="M-9,-2 C-15,18 -17,34 -14,48 C-11,56 -4,55 -1,47 C1,32 4,16 8,2 Z" fill="url(#gl-ice)"/>
        <path d="M-12,8 L-9,5 L-7,12 L-4,8" stroke="#e8fbff" stroke-width="1" opacity="0.7"/>
      </g>
      <g transform="translate(96,114) rotate(${-arm})">
        <path d="M9,-2 C15,18 17,34 14,48 C11,56 4,55 1,47 C-1,32 -4,16 -8,2 Z" fill="url(#gl-ice)"/>
      </g>
      <path d="M40,44 C28,54 24,72 28,92 C30,110 38,122 50,128 L72,128 C86,120 94,108 96,90 C98,70 92,52 78,42 C66,34 52,34 40,44 Z" fill="url(#gl-ice)"/>
      <path d="M36,48 L26,32 L42,38 Z" fill="#d9f6ff"/>
      <path d="M84,44 L94,26 L76,34 Z" fill="#c7efff"/>
      <path d="M62,22 L70,6 L78,26 Z" fill="#e4faff"/>
      <path d="M44,120 L36,134 L52,128 Z" fill="#bfeaff"/>
      <path d="M78,122 L88,136 L70,130 Z" fill="#bfeaff"/>
      <path d="M42,48 C38,68 40,88 48,103 C52,110 58,114 64,114 C73,112 80,104 83,92 C86,74 82,58 76,48 C66,42 52,42 42,48 Z" fill="#7fd5ef" opacity="0.5"/>
      ${shards}
      <ellipse cx="64" cy="80" rx="12" ry="14" fill="url(#gl-core)" filter="url(#gl-glow)"/>
      <ellipse cx="64" cy="80" rx="6" ry="8" fill="#ffffff" opacity="0.85"/>
      <path d="M46,64 C50,70 52,78 51,86 M82,62 C79,70 78,78 80,86" stroke="#e8fbff" stroke-width="0.8" opacity="0.6" fill="none"/>
      <path d="M40,104 C48,110 56,112 64,112 C72,112 80,110 88,104" stroke="#ffffff" stroke-width="0.8" opacity="0.35" fill="none"/>
      <path d="M55,36 C58,30 70,30 74,36 C68,33 62,33 55,36 Z" fill="#ffffff" opacity="0.65"/>
      <g transform="translate(72,44)">
        <circle cx="0" cy="0" r="2.2" fill="#e7ffff"/>
        <circle cx="0" cy="0" r="1.2" fill="#48e1ff"/>
      </g>
      <path d="M30,124 C46,130 82,130 98,122" stroke="#b9e8f8" stroke-width="1" opacity="0.4" fill="none"/>
    </g>`;
  const defs = `
    ${linearGradient('gl-ice', [[0, '#f2feff'], [0.3, '#c8f0ff'], [0.65, '#7fcfe9'], [1, '#4a9fbe']], 0.2, 0, 0.8, 1)}
    ${radialGradient('gl-core', [[0, '#ffffff'], [0.35, '#a6f6ff'], [1, '#31c4ec', 0]], 0.5, 0.5, 0.5)}
    ${filterGlow('gl-glow', 4)}
    ${filterFur('gl-fur', 0.4, 0.6, 7 + i)}
  `;
  return frame(`golem-${i}`, 144, 144, body, defs);
}

/* ------------------------------------------------------------------ */
/* Krampus boss                                                        */
/* ------------------------------------------------------------------ */

function krampus(i) {
  const rand = mulberry32(900 + i);
  const bob = [0, -2, 1, -1][i];
  const armL = [0, -18, 10, -6][i];
  const armR = [0, 16, -8, 5][i];
  const eyeGlow = i === 3 ? 0.5 : 1;
  const fur = Array.from({ length: 42 }, () => {
    const x = 34 + rand() * 124;
    const y = 44 + rand() * 110;
    return `<path d="M${round(x)},${round(y)} q${round((rand() - 0.5) * 5)},${round(2 + rand() * 4)} ${round((rand() - 0.5) * 4)},${round(4 + rand() * 5)}" stroke="${['#3a1e16', '#24110c', '#4b2a1e', '#5a3626'][Math.floor(rand() * 4)]}" stroke-width="${round(0.5 + rand() * 0.8)}" stroke-linecap="round" opacity="${round(0.5 + rand() * 0.5)}"/>`;
  }).join('');
  const body = `
    <g transform="translate(0,${bob})">
      ${snowDust(96, 184, 301 + i, '#cfe9f7')}
      <path d="M58,132 C50,148 50,166 56,178 L74,178 L78,150 Z" fill="#2a1711"/>
      <path d="M130,132 C138,148 138,166 132,178 L114,178 L110,150 Z" fill="#2a1711"/>
      <path d="M52,170 L78,170 L82,180 L48,180 Z" fill="#1a0d09"/>
      <path d="M114,170 L140,170 L144,180 L110,180 Z" fill="#1a0d09"/>
      <g transform="translate(58,74) rotate(${armL})">
        <path d="M-2,0 C-16,10 -22,30 -20,48 C-18,58 -10,58 -6,50 C-3,34 2,18 8,6 Z" fill="url(#kr-fur)"/>
        <path d="M-18,44 C-22,48 -22,54 -18,56 C-14,58 -10,54 -10,49 C-10,46 -14,43 -18,44 Z" fill="#4a2a1d"/>
        <path d="M-19,49 L-21,45 M-16,47 L-17,42 M-13,47 L-12,42" stroke="#1a0d09" stroke-width="0.9" stroke-linecap="round"/>
        <path d="M-12,14 C-16,24 -18,34 -16,42" stroke="#6d4230" stroke-width="0.8" opacity="0.6" fill="none"/>
      </g>
      <g transform="translate(134,70) rotate(${armR})">
        <path d="M2,0 C16,10 22,30 20,48 C18,58 10,58 6,50 C3,34 -2,18 -8,6 Z" fill="url(#kr-fur)"/>
        <path d="M18,44 C22,48 22,54 18,56 C14,58 10,54 10,49 C10,46 14,43 18,44 Z" fill="#4a2a1d"/>
        <path d="M19,49 L21,45 M16,47 L17,42 M13,47 L12,42" stroke="#1a0d09" stroke-width="0.9" stroke-linecap="round"/>
        <path d="M12,14 C16,24 18,34 16,42" stroke="#6d4230" stroke-width="0.8" opacity="0.6" fill="none"/>
      </g>
      <path d="M56,58 C42,72 36,96 40,120 C43,140 54,154 72,160 L120,160 C138,152 148,138 150,118 C153,94 146,72 132,58 C112,44 76,44 56,58 Z" fill="url(#kr-fur)"/>
      <path d="M140,64 C154,70 164,86 166,102 C160,100 154,96 150,90 C154,80 150,70 140,64 Z" fill="#3a1e16"/>
      <path d="M120,156 C132,148 140,136 142,122 C144,138 136,152 124,160 Z" fill="#5a3626" opacity="0.5"/>
      <path d="M52,142 C66,154 90,160 108,158" stroke="#20100b" stroke-width="1.4" opacity="0.8" fill="none"/>
      <path d="M70,72 C72,90 70,112 66,132 M96,70 C94,92 96,116 98,136 M120,76 C122,98 120,120 116,138" stroke="#1c0e09" stroke-width="2.4" opacity="0.5" fill="none"/>
      ${fur}
      <path d="M52,120 C70,132 88,136 102,134 C114,132 126,126 138,116" stroke="#d9b46a" stroke-width="2.2" opacity="0.7" fill="none"/>
      <path d="M56,118 C58,108 66,104 72,108 C80,112 84,120 82,126 C74,128 64,126 56,118 Z" fill="#70401f"/>
      <path d="M86,124 C94,114 106,114 112,122 C118,130 114,136 108,138 C98,140 90,134 86,124 Z" fill="#70401f"/>
      <path d="M62,122 C66,126 70,128 74,128 M94,126 C98,130 104,132 108,130" stroke="#3c2014" stroke-width="0.8" opacity="0.7" fill="none"/>
      <path d="M58,66 C56,46 66,32 82,30 L110,30 C126,32 136,46 134,66 C132,86 120,98 96,100 C72,98 60,86 58,66 Z" fill="url(#kr-face)"/>
      <path d="M62,60 C60,38 72,24 94,22 C116,24 130,38 128,60 C124,44 112,38 94,38 C76,38 66,44 62,60 Z" fill="#2b1710" opacity="0.7"/>
      <path d="M58,54 C46,50 34,52 28,60 C36,66 48,66 58,62 Z" fill="#3a1e16"/>
      <path d="M30,50 C22,42 16,32 18,22 C26,30 34,38 38,48 Z" fill="#5a3a2b"/>
      <path d="M23,24 C19,16 21,8 26,4 C30,12 30,20 28,27 Z" fill="#d9cdbd"/>
      <path d="M24,12 C22,8 23,5 25,3" stroke="#a99988" stroke-width="0.8" opacity="0.8"/>
      <path d="M130,54 C142,50 154,52 160,60 C152,66 140,66 130,62 Z" fill="#3a1e16"/>
      <path d="M158,50 C166,42 172,32 170,22 C162,30 154,38 150,48 Z" fill="#5a3a2b"/>
      <path d="M165,24 C169,16 167,8 162,4 C158,12 158,20 160,27 Z" fill="#d9cdbd"/>
      <path d="M164,12 C166,8 165,5 163,3" stroke="#a99988" stroke-width="0.8" opacity="0.8"/>
      <path d="M72,60 C76,55 84,55 88,60 C84,64 76,64 72,60 Z" fill="#e8f8ff" opacity="0.9"/>
      <path d="M104,60 C108,55 116,55 120,60 C116,64 108,64 104,60 Z" fill="#e8f8ff" opacity="0.9"/>
      <circle cx="80" cy="60" r="3.4" fill="#d62f2f" opacity="${eyeGlow}"/>
      <circle cx="112" cy="60" r="3.4" fill="#d62f2f" opacity="${eyeGlow}"/>
      <circle cx="80" cy="60" r="1.4" fill="#ffd2a0" opacity="${eyeGlow}"/>
      <circle cx="112" cy="60" r="1.4" fill="#ffd2a0" opacity="${eyeGlow}"/>
      <path d="M70,50 C74,45 82,44 88,48 M104,48 C110,44 118,45 122,50" stroke="#1a0d09" stroke-width="3" stroke-linecap="round" fill="none"/>
      <path d="M82,76 C88,70 100,70 106,76 C102,82 86,82 82,76 Z" fill="#2a1610"/>
      <path d="M84,77 Q94,82 104,77" stroke="#e6e0d4" stroke-width="1.2" fill="none"/>
      <path d="M90,82 C92,92 86,98 82,94 C80,90 84,86 88,84 M98,82 C98,94 104,100 107,96 C109,92 105,87 101,85" fill="#c45a66"/>
      <path d="M96,100 C90,106 86,114 88,120 L96,116 C94,110 98,106 100,102 Z" fill="#3a1e16"/>
      <path d="M96,100 C102,106 106,114 104,120 L96,116 C98,110 94,106 92,102 Z" fill="#3a1e16"/>
      <path d="M40,150 C46,154 54,156 60,156" stroke="#d9b46a" stroke-width="2" opacity="0.6" fill="none"/>
      <circle cx="46" cy="154" r="5" fill="none" stroke="#c5abb1" stroke-width="1.4"/>
      <circle cx="54" cy="159" r="5" fill="none" stroke="#c5abb1" stroke-width="1.4"/>
      <path d="M22,66 C30,68 36,74 38,82 C32,82 26,78 22,72 Z" fill="#7a5238" opacity="0.8"/>
    </g>`;
  const defs = `
    ${linearGradient('kr-fur', [[0, '#6a4230'], [0.35, '#4a2a1d'], [0.75, '#2e170f'], [1, '#190b07']], 0.15, 0, 0.85, 1)}
    ${linearGradient('kr-face', [[0, '#7a4a33'], [0.5, '#5a3223'], [1, '#3a1e16']], 0.2, 0, 0.8, 1)}
    ${filterFur('kr-furtex', 0.7, 1.1, 17 + i)}
    ${filterGlow('kr-glow', 3)}
  `;
  return frame(`krampus-${i}`, 192, 192, body, defs);
}

/* ------------------------------------------------------------------ */
/* Projectiles and cinematic props                                     */
/* ------------------------------------------------------------------ */

function coal() {
  const defs = `
    ${linearGradient('co-grad', [[0, '#5a5a66'], [0.5, '#2c2b33'], [1, '#111014']], 0.2, 0, 0.8, 1)}
  `;
  const body = `
    <path d="M8,6 L20,2 L28,9 L26,20 L16,26 L5,18 L4,10 Z" fill="url(#co-grad)"/>
    <path d="M9,8 L18,5 L23,10 M8,15 L13,12 L18,16" stroke="#9a9aa8" stroke-width="0.8" opacity="0.5" fill="none"/>
    <path d="M14,26 L13,30 M22,22 L26,25" stroke="#ff8c5a" stroke-width="1.2" opacity="0.7" stroke-linecap="round"/>
  `;
  return frame('projectile-coal', 32, 32, body, defs);
}

function spark() {
  const defs = `
    ${radialGradient('sp-grad', [[0, '#fffbe0'], [0.4, '#ffd35a'], [1, '#ff7a2f', 0]], 0.5, 0.5, 0.5)}
    ${filterGlow('sp-glow', 1.8)}
  `;
  const body = `
    <g filter="url(#sp-glow)">
      <circle cx="16" cy="16" r="7" fill="url(#sp-grad)"/>
      <path d="M16,2 L18,12 L28,16 L18,20 L16,30 L14,20 L4,16 L14,12 Z" fill="#ffe58a" opacity="0.75"/>
      <circle cx="16" cy="16" r="3" fill="#ffffff"/>
    </g>
  `;
  return frame('projectile-spark', 32, 32, body, defs);
}

function shard() {
  const defs = `
    ${linearGradient('sh-grad', [[0, '#effdff'], [0.5, '#aee9ff'], [1, '#4aa7c8']], 0.2, 0, 0.8, 1)}
    ${filterGlow('sh-glow', 1.2)}
  `;
  const body = `
    <g filter="url(#sh-glow)">
      <path d="M16,2 L25,12 L20,29 L10,24 L7,12 Z" fill="url(#sh-grad)"/>
      <path d="M16,4 L12,13 L17,26" stroke="#ffffff" stroke-width="0.8" opacity="0.7" fill="none"/>
    </g>
  `;
  return frame('projectile-shard', 32, 32, body, defs);
}

function reindeer(i = 0) {
  const leg = i === 0 ? 10 : -9;
  const defs = `
    ${linearGradient('rd-body', [[0, '#a8734a'], [0.5, '#7d4f2f'], [1, '#4e2d18']], 0.2, 0, 0.8, 1)}
    ${linearGradient('rd-antler', [[0, '#e6cfa8'], [1, '#a7804e']], 0, 0, 0.3, 1)}
    ${filterFur('rd-fur', 0.5, 0.8, 5)}
  `;
  const body = `
    <g>
      <g transform="translate(80,120) rotate(${leg})"><path d="M-5,-2 C-7,18 -7,34 -4,46 L4,46 C6,32 6,16 4,-2 Z" fill="#5a351e"/><path d="M-5,43 L5,43 L6,48 L-6,48 Z" fill="#2a1710"/></g>
      <g transform="translate(104,122) rotate(${-leg})"><path d="M-5,-2 C-7,18 -7,34 -4,46 L4,46 C6,32 6,16 4,-2 Z" fill="#4b2c18"/><path d="M-5,43 L5,43 L6,48 L-6,48 Z" fill="#2a1710"/></g>
      <g transform="translate(154,120) rotate(${-leg * 0.8})"><path d="M-5,-2 C-7,18 -7,34 -4,46 L4,46 C6,32 6,16 4,-2 Z" fill="#5a351e"/><path d="M-5,43 L5,43 L6,48 L-6,48 Z" fill="#2a1710"/></g>
      <g transform="translate(176,122) rotate(${leg * 0.8})"><path d="M-5,-2 C-7,18 -7,34 -4,46 L4,46 C6,32 6,16 4,-2 Z" fill="#4b2c18"/><path d="M-5,43 L5,43 L6,48 L-6,48 Z" fill="#2a1710"/></g>
      <path d="M50,70 C58,54 82,46 110,48 C138,50 158,58 168,74 C174,86 170,102 160,112 C140,126 92,128 66,116 C52,108 44,90 50,70 Z" fill="url(#rd-body)"/>
      <path d="M54,72 C62,58 82,52 108,54 C84,58 68,68 60,84 C56,92 56,100 60,108 C50,98 48,82 54,72 Z" fill="#c08b5a" opacity="0.35"/>
      <path d="M158,70 C172,64 182,52 182,40 C190,46 194,58 190,68 C184,82 170,90 158,88 Z" fill="url(#rd-body)"/>
      <path d="M160,58 C168,56 174,60 176,66 C170,70 162,68 158,64 Z" fill="#8e5b36"/>
      <path d="M180,44 C194,42 204,48 208,58 C202,64 194,66 186,62 C182,56 180,50 180,44 Z" fill="url(#rd-body)"/>
      <path d="M206,56 C214,54 220,58 220,63 C214,67 208,65 204,61 Z" fill="#2a1710"/>
      <path d="M205,58 L214,60" stroke="#5a361f" stroke-width="0.7"/>
      <circle cx="195" cy="48" r="2.6" fill="#2a1710"/><circle cx="194.2" cy="47.2" r="0.8" fill="#ffffff"/>
      <path d="M188,36 C184,30 186,22 192,18 C194,26 192,32 190,38 Z" fill="url(#rd-antler)"/>
      <path d="M188,28 C182,24 180,18 182,12 C186,18 190,22 192,26 Z" fill="url(#rd-antler)"/>
      <path d="M192,20 C196,14 202,12 208,14 C202,18 198,22 196,26 Z" fill="url(#rd-antler)"/>
      <path d="M174,34 C170,28 172,20 178,16 C180,24 178,30 176,36 Z" fill="url(#rd-antler)"/>
      <path d="M174,26 C168,22 166,16 168,10 C172,16 176,20 178,24 Z" fill="url(#rd-antler)"/>
      <path d="M60,70 C68,64 80,62 92,62 C80,66 70,72 64,80 Z" fill="#4e2d18" opacity="0.5"/>
      <path d="M108,52 C118,50 132,50 142,54" stroke="#e0b38a" stroke-width="1" opacity="0.4" fill="none"/>
      <ellipse cx="66" cy="66" rx="10" ry="6" fill="#c08b5a" opacity="0.4"/>
    </g>`;
  return frame(`reindeer-${i}`, 224, 200, body, defs);
}

function sleigh() {
  const defs = `
    ${linearGradient('sl-body', [[0, '#d94141'], [0.4, '#a91f2a'], [1, '#6c0e17']], 0, 0, 0.2, 1)}
    ${linearGradient('sl-gold', [[0, '#ffe9a8'], [0.5, '#e2b455'], [1, '#9a6f23']], 0, 0, 0.2, 1)}
    ${filterShadow('sl-shadow', 3, 3, 0.3)}
  `;
  const body = `
    <g>
      <ellipse cx="150" cy="176" rx="120" ry="9" fill="#000000" opacity="0.18" filter="url(#sl-shadow)"/>
      <path d="M38,142 C54,152 90,158 140,158 C186,158 224,152 244,142 L250,154 C228,164 190,170 140,170 C92,170 52,164 32,154 Z" fill="url(#sl-gold)"/>
      <path d="M40,140 C56,150 92,156 140,156 C188,156 224,150 242,140" stroke="#fff1be" stroke-width="2" opacity="0.6" fill="none"/>
      <path d="M46,138 C52,110 58,80 80,64 C104,48 150,44 184,54 C210,62 228,88 238,116 L246,140 C220,150 190,156 140,156 C92,156 58,150 38,142 Z" fill="url(#sl-body)"/>
      <path d="M54,134 C60,108 66,84 84,70 C104,56 142,52 172,60 C196,66 212,88 222,112 L230,136 C208,144 182,148 140,148 C98,148 70,142 54,134 Z" fill="#8f1621" opacity="0.4"/>
      <path d="M70,80 C92,64 132,60 164,66" stroke="#f06a70" stroke-width="2" opacity="0.45" fill="none"/>
      <path d="M58,134 C78,144 108,150 140,150 C178,150 210,144 232,134" stroke="#e6b45d" stroke-width="2.2" opacity="0.75" fill="none"/>
      <path d="M150,60 C154,86 154,120 150,150" stroke="#f0c16a" stroke-width="1.4" opacity="0.5" fill="none"/>
      <path d="M46,120 C90,130 190,130 240,118" stroke="#f0c16a" stroke-width="1.2" opacity="0.45" fill="none"/>
      <path d="M66,118 C70,100 78,88 92,80 C104,74 122,72 136,74" stroke="#f3cf7d" stroke-width="2" opacity="0.8" fill="none"/>
      <circle cx="96" cy="94" r="5" fill="url(#sl-gold)"/>
      <circle cx="120" cy="84" r="5" fill="url(#sl-gold)"/>
      <circle cx="146" cy="80" r="5" fill="url(#sl-gold)"/>
      <circle cx="174" cy="84" r="5" fill="url(#sl-gold)"/>
      <path d="M92,88 C96,84 102,86 102,92 C102,98 94,100 92,94" stroke="#f7e0a1" stroke-width="1.2" fill="none" opacity="0.7"/>
      <path d="M28,112 C20,112 16,118 18,124 C20,130 30,130 34,124" stroke="url(#sl-gold)" stroke-width="4" stroke-linecap="round" fill="none"/>
      <path d="M226,118 C238,120 246,112 244,102 C242,92 232,88 224,94" stroke="url(#sl-gold)" stroke-width="4" stroke-linecap="round" fill="none"/>
      <path d="M74,148 C88,154 112,158 140,158 C170,158 198,154 214,148" stroke="#f3cf7d" stroke-width="1.2" opacity="0.6" fill="none"/>
      <path d="M72,132 C104,140 176,140 218,132" stroke="#f5d489" stroke-width="0.8" opacity="0.35" fill="none"/>
      <circle cx="150" cy="150" r="4" fill="#f5d489"/>
    </g>`;
  return frame('sleigh', 256, 184, body, defs);
}

const enemies = [
  penguin(0), penguin(1),
  snowball(0), snowball(1), snowball(2), snowball(3),
  gingerbread(0), gingerbread(1), gingerbread(2), gingerbread(3),
  gumdrop(0), gumdrop(1), gumdrop(2),
  robot(0), robot(1), robot(2), robot(3),
  soldier(0), soldier(1), soldier(2), soldier(3),
  wolf(0), wolf(1), wolf(2), wolf(3),
  owl(0), owl(1),
  golem(0), golem(1), golem(2), golem(3),
  krampus(0), krampus(1), krampus(2), krampus(3),
  coal(), spark(), shard(),
  reindeer(0), reindeer(1),
  sleigh(),
];

export function buildEnemies() {
  return enemies;
}

export const ENEMY_TYPES = [
  { key: 'penguin', frames: 2, display: [72, 72] },
  { key: 'snowball', frames: 4, display: [64, 64] },
  { key: 'gingerbread', frames: 4, display: [72, 72] },
  { key: 'gumdrop', frames: 3, display: [76, 64] },
  { key: 'robot', frames: 4, display: [82, 82] },
  { key: 'soldier', frames: 4, display: [72, 78] },
  { key: 'wolf', frames: 4, display: [104, 78] },
  { key: 'owl', frames: 2, display: [76, 76] },
  { key: 'golem', frames: 4, display: [108, 108] },
  { key: 'krampus', frames: 4, display: [192, 192] },
];
