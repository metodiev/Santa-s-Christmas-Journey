// Level authoring tool. Emits editable JSON level data for the five towns.
// Run: npm run levels

import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';

const ROOT = path.resolve(import.meta.dirname, '..');
const OUT = path.join(ROOT, 'src/levels');
const GY = 760;

class Builder {
  constructor(cfg) {
    Object.assign(this, {
      height: 1000,
      groundY: GY,
      timeLimit: 360,
      parTime: 220,
      spawn: { x: 240, y: GY - 130 },
      platforms: [],
      movingPlatforms: [],
      timedPlatforms: [],
      crumblingPlatforms: [],
      houses: [],
      enemies: [],
      presents: [],
      checkpoints: [],
      hazards: [],
      secrets: [],
      decorations: [],
      areas: [],
      tips: [],
      boss: undefined,
      goal: { x: cfg.width - 500, y: GY },
      ...cfg,
    });
    this.x = 120;
  }

  area(name) {
    this.areas.push({ index: this.areas.length + 1, name, startX: this.x });
    return this;
  }

  g(len, opts = {}) {
    const y = opts.y ?? GY;
    this.platforms.push({
      x: this.x,
      y,
      w: len,
      h: this.height - y,
      material: opts.material ?? 'base',
      ...(opts.conveyor ? { conveyor: opts.conveyor } : {}),
    });
    this.x += len;
    return this;
  }

  gap(len, opts = {}) {
    const start = this.x;
    for (const l of opts.ledges ?? []) {
      this.platforms.push({
        x: start + l.x,
        y: GY + (l.y ?? -120),
        w: l.w ?? 100,
        h: 26,
        material: l.material ?? 'base',
        oneWay: true,
      });
    }
    for (const m of opts.moving ?? []) {
      this.movingPlatforms.push({
        x: start + m.x,
        y: GY + (m.y ?? -130),
        w: m.w ?? 130,
        h: 24,
        axis: m.axis ?? 'x',
        range: m.range ?? 160,
        speed: m.speed ?? 70,
        phase: m.phase ?? 0,
        material: 'base',
      });
    }
    for (const c of opts.crumbles ?? []) {
      this.crumblingPlatforms.push({
        x: start + c.x,
        y: GY + (c.y ?? -90),
        w: c.w ?? 100,
        h: 26,
        material: 'alt',
        respawn: c.respawn ?? 3.5,
        delay: c.delay ?? 0.45,
      });
    }
    for (const t of opts.timed ?? []) {
      this.timedPlatforms.push({
        x: start + t.x,
        y: GY + (t.y ?? -100),
        w: t.w ?? 120,
        h: 26,
        material: 'alt',
        period: t.period ?? 3.2,
        phase: t.phase ?? 0,
        onRatio: t.onRatio ?? 0.62,
      });
    }
    this.x += len;
    return this;
  }

  house(cx, variant, child = true, y = GY, opts = {}) {
    this.houses.push({ x: cx, y, variant, hasChild: child });
    this.platforms.push({ x: cx - 250, y: y - 104, w: 90, h: 22, material: 'base', oneWay: true });
    this.platforms.push({ x: cx + 170, y: y - 70, w: 84, h: 20, material: 'base', oneWay: true });
    this.presents.push({ x: cx - 55, y: y - 262 });
    this.presents.push({ x: cx + 70, y: y - 270 });
    this.hazards.push({ kind: 'icicle', x: cx - 150, y: y - 228 });
    this.decorations.push({ key: 'prop-lamp', x: cx - 285, y });
    if (opts.tree !== false) {
      this.decorations.push({ key: `tree-pine-${opts.town ?? 'pine'}-${variant % 2}`, x: cx + 300, y, scale: 0.9 });
    }
    return this;
  }

  present(x, y, secret) {
    this.presents.push(secret ? { x, y, secret } : { x, y });
    return this;
  }

  presLine(x, y, n, dx = 44) {
    for (let i = 0; i < n; i++) this.present(x + i * dx, y);
    return this;
  }

  presArc(x, y, n, dx = 46, amp = 26) {
    for (let i = 0; i < n; i++) {
      const t = n === 1 ? 0.5 : i / (n - 1);
      this.present(x + i * dx, y - Math.sin(t * Math.PI) * amp);
    }
    return this;
  }

  enemy(kind, x, patrol, speed, flying = false) {
    this.enemies.push({ kind, x, y: flying ? GY - 230 : GY, patrol, speed, ...(flying ? { flying: true } : {}) });
    return this;
  }

  hazard(h) {
    this.hazards.push(h);
    return this;
  }

  deco(key, x, y, scale = 1, flip = false) {
    this.decorations.push({ key, x, y, scale, ...(flip ? { flip: true } : {}) });
    return this;
  }

  checkpoint(x, area) {
    this.checkpoints.push({ x, y: GY, area });
    return this;
  }

  tip(x, key, y = GY - 150) {
    this.tips.push({ x, y, key });
    return this;
  }

