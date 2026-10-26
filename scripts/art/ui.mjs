// UI kit: nine-slice panels/buttons, HUD icons, accessibility-friendly iconography.

import {
  svgDoc, linearGradient, radialGradient, filterGlow, filterBlur, starPath, round, mulberry32,
} from './lib.mjs';

function frame(name, width, height, body, defs = '', scale = 2) {
  return {
    name,
    width,
    height,
    scale,
    svg: svgDoc(Math.round(width * scale), Math.round(height * scale), `0 0 ${width} ${height}`, defs, body),
  };
}

const GOLD = '#e6bd6a';
const GOLD_LIGHT = '#ffe9a8';
const GOLD_DARK = '#9c742c';
const NAVY = '#0c1a2e';
const NAVY_MID = '#162a45';

function roundedPanel(name, w, h, fillTop, fillBottom, border, glow, innerGlow = true) {
  const defs = `
    ${linearGradient('panel-fill', [[0, fillTop], [0.55, fillBottom], [1, '#060e19']], 0, 0, 0.2, 1)}
    ${linearGradient('panel-border', [[0, GOLD_LIGHT], [0.5, border], [1, GOLD_DARK]], 0, 0, 0.3, 1)}
    ${filterGlow('panel-glow', 3)}
  `;
  const body = `
    <g>
      <rect x="3" y="3" width="${w - 6}" height="${h - 6}" rx="18" fill="${glow}" opacity="0.22" filter="url(#panel-glow)"/>
      <rect x="4" y="4" width="${w - 8}" height="${h - 8}" rx="17" fill="url(#panel-fill)" stroke="url(#panel-border)" stroke-width="2.6"/>
      <rect x="9" y="9" width="${w - 18}" height="${h - 18}" rx="13" fill="none" stroke="#ffffff" stroke-opacity="0.08"/>
      ${innerGlow ? `<path d="M12,20 C30,10 70,10 ${w - 12},20 L${w - 12},34 C70,24 30,24 12,34 Z" fill="#ffffff" opacity="0.05"/>` : ''}
      <path d="M14,${h - 16} C30,${h - 10} ${w - 30},${h - 10} ${w - 14},${h - 16}" stroke="${GOLD_DARK}" stroke-width="0.9" opacity="0.4" fill="none"/>
      <g opacity="0.65">
        <path d="M16,24 L16,16 L24,16" stroke="${GOLD}" stroke-width="1.4" fill="none" stroke-linecap="round"/>
        <path d="M${w - 16},24 L${w - 16},16 L${w - 24},16" stroke="${GOLD}" stroke-width="1.4" fill="none" stroke-linecap="round"/>
        <path d="M16,${h - 24} L16,${h - 16} L24,${h - 16}" stroke="${GOLD}" stroke-width="1.4" fill="none" stroke-linecap="round"/>
        <path d="M${w - 16},${h - 24} L${w - 16},${h - 16} L${w - 24},${h - 16}" stroke="${GOLD}" stroke-width="1.4" fill="none" stroke-linecap="round"/>
      </g>
      <circle cx="${w / 2}" cy="${h - 15}" r="2" fill="${border}" opacity="0.55"/>
    </g>`;
  return frame(name, w, h, body, defs);
}

