import type { LevelData, LevelProgress, LevelResult, Profile, SaveData, Settings } from '../types';

export const SAVE_VERSION = 1;
export const MAX_PROFILES = 6;

export const DEFAULT_SETTINGS: Settings = {
  music: 0.62,
  sfx: 0.78,
  vibration: true,
  controlScale: 1,
  controlOpacity: 0.82,
  colorblind: false,
  reducedMotion: false,
  largeText: false,
  language: 'en',
  filmGrain: false,
};

export const ACHIEVEMENTS: { id: string; icon: string }[] = [
  { id: 'first-gift', icon: 'ui-gift' },
  { id: 'gift-master', icon: 'ui-star-full' },
  { id: 'secret-seeker', icon: 'ui-snowflake' },
  { id: 'secret-master', icon: 'ui-crown' },
  { id: 'boss-slayer', icon: 'ui-trophy' },
  { id: 'perfect-town', icon: 'ui-star-full' },
  { id: 'all-towns', icon: 'ui-crown' },
  { id: 'present-hoarder', icon: 'ui-gift' },
  { id: 'speedster', icon: 'ui-clock' },
  { id: 'untouchable', icon: 'ui-heart-full' },
  { id: 'stomper', icon: 'ui-boot' },
  { id: 'star-collector', icon: 'ui-star-full' },
];

export function emptyProgress(): LevelProgress {
  return {
    completed: false,
    stars: 0,
    bestScore: 0,
    bestTime: 0,
    giftsDelivered: 0,
    giftsTotal: 0,
    secretsFound: 0,
    secretsTotal: 0,
    deaths: 0,
    damageTaken: 0,
  };
}

export function createProfile(id: string, name: string): Profile {
  return {
    id,
    name,
    createdAt: Date.now(),
    updatedAt: Date.now(),
    progress: {},
    achievements: [],
    stats: {
      presentsCollected: 0,
      enemiesStomped: 0,
      giftsDelivered: 0,
      secretsFound: 0,
      deaths: 0,
      damageTaken: 0,
      levelsCompleted: 0,
      starsEarned: 0,
    },
  };
}

export function createDefaultSave(): SaveData {
  const guest = createProfile('guest', 'Guest');
  return {
    version: SAVE_VERSION,
    settings: { ...DEFAULT_SETTINGS },
    activeProfileId: 'guest',
    profiles: [guest],
  };
}

export function sanitizeSave(raw: unknown): SaveData {
  const fallback = createDefaultSave();
  if (!raw || typeof raw !== 'object') return fallback;
  const candidate = raw as Partial<SaveData>;
  const profiles = Array.isArray(candidate.profiles)
    ? candidate.profiles.filter((p): p is Profile => Boolean(p && typeof p === 'object' && typeof p.id === 'string' && typeof p.name === 'string'))
    : [];
  if (!profiles.length) profiles.push(...fallback.profiles);
  const normalizedProfiles = profiles.map((p) => ({
    ...createProfile(p.id, p.name),
    ...p,
    stats: { ...createProfile(p.id, p.name).stats, ...(p.stats ?? {}) },
    progress: p.progress ?? {},
    achievements: Array.isArray(p.achievements) ? p.achievements : [],
  }));
  const active = normalizedProfiles.find((p) => p.id === candidate.activeProfileId) ?? normalizedProfiles[0];
  return {
    version: SAVE_VERSION,
    settings: { ...DEFAULT_SETTINGS, ...(candidate.settings ?? {}) },
    activeProfileId: active.id,
    profiles: normalizedProfiles,
  };
}

