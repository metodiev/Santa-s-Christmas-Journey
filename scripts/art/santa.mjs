// Santa's character rig. Hand-authored vector parts (coat, fur, face, beard,
// hat) composed into anatomically consistent poses for every animation frame.
// Authored at 128x160 display units and rasterized at 2x (256x320).

import {
  svgDoc, linearGradient, radialGradient, filterFur, filterBlur, velvetPattern,
  mulberry32, round, starPath,
} from './lib.mjs';

const C = {
  coat: '#c71f2e',
  coatDark: '#8a0d1a',
  coatLight: '#ef4350',
  pants: '#a31622',
  belt: '#2b1c17',
  beltDark: '#160e0b',
  gold: '#f4c756',
  goldDark: '#b9862a',
  goldLight: '#ffe9a8',
  fur: '#f7fbfd',
  furShade: '#d4e0ea',
  furDeep: '#b7c8d6',
  skin: '#f2bd9c',
  skinDark: '#d99472',
  skinLight: '#ffe1cb',
  rosy: '#e47f7d',
  boot: '#282126',
  bootLight: '#4b3d42',
  bootSole: '#141114',
  mitten: '#f0e6d4',
  mittenShade: '#cbbca5',
  beard: '#ffffff',
  beardMid: '#eef4fa',
  beardShade: '#d3e0eb',
  beardWarm: '#e2eaf2',
  iris: '#6b4527',
  pupil: '#241309',
  mouth: '#8c4b46',
};

const HIP_Y = 116;
const FEET_Y = 154;

function armPath() {
  return `
    <path d="M-5.4,-1 C-7.2,8 -7.4,19 -5.8,30 L5.8,30 C7.4,19 7.2,8 5.4,-1 Z" fill="url(#coat-grad)" stroke="#6f0913" stroke-width="0.5" stroke-opacity="0.55"/>
    <path d="M-5.4,-1 C-7.2,8 -7.4,19 -5.8,30" stroke="${C.coatDark}" stroke-width="1" opacity="0.55"/>
    <path d="M3.6,1 C4.6,10 4.8,20 3.8,28" stroke="${C.coatLight}" stroke-width="1.1" opacity="0.5"/>
    <path d="M-4.8,20 Q0,22 4.8,20" stroke="${C.coatDark}" stroke-width="0.7" opacity="0.5"/>
  `;
}

function mitten(present) {
  return `
    <path d="M-4.6,30 C-6.5,32 -6.8,35 -5.4,37.4 C-3.8,40.2 -0.7,41.4 2.4,40.4 C5.2,39.5 6.6,36.8 6.2,33.9 C5.9,31.3 3.8,29.6 1.4,29.5 Z" fill="${C.mitten}"/>
    <path d="M-4.6,31.2 C-6.2,33.4 -6.1,36 -4.4,37.7 C-3.2,38.9 -1.4,39.5 0.4,39.2 C-1.8,37.1 -3.4,34.6 -4.6,31.2 Z" fill="${C.mittenShade}" opacity="0.55"/>
    <path d="M-2.6,31.6 C-1.1,34 -0.6,36.5 -1.2,38.9" stroke="${C.mittenShade}" stroke-width="0.55" opacity="0.8"/>
    <path d="M1.1,30.2 C2.6,33 3.4,35.6 3.2,38.3" stroke="#fffaf0" stroke-width="0.5" opacity="0.8"/>
    <path d="M-5.4,30.5 Q0,33.4 5.4,30.3" stroke="${C.furShade}" stroke-width="0.6" opacity="0.9"/>
    ${present ? `
    <g transform="translate(1.4,8.5) rotate(-8)">
      <rect x="-7" y="-6" width="14" height="12" rx="1.4" fill="#c92f39"/>
      <rect x="-7" y="-1.2" width="14" height="2.6" fill="${C.gold}"/>
      <rect x="-1.3" y="-6" width="2.6" height="12" fill="${C.gold}"/>
      <path d="M-1.2,-6 C-5.5,-9.5 -7.4,-5.5 -2.2,-4.7 M1.2,-6 C5.6,-9.5 7.3,-5.3 2.2,-4.7" stroke="${C.goldLight}" stroke-width="1.2" fill="none" stroke-linecap="round"/>
      <path d="M-5.6,-5.8 H-0.2 M0.2,-5.8 H5.6" stroke="#8e1a22" stroke-width="0.5" opacity="0.5"/>
      <path d="M-6.4,-2 L-6.4,5.2" stroke="#f0848c" stroke-width="0.7" opacity="0.6"/>
    </g>` : ''}
  `;
}

function arm(px, py, angle, present) {
  return `<g transform="translate(${px},${py}) rotate(${round(angle)})">${armPath()}${mitten(present)}</g>`;
}

function handPos(px, py, angle, dist = 36) {
  const r = (angle * Math.PI) / 180;
  return [px - Math.sin(r) * dist, py + Math.cos(r) * dist];
}