function uiButton(name, hover = false, pressed = false) {
  const w = 120;
  const h = 64;
  const top = pressed ? '#0b1626' : hover ? '#22405f' : '#1a3049';
  const bottom = pressed ? '#07101c' : hover ? '#132a42' : '#0b1929';
  const border = pressed ? '#b08a44' : GOLD;
  const defs = `
    ${linearGradient('btn-fill', [[0, top], [0.55, bottom], [1, '#060e17']], 0, 0, 0.15, 1)}
    ${linearGradient('btn-border', [[0, GOLD_LIGHT], [0.5, border], [1, GOLD_DARK]], 0, 0, 0.2, 1)}
    ${filterGlow('btn-glow', hover ? 4 : 2)}
  `;
  const body = `
    <g>
      ${hover || pressed ? `<rect x="4" y="4" width="${w - 8}" height="${h - 8}" rx="16" fill="${GOLD}" opacity="${pressed ? 0.12 : 0.28}" filter="url(#btn-glow)"/>` : ''}
      <rect x="4" y="4" width="${w - 8}" height="${h - 8}" rx="16" fill="url(#btn-fill)" stroke="url(#btn-border)" stroke-width="2.2"/>
      <rect x="8.5" y="8.5" width="${w - 17}" height="${h - 17}" rx="12" fill="none" stroke="#ffffff" stroke-opacity="${hover ? 0.2 : 0.1}"/>
      <path d="M14,20 C34,12 86,12 ${w - 14},20 L${w - 14},32 C86,24 34,24 14,32 Z" fill="#ffffff" opacity="${pressed ? 0.03 : 0.06}"/>
      <path d="M14,${h - 14} C34,${h - 9} 86,${h - 9} ${w - 14},${h - 14}" stroke="${GOLD_DARK}" stroke-width="0.9" opacity="0.45" fill="none"/>
      ${pressed ? '' : `<g opacity="${hover ? 0.9 : 0.55}"><circle cx="16" cy="${h / 2}" r="2" fill="${GOLD}"/><circle cx="${w - 16}" cy="${h / 2}" r="2" fill="${GOLD}"/></g>`}
    </g>`;
  return frame(name, w, h, body, defs);
}

function heart(kind) {
  const color = kind === 'empty' ? '#4c5f72' : kind === 'bonus' ? '#ffd166' : '#e14a55';
  const dark = kind === 'empty' ? '#2f3e4d' : kind === 'bonus' ? '#b9862a' : '#a32436';
  const light = kind === 'empty' ? '#7f93a5' : kind === 'bonus' ? '#fff3c0' : '#ff9fa6';
  const defs = `
    ${linearGradient('heart-fill', [[0, light], [0.35, color], [1, dark]], 0, 0, 0.3, 1)}
    ${filterGlow('heart-glow', 2)}
  `;
  const body = `
    <g>
      <path d="M22,38 C10,28 2,20 2,12.5 C2,5.5 7.5,1.5 13.5,1.5 C17.5,1.5 20.4,3.6 22,6.4 C23.6,3.6 26.5,1.5 30.5,1.5 C36.5,1.5 42,5.5 42,12.5 C42,20 34,28 22,38 Z" fill="url(#heart-fill)" stroke="${dark}" stroke-width="1.2"/>
      <path d="M8,10 C9,6.5 12,5 15,6" stroke="#ffffff" stroke-width="2" opacity="0.55" fill="none" stroke-linecap="round"/>
      <path d="M22,34 C14,27 8,20 8,14" stroke="#ffffff" stroke-width="0.8" opacity="0.2" fill="none"/>
      ${kind === 'empty' ? `<path d="M12,12 L32,30 M32,12 L12,30" stroke="${light}" stroke-width="1" opacity="0.15"/>` : ''}
    </g>`;
  return frame(`ui-heart-${kind}`, 44, 40, body, defs);
}

function starIcon(filled = true) {
  const defs = `
    ${linearGradient('star-fill', [[0, '#fff7cc'], [0.4, '#ffd166'], [1, '#c9902a']], 0, 0, 0.3, 1)}
    ${filterGlow('star-glow', 2)}
  `;
  const body = `
    <g>
      ${filled ? `<circle cx="20" cy="20" r="18" fill="#ffd166" opacity="0.18" filter="url(#star-glow)"/>` : ''}
      <path d="${starPath(20, 20, 17, 7)}" fill="${filled ? 'url(#star-fill)' : '#344658'}" stroke="${filled ? '#b9862a' : '#6d8194'}" stroke-width="1.2"/>
      ${filled ? `<path d="${starPath(20, 20, 10, 4)}" fill="#fff3c0" opacity="0.45"/>` : ''}
    </g>`;
  return frame(`ui-star-${filled ? 'full' : 'empty'}`, 40, 40, body, defs);
}

function giftIcon() {
  const body = `
    <g>
      <rect x="5" y="13" width="30" height="22" rx="3" fill="url(#ui-gift)" stroke="#8a1b24" stroke-width="1.2"/>
      <rect x="17" y="13" width="6" height="22" fill="#ffd166"/>
      <rect x="5" y="21" width="30" height="5" fill="#ffd166"/>
      <path d="M20,13 C10,3 5,11 13,13 M20,13 C30,3 35,11 27,13" stroke="#ffd166" stroke-width="4" fill="none" stroke-linecap="round"/>
      <path d="M8,16 C14,18 26,16 32,18" stroke="#ffffff" stroke-width="1" opacity="0.3" fill="none"/>
    </g>`;
  const defs = `${linearGradient('ui-gift', [[0, '#ef5a64'], [1, '#a91f2a']], 0, 0, 0.3, 1)}`;
  return frame('ui-gift', 40, 40, body, defs);
}

