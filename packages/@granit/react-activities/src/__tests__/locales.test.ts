import { describe, expect, it } from 'vitest';

import { activitiesTranslationsEn } from '../locales/en';
import { activitiesTranslationsFr } from '../locales/fr';

/** Walk an object tree and collect all leaf paths (`'A.B.C'`). */
function leafPaths(obj: unknown, prefix = ''): readonly string[] {
  if (typeof obj !== 'object' || obj === null) {
    return [prefix];
  }
  return Object.entries(obj as Record<string, unknown>).flatMap(([key, value]) =>
    leafPaths(value, prefix ? `${prefix}.${key}` : key)
  );
}

describe('activities locale bundles', () => {
  it('en has the expected top-level namespaces', () => {
    expect(Object.keys(activitiesTranslationsEn).sort()).toEqual([
      'Action',
      'Calendar',
      'Detail',
      'List',
      'Notification',
      'SidePanel',
      'Status',
      'StatusFilter',
    ]);
  });

  it('fr provides every key declared in en (no missing translations)', () => {
    const enPaths = new Set(leafPaths(activitiesTranslationsEn));
    const frPaths = new Set(leafPaths(activitiesTranslationsFr));

    const missingInFr = [...enPaths].filter((p) => !frPaths.has(p));
    const extraInFr = [...frPaths].filter((p) => !enPaths.has(p));

    expect(missingInFr).toEqual([]);
    expect(extraInFr).toEqual([]);
  });

  it('preserves interpolation placeholders across locales', () => {
    expect(activitiesTranslationsEn.List.Pagination.Page).toContain('{{page}}');
    expect(activitiesTranslationsEn.List.Pagination.Page).toContain('{{total}}');
    expect(activitiesTranslationsFr.List.Pagination.Page).toContain('{{page}}');
    expect(activitiesTranslationsFr.List.Pagination.Page).toContain('{{total}}');
  });
});