function leg(x, angle, lift, back) {
  const dark = back ? 0.28 : 0;
  return `<g transform="translate(${x},${HIP_Y + lift}) rotate(${round(angle)})">
    <path d="M-5.2,-2 C-6,8 -5.8,17 -5,24 L5,24 C5.8,17 6,8 5.2,-2 Z" fill="${back ? '#8d111d' : C.pants}"/>
    <path d="M${back ? -5 : 2.6},0 C${back ? -5.8 : 3.4},10 ${back ? -5.6 : 3.6},18 ${back ? -4.8 : 3},24" stroke="${back ? '#6f0a14' : '#c9333f'}" stroke-width="1" opacity="0.6"/>
    <ellipse cx="0" cy="24" rx="6.4" ry="3.6" fill="url(#fur-grad)"/>
    <path d="M-6.4,24.1 Q0,27.6 6.4,24" stroke="${C.furShade}" stroke-width="0.6" opacity="0.9"/>
    <path d="M-4.3,26.4 C-5.2,29.5 -4.9,32 -3.4,34 L7.2,34 C9.2,33.4 10.2,32.4 10.7,30.7 C9.6,29.6 8.2,29.2 6.4,29.2 L3.6,29.2 L3.2,26.2 Z" fill="${C.boot}"${dark ? ' opacity="0.92"' : ''}/>
    <path d="M-3.8,27.4 C-4.4,29.6 -4.2,31.2 -3.2,32.4 L5.4,32.4" stroke="${C.bootLight}" stroke-width="0.8" opacity="0.65"/>
    <path d="M-3.6,32.9 L8.6,32.9 C10.4,33.4 10.7,35.3 8.4,35.9 L-3.4,35.9 C-5.2,35.9 -5.1,33.4 -3.6,32.9 Z" fill="${C.bootSole}"/>
    <path d="M6.4,25.9 C7.9,26.3 8.2,27.7 7.2,28.6" stroke="${C.bootLight}" stroke-width="0.7" opacity="0.8"/>
    <circle cx="4.4" cy="27.2" r="0.9" fill="${C.goldDark}" opacity="0.9"/>
    <path d="M-3.4,35.3 L8,35.3" stroke="#5b4d52" stroke-width="0.4" opacity="0.7"/>
  </g>`;
}

function eyes(kind) {
  if (kind === 'closed') {
    return `
      <path d="M51,41.4 Q56,43.2 60.4,41" stroke="#7e4c37" stroke-width="1.1" stroke-linecap="round"/>
      <path d="M67.6,41 Q72,43.2 77,41.4" stroke="#7e4c37" stroke-width="1.1" stroke-linecap="round"/>
      <path d="M50.4,44.3 Q56,46 60.8,44.2" stroke="#d99472" stroke-width="0.45" opacity="0.6"/>
      <path d="M67.2,44.2 Q72,46 77.6,44.3" stroke="#d99472" stroke-width="0.45" opacity="0.6"/>
    `;
  }
  if (kind === 'happy') {
    return `
      <path d="M51,42.4 Q56,38.2 60.6,42.4" stroke="#5f3826" stroke-width="1.35" stroke-linecap="round" fill="none"/>
      <path d="M67.4,42.4 Q72,38.2 77,42.4" stroke="#5f3826" stroke-width="1.35" stroke-linecap="round" fill="none"/>
      <path d="M52,44.6 Q56,46.2 60,44.7" stroke="#d68d6a" stroke-width="0.5" opacity="0.7"/>
      <path d="M68,44.7 Q72,46.2 76,44.6" stroke="#d68d6a" stroke-width="0.5" opacity="0.7"/>
    `;
  }
  const open = `
    <path d="M50.4,41.5 C52.2,38.9 58.2,38.7 61,41.3 C59.4,44 53,44.3 50.4,41.5 Z" fill="#fffdf8"/>
    <path d="M67,41.2 C69.6,38.7 75.4,38.9 77.5,41.4 C75,44.2 68.7,44 67,41.2 Z" fill="#fffdf8"/>
    <path d="M54.4,41.2 C55.1,39.8 57.2,39.6 58.3,40.8 C59.4,42 58.1,43.6 56.4,43.5 C54.8,43.4 53.9,42.3 54.4,41.2 Z" fill="${C.iris}"/>
    <path d="M70.9,40.8 C71.9,39.4 74,39.6 74.7,41 C75.3,42.3 74,43.7 72.4,43.6 C70.8,43.4 69.9,42 70.9,40.8 Z" fill="${C.iris}"/>
    <circle cx="56.9" cy="41.4" r="1.35" fill="${C.pupil}"/>
    <circle cx="72.4" cy="41.2" r="1.35" fill="${C.pupil}"/>
    <circle cx="56.2" cy="40.6" r="0.52" fill="#fff"/>
    <circle cx="71.5" cy="40.4" r="0.52" fill="#fff"/>
    <circle cx="57.9" cy="42.4" r="0.32" fill="#dfb08e" opacity="0.8"/>
    <circle cx="73.4" cy="42.3" r="0.32" fill="#dfb08e" opacity="0.8"/>
    <path d="M50.6,40.8 C52.9,37.9 58.3,37.8 61.1,40.1" stroke="#8e5a42" stroke-width="0.75" stroke-linecap="round" fill="none"/>
    <path d="M67.2,40 C69.9,37.8 74.8,38.1 77.2,40.5" stroke="#8e5a42" stroke-width="0.75" stroke-linecap="round" fill="none"/>
    <path d="M51.4,42.9 C53.4,44.1 57.8,44.2 60.2,42.7" stroke="#cf8c69" stroke-width="0.38" opacity="0.8" fill="none"/>
    <path d="M67.9,42.7 C70.5,44.1 74.6,44 76.7,42.9" stroke="#cf8c69" stroke-width="0.38" opacity="0.8" fill="none"/>
  `;
  return open + `
    <path d="M49.7,39.4 C46.6,39.9 45.4,41.6 45.7,43.2 M48.9,43.9 C46.5,44.9 45.9,46.1 46.2,47.2 M78.2,39.3 C81.2,39.8 82.5,41.5 82.2,43.1 M79.1,43.8 C81.5,44.8 82.1,46 81.8,47.1" stroke="#c98163" stroke-width="0.45" stroke-linecap="round" opacity="0.75"/>
    <path d="M53,45.1 C55.2,46.3 58.2,46.4 60.1,45.5" stroke="#d89a78" stroke-width="0.38" opacity="0.65" fill="none"/>
    <path d="M68.5,45.5 C70.6,46.4 73.4,46.2 75.4,45.1" stroke="#d89a78" stroke-width="0.38" opacity="0.65" fill="none"/>
  `;
}

