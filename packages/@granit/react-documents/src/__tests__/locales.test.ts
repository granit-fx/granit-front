import { describe, expect, it } from 'vitest';

import { documentsTranslationsEn, documentsTranslationsFr } from '../locales/index.js';

describe('locales', () => {
  it('exposes an English bundle', () => {
    expect(documentsTranslationsEn).toBeDefined();
  });

  it('exposes a French bundle', () => {
    expect(documentsTranslationsFr).toBeDefined();
  });

  it('English and French bundles share the same key set', () => {
    const enKeys = Object.keys(documentsTranslationsEn).sort();
    const frKeys = Object.keys(documentsTranslationsFr).sort();
    expect(frKeys).toEqual(enKeys);
  });
});
