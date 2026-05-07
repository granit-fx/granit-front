import { describe, expect, it } from 'vitest';

import { taxonomyTranslationsEn } from '../locales/en.js';
import { taxonomyTranslationsFr } from '../locales/fr.js';

import type { TaxonomyTranslations } from '../locales/en.js';

function flatten(obj: unknown, prefix = ''): readonly string[] {
  if (typeof obj !== 'object' || obj === null) {
    return [prefix];
  }
  return Object.entries(obj as Record<string, unknown>).flatMap(([key, value]) =>
    flatten(value, prefix === '' ? key : `${prefix}.${key}`)
  );
}

describe('Taxonomy locale bundles', () => {
  it('en and fr expose the same key tree (no missing translations)', () => {
    const en = flatten(taxonomyTranslationsEn).slice().sort();
    const fr = flatten(taxonomyTranslationsFr).slice().sort();
    expect(fr).toEqual(en);
  });

  it('en bundle satisfies the TaxonomyTranslations contract', () => {
    const _typed: TaxonomyTranslations = taxonomyTranslationsEn;
    expect(_typed.Tag.Manager.Title).toBe('Tags');
    expect(_typed.Search.BelowThreshold).toContain('2');
  });

  it('fr bundle uses diacritics where expected', () => {
    expect(taxonomyTranslationsFr.Tag.Strip.Empty).toContain('é');
    expect(taxonomyTranslationsFr.Category.Tree.Delete).toBe('Supprimer');
  });
});