function spiritIcon() {
  const defs = `
    ${radialGradient('spirit-bg', [[0, '#ffd166', 0.5], [1, '#ffd166', 0]], 0.5, 0.5, 0.5)}
    ${filterGlow('spirit-glow', 2)}
  `;
  const body = `
    <g>
      <circle cx="20" cy="20" r="19" fill="url(#spirit-bg)"/>
      <circle cx="20" cy="20" r="16" fill="none" stroke="#ffd166" stroke-width="1.2" opacity="0.6"/>
      ${[0, 1, 2, 3, 4, 5].map((i) => {
        const a = (i / 6) * Math.PI * 2;
        const x1 = 20 + Math.cos(a) * 4;
        const y1 = 20 + Math.sin(a) * 4;
        const x2 = 20 + Math.cos(a) * 15;
        const y2 = 20 + Math.sin(a) * 15;
        const bx = 20 + Math.cos(a) * 9;
        const by = 20 + Math.sin(a) * 9;
        return `<path d="M${round(x1)},${round(y1)} L${round(x2)},${round(y2)} M${round(bx)},${round(by)} L${round(bx + Math.cos(a + 0.8) * 4.4)},${round(by + Math.sin(a + 0.8) * 4.4)} M${round(bx)},${round(by)} L${round(bx + Math.cos(a - 0.8) * 4.4)},${round(by + Math.sin(a - 0.8) * 4.4)}" stroke="#fff7d6" stroke-width="1.8" stroke-linecap="round"/>`;
      }).join('')}
      <circle cx="20" cy="20" r="3" fill="#ffffff"/>
    </g>`;
  return frame('ui-spirit', 40, 40, body, defs);
}

function icon(name, body, defs = '', w = 44, h = 44) {
  return frame(`ui-${name}`, w, h, `<g>${body}</g>`, defs);
}

function pauseIcon() {
  return icon('pause', `<rect x="12" y="8" width="7" height="28" rx="2.5" fill="url(#pause-grad)"/><rect x="25" y="8" width="7" height="28" rx="2.5" fill="url(#pause-grad)"/><rect x="8" y="4" width="28" height="36" rx="8" fill="none" stroke="#ffd166" stroke-opacity="0.25" stroke-width="1.4"/>`,
    `${linearGradient('pause-grad', [[0, '#ffe9a8'], [1, '#c99a3d']], 0, 0, 0.2, 1)}`);
}

function playIcon() {
  return icon('play', `<path d="M16,8 L36,22 L16,36 Z" fill="url(#play-grad)"/><path d="M18,12 L31,22 L18,32 Z" fill="#ffffff" opacity="0.25"/>`,
    `${linearGradient('play-grad', [[0, '#fff0b8'], [1, '#d2a343']], 0, 0, 0.3, 1)}`);
}

function arrowIcon(dir) {
  const flip = dir === 'left' ? 'scale(-1,1) translate(-44,0)' : '';
  return icon(`arrow-${dir}`, `<g transform="${flip}"><path d="M10,22 L26,8 L26,16 L36,16 L36,28 L26,28 L26,36 Z" fill="url(#arrow-grad)" stroke="#8a6a2a" stroke-width="1"/></g>`,
    `${linearGradient('arrow-grad', [[0, '#ffe9a8'], [1, '#c99b42']], 0, 0, 0.3, 1)}`);
}

function jumpIcon() {
  return icon('jump', `
    <path d="M22,6 L34,18 L27,18 L27,28 L17,28 L17,18 L10,18 Z" fill="url(#jump-grad)"/>
    <path d="M8,34 C16,40 30,40 36,34 L36,38 C28,43 16,43 8,38 Z" fill="#dff3ff" opacity="0.8"/>
    <path d="M13,35 C18,38 27,38 32,35" stroke="#ffffff" stroke-width="1" opacity="0.5" fill="none"/>
  `, `${linearGradient('jump-grad', [[0, '#e8fbff'], [1, '#7fc6de']], 0, 0, 0.3, 1)}`);
}

