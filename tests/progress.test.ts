import { describe, expect, it } from 'vitest';
import type { LevelData, LevelResult } from '../src/types';
import {
  DEFAULT_SETTINGS, applyLevelResult, createDefaultSave, createProfile, emptyProgress,
  firstIncompleteLevel, isLevelUnlocked, sanitizeSave, totalStars,
} from '../src/systems/progress';

function makeResult(overrides: Partial<LevelResult> = {}): LevelResult {
  return {
    levelId: 'snowy-pine-village',
    score: 1200,
    time: 95,
    stars: 2,
    presents: 12,
    giftsDelivered: 4,
    giftsTotal: 5,
    secretsFound: 1,
    secretsTotal: 3,
    deaths: 1,
    damageTaken: 2,
    enemiesStomped: 3,
    presentsCollected: 12,
    underPar: false,
    bossDefeated: false,
    ...overrides,
  };
}

function makeLevel(index = 0, id = 'snowy-pine-village'): LevelData {
  return { id, index } as LevelData;
}

describe('save profiles', () => {
  it('creates a playable guest profile by default', () => {
    const data = createDefaultSave();
    expect(data.version).toBe(1);
    expect(data.activeProfileId).toBe('guest');
    expect(data.profiles).toHaveLength(1);
    expect(data.profiles[0].name).toBe('Guest');
    expect(data.settings).toEqual(DEFAULT_SETTINGS);
    expect(data.profiles[0].stats.levelsCompleted).toBe(0);
  });

  it('falls back safely for garbage input', () => {
    for (const raw of [null, undefined, 42, 'nope', [], {}]) {
      const data = sanitizeSave(raw);
      expect(data.profiles.length).toBeGreaterThanOrEqual(1);
      expect(data.activeProfileId).toBe(data.profiles[0].id);
      expect(data.settings).toEqual(DEFAULT_SETTINGS);
    }
  });

  it('keeps valid profiles and repairs missing nested data', () => {
    const raw = {
      version: 99,
      activeProfileId: 'p2',
      settings: { music: 0.1, language: 'de' },
      profiles: [
        { id: 'p1', name: 'One', progress: {}, achievements: ['first-gift'] },
        { id: 'p2', name: 'Two' },
        { id: 3, name: 'bad' },
      ],
    };
    const data = sanitizeSave(raw);
    expect(data.version).toBe(1);
    expect(data.profiles.map((p) => p.id)).toEqual(['p1', 'p2']);
    expect(data.activeProfileId).toBe('p2');
    expect(data.settings.music).toBe(0.1);
    expect(data.settings.language).toBe('de');
    expect(data.profiles[1].stats.levelsCompleted).toBe(0);
    expect(data.profiles[1].progress).toEqual({});
    expect(data.profiles[1].achievements).toEqual([]);
  });

  it('selects the first profile when the active id is unknown', () => {
    const profile = createProfile('santa', 'Santa');
    const data = sanitizeSave({ profiles: [profile], activeProfileId: 'missing' });
    expect(data.activeProfileId).toBe('santa');
  });

  it('creates empty progress with all counters zeroed', () => {
    const progress = emptyProgress();
    expect(progress.completed).toBe(false);
    expect(Object.values(progress).every((v) => v === false || v === 0)).toBe(true);
  });
});

describe('applyLevelResult', () => {
  it('records completion, bests and unlocks the first gift achievement', () => {
    const profile = createProfile('p1', 'Player');
    const unlocked = applyLevelResult(profile, makeLevel(), makeResult());

    expect(unlocked).toContain('first-gift');
    const progress = profile.progress['snowy-pine-village'];
    expect(progress.completed).toBe(true);
    expect(progress.stars).toBe(2);
    expect(progress.bestScore).toBe(1200);
    expect(progress.bestTime).toBe(95);
    expect(progress.giftsDelivered).toBe(4);
    expect(profile.stats.levelsCompleted).toBe(1);
    expect(profile.stats.starsEarned).toBe(2);
    expect(profile.stats.presentsCollected).toBe(12);
    expect(profile.stats.enemiesStomped).toBe(3);
  });

  it('never lowers previous bests and counts repeat runs in stats', () => {
    const profile = createProfile('p1', 'Player');
    applyLevelResult(profile, makeLevel(), makeResult({ stars: 3, score: 5000, time: 60 }));
    const unlocked = applyLevelResult(profile, makeLevel(), makeResult({ stars: 1, score: 100, time: 120, presentsCollected: 5 }));

    const progress = profile.progress['snowy-pine-village'];
    expect(progress.stars).toBe(3);
    expect(progress.bestScore).toBe(5000);
    expect(progress.bestTime).toBe(60);
    expect(profile.stats.levelsCompleted).toBe(1);
    expect(profile.stats.presentsCollected).toBe(17);
    expect(unlocked).not.toContain('first-gift');
  });

  it('awards gift master, speedster and untouchable', () => {
    const profile = createProfile('p1', 'Player');
    const unlocked = applyLevelResult(profile, makeLevel(), makeResult({
      giftsDelivered: 5, giftsTotal: 5, underPar: true, damageTaken: 0, stars: 3,
    }));
    expect(unlocked).toEqual(expect.arrayContaining(['gift-master', 'speedster', 'untouchable', 'perfect-town']));
  });

  it('awards boss slayer and all towns after the summit', () => {
    const profile = createProfile('p1', 'Player');
    for (let i = 0; i < 4; i++) {
      applyLevelResult(profile, makeLevel(i, `level-${i}`), makeResult({
        levelId: `level-${i}`, stars: 1, damageTaken: 1,
      }));
    }
    const unlocked = applyLevelResult(
      profile,
      makeLevel(4, 'north-pole-summit'),
      makeResult({ levelId: 'north-pole-summit', bossDefeated: true, damageTaken: 1 }),
    );
    expect(unlocked).toContain('boss-slayer');
    expect(unlocked).toContain('all-towns');
    expect(profile.stats.levelsCompleted).toBe(5);
  });

  it('aggregates stars and unlocks levels in order', () => {
    const profile = createProfile('p1', 'Player');
    expect(totalStars(profile)).toBe(0);
    expect(isLevelUnlocked(profile, 0)).toBe(true);
    expect(isLevelUnlocked(profile, 1)).toBe(false);

    applyLevelResult(profile, makeLevel(0), makeResult({ stars: 3 }));
    expect(isLevelUnlocked(profile, 1)).toBe(true);
    expect(isLevelUnlocked(profile, 2)).toBe(false);
    expect(totalStars(profile)).toBe(3);
    expect(firstIncompleteLevel(profile)).toBe(1);
  });
});