function brows(raise) {
  const dy = raise || 0;
  return `
    <g transform="translate(0,${dy})">
      <path d="M49.6,36.1 C52.4,33.2 59.4,33.2 62.3,35.2 C59.6,34.8 55.6,35.8 53.5,37.1 C51.9,38.1 50.4,37.7 49.6,36.1 Z" fill="url(#brow-grad)"/>
      <path d="M66,35.2 C69.2,33 75.4,33.4 78.4,36.1 C77.4,37.7 76,38.1 74.4,37.1 C72.2,35.7 68.7,34.9 66,35.2 Z" fill="url(#brow-grad)"/>
      <path d="M50.6,35.1 C54,32.9 59.2,32.9 61.6,34.4" stroke="#ffffff" stroke-width="0.7" stroke-linecap="round" opacity="0.9"/>
      <path d="M67,34.5 C69.9,32.8 74.9,33.1 77.5,35.1" stroke="#ffffff" stroke-width="0.7" stroke-linecap="round" opacity="0.9"/>
      <path d="M51.8,34.2 C54.2,32.8 56.2,33.3 57.4,34.6 M73.3,34.4 C74.9,33.1 76.6,33.3 77.8,34.4" stroke="${C.beardShade}" stroke-width="0.38" opacity="0.85"/>
    </g>
  `;
}

function beard(sway, randSeed) {
  const rand = mulberry32(randSeed);
  const clip = 'beard-clip';
  let strands = '';
  for (let i = 0; i < 56; i++) {
    const t = i / 56;
    const startX = 43 + t * 42 + (rand() - 0.5) * 4;
    const startY = 50 + rand() * 16;
    const endX = 53 + t * 22 + (rand() - 0.5) * 10 + sway * (0.4 + rand() * 0.8);
    const endY = 74 + rand() * 20;
    const midX = (startX + endX) / 2 + (rand() - 0.5) * 9 + sway * 0.4;
    const midY = (startY + endY) / 2 + (rand() - 0.5) * 10;
    const shade = ['#ffffff', '#f6f9fc', '#e7eef5', '#dbe6ef', '#ccdae6'][Math.floor(rand() * 5)];
    const width = round(0.35 + rand() * 0.75);
    strands += `<path d="M${round(startX)},${round(startY)} Q${round(midX)},${round(midY)} ${round(endX)},${round(endY)}" stroke="${shade}" stroke-width="${width}" stroke-linecap="round" opacity="${round(0.45 + rand() * 0.5)}"/>`;
    if (rand() > 0.55) {
      const cx = endX + (rand() - 0.5) * 2;
      const cy = endY - 1;
      strands += `<path d="M${round(cx - 1.6)},${round(cy + 0.2)} Q${round(cx - 1.8)},${round(cy - 1.8)} ${round(cx + 0.2)},${round(cy - 2.1)}" stroke="${shade}" stroke-width="0.55" fill="none" stroke-linecap="round" opacity="0.85"/>`;
    }
  }
  const curls = Array.from({ length: 12 }, () => {
    const x = 46 + rand() * 36;
    const y = 66 + rand() * 28;
    return `<path d="M${round(x)},${round(y)} q${round(1.8 + rand() * 2.2)},${round(-1 - rand() * 1.5)} ${round(2.6 + rand() * 1.8)},${round(0.6 + rand())}" stroke="${['#fff', '#eef5fb', '#dde8f1'][Math.floor(rand() * 3)]}" stroke-width="0.6" fill="none" stroke-linecap="round" opacity="0.85"/>`;
  }).join('');

  return `
    <clipPath id="${clip}">
      <path d="M49,47 C40,55 38,68 43,79 C46,86 52,91 58,94 C60,95 62,96 64,96 C66,96 68,95 70,94 C76,91 82,86 85,79 C90,68 88,55 79,47 C75,51 70,53 64,53 C58,53 53,51 49,47 Z"/>
    </clipPath>
    <path d="M49,47 C40,55 38,68 43,79 C46,86 52,91 58,94 C60,95 62,96 64,96 C66,96 68,95 70,94 C76,91 82,86 85,79 C90,68 88,55 79,47 C75,51 70,53 64,53 C58,53 53,51 49,47 Z" fill="url(#beard-grad)"/>
    <path d="M51,49 C44,57 43,68 46,78 C49,85 54,89 59,92 C61,93 62,94 64,94 C66,94 67,93 69,92 C74,89 79,85 82,78 C85,68 84,57 77,49 C74,52 69,54 64,54 C59,54 54,52 51,49 Z" fill="url(#beard-mid)"/>
    <g clip-path="url(#${clip})">
      <path d="M38,80 C48,87 57,91 64,97 C71,91 80,87 90,80 L90,102 L38,102 Z" fill="${C.beardShade}" opacity="0.4"/>
      <path d="M50,49 C45,58 44,68 47,77 C50,84 54,89 59,92" stroke="#ffffff" stroke-width="2.2" opacity="0.5" stroke-linecap="round"/>
      ${strands}
      ${curls}
      <path d="M42,78 C48,85 54,89 59,92" stroke="#ffffff" stroke-width="1.5" opacity="0.5"/>
      <path d="M85,77 C80,84 74,89 69,92" stroke="#e6eef6" stroke-width="1.3" opacity="0.6"/>
      <ellipse cx="64" cy="90" rx="10" ry="5" fill="#ffffff" opacity="0.32"/>
    </g>
    <path d="M49,47 C40,55 38,68 43,79 C46,86 52,91 58,94 C60,95 62,96 64,96 C66,96 68,95 70,94 C76,91 82,86 85,79 C90,68 88,55 79,47" stroke="${C.beardDeep}" stroke-width="0.5" opacity="0.35" fill="none"/>
    <path d="M49,48 C43,56 41,66 44,75" stroke="#ffffff" stroke-width="1" opacity="0.7" fill="none" stroke-linecap="round"/>
    <path d="M49,48 C53,52 58,54 64,54 C70,54 75,52 79,48" stroke="${C.beardShade}" stroke-width="0.55" opacity="0.6" fill="none"/>
  `;
}