function runIcon() {
  return icon('run', `
    <path d="M8,12 L20,12 M4,20 L18,20 M8,28 L20,28" stroke="#dff3ff" stroke-width="3" stroke-linecap="round" opacity="0.7"/>
    <path d="M22,10 C28,12 34,18 36,26 C32,22 28,20 23,20 C26,26 26,32 23,36 C22,30 20,25 17,21 Z" fill="url(#run-grad)"/>
  `, `${linearGradient('run-grad', [[0, '#ffe9a8'], [1, '#c99b42']], 0, 0, 0.3, 1)}`);
}

function slideIcon() {
  return icon('slide', `
    <path d="M22,36 L10,24 L17,24 L17,12 L27,12 L27,24 L34,24 Z" fill="url(#slide-grad)"/>
    <path d="M8,8 C16,4 28,4 36,8" stroke="#dff3ff" stroke-width="2" opacity="0.5" fill="none"/>
  `, `${linearGradient('slide-grad', [[0, '#ffe9a8'], [1, '#c99b42']], 0, 0, 0.3, 1)}`);
}

function lockIcon() {
  return icon('lock', `<rect x="10" y="18" width="24" height="20" rx="4" fill="url(#lock-grad)" stroke="#6b5324" stroke-width="1.2"/><path d="M15,18 L15,13 C15,5 29,5 29,13 L29,18" stroke="url(#lock-grad)" stroke-width="4" fill="none"/><circle cx="22" cy="27" r="3" fill="#4b3a15"/><path d="M22,29 L22,33" stroke="#4b3a15" stroke-width="2"/>`,
    `${linearGradient('lock-grad', [[0, '#dbe4ec'], [1, '#8494a3']], 0, 0, 0.2, 1)}`);
}

function closeIcon() {
  return icon('close', `<path d="M12,12 L32,32 M32,12 L12,32" stroke="#ffd6d6" stroke-width="4" stroke-linecap="round"/>`);
}

function checkIcon() {
  return icon('check', `<path d="M9,23 L18,32 L35,12" stroke="#9cf0c4" stroke-width="5" stroke-linecap="round" stroke-linejoin="round" fill="none"/>`);
}

function soundIcon(on) {
  return icon(`sound-${on ? 'on' : 'off'}`, `
    <path d="M6,17 L13,17 L22,9 L22,35 L13,27 L6,27 Z" fill="#dff3ff"/>
    ${on ? `<path d="M27,14 C31,18 31,26 27,30 M31,9 C38,16 38,28 31,35" stroke="#9fe0ff" stroke-width="2.4" fill="none" stroke-linecap="round"/>` : `<path d="M28,16 L38,30 M38,16 L28,30" stroke="#ff9c9c" stroke-width="2.8" stroke-linecap="round"/>`}
  `, '', 44, 44);
}

function musicIcon() {
  return icon('music', `<path d="M18,10 L34,7 L34,28" stroke="#ffe9a8" stroke-width="3.4" fill="none" stroke-linejoin="round"/><ellipse cx="14" cy="30" rx="6" ry="4.6" fill="#ffe9a8"/><ellipse cx="30" cy="27" rx="6" ry="4.6" fill="#ffe9a8"/>`);
}

function vibrateIcon() {
  return icon('vibrate', `<rect x="16" y="8" width="12" height="28" rx="4" fill="none" stroke="#dff3ff" stroke-width="2.4"/><path d="M9,14 C5,18 5,26 9,30 M35,14 C39,18 39,26 35,30" stroke="#9fe0ff" stroke-width="2.2" fill="none" stroke-linecap="round"/><circle cx="22" cy="31" r="1.5" fill="#dff3ff"/>`);
}

function settingsIcon() {
  let teeth = '';
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2;
    teeth += `<rect x="${round(22 + Math.cos(a) * 13 - 3)}" y="${round(22 + Math.sin(a) * 13 - 3)}" width="6" height="6" rx="1" fill="#dff3ff" transform="rotate(${round((a * 180) / Math.PI)} ${round(22 + Math.cos(a) * 13)} ${round(22 + Math.sin(a) * 13)})"/>`;
  }
  return icon('settings', `${teeth}<circle cx="22" cy="22" r="10" fill="#dff3ff"/><circle cx="22" cy="22" r="5" fill="#0c1a2e"/>`);
}

