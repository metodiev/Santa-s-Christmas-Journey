import type { LevelData, TownId } from './types';
import pine from './levels/snowy-pine-village.json';
import ginger from './levels/gingerbread-town.json';
import factory from './levels/toy-factory-district.json';
import forest from './levels/frozen-forest.json';
import summit from './levels/north-pole-summit.json';

export const GAME_TITLE = "Santa's Christmas Journey";

export const LEVELS: LevelData[] = [
  pine as unknown as LevelData,
  ginger as unknown as LevelData,
  factory as unknown as LevelData,
  forest as unknown as LevelData,
  summit as unknown as LevelData,
];

export const LEVEL_BY_ID: Record<string, LevelData> = Object.fromEntries(LEVELS.map((l) => [l.id, l]));

export const TILE_SIZE = 64;
export const TILE_SCALE = 0.5;
export const HOUSE_WIDTH = 320;
export const HOUSE_HEIGHT = 260;
export const HOUSE_ROOF_OFFSET = 208;
export const HOUSE_CHIMNEY_OFFSET = 98;
export const HOUSE_SCALE = 2 / 3;

export const PHYSICS = {
  gravity: 2400,
  walkSpeed: 250,
  runSpeed: 390,
  accel: 2900,
  airAccel: 1900,
  drag: 2800,
  airDrag: 500,
  iceAccel: 700,
  iceDrag: 260,
  jump: 1120,
  doubleJump: 930,
  maxFall: 1500,
  coyoteMs: 110,
  jumpBufferMs: 130,
  stompBounce: 760,
  springBounce: 1680,
  slideSpeed: 460,
  slideMs: 520,
  poundSpeed: 1750,
} as const;

export const MAX_HEARTS = 3;
export const SPIRIT_MAX = 100;
export const SPIRIT_DURATION = 11;

export const DEPTH = {
  sky: -1000,
  far: -900,
  mid: -800,
  near: -700,
  decoBack: 2,
  ground: 5,
  house: 8,
  houseGlow: 9,
  pickup: 12,
  hazard: 13,
  enemy: 16,
  boss: 17,
  santaShadow: 18,
  santa: 20,
  fx: 30,
  vignette: 900,
  snow: 950,
  grain: 960,
  uiScene: 1000,
} as const;

export const TOWN_META: Record<TownId, {
  nameKey: string;
  accent: string;
  accent2: string;
  sky: [string, string, string];
  icon: string;
}> = {
  pine: { nameKey: 'town.pine', accent: '#ffd166', accent2: '#7fe3ff', sky: ['#050b1c', '#0b2142', '#2b537f'], icon: 'tree-pine-pine-0' },
  ginger: { nameKey: 'town.ginger', accent: '#9fe0c0', accent2: '#d64550', sky: ['#200d20', '#51203a', '#8f3c55'], icon: 'prop-candy-cane' },
  factory: { nameKey: 'town.factory', accent: '#f0b64a', accent2: '#c9342f', sky: ['#0a0e18', '#1b2536', '#405268'], icon: 'prop-gear' },
  forest: { nameKey: 'town.forest', accent: '#8fd0e8', accent2: '#cfe3e8', sky: ['#02141b', '#082a36', '#134d5c'], icon: 'tree-pine-forest-0' },
  summit: { nameKey: 'town.summit', accent: '#ffd166', accent2: '#a97bff', sky: ['#04091a', '#0b2038', '#1c4459'], icon: 'goal-tree' },
};

export const FONT_TITLE = 'Cinzel, Georgia, "Times New Roman", serif';
export const FONT_UI = 'Inter, "Trebuchet MS", system-ui, sans-serif';

export const ACHIEVEMENT_ICONS: Record<string, string> = {
  'first-gift': 'ui-gift',
  'gift-master': 'ui-star-full',
  'secret-seeker': 'ui-snowflake',
  'secret-master': 'ui-crown',
  'boss-slayer': 'ui-trophy',
  'perfect-town': 'ui-star-full',
  'all-towns': 'ui-crown',
  'present-hoarder': 'ui-gift',
  speedster: 'ui-clock',
  untouchable: 'ui-heart-full',
  stomper: 'ui-boot',
  'star-collector': 'ui-star-full',
};

export function nextLevelId(id: string): string | null {
  const index = LEVELS.findIndex((l) => l.id === id);
  return index >= 0 && index < LEVELS.length - 1 ? LEVELS[index + 1].id : null;
}

export function getLevel(id: string): LevelData {
  return LEVEL_BY_ID[id] ?? LEVELS[0];
}

export function starsFor(giftsDelivered: number, giftsTotal: number, secretsFound: number, secretsTotal: number): number {
  if (giftsTotal > 0 && giftsDelivered >= giftsTotal && secretsFound >= secretsTotal) return 3;
  if (giftsTotal > 0 && giftsDelivered >= giftsTotal) return 2;
  return 1;
}

export function computeScore(input: {
  presentsCollected: number;
  giftsDelivered: number;
  giftsTotal: number;
  secretsFound: number;
  enemiesStomped: number;
  time: number;
  timeLimit: number;
}): number {
  const timeBonus = Math.max(0, Math.round((input.timeLimit - input.time) * 5));
  const allDelivered = input.giftsTotal > 0 && input.giftsDelivered >= input.giftsTotal;
  return Math.round(
    input.presentsCollected * 50 +
    input.giftsDelivered * 100 +
    input.secretsFound * 200 +
    input.enemiesStomped * 25 +
    timeBonus +
    (allDelivered ? 500 : 0),
  );
}

export function formatTime(seconds: number): string {
  const s = Math.max(0, Math.floor(seconds));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
}
