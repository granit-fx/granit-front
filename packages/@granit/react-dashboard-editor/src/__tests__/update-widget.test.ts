import { describe, expect, it } from 'vitest';

import { removeWidget, updateWidget } from '../lib/update-widget.js';

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
      position: 0,
      size: { width: 6, height: 1 },
      contentLocalizationKey: 'Widget:A.Content',
    },
    {
      slug: 'B',
      type: 'markdown',
      position: 1,
      size: { width: 6, height: 1 },
      contentLocalizationKey: 'Widget:B.Content',
    },
    {
      slug: 'C',
      type: 'markdown',
      position: 2,
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
      position: 1,
      size: { width: 6, height: 1 },
      contentLocalizationKey: 'Widget:B.NewContent',
    } satisfies MarkdownWidgetDefinition);
    const updated = next.widgets[1] as MarkdownWidgetDefinition;
    expect(updated.contentLocalizationKey).toBe('Widget:B.NewContent');
  });

  it('preserves the existing slug + position even when the patch attempts to change them', () => {
    const next = updateWidget(definition, 'B', {
      slug: 'RENAMED',
      type: 'markdown',
      position: 99,
      size: { width: 6, height: 1 },
      contentLocalizationKey: 'Widget:B.NewContent',
    } satisfies MarkdownWidgetDefinition);
    const updated = next.widgets[1];
    expect(updated?.slug).toBe('B');
    expect(updated?.position).toBe(1);
  });

  it('returns the input unchanged when the slug is not found', () => {
    const next = updateWidget(definition, 'MISSING', {
      slug: 'MISSING',
      type: 'markdown',
      position: 0,
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
      position: 0,
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

  it('re-ranks remaining widgets into a dense 0-based position sequence', () => {
    const next = removeWidget(definition, 'A');
    expect(next.widgets.map((w) => w.position)).toEqual([0, 1]);
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