function mustache(sway) {
  const dx = sway * 0.5;
  return `
    <g transform="translate(${round(dx)},0)">
      <path d="M63,54 C58,50.4 50,50.2 46.4,54.2 C44.8,56.1 45.6,59.1 48,59.2 C51.6,59.3 53.6,56.2 57,55.6 C59.4,55.2 61.4,56 63,57.6 Z" fill="url(#stache-grad)"/>
      <path d="M65,54 C70,50.4 78,50.2 81.6,54.2 C83.2,56.1 82.4,59.1 80,59.2 C76.4,59.3 74.4,56.2 71,55.6 C68.6,55.2 66.6,56 65,57.6 Z" fill="url(#stache-grad)"/>
      <path d="M47,55.2 C50.2,52.4 55.4,52.3 58.8,54.5 C55.6,54.4 52.2,55.8 49.8,57.7 C48.1,58.9 46.1,57.4 47,55.2 Z" fill="#ffffff" opacity="0.7"/>
      <path d="M81,55.2 C77.8,52.4 72.6,52.3 69.2,54.5 C72.4,54.4 75.8,55.8 78.2,57.7 C79.9,58.9 81.9,57.4 81,55.2 Z" fill="#ffffff" opacity="0.7"/>
      <path d="M47.4,56.1 C46.2,57.2 46.4,58.6 47.7,58.4 M80.6,56.1 C81.8,57.2 81.6,58.6 80.3,58.4" stroke="${C.beardShade}" stroke-width="0.55" fill="none" stroke-linecap="round"/>
      <path d="M51,54.2 C54.2,52.9 57.4,53.6 59.2,55.1 M77,54.2 C73.8,52.9 70.6,53.6 68.8,55.1" stroke="#dfe9f2" stroke-width="0.4" opacity="0.9" fill="none"/>
      <path d="M52.6,55.4 C55,54.5 57,55.2 58.4,56.2 M75.4,55.4 C73,54.5 71,55.2 69.6,56.2" stroke="#ffffff" stroke-width="0.35" opacity="0.8" fill="none"/>
    </g>
  `;
}