  secret(id, name, x, baseY = GY) {
    const floorY = baseY - 410;
    this.platforms.push({ x, y: floorY, w: 380, h: 26, material: 'base', oneWay: true });
    this.platforms.push({ x: x + 300, y: floorY + 110, w: 80, h: 22, material: 'base', oneWay: true });
    this.deco('prop-secret-arch', x + 190, floorY, 1);
    this.present(x + 80, floorY - 46, id);
    this.present(x + 150, floorY - 46, id);
    this.present(x + 220, floorY - 46, id);
    this.present(x + 190, floorY - 120, id);
    this.deco('prop-star', x + 190, floorY - 132, 1);
    this.hazard({ kind: 'spring', x: x + 50, y: baseY });
    this.secrets.push({ id, name, x: x + 20, y: floorY - 150, w: 340, h: 170 });
    return this;
  }

  goalAt(x) {
    this.goal = { x, y: GY };
    return this;
  }
}

function jitter(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/* ================================================================== */
/* 1. Snowy Pine Village                                               */
/* ================================================================== */
function buildPine() {
  const L = new Builder({
    id: 'snowy-pine-village',
    town: 'pine',
    index: 0,
    name: 'Snowy Pine Village',
    subtitle: 'A quiet village wakes beneath the first snow.',
    width: 9900,
    timeLimit: 360,
    parTime: 210,
    music: 'jingle',
  });
  L.area('Pine Hollow');
  L.g(720);
  L.spawn = { x: 240, y: GY - 130 };
  L.presArc(330, GY - 120, 4);
  L.tip(400, 'tips.move');
  L.tip(500, 'tips.jump');
  L.tip(590, 'tips.gift', GY - 195);
  L.deco('prop-sign', 440, GY);
  L.deco('tree-pine-pine-1', 620, GY);
  L.checkpoint(700, 1);

  let s = L.x;
  L.g(1080);
  L.house(s + 320, 0);
  L.house(s + 790, 1);
  L.presLine(s + 80, GY - 120, 3);
  L.presArc(s + 950, GY - 150, 3);
  L.enemy('penguin', s + 600, [s + 480, s + 760]);
  L.enemy('penguin', s + 980, [s + 850, s + 1050]);
  L.deco('prop-snowman', s + 520, GY);
  L.deco('tree-pine-pine-0', s + 1050, GY, 0.8);

  L.gap(170, { ledges: [{ x: 45, y: -120, w: 100 }] });
  L.present(L.x - 130, GY - 200);

  s = L.x;
  L.g(640);
  L.enemy('snowball', s + 220, [s + 60, s + 560], 90);
  L.presArc(s + 300, GY - 120, 4);
  L.deco('prop-snowman', s + 520, GY);
  L.deco('tree-pine-pine-0', s + 60, GY);

  L.gap(210, { ledges: [{ x: 35, y: -105, w: 110 }, { x: 150, y: -195, w: 100 }] });
  L.present(L.x - 170, GY - 270);

  L.g(420);
  s = L.x;
  L.g(380, { material: 'alt' });
  L.hazard({ kind: 'ice', x: s, y: GY - 20, w: 380, h: 50 });
  L.enemy('penguin', s + 200, [s + 60, s + 330]);
  L.deco('tree-pine-pine-1', s - 30, GY);
  L.deco('prop-snowman', s + 360, GY, 0.9);

  s = L.x;
  L.g(560);
  L.presArc(s + 120, GY - 130, 4);
  L.secret('pine-ice-cave', 'Icicle Hollow', s + 240);
  L.deco('tree-pine-pine-0', s + 520, GY, 0.9);
  L.enemy('penguin', s + 420, [s + 330, s + 540]);
  L.checkpoint(L.x - 80, 1);

  L.area('Frostbite Ridge');
  s = L.x;
  L.g(900);
  L.house(s + 300, 2);
  L.house(s + 770, 0);
  L.presArc(s + 100, GY - 150, 3);
  L.enemy('snowball', s + 590, [s + 500, s + 860], 100);
  L.deco('tree-pine-pine-1', s + 80, GY, 0.9);

  L.gap(180, { ledges: [{ x: 40, y: -110, w: 100 }] });
  L.present(L.x - 140, GY - 190);

  s = L.x;
  L.g(820);
  L.hazard({ kind: 'spikes', x: s + 280, y: GY, w: 90 });
  L.hazard({ kind: 'icicle', x: s + 480, y: GY - 235 });
  L.hazard({ kind: 'icicle', x: s + 560, y: GY - 235 });
  L.enemy('penguin', s + 680, [s + 560, s + 800]);
  L.presArc(s + 350, GY - 130, 5);
  L.deco('prop-snowman', s + 100, GY);
  L.deco('tree-pine-pine-0', s + 760, GY, 0.9);

  L.gap(220, { ledges: [{ x: 35, y: -120, w: 110 }, { x: 150, y: -210, w: 100 }] });
  L.presLine(L.x - 160, GY - 280, 2, 44);

  s = L.x;
  L.g(600);
  L.secret('pine-ridge-cache', 'Ridge Cache', s + 100);
  L.enemy('snowball', s + 420, [s + 300, s + 560], 110);
  L.checkpoint(L.x - 80, 2);

  L.area('Village Edge');
  s = L.x;
  L.g(980);
  L.house(s + 320, 1);
  L.house(s + 800, 2);
  L.presLine(s + 80, GY - 120, 4);
  L.enemy('penguin', s + 580, [s + 500, s + 740]);
  L.hazard({ kind: 'icicle', x: s + 220, y: GY - 235 });
  L.deco('prop-snowman', s + 260, GY);
  L.deco('tree-pine-pine-1', s + 950, GY, 0.9);

  L.gap(160, { ledges: [{ x: 45, y: -110, w: 100 }] });

  s = L.x;
  L.g(760);
  L.enemy('snowball', s + 280, [s + 130, s + 640], 100);
  L.hazard({ kind: 'spikes', x: s + 500, y: GY, w: 80 });
  L.presArc(s + 180, GY - 150, 4);
  L.deco('tree-pine-pine-0', s + 700, GY);

  L.gap(200, { ledges: [{ x: 30, y: -130, w: 100 }, { x: 140, y: -220, w: 100 }] });
  L.present(L.x - 165, GY - 300);

  s = L.x;
  L.g(600);
  L.secret('pine-final-gift', 'Secret Grotto', s + 160);
  L.deco('prop-snowman', s + 520, GY);
  L.presLine(s + 30, GY - 120, 2);

  s = L.x;
  L.g(1300);
  L.goalAt(s + 900);
  L.deco('goal-tree', s + 900, GY);
  L.deco('tree-pine-pine-1', s + 300, GY, 1);
  L.deco('prop-snowman', s + 620, GY);
  L.presLine(s + 220, GY - 140, 3);
  L.x += 200;
  L.width = L.x;
  return L;
}

/* ================================================================== */
/* 2. Gingerbread Town                                                 */
/* ================================================================== */
function buildGinger() {
  const L = new Builder({
    id: 'gingerbread-town',
    town: 'ginger',
    index: 1,
    name: 'Gingerbread Town',
    subtitle: 'Mind the gumdrops. They are stickier than they look.',
    width: 10200,
    timeLimit: 390,
    parTime: 230,
    music: 'tannenbaum',
  });
  L.area('Sugarplum Lane');
  L.g(720);
  L.spawn = { x: 240, y: GY - 130 };
  L.presArc(330, GY - 120, 4);
  L.tip(400, 'tips.gift');
  L.tip(500, 'tips.sticky');
  L.deco('prop-sign', 450, GY);
  L.deco('prop-candy-cane', 660, GY);
  L.checkpoint(700, 1);

  let s = L.x;
  L.g(1080);
  L.house(s + 320, 0, true, GY, { town: 'ginger' });
  L.house(s + 790, 1, true, GY, { town: 'ginger' });
  L.presLine(s + 60, GY - 120, 3);
  L.enemy('gingerbread', s + 580, [s + 470, s + 760]);
  L.enemy('gumdrop', s + 950, [s + 850, s + 1050]);
  L.hazard({ kind: 'sticky', x: s + 930, y: GY, w: 120 });
  L.deco('prop-candy-cane', s + 520, GY);

  L.gap(210, {
    crumbles: [
      { x: 40, y: -100, w: 100 },
      { x: 170, y: -150, w: 100 },
    ],
  });
  L.present(L.x - 185, GY - 230);

  s = L.x;
  L.g(720);
  L.enemy('gingerbread', s + 240, [s + 120, s + 460]);
  L.enemy('gumdrop', s + 560, [s + 460, s + 680]);
  L.hazard({ kind: 'sticky', x: s + 340, y: GY, w: 130 });
  L.hazard({ kind: 'sticky', x: s + 600, y: GY, w: 100 });
  L.presArc(s + 180, GY - 140, 4);
  L.deco('prop-candy-cane', s + 80, GY);

  L.gap(240, {
    crumbles: [
      { x: 30, y: -110, w: 100 },
      { x: 160, y: -160, w: 100 },
    ],
  });
  L.present(L.x - 170, GY - 250);

  s = L.x;
  L.g(620);
  L.house(s + 300, 2, true, GY, { town: 'ginger' });
  L.hazard({ kind: 'spikes', x: s + 500, y: GY, w: 60 });
  L.enemy('gumdrop', s + 420, [s + 320, s + 580]);
  L.secret('ginger-sugar-cellar', 'Sugar Cellar', s + 40);
  L.checkpoint(L.x - 70, 1);

  L.area('Gumdrop Grove');
  s = L.x;
  L.g(1560);
  L.house(s + 320, 0, true, GY, { town: 'ginger' });
  L.house(s + 790, 1, true, GY, { town: 'ginger' });
  L.house(s + 1240, 2, true, GY, { town: 'ginger' });
  L.enemy('gingerbread', s + 600, [s + 520, s + 720]);
  L.enemy('gumdrop', s + 1100, [s + 1000, s + 1200]);
  L.hazard({ kind: 'sticky', x: s + 720, y: GY, w: 120 });
  L.presLine(s + 120, GY - 150, 3);
  L.hazard({ kind: 'icicle', x: s + 900, y: GY - 230 });
  L.deco('prop-candy-cane', s + 520, GY);
  L.deco('prop-lamp', s + 1000, GY);

  L.gap(260, {
    crumbles: [
      { x: 30, y: -100, w: 100 },
      { x: 170, y: -170, w: 100 },
    ],
    ledges: [{ x: 110, y: -250, w: 80 }],
  });
  L.present(L.x - 140, GY - 300);

  s = L.x;
  L.g(760);
  L.enemy('gingerbread', s + 300, [s + 150, s + 620]);
  L.hazard({ kind: 'sticky', x: s + 480, y: GY, w: 140 });
  L.presArc(s + 200, GY - 130, 4);
  L.deco('prop-candy-cane', s + 700, GY);

  L.gap(200, {
    crumbles: [
      { x: 40, y: -110, w: 100 },
      { x: 165, y: -150, w: 100 },
    ],
  });

  s = L.x;
  L.g(520);
  L.secret('ginger-peppermint-vault', 'Peppermint Vault', s + 60);
  L.deco('prop-candy-cane', s + 450, GY);
  L.checkpoint(L.x - 70, 2);

  L.area('Peppermint Plaza');
  s = L.x;
  L.g(900);
  L.house(s + 300, 0, true, GY, { town: 'ginger' });
  L.house(s + 770, 2, false, GY, { town: 'ginger' });
  L.enemy('gumdrop', s + 560, [s + 480, s + 720]);
  L.hazard({ kind: 'sticky', x: s + 880, y: GY, w: 100 });
  L.presLine(s + 100, GY - 140, 4);
  L.deco('prop-candy-cane', s + 500, GY);

  L.gap(240, {
    crumbles: [
      { x: 30, y: -100, w: 100 },
      { x: 155, y: -170, w: 100 },
    ],
    ledges: [{ x: 90, y: -250, w: 80 }],
  });
  L.present(L.x - 150, GY - 300);

  s = L.x;
  L.g(720);
  L.enemy('gingerbread', s + 300, [s + 160, s + 560]);
  L.enemy('gingerbread', s + 580, [s + 480, s + 680]);
  L.hazard({ kind: 'sticky', x: s + 430, y: GY, w: 120 });
  L.hazard({ kind: 'spikes', x: s + 120, y: GY, w: 60 });
  L.presArc(s + 220, GY - 160, 4);
  L.deco('prop-candy-cane', s + 680, GY);
  L.deco('prop-lamp', s + 60, GY);

  s = L.x;
  L.g(560);
  L.secret('ginger-final-icing', 'Icing Hideaway', s + 100);
  L.checkpoint(L.x - 80, 3);

  s = L.x;
  L.g(1400);
  L.goalAt(s + 980);
  L.deco('goal-tree', s + 980, GY);
  L.presLine(s + 200, GY - 140, 3);
  L.deco('prop-candy-cane', s + 400, GY);
  L.deco('prop-candy-cane', s + 720, GY);
  L.x += 200;
  L.width = L.x;
  return L;
}

/* ================================================================== */
/* 3. Toy Factory District                                             */
/* ================================================================== */
function buildFactory() {
  const L = new Builder({
    id: 'toy-factory-district',
    town: 'factory',
    index: 2,
    name: 'Toy Factory District',
    subtitle: 'The night shift is running. So are the toys.',
    width: 10600,
    timeLimit: 390,
    parTime: 240,
    music: 'workshop',
  });
  L.area('Assembly Floor');
  L.g(720);
  L.spawn = { x: 240, y: GY - 130 };
  L.presArc(330, GY - 120, 4);
  L.tip(410, 'tips.conveyor');
  L.tip(510, 'tips.spring');
  L.deco('prop-sign', 450, GY);
  L.checkpoint(690, 1);

  let s = L.x;
  L.g(1060);
  L.house(s + 320, 0, true, GY, { town: 'factory' });
  L.house(s + 800, 1, true, GY, { town: 'factory' });
  L.enemy('robot', s + 600, [s + 470, s + 760]);
  L.enemy('soldier', s + 980, [s + 860, s + 1050]);
  L.presLine(s + 80, GY - 130, 3);
  L.deco('prop-lamp', s + 1050, GY);

  L.gap(250, {
    moving: [
      { x: 20, y: -120, w: 130, axis: 'x', range: 90, speed: 60, phase: 0 },
      { x: 140, y: -160, w: 120, axis: 'x', range: 80, speed: 55, phase: 0.5 },
    ],
  });
  L.present(L.x - 130, GY - 240);

  s = L.x;
  L.g(380);
  L.g(420, { conveyor: { dir: 1, speed: 95 } });
  L.presArc(s + 140, GY - 130, 3);
  L.hazard({ kind: 'steam', x: s + 380, y: GY, interval: 2.6, phase: 0.4 });
  L.hazard({ kind: 'steam', x: s + 600, y: GY, interval: 3.1, phase: 1.2 });
  L.enemy('soldier', s + 640, [s + 480, s + 780]);

  L.gap(220, {
    moving: [{ x: 40, y: -140, w: 130, axis: 'x', range: 110, speed: 75 }],
  });

  s = L.x;
  L.g(620);
  L.hazard({ kind: 'gear', x: s + 260, y: GY - 95, radius: 52 });
  L.hazard({ kind: 'gear', x: s + 470, y: GY - 95, radius: 52 });
  L.enemy('robot', s + 120, [s + 40, s + 300]);
  L.presArc(s + 160, GY - 160, 3);
  L.secret('factory-vent-den', 'Vent Den', s + 40);

  s = L.x;
  L.g(420);
  L.hazard({ kind: 'train', x: s + 60, y: GY, minX: s + 20, maxX: s + 400, speed: 120 });
  L.present(s + 200, GY - 160);
  L.checkpoint(L.x - 80, 1);

  L.area('Gearworks');
  s = L.x;
  L.g(1040);
  L.house(s + 300, 2, true, GY, { town: 'factory' });
  L.house(s + 760, 0, true, GY, { town: 'factory' });
  L.enemy('soldier', s + 560, [s + 450, s + 720]);
  L.enemy('robot', s + 1040, [s + 900, s + 1180]);
  L.hazard({ kind: 'steam', x: s + 900, y: GY, interval: 2.4, phase: 0.2 });
  L.presLine(s + 90, GY - 140, 3);

  L.gap(300, {
    moving: [
      { x: 20, y: -100, w: 120, axis: 'y', range: 100, speed: 55, phase: 0 },
      { x: 170, y: -180, w: 110, axis: 'x', range: 90, speed: 65 },
    ],
  });
  L.present(L.x - 150, GY - 290);

  s = L.x;
  L.g(420, { conveyor: { dir: -1, speed: 100 } });
  L.g(400, { conveyor: { dir: 1, speed: 120 } });
  L.hazard({ kind: 'gear', x: s + 430, y: GY - 100, radius: 56 });
  L.enemy('robot', s + 300, [s + 180, s + 560]);
  L.presArc(s + 120, GY - 150, 4);

  L.gap(240, {
    ledges: [{ x: 40, y: -120, w: 100 }],
    moving: [{ x: 140, y: -200, w: 110, axis: 'x', range: 80, speed: 50 }],
  });

  s = L.x;
  L.g(560);
  L.house(s + 300, 1, true, GY, { town: 'factory' });
  L.secret('factory-boiler-room', 'Boiler Room', s + 40);
  L.enemy('soldier', s + 480, [s + 400, s + 560]);
  L.checkpoint(L.x - 80, 2);

  L.area('The Big Sled');
  s = L.x;
  L.g(1040);
  L.house(s + 320, 0, true, GY, { town: 'factory' });
  L.house(s + 790, 2, true, GY, { town: 'factory' });
  L.enemy('robot', s + 600, [s + 500, s + 750]);
  L.enemy('soldier', s + 1000, [s + 860, s + 1180]);
  L.hazard({ kind: 'train', x: s + 300, y: GY, minX: s + 200, maxX: s + 700, speed: 130 });
  L.presLine(s + 100, GY - 140, 4);

  L.gap(280, {
    moving: [
      { x: 20, y: -130, w: 120, axis: 'y', range: 110, speed: 60, phase: 0.3 },
      { x: 170, y: -190, w: 120, axis: 'x', range: 100, speed: 70, phase: 0.1 },
    ],
  });
  L.present(L.x - 150, GY - 300);

  s = L.x;
  L.g(760);
  L.hazard({ kind: 'steam', x: s + 180, y: GY, interval: 2.2, phase: 0.7 });
  L.hazard({ kind: 'steam', x: s + 360, y: GY, interval: 2.8, phase: 1.5 });
  L.hazard({ kind: 'gear', x: s + 580, y: GY - 100, radius: 54 });
  L.enemy('soldier', s + 480, [s + 420, s + 650]);
  L.presArc(s + 220, GY - 150, 4);

  s = L.x;
  L.g(560);
  L.secret('factory-night-cache', 'Night-Shift Cache', s + 120);
  L.hazard({ kind: 'spikes', x: s + 480, y: GY, w: 60 });

  s = L.x;
  L.g(1400);
  L.goalAt(s + 980);
  L.deco('goal-tree', s + 980, GY);
  L.presLine(s + 180, GY - 140, 3);
  L.deco('prop-lamp', s + 420, GY);
  L.deco('prop-lamp', s + 720, GY);
  L.x += 200;
  L.width = L.x;
  return L;
}

/* ================================================================== */
/* 4. Frozen Forest                                                    */
/* ================================================================== */
function buildForest() {
  const L = new Builder({
    id: 'frozen-forest',
    town: 'forest',
    index: 3,
    name: 'Frozen Forest',
    subtitle: 'The lake ice sings. The wolves listen.',
    width: 11000,
    timeLimit: 420,
    parTime: 250,
    music: 'silent',
  });
  L.area('Moonlit Pines');
  L.g(720);
  L.spawn = { x: 240, y: GY - 130 };
  L.presArc(330, GY - 120, 4);
  L.tip(400, 'tips.ice');
  L.tip(520, 'tips.boulder');
  L.deco('prop-sign', 450, GY);
  L.checkpoint(700, 1);

  let s = L.x;
  L.g(980);
  L.house(s + 320, 0, true, GY, { town: 'forest' });
  L.house(s + 790, 1, true, GY, { town: 'forest' });
  L.enemy('wolf', s + 600, [s + 470, s + 760], 150);
  L.enemy('owl', s + 980, [s + 850, s + 1080], 80, true);
  L.presLine(s + 80, GY - 140, 3);
  L.deco('tree-pine-forest-1', s + 1020, GY);

  L.gap(230, {
    ledges: [{ x: 30, y: -120, w: 100 }],
    timed: [{ x: 130, y: -200, w: 100, period: 3.4, phase: 0.2 }],
  });
  L.present(L.x - 120, GY - 270);

  s = L.x;
  L.g(420);
  L.g(520, { material: 'alt' });
  L.hazard({ kind: 'ice', x: s, y: GY - 20, w: 520, h: 50 });
  L.hazard({ kind: 'spikes', x: s + 280, y: GY, w: 70 });
  L.enemy('wolf', s + 420, [s + 300, s + 500], 160);
  L.presArc(s + 130, GY - 150, 3);
  L.deco('tree-pine-forest-0', s + 80, GY);

  // Frozen lake with timed platforms
  L.gap(760, {
    timed: [
      { x: 80, y: -110, w: 120, period: 3.6, phase: 0 },
      { x: 300, y: -140, w: 120, period: 3.6, phase: 1.2 },
      { x: 520, y: -110, w: 120, period: 3.6, phase: 2.4 },
    ],
  });
  L.presLine(L.x - 700, GY - 260, 3, 65);

  s = L.x;
  L.g(760);
  L.enemy('owl', s + 220, [s + 120, s + 420], 90, true);
  L.enemy('wolf', s + 560, [s + 460, s + 680], 150);
  L.hazard({ kind: 'boulder', x: s + 380, y: GY, minX: s + 40, maxX: s + 700, speed: 130 });
  L.presArc(s + 160, GY - 150, 4);
  L.deco('tree-pine-forest-1', s + 700, GY);

  L.gap(220, {
    ledges: [{ x: 45, y: -120, w: 100 }],
  });

  s = L.x;
  L.g(620);
  L.house(s + 300, 2, true, GY, { town: 'forest' });
  L.secret('forest-moon-cache', 'Moonlit Cache', s + 40);
  L.hazard({ kind: 'icicle', x: s + 520, y: GY - 235 });
  L.checkpoint(L.x - 80, 1);

  L.area('Wolfpine Thicket');
  s = L.x;
  L.g(920);
  L.house(s + 300, 0, true, GY, { town: 'forest' });
  L.house(s + 770, 1, true, GY, { town: 'forest' });
  L.enemy('wolf', s + 580, [s + 470, s + 800], 160);
  L.enemy('owl', s + 1060, [s + 920, s + 1180], 90, true);
  L.hazard({ kind: 'boulder', x: s + 420, y: GY, minX: s + 120, maxX: s + 860, speed: 140 });
  L.presLine(s + 100, GY - 150, 4);
  L.deco('tree-pine-forest-0', s + 600, GY);

  L.gap(260, {
    ledges: [
      { x: 30, y: -110, w: 100 },
      { x: 140, y: -190, w: 90 },
    ],
    timed: [{ x: 60, y: -270, w: 100, period: 3.2, phase: 0.8 }],
  });
  L.present(L.x - 140, GY - 330);

  s = L.x;
  L.g(440);
  L.g(420, { material: 'alt' });
  L.hazard({ kind: 'ice', x: s, y: GY - 20, w: 420, h: 50 });
  L.hazard({ kind: 'spikes', x: s + 180, y: GY, w: 80 });
  L.enemy('wolf', s + 520, [s + 420, s + 640], 170);
  L.presArc(s + 100, GY - 160, 3);

  L.gap(300, {
    timed: [
      { x: 40, y: -120, w: 110, period: 3, phase: 0.4 },
      { x: 180, y: -170, w: 110, period: 3, phase: 1.6 },
    ],
  });

  s = L.x;
  L.g(700);
  L.enemy('golem', s + 300, [s + 140, s + 520], 55);
  L.enemy('wolf', s + 620, [s + 560, s + 760], 160);
  L.hazard({ kind: 'boulder', x: s + 400, y: GY, minX: s + 20, maxX: s + 680, speed: 120 });
  L.presArc(s + 150, GY - 160, 4);
  L.deco('tree-pine-forest-1', s + 760, GY, 0.9);

  s = L.x;
  L.g(520);
  L.secret('forest-wolf-den', 'Wolf Den', s + 60);
  L.checkpoint(L.x - 70, 2);

  L.area('Frozen Hollow');
  s = L.x;
  L.g(1040);
  L.house(s + 320, 1, true, GY, { town: 'forest' });
  L.house(s + 790, 2, true, GY, { town: 'forest' });
  L.enemy('wolf', s + 600, [s + 500, s + 760], 165);
  L.enemy('owl', s + 1040, [s + 900, s + 1180], 95, true);
  L.hazard({ kind: 'icicle', x: s + 460, y: GY - 235 });
  L.hazard({ kind: 'icicle', x: s + 540, y: GY - 235 });
  L.presLine(s + 90, GY - 140, 4);

  L.gap(780, {
    timed: [
      { x: 70, y: -110, w: 120, period: 3.4, phase: 0 },
      { x: 300, y: -150, w: 120, period: 3.4, phase: 1.1 },
      { x: 540, y: -110, w: 120, period: 3.4, phase: 2.2 },
    ],
  });
  L.presLine(L.x - 760, GY - 280, 3, 60);

  s = L.x;
  L.g(640);
  L.enemy('golem', s + 300, [s + 120, s + 520], 50);
  L.hazard({ kind: 'spikes', x: s + 540, y: GY, w: 70 });
  L.presArc(s + 160, GY - 160, 3);
  L.deco('tree-pine-forest-0', s + 580, GY, 0.9);

  L.gap(240, { ledges: [{ x: 40, y: -130, w: 100 }] });

  s = L.x;
  L.g(560);
  L.secret('forest-final-glow', 'Glowworm Grotto', s + 80);
  L.enemy('wolf', s + 460, [s + 380, s + 540], 160);

  s = L.x;
  L.g(1400);
  L.goalAt(s + 980);
  L.deco('goal-tree', s + 980, GY);
  L.presLine(s + 180, GY - 140, 3);
  L.deco('tree-pine-forest-1', s + 420, GY);
  L.deco('tree-pine-forest-0', s + 720, GY);
  L.x += 200;
  L.width = L.x;
  return L;
}

/* ================================================================== */
/* 5. North Pole Summit (boss)                                         */
/* ================================================================== */
function buildSummit() {
  const L = new Builder({
    id: 'north-pole-summit',
    town: 'summit',
    index: 4,
    name: 'North Pole Summit',
    subtitle: 'One last climb. One last gift. One very unhappy Krampus.',
    width: 11800,
    timeLimit: 480,
    parTime: 300,
    music: 'bells',
  });
  L.area('Base Camp');
  L.g(720);
  L.spawn = { x: 240, y: GY - 130 };
  L.presArc(330, GY - 120, 4);
  L.tip(410, 'tips.wind');
  L.tip(530, 'tips.boss');
  L.deco('prop-sign', 450, GY);
  L.checkpoint(700, 1);

  let s = L.x;
  L.g(980);
  L.house(s + 320, 0, true, GY, { town: 'summit' });
  L.house(s + 790, 1, true, GY, { town: 'summit' });
  L.enemy('wolf', s + 600, [s + 480, s + 760], 155);
  L.enemy('golem', s + 1020, [s + 900, s + 1100], 50);
  L.presLine(s + 90, GY - 150, 3);
  L.deco('tree-pine-summit-1', s + 1020, GY);

  L.gap(280, {
    ledges: [{ x: 40, y: -120, w: 100 }],
    timed: [{ x: 170, y: -190, w: 100, period: 3.2, phase: 0.4 }],
  });
  L.present(L.x - 130, GY - 270);

  s = L.x;
  L.g(760);
  L.hazard({ kind: 'wind', x: s + 220, y: GY - 300, w: 260, h: 300, force: -260 });
  L.enemy('owl', s + 340, [s + 220, s + 500], 90, true);
  L.enemy('wolf', s + 620, [s + 520, s + 740], 160);
  L.presArc(s + 240, GY - 140, 4);
  L.deco('tree-pine-summit-0', s + 720, GY);

  L.gap(240, {
    ledges: [
      { x: 30, y: -110, w: 90 },
      { x: 140, y: -200, w: 90 },
    ],
  });
  L.present(L.x - 130, GY - 270);

  s = L.x;
  L.g(620);
  L.house(s + 300, 2, true, GY, { town: 'summit' });
  L.secret('summit-base-cache', 'Aurora Cache', s + 40);
  L.checkpoint(L.x - 80, 1);

  L.area('Aurora Ascent');
  s = L.x;
  L.g(980);
  L.house(s + 320, 0, true, GY, { town: 'summit' });
  L.house(s + 790, 1, true, GY, { town: 'summit' });
  L.enemy('golem', s + 560, [s + 440, s + 700], 55);
  L.enemy('wolf', s + 1020, [s + 900, s + 1140], 160);
  L.presLine(s + 90, GY - 150, 3);
  L.deco('tree-pine-summit-1', s + 1020, GY);

  // narrow ledge climb
  L.gap(300, {
    ledges: [
      { x: 30, y: -120, w: 90 },
      { x: 160, y: -230, w: 90 },
    ],
  });
  L.present(L.x - 130, GY - 300);

  s = L.x;
  L.g(360, { material: 'alt' });
  L.hazard({ kind: 'ice', x: s, y: GY - 20, w: 360, h: 50 });
  L.hazard({ kind: 'spikes', x: s + 180, y: GY, w: 70 });
  L.enemy('golem', s + 280, [s + 200, s + 350], 50);
  L.presArc(s + 80, GY - 150, 2);

  L.gap(420, {
    ledges: [
      { x: 30, y: -120, w: 90 },
      { x: 150, y: -210, w: 90 },
      { x: 280, y: -150, w: 90 },
    ],
    timed: [{ x: 90, y: -300, w: 90, period: 3.4, phase: 0.6 }],
  });
  L.presLine(L.x - 360, GY - 330, 2, 60);

  s = L.x;
  L.g(700);
  L.hazard({ kind: 'wind', x: s + 180, y: GY - 300, w: 300, h: 300, force: -300 });
  L.enemy('wolf', s + 500, [s + 400, s + 660], 170);
  L.presArc(s + 200, GY - 160, 4);
  L.deco('tree-pine-summit-0', s + 640, GY);

  L.gap(260, {
    ledges: [{ x: 40, y: -140, w: 90 }],
    timed: [{ x: 150, y: -220, w: 100, period: 3, phase: 1 }],
  });

  s = L.x;
  L.g(560);
  L.secret('summit-ascent-cache', 'Ascent Cache', s + 100);
  L.checkpoint(L.x - 80, 2);

  L.area('Summit Gate');
  s = L.x;
  L.g(520);
  L.hazard({ kind: 'spikes', x: s + 240, y: GY, w: 70 });
  L.enemy('golem', s + 400, [s + 300, s + 500], 55);
  L.presArc(s + 120, GY - 150, 3);
  L.secret('summit-gate-cache', 'Gate Cache', s + 20);

  L.gap(320, {
    ledges: [
      { x: 40, y: -120, w: 90 },
      { x: 170, y: -210, w: 90 },
    ],
  });
  L.present(L.x - 160, GY - 280);

  s = L.x;
  L.g(440, { material: 'alt' });
  L.hazard({ kind: 'ice', x: s, y: GY - 20, w: 440, h: 50 });
  L.hazard({ kind: 'icicle', x: s + 140, y: GY - 235 });
  L.hazard({ kind: 'icicle', x: s + 250, y: GY - 235 });
  L.enemy('wolf', s + 360, [s + 260, s + 440], 170);
  L.presLine(s + 60, GY - 150, 2);

  // Boss arena
  const arenaStart = L.x;
  L.g(1800, { material: 'alt' });
  L.boss = {
    x: arenaStart + 1080,
    triggerX: arenaStart + 160,
    gateX: arenaStart + 1640,
    arenaStart,
    arenaEnd: arenaStart + 1800,
  };
  L.deco('tree-pine-summit-1', arenaStart + 120, GY, 0.8);
  L.presLine(arenaStart + 220, GY - 150, 3);

  s = L.x;
  L.g(900);
  L.goalAt(s + 520);
  L.deco('goal-tree', s + 520, GY);
  L.x += 200;
  L.width = L.x;
  return L;
}

const levels = [buildPine(), buildGinger(), buildFactory(), buildForest(), buildSummit()];

await mkdir(OUT, { recursive: true });
for (const level of levels) {
  const data = {
    id: level.id,
    town: level.town,
    index: level.index,
    name: level.name,
    subtitle: level.subtitle,
    width: Math.round(level.width),
    height: level.height,
    groundY: level.groundY,
    timeLimit: level.timeLimit,
    parTime: level.parTime,
    music: level.music,
    spawn: level.spawn,
    platforms: level.platforms,
    movingPlatforms: level.movingPlatforms,
    timedPlatforms: level.timedPlatforms,
    crumblingPlatforms: level.crumblingPlatforms,
    houses: level.houses,
    enemies: level.enemies,
    presents: level.presents,
    checkpoints: level.checkpoints,
    hazards: level.hazards,
    secrets: level.secrets,
    decorations: level.decorations,
    areas: level.areas,
    tips: level.tips,
    ...(level.boss ? { boss: level.boss } : {}),
    goal: level.goal,
  };
  await writeFile(path.join(OUT, `${level.id}.json`), JSON.stringify(data, null, 2));
  const gifts = data.houses.filter((h) => h.hasChild).length;
  console.log(
    `${level.id}: ${data.width}x${data.height}, ${data.platforms.length} platforms, ` +
    `${data.houses.length} houses (${gifts} deliveries), ${data.presents.length} presents, ` +
    `${data.secrets.length} secrets, ${data.enemies.length} enemies, ${data.hazards.length} hazards` +
    (data.boss ? ', BOSS' : ''),
  );
}
