import { describe, expect, it } from 'vitest';

import { entitiesTranslationsEn } from '../locales/en';
import { entitiesTranslationsFr } from '../locales/fr';

/** Walk an object tree and collect all leaf paths (`'A.B.C'`). */
function leafPaths(obj: unknown, prefix = ''): readonly string[] {
  if (typeof obj !== 'object' || obj === null) {
    return [prefix];
  }
  return Object.entries(obj as Record<string, unknown>).flatMap(([key, value]) =>
    leafPaths(value, prefix ? `${prefix}.${key}` : key)
  );
}

describe('entities locale bundles', () => {
  it('en covers the SelectionBar + BulkAction.Recap surfaces', () => {
    expect(Object.keys(entitiesTranslationsEn).sort()).toEqual(['BulkAction', 'SelectionBar']);
    expect(entitiesTranslationsEn.SelectionBar.SelectedSummary).toContain('{{count}}');
    expect(entitiesTranslationsEn.BulkAction.Recap.PartialFailure).toContain('{{succeeded}}');
    expect(entitiesTranslationsEn.BulkAction.Recap.PartialFailure).toContain('{{failed}}');
  });

  it('fr provides every key declared in en (no missing translations)', () => {
    const enPaths = new Set(leafPaths(entitiesTranslationsEn));
    const frPaths = new Set(leafPaths(entitiesTranslationsFr));

    const missingInFr = [...enPaths].filter((p) => !frPaths.has(p));
    const extraInFr = [...frPaths].filter((p) => !enPaths.has(p));

    expect(missingInFr).toEqual([]);
    expect(extraInFr).toEqual([]);
  });

  it('preserves interpolation placeholders across locales', () => {
    expect(entitiesTranslationsFr.SelectionBar.SelectedSummary).toContain('{{count}}');
    expect(entitiesTranslationsFr.BulkAction.Recap.PartialFailure).toContain('{{succeeded}}');
    expect(entitiesTranslationsFr.BulkAction.Recap.PartialFailure).toContain('{{failed}}');
    expect(entitiesTranslationsFr.BulkAction.Recap.FullFailure).toContain('{{count}}');
  });

  it('exposes _one and _other plural variants for count-driven keys', () => {
    // i18next plural key suffixes for every key that takes `count`
    expect(entitiesTranslationsEn.SelectionBar.SelectedSummary_one).toBeTruthy();
    expect(entitiesTranslationsEn.SelectionBar.SelectedSummary_other).toBeTruthy();
    expect(entitiesTranslationsFr.SelectionBar.SelectedSummary_one).toBeTruthy();
    expect(entitiesTranslationsFr.SelectionBar.SelectedSummary_other).toBeTruthy();
    expect(entitiesTranslationsEn.BulkAction.Recap.Success_one).toBeTruthy();
    expect(entitiesTranslationsEn.BulkAction.Recap.FullFailure_one).toBeTruthy();
  });
});