function head(params) {
  const { headTilt, beardSway, eyesKind, browRaise, hatSway, seed } = params;
  const hatRot = hatSway * 0.8;
  return `
  <g transform="translate(64,58) rotate(${round(headTilt)}) translate(-64,-58)">
    <path d="M41.5,44 C41.5,53.5 48,62.5 58,64.5 L70,64.5 C80,62.5 86.5,53.5 86.5,44 C86.5,34.5 79,25.5 64,25.5 C49,25.5 41.5,34.5 41.5,44 Z" fill="url(#face-grad)"/>
    <ellipse cx="41.6" cy="45.5" rx="3.7" ry="6.2" fill="${C.skinDark}"/>
    <ellipse cx="86.4" cy="45.5" rx="3.7" ry="6.2" fill="${C.skinDark}"/>
    <path d="M38.4,45.2 C38.1,42.4 39.5,40.6 41.5,40.5 C43.5,40.4 44.9,42 44.8,44.6" stroke="${C.skinDark}" stroke-width="0.6" opacity="0.8" fill="none"/>
    <path d="M89.6,45.2 C89.9,42.4 88.5,40.6 86.5,40.5 C84.5,40.4 83.1,42 83.2,44.6" stroke="${C.skinDark}" stroke-width="0.6" opacity="0.8" fill="none"/>
    <path d="M44,36 C40,32 37,34 36.6,38 C36.2,42 39,44 42,43" fill="url(#hair-grad)"/>
    <path d="M84,36 C88,31.5 91.4,34 91.6,38 C91.8,42 89,44.4 86,43.2" fill="url(#hair-grad)"/>
    <path d="M44,34.5 C41,34 39,36.2 39.4,38.7 M84,34.5 C87,34 89,36.2 88.6,38.7" stroke="#ffffff" stroke-width="0.5" opacity="0.8" fill="none"/>
    <ellipse cx="50" cy="48.4" rx="8.8" ry="7.2" fill="url(#cheek-grad)"/>
    <ellipse cx="78" cy="48.4" rx="8.8" ry="7.2" fill="url(#cheek-grad)"/>
    <ellipse cx="55.5" cy="47.6" rx="2.2" ry="1.1" fill="#ffffff" opacity="0.28"/>
    <ellipse cx="72.5" cy="47.6" rx="2.2" ry="1.1" fill="#ffffff" opacity="0.28"/>
    <path d="M53,31.2 C56,30.3 59,30.7 61,32 M67,32 C69.2,30.6 72.2,30.3 75,31.3" stroke="#d49472" stroke-width="0.4" opacity="0.65" fill="none"/>
    <path d="M56,27.4 C59,26.6 61.6,26.9 63.4,28 M64.8,28 C67,26.8 69.6,26.6 72.2,27.4" stroke="#dfa382" stroke-width="0.35" opacity="0.45" fill="none"/>
    ${brows(browRaise)}
    ${eyes(eyesKind)}
    <path d="M58,48.6 C58.8,45.4 61.4,43.7 64,43.7 C66.6,43.7 69.2,45.4 70,48.6 C70.7,51.6 68.8,54.6 64,54.6 C59.2,54.6 57.3,51.6 58,48.6 Z" fill="url(#nose-grad)"/>
    <ellipse cx="64" cy="50.8" rx="3.4" ry="2.3" fill="#d98469" opacity="0.5"/>
    <ellipse cx="61.6" cy="47.8" rx="2" ry="1.4" fill="#ffe4d2" opacity="0.8" transform="rotate(-18 61.6 47.8)"/>
    <path d="M59.4,52.8 C60,53.7 61,54.1 62,53.9 M69.6,52.8 C69,53.7 68,54.1 67,53.9" stroke="#a65a44" stroke-width="0.5" fill="none" stroke-linecap="round"/>
    <path d="M55.8,57.4 C58,58.1 60.2,57.8 62,56.6 M72.2,57.4 C70,58.1 67.8,57.8 66,56.6" stroke="#b96c53" stroke-width="0.35" opacity="0.5" fill="none"/>
    ${beard(beardSway, seed)}
    ${mustache(beardSway)}
    <path d="M49,66 C52,63.6 58,62.6 64,62.6 C70,62.6 76,63.6 79,66 C75,70 70,71.4 64,71.4 C58,71.4 53,70 49,66 Z" fill="url(#fur-grad)" filter="url(#fur-soft)"/>
    <path d="M50,67 C56,68.2 61,68.7 64,68.7 C67,68.7 72,68.2 78,67" stroke="${C.furShade}" stroke-width="0.6" opacity="0.75" fill="none"/>
    <g transform="translate(64,26) rotate(${round(hatRot * 0.5)}) translate(-64,-26)">
      <path d="M43,26 C45.6,19.4 51.4,13.4 58.6,10.6 C67.2,7.2 78.4,8.6 88,12.8 C92.6,14.9 96.6,13.2 98.6,9.6 C100.6,15.4 95.4,21.6 88.6,25.2 C80.4,29.6 70,31.6 63.4,31.6 C56,31.6 48.4,29.8 43,26 Z" fill="url(#hat-grad)"/>
      <path d="M45,25.2 C49.6,18.4 57.4,13.6 66,11.8 C74.6,10 82.6,10.6 88.6,13.4" stroke="#f06a70" stroke-width="1.3" opacity="0.55" fill="none" stroke-linecap="round"/>
      <path d="M56,29.2 C64,27.4 73.2,23.6 80.2,18.2 C84,15.2 87,11.8 89,8.4" stroke="${C.coatDark}" stroke-width="1.1" opacity="0.5" fill="none" stroke-linecap="round"/>
      <path d="M46.2,27 C51,24.4 54,20.8 55.4,16.8 M60.4,25.6 C64.4,23 67.6,19.2 69.4,15.2 M74.6,24 C78.4,21.8 81.8,18.5 84,14.8" stroke="${C.coatDark}" stroke-width="0.7" opacity="0.35" fill="none" stroke-linecap="round"/>
      <path d="M62.6,11 C68.6,8.8 75.4,8.6 81.4,10.4" stroke="#ff9aa2" stroke-width="0.7" opacity="0.65" fill="none" stroke-linecap="round"/>
      <circle cx="99.4" cy="8.6" r="5.5" fill="url(#fur-grad)" filter="url(#fur-soft)"/>
      <circle cx="97.6" cy="6.6" r="2.1" fill="#ffffff" opacity="0.6"/>
      <path d="M95.4,10.4 C96.4,12.2 98.6,12.8 100.4,12" stroke="${C.furShade}" stroke-width="0.5" opacity="0.8" fill="none"/>
      <path d="M42.6,23.2 C45.8,20.4 53,19.4 64,19.4 C75,19.4 84,20.4 86,23.6 C86.8,25.8 86,27.4 84.6,28.2 C78,30.4 70,31 64,31 C58,31 50,30.4 44,28.4 C42.4,27.4 42,25.6 42.6,23.6 Z" fill="url(#fur-grad)" filter="url(#fur-soft)"/>
      <path d="M44.2,24.6 C50,23 57,23.4 63,24 C70,24.6 78,24 84,22.6" stroke="${C.furShade}" stroke-width="0.65" opacity="0.7" fill="none"/>
      <path d="M45.8,27.2 C53,29.2 60,29.8 64.2,29.8 C70,29.8 76.4,28.8 82.6,26.8" stroke="${C.furDeep}" stroke-width="0.5" opacity="0.55" fill="none"/>
      <path d="M46.2,23.6 C49,22.2 53,21.7 56,22.1 M72,22.1 C75.4,21.5 79.4,22.1 82.2,23.6" stroke="#ffffff" stroke-width="0.7" opacity="0.8" fill="none" stroke-linecap="round"/>
    </g>
  </g>`;
}

