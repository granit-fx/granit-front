import { describe, expect, it } from 'vitest';

import { customizationTranslationsEn } from '../locales/en.js';
import { customizationTranslationsFr } from '../locales/fr.js';

function leafPaths(obj: unknown, prefix = ''): readonly string[] {
  if (typeof obj !== 'object' || obj === null) {
    return [prefix];
  }
  return Object.entries(obj as Record<string, unknown>).flatMap(([key, value]) =>
    leafPaths(value, prefix ? `${prefix}.${key}` : key)
  );
}

describe('customization locale bundles', () => {
  it('en exposes Editor and Inspector surfaces with the 5 layer labels', () => {
    expect(Object.keys(customizationTranslationsEn).sort()).toEqual(['Editor', 'Inspector']);
    expect(Object.keys(customizationTranslationsEn.Inspector.Layers).sort()).toEqual([
      'Layer1Admin',
      'Layer2Workspace',
      'Layer3Role',
      'Layer4User',
      'Layer5Schema',
    ]);
  });

  it('fr provides every key declared in en (no missing translations)', () => {
    const enPaths = new Set(leafPaths(customizationTranslationsEn));
    const frPaths = new Set(leafPaths(customizationTranslationsFr));
    expect([...enPaths].filter((p) => !frPaths.has(p))).toEqual([]);
    expect([...frPaths].filter((p) => !enPaths.has(p))).toEqual([]);
  });

  it('preserves interpolation placeholders across locales', () => {
    expect(customizationTranslationsEn.Editor.GroupSelectAriaLabel).toContain('{{fieldName}}');
    expect(customizationTranslationsFr.Editor.GroupSelectAriaLabel).toContain('{{fieldName}}');
    expect(customizationTranslationsEn.Inspector.Title).toContain('{{fieldName}}');
    expect(customizationTranslationsFr.Inspector.Title).toContain('{{fieldName}}');
  });
});
