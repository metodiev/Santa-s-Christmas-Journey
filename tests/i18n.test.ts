import { afterEach, describe, expect, it } from 'vitest';
import { LANGUAGES, getLanguage, setLanguage, t } from '../src/systems/i18n';

afterEach(() => setLanguage('en'));

describe('i18n', () => {
  it('returns English strings by default', () => {
    expect(getLanguage()).toBe('en');
    expect(t('menu.play')).toBe('Play');
    expect(t('hud.hearts', { n: 3 })).toBe('Hearts: 3');
  });

  it('switches between all shipped languages', () => {
    for (const language of LANGUAGES) {
      setLanguage(language.id);
      expect(getLanguage()).toBe(language.id);
      expect(t('menu.play')).toBeTruthy();
      expect(t('menu.play')).not.toBe('menu.play');
    }
    setLanguage('es');
    expect(t('menu.play')).toBe('Jugar');
    setLanguage('de');
    expect(t('hud.hearts', { n: 2 })).toBe('Herzen: 2');
    setLanguage('bg');
    expect(t('pause.title')).toBe('Пауза');
  });

  it('falls back to the key for unknown strings and the default language', () => {
    expect(t('does.not.exist')).toBe('does.not.exist');
    setLanguage('xx' as never);
    expect(getLanguage()).toBe('en');
  });

  it('interpolates every occurrence of a variable and leaves unknown placeholders alone', () => {
    setLanguage('en');
    expect(t('hud.hearts', { n: 1 })).toContain('1');
    expect(t('hud.hearts', {})).toContain('{n}');
  });
});