function santaBody(params) {
  const {
    bob = 0, lean = 0, scaleX = 1, scaleY = 1, legF = 0, legB = 0, liftF = 0, liftB = 0,
    armF = 0, armB = 0, headTilt = 0, beardSway = 0, hatSway = 0, eyesKind = 'open',
    browRaise = 0, present = false, presentAngle = null, seed = 42, showArms = true,
  } = params;

  // Arm positions are resolved so the present sits in the front mitten.
  const frontArmHand = handPos(89, 73, armF - 14, 37);
  const presentSvg = present
    ? `<g transform="translate(${round(frontArmHand[0])},${round(frontArmHand[1])}) rotate(${round(presentAngle ?? -armF * 0.25)})">
        <rect x="-6.6" y="-5.8" width="13.2" height="11.6" rx="1.4" fill="#c92f39"/>
        <rect x="-6.6" y="-1.2" width="13.2" height="2.5" fill="${C.gold}"/>
        <rect x="-1.2" y="-5.8" width="2.4" height="11.6" fill="${C.gold}"/>
        <path d="M-1.1,-5.8 C-5.4,-9 -7,-5.2 -2,-4.6 M1.1,-5.8 C5.4,-9 7,-5.2 2,-4.6" stroke="${C.goldLight}" stroke-width="1.1" fill="none" stroke-linecap="round"/>
        <path d="M-5.6,-1.4 L-5.6,5.2" stroke="#f08a92" stroke-width="0.6" opacity="0.7"/>
        <path d="M-6.4,-5.6 L-5.8,5.6" stroke="#7e1119" stroke-width="0.4" opacity="0.5"/>
      </g>`
    : '';

  const suit = `
    <g transform="translate(64,${FEET_Y}) scale(${round(scaleX)},${round(scaleY)}) translate(-64,-${FEET_Y})">
      <g transform="translate(64,${FEET_Y}) rotate(${round(lean)}) translate(-64,-${FEET_Y})">
        <g transform="translate(0,${round(bob)})">
          ${arm(39, 73, armB + 14, false)}
          ${leg(71, legF, liftF, false)}
          ${leg(56, legB, liftB, true)}
          <g>
            <path d="M44,70 C34,80 28,94 30,108 C31,116 33,121 36,125 L92,125 C95,121 97,116 98,108 C100,94 94,80 84,70 C77,65 51,65 44,70 Z" fill="url(#coat-grad)"/>
            <path d="M44,70 C34,80 28,94 30,108 C31,116 33,121 36,125 L92,125 C95,121 97,116 98,108 C100,94 94,80 84,70 C77,65 51,65 44,70 Z" fill="url(#velvet)"/>
            <path d="M36,72 C30,86 29,100 32,112 C33,118 34,121 36,124 L45,124 C42,112 41,96 45,80 Z" fill="${C.coatDark}" opacity="0.32"/>
            <path d="M84,72 C92,82 96,94 95,107 C94,115 93,120 90,124 L82,124 C86,110 86,94 80,79 Z" fill="${C.coatDark}" opacity="0.22"/>
            <path d="M44,72 C50,68 57,66 63,66 C60,78 59,94 61,110" stroke="#f2636c" stroke-width="1.2" opacity="0.35" fill="none"/>
            <path d="M35,95 C50,101 78,101 94,94" stroke="${C.coatDark}" stroke-width="0.8" opacity="0.4" fill="none"/>
            <path d="M34,110 C44,115 52,116 58,115 M74,115 C82,115 90,112 95,109" stroke="${C.coatDark}" stroke-width="0.7" opacity="0.35" fill="none"/>
            <path d="M58,69 C61,66 67,66 70,69 L71,124 L57,124 Z" fill="url(#fur-grad)" opacity="0.98"/>
            <path d="M57.6,70 C60,67.4 62,66.4 64,66.4 C66,66.4 68,67.4 70.4,70" stroke="${C.furShade}" stroke-width="0.6" opacity="0.8" fill="none"/>
            <path d="M58.8,72 C59,88 58.8,106 58.4,122 M69.2,72 C69,88 69.2,106 69.6,122" stroke="${C.furShade}" stroke-width="0.45" opacity="0.55" fill="none"/>
            <path d="M60,82 C61.2,83.4 62.6,83.4 63.8,82 M60,98 C61.2,99.4 62.6,99.4 63.8,98 M60.2,112 C61.4,113.4 62.8,113.4 64,112" stroke="#d9e4ed" stroke-width="0.55" opacity="0.8" fill="none" stroke-linecap="round"/>
            <path d="M33,114 C40,117 48,118 56,118 C62,118 67,117 72,116 C80,114 88,112 95,109 L95,120 C90,124 84,126 78,127 L49,127 C43,126 38,124 34,121 Z" fill="url(#fur-grad)"/>
            <path d="M34,119 C42,123 55,124 64,123 C74,123 86,121 95,116" stroke="${C.furShade}" stroke-width="0.7" opacity="0.7" fill="none"/>
            <path d="M37,126 C43,124 48,128 54,126 C60,124 67,128 73,126 C79,124 86,127 91,125" stroke="${C.furDeep}" stroke-width="0.6" opacity="0.65" fill="none"/>
            <path d="M30,95 C45,101 83,101 98,95 L98,105 C83,111 45,111 30,105 Z" fill="${C.belt}"/>
            <path d="M30,95 C45,100 83,100 98,95" stroke="#5e4436" stroke-width="0.7" opacity="0.85" fill="none"/>
            <path d="M31,103 C46,108 82,108 97,103" stroke="${C.beltDark}" stroke-width="0.9" opacity="0.9" fill="none"/>
            <rect x="55" y="94" width="18" height="13" rx="2.2" fill="url(#gold-grad)" stroke="${C.goldDark}" stroke-width="0.7"/>
            <rect x="58.4" y="97" width="11.2" height="7" rx="1.2" fill="#3a2513"/>
            <path d="M61,99 L67,102.6 M61,100.3 L60.1,100.6 M67,101.2 L67.8,101.5" stroke="${C.goldLight}" stroke-width="1.1" stroke-linecap="round"/>
            <circle cx="48" cy="84" r="1.8" fill="url(#gold-grad)" stroke="${C.goldDark}" stroke-width="0.4"/>
            <circle cx="46" cy="106" r="1.8" fill="url(#gold-grad)" stroke="${C.goldDark}" stroke-width="0.4"/>
            <path d="M48,84 C47,85.6 47.4,86.6 49,86.8 M46,106 C45,107.6 45.4,108.6 47,108.8" stroke="${C.goldLight}" stroke-width="0.5" fill="none" opacity="0.9"/>
            <path d="M45,67 C52,63 76,63 83,67 C88,70 90,74 91,78 C83,75 74,74 64,74 C54,74 45,75 37,78 C38,73 40,69 45,67 Z" fill="url(#fur-grad)" filter="url(#fur-soft)"/>
            <path d="M66,72 C69,80 69,90 68,100 M68,106 C68,112 67,118 66,123" stroke="${C.furShade}" stroke-width="0.5" opacity="0.55" fill="none"/>
            <path d="M74,69 C76,73 77,77 76,81 M54,69 C52,73 51,77 52,81" stroke="#ffffff" stroke-width="0.6" opacity="0.8" fill="none" stroke-linecap="round"/>
            <path d="M42,62 C49,58 79,58 86,62 C88,64 88,67 86,69 C78,66 50,66 42,69 C40,67 40,64 42,62 Z" fill="url(#fur-grad)" filter="url(#fur-soft)"/>
          </g>
          ${showArms ? arm(89, 73, armF - 14, false) : ''}
          ${presentSvg}
          ${head({ headTilt, beardSway, eyesKind, browRaise, hatSway, seed })}
        </g>
      </g>
    </g>`;

  return suit;
}

