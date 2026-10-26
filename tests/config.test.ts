import { describe, expect, it } from 'vitest';
import {
  LEVELS, LEVEL_BY_ID, PHYSICS, TOWN_META, computeScore, formatTime, getLevel, nextLevelId, starsFor,
} from '../src/config';

describe('level registry', () => {
  it('registers five towns in journey order', () => {
    expect(LEVELS).toHaveLength(5);
    expect(LEVELS.map((level) => level.id)).toEqual([
      'snowy-pine-village',
      'gingerbread-town',
      'toy-factory-district',
      'frozen-forest',
      'north-pole-summit',
    ]);
    expect(new Set(LEVELS.map((level) => level.town)).size).toBe(5);
    expect(LEVELS.every((level) => level.width > 4000 && level.height >= level.groundY)).toBe(true);
  });

  it('provides accessible metadata for every town', () => {
    for (const level of LEVELS) {
      const meta = TOWN_META[level.town];
      expect(meta.nameKey).toMatch(/^town\./);
      expect(meta.accent).toMatch(/^#[0-9a-f]{6}$/i);
      expect(meta.icon).toBeTruthy();
      expect(meta.sky).toHaveLength(3);
    }
  });

  it('links each level to the next and ends at the summit', () => {
    for (let i = 0; i < LEVELS.length - 1; i++) {
      expect(nextLevelId(LEVELS[i].id)).toBe(LEVELS[i + 1].id);
    }
    expect(nextLevelId(LEVELS[LEVELS.length - 1].id)).toBeNull();
    expect(nextLevelId('unknown-level')).toBeNull();
  });

  it('falls back to the first level when an id is unknown', () => {
    expect(getLevel('does-not-exist')).toBe(LEVELS[0]);
    expect(getLevel('gingerbread-town')).toBe(LEVEL_BY_ID['gingerbread-town']);
  });

  it('keeps every spawn, goal, house, platform and enemy inside the level bounds', () => {
    for (const level of LEVELS) {
      expect(level.spawn.x).toBeGreaterThan(0);
      expect(level.spawn.x).toBeLessThan(level.width);
      expect(level.goal.x).toBeGreaterThan(level.spawn.x);
      expect(level.goal.x).toBeLessThanOrEqual(level.width);
      expect(level.areas.length).toBeGreaterThanOrEqual(3);

      for (const platform of level.platforms) {
        expect(platform.x).toBeGreaterThanOrEqual(0);
        expect(platform.x + platform.w).toBeLessThanOrEqual(level.width);
        expect(platform.y).toBeGreaterThan(0);
        expect(platform.y).toBeLessThanOrEqual(level.groundY);
      }
      for (const house of level.houses) {
        expect(house.x).toBeGreaterThan(level.spawn.x);
        expect(house.x).toBeLessThan(level.width);
        expect(house.y).toBe(level.groundY);
      }
      for (const enemy of level.enemies) {
        expect(enemy.x).toBeGreaterThan(0);
        expect(enemy.x).toBeLessThan(level.width);
        expect(enemy.patrol[0]).toBeGreaterThanOrEqual(0);
        expect(enemy.patrol[1]).toBeLessThanOrEqual(level.width);
        expect(enemy.patrol[1]).toBeGreaterThan(enemy.patrol[0]);
      }
      expect(level.secrets).toHaveLength(3);
      for (const secret of level.secrets) {
        expect(secret.x + secret.w).toBeLessThanOrEqual(level.width);
        expect(secret.y).toBeGreaterThanOrEqual(0);
      }
      expect(level.checkpoints.length).toBeGreaterThanOrEqual(1);
      expect(level.presents.length).toBeGreaterThan(0);
    }
  });

  it('defines a boss arena only for the final town', () => {
    const bossLevels = LEVELS.filter((level) => level.boss);
    expect(bossLevels).toHaveLength(1);
    expect(bossLevels[0].id).toBe('north-pole-summit');
    const boss = bossLevels[0].boss!;
    expect(boss.arenaStart).toBeLessThan(boss.triggerX);
    expect(boss.triggerX).toBeLessThan(boss.arenaEnd);
    expect(boss.gateX).toBeLessThan(boss.arenaEnd);
  });
});

describe('scoring', () => {
  it('awards stars only for full gift and secret completion', () => {
    expect(starsFor(0, 0, 0, 0)).toBe(1);
    expect(starsFor(4, 5, 3, 3)).toBe(1);
    expect(starsFor(5, 5, 2, 3)).toBe(2);
    expect(starsFor(5, 5, 3, 3)).toBe(3);
  });

  it('scores presents, deliveries, secrets, stomps and remaining time', () => {
    expect(computeScore({
      presentsCollected: 10,
      giftsDelivered: 4,
      giftsTotal: 5,
      secretsFound: 2,
      enemiesStomped: 3,
      time: 120,
      timeLimit: 200,
    })).toBe(10 * 50 + 4 * 100 + 2 * 200 + 3 * 25 + (200 - 120) * 5);

    expect(computeScore({
      presentsCollected: 10,
      giftsDelivered: 5,
      giftsTotal: 5,
      secretsFound: 3,
      enemiesStomped: 0,
      time: 400,
      timeLimit: 200,
    })).toBe(10 * 50 + 5 * 100 + 3 * 200 + 500);
  });

  it('formats time with clamped minutes and padded seconds', () => {
    expect(formatTime(0)).toBe('0:00');
    expect(formatTime(9.9)).toBe('0:09');
    expect(formatTime(65)).toBe('1:05');
    expect(formatTime(3600)).toBe('60:00');
    expect(formatTime(-30)).toBe('0:00');
  });

  it('keeps movement constants in a sane platformer range', () => {
    expect(PHYSICS.jump).toBeGreaterThan(PHYSICS.doubleJump);
    expect(PHYSICS.runSpeed).toBeGreaterThan(PHYSICS.walkSpeed);
    expect(PHYSICS.gravity).toBeGreaterThan(0);
  });
});