function trophyIcon() {
  return icon('trophy', `<path d="M12,8 L32,8 L30,24 C28,32 16,32 14,24 Z" fill="url(#trophy-grad)" stroke="#8a6a1e" stroke-width="1"/><path d="M12,12 C4,12 4,22 14,22 M32,12 C40,12 40,22 30,22" stroke="#e6bd6a" stroke-width="2.4" fill="none"/><path d="M22,30 L22,38 M14,38 L30,38" stroke="#e6bd6a" stroke-width="3" stroke-linecap="round"/><path d="M16,12 L16,16" stroke="#fff7cc" stroke-width="2" opacity="0.6"/>`,
    `${linearGradient('trophy-grad', [[0, '#ffe9a8'], [1, '#c99b42']], 0, 0, 0.3, 1)}`, 44, 44);
}

function bootIcon() {
  return icon('boot', `<path d="M12,8 L24,8 L24,24 L36,28 C40,30 39,36 34,36 L12,36 C9,36 7,33 8,30 L10,24 Z" fill="url(#boot-grad)" stroke="#5a3520" stroke-width="1"/><path d="M12,28 C18,26 26,28 33,30" stroke="#ffffff" stroke-width="1.2" opacity="0.4" fill="none"/><path d="M15,10 L21,10 L21,24 L15,24 Z" fill="#ffffff" opacity="0.15"/>`,
    `${linearGradient('boot-grad', [[0, '#d08a45'], [1, '#7a4a22']], 0, 0, 0.3, 1)}`);
}

function clockIcon() {
  return icon('clock', `<circle cx="22" cy="22" r="16" fill="#dff3ff" opacity="0.15" stroke="#dff3ff" stroke-width="2.4"/><path d="M22,12 L22,23 L30,28" stroke="#ffe9a8" stroke-width="2.6" stroke-linecap="round" fill="none"/><circle cx="22" cy="22" r="2" fill="#ffe9a8"/>`);
}

function crownIcon() {
  return icon('crown', `<path d="M8,32 L10,14 L18,22 L22,10 L26,22 L34,14 L36,32 Z" fill="url(#crown-grad)" stroke="#8a6a1e" stroke-width="1.2"/><circle cx="22" cy="26" r="2.6" fill="#ff8f9a"/><path d="M10,34 L36,34" stroke="#e6bd6a" stroke-width="3" stroke-linecap="round"/>`,
    `${linearGradient('crown-grad', [[0, '#fff3c0'], [1, '#c99b42']], 0, 0, 0.2, 1)}`);
}

function profileIcon() {
  return icon('profile', `<circle cx="22" cy="16" r="8" fill="#dff3ff"/><path d="M7,38 C8,28 15,24 22,24 C29,24 36,28 37,38 Z" fill="#dff3ff"/>`, '', 44, 44);
}

function snowflakeIcon() {
  let arms = '';
  for (let i = 0; i < 3; i++) {
    const a = (i / 3) * Math.PI;
    arms += `<path d="M4,20 L36,20" stroke="#dff8ff" stroke-width="2.6" stroke-linecap="round" transform="rotate(${round((a * 180) / Math.PI)} 20 20)"/>`;
    arms += `<path d="M12,14 L4,20 L12,26 M28,14 L36,20 L28,26" stroke="#dff8ff" stroke-width="2.2" fill="none" stroke-linecap="round" transform="rotate(${round((a * 180) / Math.PI)} 20 20)"/>`;
  }
  return frame('ui-snowflake', 40, 40, `<g>${arms}<circle cx="20" cy="20" r="3.4" fill="#ffffff"/></g>`);
}