export function santaSvg(params) {
  const seed = params.seed ?? 41;
  const defs = `
    ${linearGradient('coat-grad', [[0, '#e63a45'], [0.35, C.coat], [0.8, '#a51522'], [1, '#7d0a16']], 0.2, 0, 0.8, 1)}
    ${linearGradient('hat-grad', [[0, '#ee4a54'], [0.45, '#cf2130'], [0.82, '#97101e'], [1, '#740913']], 0.1, 0, 0.9, 1)}
    ${linearGradient('fur-grad', [[0, '#ffffff'], [0.45, '#f8fbfd'], [0.78, '#e6eef5'], [1, '#c8d6e2']], 0, 0, 0.4, 1)}
    ${linearGradient('beard-grad', [[0, '#ffffff'], [0.5, '#f4f8fc'], [1, '#dce7f0']], 0.2, 0, 0.8, 1)}
    ${linearGradient('beard-mid', [[0, '#ffffff'], [0.6, '#fafcfe'], [1, '#e9f0f6']], 0.2, 0, 0.8, 1)}
    ${linearGradient('brow-grad', [[0, '#ffffff'], [0.6, '#f0f5fa'], [1, '#d7e3ee']], 0, 0, 0.4, 1)}
    ${linearGradient('stache-grad', [[0, '#ffffff'], [0.55, '#f4f8fc'], [1, '#dde8f1']], 0, 0, 0.3, 1)}
    ${linearGradient('hair-grad', [[0, '#ffffff'], [1, '#dfe9f2']], 0, 0, 0, 1)}
    ${linearGradient('gold-grad', [[0, C.goldLight], [0.4, C.gold], [0.8, '#d9a334'], [1, C.goldDark]], 0, 0, 0.3, 1)}
    ${radialGradient('face-grad', [[0, C.skinLight], [0.5, C.skin], [1, C.skinDark]], 0.42, 0.35, 0.72)}
    ${radialGradient('nose-grad', [[0, '#ffe0cd'], [0.45, '#f2ae8e'], [1, '#cf7f60']], 0.35, 0.3, 0.75)}
    ${radialGradient('cheek-grad', [[0, '#e98380', 0.55], [0.65, C.rosy, 0.32], [1, C.rosy, 0]], 0.5, 0.5, 0.5)}
    ${filterFur('fur-soft', 0.55, 1.15, seed % 17 + 3)}
    ${filterBlur('soft-shadow', 1.2)}
    ${velvetPattern('velvet')}
  `;
  return svgDoc(256, 320, '0 0 128 160', defs, santaBody({ ...params, seed }));
}

