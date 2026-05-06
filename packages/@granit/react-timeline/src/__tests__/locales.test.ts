import { describe, expect, it } from 'vitest';

import { timelineTranslationsEn } from '../locales/en.js';
import { timelineTranslationsFr } from '../locales/fr.js';

/** Walk an object tree and collect all leaf paths (`'A.B.C'`). */
function leafPaths(obj: unknown, prefix = ''): readonly string[] {
  if (typeof obj !== 'object' || obj === null) {
    return [prefix];
  }
  return Object.entries(obj as Record<string, unknown>).flatMap(([key, value]) =>
    leafPaths(value, prefix ? `${prefix}.${key}` : key)
  );
}

describe('timeline locale bundles', () => {
  it('en exposes the Reaction surface (AriaLabel + Tooltip plurals)', () => {
    expect(Object.keys(timelineTranslationsEn)).toEqual(['Reaction']);
    expect(timelineTranslationsEn.Reaction.AriaLabel).toContain('{{emoji}}');
    expect(timelineTranslationsEn.Reaction.Tooltip.Count_one).toBeTruthy();
    expect(timelineTranslationsEn.Reaction.Tooltip.Count_other).toBeTruthy();
  });

  it('fr provides every key declared in en (no missing translations)', () => {
    const enPaths = new Set(leafPaths(timelineTranslationsEn));
    const frPaths = new Set(leafPaths(timelineTranslationsFr));

    expect([...enPaths].filter((p) => !frPaths.has(p))).toEqual([]);
    expect([...frPaths].filter((p) => !enPaths.has(p))).toEqual([]);
  });

  it('preserves interpolation placeholders across locales', () => {
    expect(timelineTranslationsFr.Reaction.AriaLabel).toContain('{{emoji}}');
    expect(timelineTranslationsEn.Reaction.Tooltip.Count_other).toContain('{{count}}');
    expect(timelineTranslationsFr.Reaction.Tooltip.Count_other).toContain('{{count}}');
  });
});