function roundButton(name, hover) {
  const defs = `
    ${radialGradient('rb-fill', [[0, hover ? '#2c4a68' : '#1d344c'], [0.75, '#0c1b2c'], [1, '#08121f']], 0.4, 0.3, 0.8)}
    ${linearGradient('rb-rim', [[0, GOLD_LIGHT], [0.55, GOLD], [1, GOLD_DARK]], 0, 0, 0.3, 1)}
    ${filterGlow('rb-glow', hover ? 4 : 2)}
  `;
  const body = `
    <g>
      <circle cx="48" cy="48" r="45" fill="${hover ? '#e6bd6a' : '#000'}" opacity="${hover ? 0.18 : 0.2}" filter="url(#rb-glow)"/>
      <circle cx="48" cy="48" r="43" fill="url(#rb-fill)" stroke="url(#rb-rim)" stroke-width="2.2"/>
      <circle cx="48" cy="48" r="37" fill="none" stroke="#ffffff" stroke-opacity="0.09" stroke-width="1.2"/>
      <path d="M22,32 C32,20 56,18 72,26" stroke="#ffffff" stroke-width="1.4" stroke-opacity="0.14" fill="none"/>
      <circle cx="48" cy="48" r="41" fill="none" stroke="#000" stroke-opacity="0.25"/>
    </g>`;
  return frame(name, 96, 96, body, defs);
}

function appIcon() {
  const defs = `
    ${linearGradient('bg', [[0, '#0b1b33'], [0.55, '#122e4e'], [1, '#081322']], 0.2, 0, 0.8, 1)}
    ${radialGradient('moon', [[0, '#fff8dc'], [0.7, '#ffe9a8'], [1, '#e6bd6a']], 0.5, 0.5, 0.5)}
    ${radialGradient('face', [[0, '#ffe3cd'], [0.55, '#f2bd9c'], [1, '#d99472']], 0.4, 0.35, 0.7)}
    ${linearGradient('hat', [[0, '#ee4a54'], [0.5, '#c71f2e'], [1, '#7d0a16']], 0.2, 0, 0.8, 1)}
    ${filterBlur('glow', 8)}
    ${filterGlow('star', 4)}
  `;
  let snow = '';
  const rand = mulberry32(42);
  for (let i = 0; i < 26; i++) {
    const x = rand() * 512;
    const y = rand() * 512;
    const r = 1.6 + rand() * 4;
    snow += `<circle cx="${round(x)}" cy="${round(y)}" r="${round(r)}" fill="#e8f6ff" opacity="${round(0.2 + rand() * 0.55)}"/>`;
  }
  const body = `
    <g>
      <rect width="512" height="512" rx="112" fill="url(#bg)"/>
      ${snow}
      <circle cx="388" cy="116" r="54" fill="url(#moon)" opacity="0.22" filter="url(#glow)"/>
      <circle cx="388" cy="116" r="30" fill="url(#moon)" opacity="0.85"/>
      <circle cx="378" cy="108" r="7" fill="#e9d7a4" opacity="0.4"/><circle cx="396" cy="124" r="5" fill="#e9d7a4" opacity="0.35"/>
      <path d="M40,430 L130,360 L200,420 L290,330 L380,420 L470,360 L512,400 L512,512 L0,512 L0,470 Z" fill="#163a5c" opacity="0.7"/>
      <path d="M0,450 C80,420 160,444 240,430 C320,416 400,442 512,424 L512,512 L0,512 Z" fill="#e9f7ff" opacity="0.9"/>
      <g transform="translate(256,268)">
        <path d="M-96,84 C-116,50 -112,6 -92,-26 C-72,-56 -26,-76 8,-72 C56,-68 92,-38 106,2 C120,42 108,80 84,104 Z" fill="#ffffff" opacity="0.96"/>
        <path d="M-80,68 C-92,42 -88,12 -74,-12 C-54,-46 -20,-58 8,-56 C44,-54 72,-32 84,-2 C94,24 88,50 72,70 C52,56 22,48 -4,52 C-32,56 -58,60 -80,68 Z" fill="#eef6fc"/>
        <circle cx="0" cy="-18" r="86" fill="url(#face)"/>
        <path d="M-90,-26 C-86,-64 -62,-94 -24,-106 C8,-116 44,-110 70,-90 C90,-74 100,-50 98,-28 C86,-46 70,-56 50,-60 C24,-66 -10,-62 -34,-50 C-58,-38 -76,-34 -90,-26 Z" fill="url(#hat)"/>
        <path d="M-94,-30 C-52,-46 42,-46 94,-24 C100,-10 92,4 78,10 C44,2 -6,2 -52,10 C-76,14 -96,6 -100,-8 C-102,-18 -100,-26 -94,-30 Z" fill="#ffffff"/>
        <path d="M-88,-22 C-54,-36 40,-36 86,-18" stroke="#d4e2ec" stroke-width="5" opacity="0.5" fill="none"/>
        <ellipse cx="-34" cy="8" rx="24" ry="22" fill="#e8837c" opacity="0.35"/>
        <ellipse cx="34" cy="8" rx="24" ry="22" fill="#e8837c" opacity="0.35"/>
        <path d="M-42,-12 C-38,-18 -30,-18 -26,-12" stroke="#4b2a18" stroke-width="4" fill="none" stroke-linecap="round"/>
        <path d="M26,-12 C30,-18 38,-18 42,-12" stroke="#4b2a18" stroke-width="4" fill="none" stroke-linecap="round"/>
        <ellipse cx="-33" cy="-6" rx="9" ry="7" fill="#ffffff"/><ellipse cx="33" cy="-6" rx="9" ry="7" fill="#ffffff"/>
        <circle cx="-33" cy="-6" r="4" fill="#6b4527"/><circle cx="33" cy="-6" r="4" fill="#6b4527"/>
        <circle cx="-34.5" cy="-7.5" r="1.4" fill="#ffffff"/><circle cx="31.5" cy="-7.5" r="1.4" fill="#ffffff"/>
        <path d="M-8,-22 C-4,-30 6,-30 10,-22 C12,-14 8,-6 0,-4 C-8,-6 -12,-14 -8,-22 Z" fill="#e8a383"/>
        <ellipse cx="-4" cy="-20" rx="4" ry="3" fill="#ffe3cd" opacity="0.8"/>
        <path d="M-20,32 C-10,26 10,26 20,32 C14,42 4,46 0,46 C-6,46 -16,42 -20,32 Z" fill="#ffffff" opacity="0.8"/>
        <path d="M-40,96 C-6,82 34,84 76,96 L82,150 L-86,150 Z" fill="#ffffff"/>
        <path d="M-44,112 C-20,124 22,126 52,114" stroke="#d4e2ec" stroke-width="3" opacity="0.5" fill="none"/>
        <g transform="translate(90,-94)">
          <path d="${starPath(0, 0, 26, 11)}" fill="#ffd166" filter="url(#star)"/>
        </g>
      </g>
      <rect x="10" y="10" width="492" height="492" rx="104" fill="none" stroke="#e6bd6a" stroke-width="5" opacity="0.7"/>
      <rect x="22" y="22" width="468" height="468" rx="94" fill="none" stroke="#ffffff" stroke-width="1.2" opacity="0.18"/>
    </g>`;
  return svgDoc(512, 512, '0 0 512 512', defs, body);
}

