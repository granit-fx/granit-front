import { describe, expect, it } from 'vitest';

import { duplicateWidget, removeWidget, updateWidget } from '../lib/update-widget';

import type { DashboardDefinition, MarkdownWidgetDefinition } from '@granit/dashboards';

const definition: DashboardDefinition = {
  name: 'Test',
  category: 'General',
  isSystem: false,
  version: '1.0.0',
  layout: { columns: 12, rowHeight: 80 },
  widgets: [
    {
      slug: 'A',
      type: 'markdown',
      size: { width: 6, height: 1 },
      contentLocalizationKey: 'Widget:A.Content',
    },
    {
      slug: 'B',
      type: 'markdown',
      size: { width: 6, height: 1 },
      contentLocalizationKey: 'Widget:B.Content',
    },
    {
      slug: 'C',
      type: 'markdown',
      size: { width: 12, height: 1 },
      contentLocalizationKey: 'Widget:C.Content',
    },
  ],
};

describe('updateWidget', () => {
  it('replaces the widget matched by slug with the patched copy', () => {
    const next = updateWidget(definition, 'B', {
      slug: 'B',
      type: 'markdown',
      size: { width: 6, height: 1 },
      contentLocalizationKey: 'Widget:B.NewContent',
    } satisfies MarkdownWidgetDefinition);
    const updated = next.widgets[1] as MarkdownWidgetDefinition;
    expect(updated.contentLocalizationKey).toBe('Widget:B.NewContent');
  });

  it('preserves the existing slug even when the patch attempts to change it', () => {
    const next = updateWidget(definition, 'B', {
      slug: 'RENAMED',
      type: 'markdown',
      size: { width: 6, height: 1 },
      contentLocalizationKey: 'Widget:B.NewContent',
    } satisfies MarkdownWidgetDefinition);
    const updated = next.widgets[1];
    expect(updated?.slug).toBe('B');
  });

  it('returns the input unchanged when the slug is not found', () => {
    const next = updateWidget(definition, 'MISSING', {
      slug: 'MISSING',
      type: 'markdown',
      size: { width: 6, height: 1 },
      contentLocalizationKey: 'Widget:Missing.Content',
    } satisfies MarkdownWidgetDefinition);
    expect(next).toBe(definition);
  });

  it('does not mutate the input definition', () => {
    const before = definition.widgets;
    updateWidget(definition, 'A', {
      slug: 'A',
      type: 'markdown',
      size: { width: 6, height: 1 },
      contentLocalizationKey: 'Widget:A.NewContent',
    } satisfies MarkdownWidgetDefinition);
    expect(definition.widgets).toBe(before);
  });
});

describe('removeWidget', () => {
  it('removes the widget matched by slug', () => {
    const next = removeWidget(definition, 'B');
    expect(next.widgets).toHaveLength(2);
    expect(next.widgets.map((w) => w.slug)).toEqual(['A', 'C']);
  });

  it('keeps the remaining widgets in order', () => {
    const next = removeWidget(definition, 'A');
    expect(next.widgets.map((w) => w.slug)).toEqual(['B', 'C']);
  });

  it('returns the input unchanged when the slug is not found', () => {
    const next = removeWidget(definition, 'MISSING');
    expect(next).toBe(definition);
  });

  it('does not mutate the input definition', () => {
    const before = definition.widgets;
    removeWidget(definition, 'A');
    expect(definition.widgets).toBe(before);
  });
});

describe('duplicateWidget', () => {
  it('appends a clone with a fresh unique slug', () => {
    const next = duplicateWidget(definition, 'A');
    expect(next.widgets).toHaveLength(4);
    const clone = next.widgets[3];
    expect(clone?.slug).toBe('Markdown1'); // minted off the source type
    expect((clone as MarkdownWidgetDefinition).contentLocalizationKey).toBe('Widget:A.Content');
  });

  it('drops titleLocalizationKey and x/y so the clone re-derives them', () => {
    const withMeta: DashboardDefinition = {
      ...definition,
      widgets: [
        {
          slug: 'A',
          type: 'markdown',
          x: 3,
          y: 1,
          size: { width: 6, height: 1 },
          contentLocalizationKey: 'Widget:A.Content',
          titleLocalizationKey: 'Widget:Test.A',
        },
      ],
    };
    const clone = duplicateWidget(withMeta, 'A').widgets[1];
    expect(clone?.x).toBeUndefined();
    expect(clone?.y).toBeUndefined();
    expect(clone?.titleLocalizationKey).toBeUndefined();
  });

  it('returns the input unchanged when the slug is not found', () => {
    expect(duplicateWidget(definition, 'MISSING')).toBe(definition);
  });

  it('does not mutate the input definition', () => {
    const before = definition.widgets;
    duplicateWidget(definition, 'A');
    expect(definition.widgets).toBe(before);
  });
});
