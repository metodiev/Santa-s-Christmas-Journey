import Phaser from 'phaser';
import { Preferences } from '@capacitor/preferences';
import type { LevelData, LevelResult, Profile, SaveData, Settings } from '../types';
import {
  MAX_PROFILES, SAVE_VERSION, applyLevelResult, createDefaultSave, createProfile,
  sanitizeSave,
} from './progress';

const STORAGE_KEY = 'santas-christmas-journey.save.v1';
const LOCAL_KEY = 'scj.save.v1';

function makeId(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) return crypto.randomUUID();
  return `p-${Date.now()}-${Math.floor(Math.random() * 1e6)}`;
}

class SaveSystem extends Phaser.Events.EventEmitter {
  private data: SaveData = createDefaultSave();
  private ready = false;
  private saveTimer: number | null = null;
  private writing: Promise<void> = Promise.resolve();

  async init(): Promise<void> {
    let raw: string | null = null;
    try {
      raw = (await Preferences.get({ key: STORAGE_KEY })).value;
    } catch {
      try { raw = localStorage.getItem(LOCAL_KEY); } catch { raw = null; }
    }
    if (raw) {
      try {
        this.data = sanitizeSave(JSON.parse(raw));
      } catch {
        this.data = createDefaultSave();
      }
    }
    if (!this.data.profiles.length) this.data = createDefaultSave();
    if (!this.data.profiles.some((p) => p.id === this.data.activeProfileId)) {
      this.data.activeProfileId = this.data.profiles[0].id;
    }
    this.ready = true;
    this.emit('ready');
    this.emit('settings', this.settings);
  }

  get isReady(): boolean { return this.ready; }
  get settings(): Settings { return this.data.settings; }
  get profiles(): Profile[] { return this.data.profiles; }
  get profile(): Profile {
    return this.data.profiles.find((p) => p.id === this.data.activeProfileId) ?? this.data.profiles[0];
  }
  get activeProfileId(): string { return this.data.activeProfileId; }

  updateSettings(patch: Partial<Settings>): void {
    this.data.settings = { ...this.data.settings, ...patch };
    this.emit('settings', this.settings);
    this.scheduleSave();
  }

  resetSettings(): void {
    this.data.settings = { ...createDefaultSave().settings };
    this.emit('settings', this.settings);
    this.scheduleSave();
  }

  selectProfile(id: string): boolean {
    if (!this.data.profiles.some((p) => p.id === id)) return false;
    this.data.activeProfileId = id;
    this.emit('profile', this.profile);
    this.scheduleSave(0);
    return true;
  }

  addProfile(name: string): Profile | null {
    const trimmed = name.trim().slice(0, 18);
    if (!trimmed) return null;
    if (this.data.profiles.length >= MAX_PROFILES) return null;
    const profile = createProfile(makeId(), trimmed);
    this.data.profiles.push(profile);
    this.data.activeProfileId = profile.id;
    this.emit('profile', profile);
    this.scheduleSave(0);
    return profile;
  }

  renameProfile(id: string, name: string): boolean {
    const profile = this.data.profiles.find((p) => p.id === id);
    const trimmed = name.trim().slice(0, 18);
    if (!profile || !trimmed) return false;
    profile.name = trimmed;
    profile.updatedAt = Date.now();
    this.emit('profile', this.profile);
    this.scheduleSave();
    return true;
  }

  deleteProfile(id: string): boolean {
    if (id === 'guest') return false;
    if (this.data.profiles.length <= 1) return false;
    const index = this.data.profiles.findIndex((p) => p.id === id);
    if (index < 0) return false;
    this.data.profiles.splice(index, 1);
    if (this.data.activeProfileId === id) this.data.activeProfileId = this.data.profiles[0].id;
    this.emit('profile', this.profile);
    this.scheduleSave(0);
    return true;
  }

  resetProgress(): void {
    const profile = this.profile;
    profile.progress = {};
    profile.achievements = [];
    profile.stats = createProfile(profile.id, profile.name).stats;
    profile.updatedAt = Date.now();
    this.emit('progress', profile);
    this.scheduleSave(0);
  }

  recordResult(level: LevelData, result: LevelResult): string[] {
    const unlocked = applyLevelResult(this.profile, level, result);
    for (const id of unlocked) this.emit('achievement', id);
    this.emit('progress', this.profile);
    void this.saveNow();
    return unlocked;
  }

  vibrate(ms: number | number[]): void {
    if (!this.settings.vibration) return;
    try {
      if (typeof navigator !== 'undefined' && 'vibrate' in navigator) navigator.vibrate(ms);
    } catch {
      // Vibration is best-effort.
    }
  }

  saveNow(): Promise<void> {
    if (this.saveTimer !== null) {
      window.clearTimeout(this.saveTimer);
      this.saveTimer = null;
    }
    const payload = JSON.stringify({ ...this.data, version: SAVE_VERSION });
    this.writing = this.writing.then(async () => {
      try {
        await Preferences.set({ key: STORAGE_KEY, value: payload });
      } catch {
        try { localStorage.setItem(LOCAL_KEY, payload); } catch { /* storage unavailable */ }
      }
    });
    return this.writing;
  }

  private scheduleSave(delay = 220): void {
    if (this.saveTimer !== null) window.clearTimeout(this.saveTimer);
    this.saveTimer = window.setTimeout(() => {
      this.saveTimer = null;
      void this.saveNow();
    }, delay);
  }
}

export const save = new SaveSystem();