export function applyLevelResult(profile: Profile, level: LevelData, result: LevelResult): string[] {
  const previous = profile.progress[level.id] ?? emptyProgress();
  const completedBefore = previous.completed;
  const progress: LevelProgress = {
    completed: true,
    stars: Math.max(previous.stars, result.stars),
    bestScore: Math.max(previous.bestScore, result.score),
    bestTime: previous.bestTime > 0 ? Math.min(previous.bestTime, result.time) : result.time,
    giftsDelivered: Math.max(previous.giftsDelivered, result.giftsDelivered),
    giftsTotal: Math.max(previous.giftsTotal, result.giftsTotal),
    secretsFound: Math.max(previous.secretsFound, result.secretsFound),
    secretsTotal: Math.max(previous.secretsTotal, result.secretsTotal),
    deaths: Math.max(previous.deaths, result.deaths),
    damageTaken: Math.max(previous.damageTaken, result.damageTaken),
  };
  profile.progress[level.id] = progress;
  profile.updatedAt = Date.now();

  profile.stats.presentsCollected += result.presentsCollected;
  profile.stats.enemiesStomped += result.enemiesStomped;
  profile.stats.giftsDelivered += result.giftsDelivered;
  profile.stats.secretsFound += result.secretsFound;
  profile.stats.deaths += result.deaths;
  profile.stats.damageTaken += result.damageTaken;
  profile.stats.levelsCompleted = Object.values(profile.progress).filter((p) => p.completed).length;
  profile.stats.starsEarned = Object.values(profile.progress).reduce((sum, p) => sum + p.stars, 0);
  if (completedBefore) {
    // stats still count repeat runs, but completed count reflects unique levels
  }

  const newlyUnlocked: string[] = [];
  const unlock = (id: string) => {
    if (!profile.achievements.includes(id)) {
      profile.achievements.push(id);
      newlyUnlocked.push(id);
    }
  };

  if (result.giftsDelivered >= 1) unlock('first-gift');
  if (result.giftsTotal > 0 && result.giftsDelivered >= result.giftsTotal) unlock('gift-master');
  if (profile.stats.secretsFound >= 5) unlock('secret-seeker');
  if (profile.stats.presentsCollected >= 100) unlock('present-hoarder');
  if (profile.stats.enemiesStomped >= 10) unlock('stomper');
  if (profile.stats.starsEarned >= 15) unlock('star-collector');
  if (progress.stars >= 3) unlock('perfect-town');
  if (result.underPar) unlock('speedster');
  if (result.damageTaken === 0) unlock('untouchable');
  if (result.bossDefeated) unlock('boss-slayer');
  if (Object.values(profile.progress).filter((p) => p.completed).length >= 5) unlock('all-towns');
  if (
    level.index === 4 &&
    progress.completed &&
    Object.values(profile.progress).every((p) => p.completed)
  ) {
    unlock('all-towns');
  }
  const allSecrets = Object.values(profile.progress).filter((p) => p.completed && p.secretsTotal > 0);
  if (allSecrets.length >= 5 && allSecrets.every((p) => p.secretsFound >= p.secretsTotal)) {
    unlock('secret-master');
  }
  const bossProgress = profile.progress['north-pole-summit'];
  if (level.index === 4 && bossProgress?.completed) unlock('boss-slayer');

  return newlyUnlocked;
}

export function totalStars(profile: Profile): number {
  return Object.values(profile.progress).reduce((sum, p) => sum + p.stars, 0);
}

export function isLevelUnlocked(profile: Profile, index: number): boolean {
  if (index <= 0) return true;
  const previous = ['snowy-pine-village', 'gingerbread-town', 'toy-factory-district', 'frozen-forest', 'north-pole-summit'][index - 1];
  return Boolean(profile.progress[previous]?.completed);
}

export function firstIncompleteLevel(profile: Profile): number {
  const ids = ['snowy-pine-village', 'gingerbread-town', 'toy-factory-district', 'frozen-forest', 'north-pole-summit'];
  const index = ids.findIndex((id) => !profile.progress[id]?.completed);
  if (index === -1) return 4;
  return index;
}

export function bestStarsForTown(profile: Profile, levelIds: string[]): number {
  return levelIds.reduce((sum, id) => sum + (profile.progress[id]?.stars ?? 0), 0);
}