export function buildUi() {
  const out = [];
  out.push(roundedPanel('panel', 96, 96, NAVY_MID, '#0a1728', GOLD, GOLD, true));
  out.push(roundedPanel('panel-dark', 96, 96, '#050d18', '#03080f', '#7a6330', '#000000', false));
  out.push(roundedPanel('panel-light', 96, 96, '#f8ead0', '#e2c89e', GOLD_DARK, '#ffffff', false));
  out.push(uiButton('button'));
  out.push(uiButton('button-hover', true));
  out.push(uiButton('button-pressed', false, true));
  out.push(roundButton('round-button', false));
  out.push(roundButton('round-button-hover', true));
  out.push(heart('full'));
  out.push(heart('empty'));
  out.push(heart('bonus'));
  out.push(starIcon(true));
  out.push(starIcon(false));
  out.push(giftIcon());
  out.push(spiritIcon());
  out.push(pauseIcon());
  out.push(playIcon());
  out.push(arrowIcon('left'));
  out.push(arrowIcon('right'));
  out.push(jumpIcon());
  out.push(runIcon());
  out.push(slideIcon());
  out.push(lockIcon());
  out.push(closeIcon());
  out.push(checkIcon());
  out.push(soundIcon(true));
  out.push(soundIcon(false));
  out.push(musicIcon());
  out.push(vibrateIcon());
  out.push(settingsIcon());
  out.push(trophyIcon());
  out.push(bootIcon());
  out.push(clockIcon());
  out.push(crownIcon());
  out.push(profileIcon());
  out.push(snowflakeIcon());
  return out;
}

export { appIcon };
