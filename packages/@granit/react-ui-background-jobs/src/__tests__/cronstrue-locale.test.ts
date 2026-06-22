import { describe, expect, it } from 'vitest';

import { getCronstrueLocale, loadCronstrueLocale } from '../cronstrue-locale';

// Mirror of LOCALE_MAP in cronstrue-locale.ts. Driving loadCronstrueLocale over
// every entry exercises each `case` arm of the dynamic-import switch (branch
// coverage), and getCronstrueLocale assertions pin the exact mapping behaviour.
const LOCALE_MAP: Record<string, string> = {
  af: 'af',
  ar: 'ar',
  be: 'be',
  bg: 'bg',
  ca: 'ca',
  cs: 'cs',
  da: 'da',
  de: 'de',
  en: 'en',
  'en-GB': 'en',
  es: 'es',
  'es-MX': 'es',
  fa: 'fa',
  fi: 'fi',
  fr: 'fr',
  'fr-CA': 'fr',
  he: 'he',
  hr: 'hr',
  hu: 'hu',
  id: 'id',
  it: 'it',
  ja: 'ja',
  ko: 'ko',
  my: 'my',
  nb: 'nb',
  nl: 'nl',
  pl: 'pl',
  pt: 'pt_PT',
  'pt-BR': 'pt_BR',
  ro: 'ro',
  ru: 'ru',
  sk: 'sk',
  sl: 'sl',
  sr: 'sr',
  sv: 'sv',
  sw: 'sw',
  th: 'th',
  tr: 'tr',
  uk: 'uk',
  vi: 'vi',
  zh: 'zh_CN',
  'zh-TW': 'zh_TW',
};

describe('getCronstrueLocale', () => {
  it('returns the dedicated locale for exact-key hits', () => {
    expect(getCronstrueLocale('pt')).toBe('pt_PT');
    expect(getCronstrueLocale('zh')).toBe('zh_CN');
    expect(getCronstrueLocale('de')).toBe('de');
  });

  it('maps regional variants with their own map entry', () => {
    expect(getCronstrueLocale('en-GB')).toBe('en');
    expect(getCronstrueLocale('es-MX')).toBe('es');
    expect(getCronstrueLocale('fr-CA')).toBe('fr');
    expect(getCronstrueLocale('pt-BR')).toBe('pt_BR');
    expect(getCronstrueLocale('zh-TW')).toBe('zh_TW');
  });

  it('falls back to the base language when the full tag is absent', () => {
    expect(getCronstrueLocale('de-DE')).toBe('de');
    expect(getCronstrueLocale('it-IT')).toBe('it');
    expect(getCronstrueLocale('ja-JP')).toBe('ja');
  });

  it('falls back to en for unknown languages and tags', () => {
    expect(getCronstrueLocale('hi')).toBe('en');
    expect(getCronstrueLocale('xx-YY')).toBe('en');
    expect(getCronstrueLocale('zz')).toBe('en');
  });

  it('returns en for an empty string', () => {
    expect(getCronstrueLocale('')).toBe('en');
  });
});

describe('loadCronstrueLocale', () => {
  it('loads every mapped locale without throwing (covers each switch case)', async () => {
    for (const tag of Object.keys(LOCALE_MAP)) {
      await expect(loadCronstrueLocale(tag)).resolves.toBeUndefined();
    }
  });

  it('no-ops on the second call for an already-loaded locale', async () => {
    // 'de' was loaded in the previous test; calling again hits the
    // `loaded.has(locale)` early-return branch.
    await expect(loadCronstrueLocale('de')).resolves.toBeUndefined();
    await expect(loadCronstrueLocale('de-DE')).resolves.toBeUndefined();
  });

  it('falls back to en (already loaded) for an unmapped locale', async () => {
    await expect(loadCronstrueLocale('hi')).resolves.toBeUndefined();
    await expect(loadCronstrueLocale('xx-YY')).resolves.toBeUndefined();
  });
});
