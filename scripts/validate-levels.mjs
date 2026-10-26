// Structural validation for the generated level JSON.
import { readFile, readdir } from 'node:fs/promises';
import path from 'node:path';

const dir = path.resolve(import.meta.dirname, '../src/levels');
const levels = [];
for (const file of (await readdir(dir)).filter((f) => f.endsWith('.json')).sort()) {
  levels.push(JSON.parse(await readFile(path.join(dir, file), 'utf8')));
}

let errors = 0;
let warnings = 0;
const err = (level, msg) => { console.error(`ERROR ${level.id}: ${msg}`); errors++; };
const warn = (level, msg) => { console.warn(`WARN  ${level.id}: ${msg}`); warnings++; };

function groundAt(level, x) {
  let best = null;
  for (const p of level.platforms) {
    if (x >= p.x && x <= p.x + p.w && !p.oneWay) {
      if (!best || p.y < best.y) best = p;
    }
  }
  return best;
}

for (const level of levels) {
  const children = level.houses.filter((h) => h.hasChild).length;
  if (level.index < 0 || level.index > 4) err(level, 'invalid index');
  if (children < 5 || children > 10) err(level, `${children} waiting houses (expected 5-10)`);
  if (level.presents.length < children + 2) err(level, `only ${level.presents.length} presents for ${children} deliveries`);
  if (level.goal.x >= level.width - 100) err(level, 'goal too close to level edge');
  if (!groundAt(level, level.goal.x)) err(level, 'goal is not over ground');
  if (!groundAt(level, level.spawn.x)) err(level, 'spawn is not over ground');
  if (level.spawn.y <= 0 || level.spawn.y >= level.height) err(level, 'spawn y out of bounds');
  if (level.areas.length !== 3) err(level, `expected 3 areas, got ${level.areas.length}`);
  if (level.secrets.length !== 3) err(level, `expected 3 secrets, got ${level.secrets.length}`);
  if (level.checkpoints.length < 2) err(level, 'missing checkpoints');

  for (const h of level.houses) {
    const supported = level.platforms.some(
      (p) => !p.oneWay && p.y === h.y && p.x <= h.x - 120 && p.x + p.w >= h.x + 120,
    );
    if (!supported) err(level, `house at ${h.x} overhangs its ground platform`);
    const step = level.platforms.some(
      (p) => p.oneWay && Math.abs(p.y - (h.y - 104)) < 2 && p.x + p.w > h.x - 280 && p.x < h.x - 120,
    );
    if (!step) warn(level, `house at ${h.x} has no easy roof step`);
    if (!level.presents.some((p) => Math.abs(p.x - h.x) < 200 && p.y < h.y - 180)) {
      warn(level, `house at ${h.x} has no roof presents`);
    }
  }

  for (const c of level.checkpoints) {
    if (!groundAt(level, c.x)) err(level, `checkpoint at ${c.x} is not over ground`);
  }
  for (const s of level.secrets) {
    const chamber = level.platforms.some((p) => p.oneWay && Math.abs(p.y - (s.y + 150)) < 60 && p.x <= s.x && p.x + p.w >= s.x + s.w);
    if (!chamber) err(level, `secret ${s.id} has no chamber platform`);
    const spring = level.hazards.some((h) => h.kind === 'spring' && h.x > s.x - 100 && h.x < s.x + s.w + 40);
    if (!spring) err(level, `secret ${s.id} has no spring access`);
    const presents = level.presents.filter((p) => p.secret === s.id).length;
    if (presents === 0) warn(level, `secret ${s.id} has no tagged presents`);
  }
  for (const [i, h] of level.hazards.entries()) {
    if (h.x < 0 || h.x > level.width) err(level, `hazard ${i} x out of bounds`);
    if (['steam', 'spikes', 'sticky', 'ice', 'spring', 'geyser'].includes(h.kind) && h.y !== level.groundY) {
      warn(level, `hazard ${i} (${h.kind}) y=${h.y} is not on ground ${level.groundY}`);
    }
  }
  for (const [i, e] of level.enemies.entries()) {
    if (e.x < 0 || e.x > level.width) err(level, `enemy ${i} x out of bounds`);
    if (e.patrol[0] >= e.patrol[1]) err(level, `enemy ${i} invalid patrol bounds`);
  }

  // Gaps not spanned by any platform / moving / timed / crumbling platform.
  const gaps = [];
  const solids = level.platforms.filter((p) => !p.oneWay && p.y === level.groundY).sort((a, b) => a.x - b.x);
  let cursor = 0;
  for (const p of solids) {
    if (p.x > cursor) gaps.push([cursor, p.x]);
    cursor = Math.max(cursor, p.x + p.w);
  }
  if (cursor < level.width) gaps.push([cursor, level.width]);
  for (const [a, b] of gaps) {
    const width = b - a;
    if (width < 30) continue;
    const hasHelpers =
      level.movingPlatforms.some((p) => p.x + p.w > a && p.x < b) ||
      level.timedPlatforms.some((p) => p.x + p.w > a && p.x < b) ||
      level.crumblingPlatforms.some((p) => p.x + p.w > a && p.x < b) ||
      level.platforms.some((p) => p.oneWay && p.x + p.w > a && p.x < b);
    if (width > 300 && !hasHelpers) err(level, `unspanned gap ${Math.round(width)}px at ${Math.round(a)}`);
    else if (width > 240) warn(level, `wide gap ${Math.round(width)}px at ${Math.round(a)}`);
  }

  if (level.boss) {
    if (!level.boss.gateX || !level.boss.x) err(level, 'boss arena incomplete');
    if (level.boss.gateX <= level.boss.x) err(level, 'boss gate is before boss');
    if (level.goal.x < level.boss.gateX) err(level, 'goal is before the boss gate');
    if (!groundAt(level, level.boss.gateX)) err(level, 'boss gate is not over ground');
  }
  if (level.index === 4 && !level.boss) err(level, 'final level has no boss');

  const timings = level.enemies.map((e) => e.kind);
  console.log(`${level.id}: ${level.width}px, ${children} gifts, ${level.presents.length} presents, ` +
    `${level.houses.length} houses, ${level.enemies.length} enemies [${[...new Set(timings)].join(', ')}], ` +
    `${gaps.length} gaps, ${level.decorations.length} props`);
}

if (warnings) console.warn(`\n${warnings} warning(s)`);
if (errors) {
  console.error(`\n${errors} error(s)`);
  process.exit(1);
}
console.log('\nAll levels structurally valid.');
