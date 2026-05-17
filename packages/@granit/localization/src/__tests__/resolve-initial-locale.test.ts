import { afterEach, describe, expect, it, vi } from 'vitest';

import { resolveInitialLocale } from '../resolve-initial-locale.js';

import type { LanguageInfo } from '../types/index.js';

const languages: LanguageInfo[] = [
  { cultureName: 'fr', displayName: 'Français', isDefault: true },
  { cultureName: 'en', displayName: 'English', isDefault: false },
  { cultureName: 'de', displayName: 'Deutsch', isDefault: false },
];

afterEach(() => {
  localStorage.clear();
  vi.restoreAllMocks();
});

describe('resolveInitialLocale', () => {
  it('should return stored locale from localStorage when available', () => {
    localStorage.setItem('dd:locale', '"en"');
    expect(resolveInitialLocale(languages)).toBe('en');
  });

  it('should return browser locale when no stored value and language is in available list', () => {
    vi.spyOn(navigator, 'language', 'get').mockReturnValue('de-DE');
    expect(resolveInitialLocale(languages)).toBe('de');
  });

  it('should return full browser locale when no languages list is provided', () => {
    vi.spyOn(navigator, 'language', 'get').mockReturnValue('es-ES');
    expect(resolveInitialLocale()).toBe('es-ES');
  });

  it('should return exact compound locale when it matches a cultureName', () => {
    vi.spyOn(navigator, 'language', 'get').mockReturnValue('pt-BR');
    const langs: LanguageInfo[] = [
      { cultureName: 'fr', displayName: 'Français', isDefault: true },
      { cultureName: 'pt-BR', displayName: 'Português (Brasil)', isDefault: false },
    ];
    expect(resolveInitialLocale(langs)).toBe('pt-BR');
  });

  it('should fall back to base code when compound locale has no exact match', () => {
    vi.spyOn(navigator, 'language', 'get').mockReturnValue('zh-TW');
    const langs: LanguageInfo[] = [
      { cultureName: 'fr', displayName: 'Français', isDefault: true },
      { cultureName: 'zh', displayName: '中文', isDefault: false },
    ];
    expect(resolveInitialLocale(langs)).toBe('zh');
  });

  it('should skip browser locale when not in available languages list', () => {
    vi.spyOn(navigator, 'language', 'get').mockReturnValue('ja-JP');
    expect(resolveInitialLocale(languages)).toBe('fr');
  });

  it('should return isDefault language when browser locale is not available', () => {
    vi.spyOn(navigator, 'language', 'get').mockReturnValue('ja-JP');
    const langs: LanguageInfo[] = [
      { cultureName: 'en', displayName: 'English', isDefault: true },
      { cultureName: 'fr', displayName: 'Français', isDefault: false },
    ];
    expect(resolveInitialLocale(langs)).toBe('en');
  });

  it('should fall back to "fr" when nothing else matches', () => {
    vi.spyOn(navigator, 'language', 'get').mockReturnValue('ja-JP');
    const langs: LanguageInfo[] = [
      { cultureName: 'en', displayName: 'English', isDefault: false },
      { cultureName: 'de', displayName: 'Deutsch', isDefault: false },
    ];
    expect(resolveInitialLocale(langs)).toBe('fr');
  });

  it('should use custom storageKey', () => {
    localStorage.setItem('dd:app-locale', '"de"');
    expect(resolveInitialLocale(languages, 'app-locale')).toBe('de');
  });

  it('should prioritize localStorage over navigator', () => {
    localStorage.setItem('dd:locale', '"de"');
    vi.spyOn(navigator, 'language', 'get').mockReturnValue('en-US');
    expect(resolveInitialLocale(languages)).toBe('de');
  });

  // userLocale tests
  it('should return userLocale when no localStorage and userLocale is provided', () => {
    vi.spyOn(navigator, 'language', 'get').mockReturnValue('en-US');
    expect(resolveInitialLocale(languages, undefined, 'de')).toBe('de');
  });

  it('should prioritize localStorage over userLocale', () => {
    localStorage.setItem('dd:locale', '"en"');
    expect(resolveInitialLocale(languages, undefined, 'de')).toBe('en');
  });

  it('should prioritize userLocale over navigator', () => {
    vi.spyOn(navigator, 'language', 'get').mockReturnValue('en-US');
    expect(resolveInitialLocale(languages, undefined, 'fr')).toBe('fr');
  });

  it('should ignore null userLocale', () => {
    vi.spyOn(navigator, 'language', 'get').mockReturnValue('de-DE');
    expect(resolveInitialLocale(languages, undefined, null)).toBe('de');
  });
});