const IDLE = [0, 1, 2, 3].map((i) => ({
  name: `santa-idle-${i}`,
  bob: -[0, 0.45, 0.8, 0.45][i],
  scaleY: [1, 1.006, 1.012, 1.006][i],
  beardSway: [0, 0.5, 0.9, 0.5][i],
  hatSway: [0, 1.2, 2, 1.2][i],
  armF: [1, 1.8, 2.4, 1.8][i],
  armB: [0.5, 1.2, 1.8, 1.2][i],
  seed: 41,
}));

const WALK = Array.from({ length: 8 }, (_, i) => {
  const phase = (i / 8) * Math.PI * 2;
  const s = Math.sin(phase);
  return {
    name: `santa-walk-${i}`,
    bob: -Math.abs(Math.sin(phase)) * 1.15,
    legF: 15 * s,
    legB: -15 * s,
    liftF: Math.max(0, s) * 1.7,
    liftB: Math.max(0, -s) * 1.7,
    armF: 11 * s,
    armB: -11 * s,
    headTilt: 1.2 * s,
    beardSway: 1.1 * s,
    hatSway: 2 * s,
    seed: 41 + i * 7,
  };
});

const RUN = Array.from({ length: 8 }, (_, i) => {
  const phase = (i / 8) * Math.PI * 2;
  const s = Math.sin(phase);
  return {
    name: `santa-run-${i}`,
    bob: -Math.abs(Math.sin(phase)) * 2,
    lean: 6.5,
    legF: 30 * s,
    legB: -30 * s,
    liftF: Math.max(0, s) * 3.2,
    liftB: Math.max(0, -s) * 3.2,
    armF: 26 * s,
    armB: -26 * s,
    headTilt: 1.8 * s,
    beardSway: -3 + 1.4 * s,
    hatSway: -4 + 2 * s,
    scaleY: 1.015,
    seed: 51 + i * 11,
  };
});

export const SANTA_FRAMES = [
  ...IDLE,
  ...WALK,
  ...RUN,
  {
    name: 'santa-jump', lean: -2, legF: -26, legB: 20, liftF: 3, liftB: 0,
    armF: -120, armB: -105, beardSway: -2.5, hatSway: -6, headTilt: -2, scaleY: 1.035, scaleX: 0.985, seed: 71,
  },
  {
    name: 'santa-fall', lean: 3, legF: 13, legB: -16, liftF: 1, liftB: 2,
    armF: -72, armB: -60, beardSway: 1.8, hatSway: -3, headTilt: 1, scaleY: 0.99, seed: 83,
  },
  {
    name: 'santa-slide', lean: -17, legF: -62, legB: -38, liftF: 0, liftB: 2,
    armF: 42, armB: 24, beardSway: 3, hatSway: 7, headTilt: 5,
    scaleY: 0.74, scaleX: 1.09, bob: 14, seed: 97,
  },
  {
    name: 'santa-hurt', lean: -11, legF: 12, legB: -8, armF: -148, armB: -132,
    beardSway: 3.5, hatSway: 8, headTilt: -7, eyesKind: 'closed', browRaise: 0.8, seed: 113,
  },
  {
    name: 'santa-victory', lean: 0, legF: -5, legB: 5, armF: -158, armB: -148,
    beardSway: -0.5, hatSway: -1, headTilt: -3, eyesKind: 'happy', browRaise: -0.4, bob: -1, seed: 127,
  },
  {
    name: 'santa-throw-0', lean: 1, legF: 6, legB: -5, armF: 48, armB: 20,
    beardSway: 1, hatSway: 2, headTilt: 1, present: true, presentAngle: 10, seed: 139,
  },
  {
    name: 'santa-throw-1', lean: -2, legF: -4, legB: 4, armF: -112, armB: -92,
    beardSway: -1.5, hatSway: -3, headTilt: -2, present: true, presentAngle: 12, seed: 149,
  },
  {
    name: 'santa-throw-2', lean: 2, legF: 5, legB: -3, armF: -74, armB: -55,
    beardSway: 0.8, hatSway: 1.5, headTilt: 1, seed: 157,
  },
  {
    name: 'santa-sleigh', lean: -4, legF: -68, legB: -58, liftF: 0, liftB: 0,
    armF: -82, armB: -78, beardSway: -2, hatSway: -5, headTilt: -3, bob: 3,
    scaleY: 0.93, seed: 163,
  },
];

export function buildSanta() {
  return SANTA_FRAMES.map((frame) => ({
    ...frame,
    width: 128,
    height: 160,
    scale: 2,
    svg: santaSvg(frame),
  }));
}
