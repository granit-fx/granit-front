import { describe, expect, it } from 'vitest';

import { reorderWidgets } from '../lib/reorder-widgets';

import type { DashboardDefinition } from '@granit/dashboards';

const baseDefinition: DashboardDefinition = {
  name: 'Test',
  category: 'General',
  isSystem: false,
  version: '1.0.0',
  layout: { columns: 12, rowHeight: 80 },
  widgets: [
    {
      slug: 'A',
      type: 'text',
      position: 0,
      size: { width: 4, height: 1 },
      contentLocalizationKey: 'Widget:A',
      style: 'Body',
    },
    {
      slug: 'B',
      type: 'text',
      position: 1,
      size: { width: 4, height: 1 },
      contentLocalizationKey: 'Widget:B',
      style: 'Body',
    },
    {
      slug: 'C',
      type: 'text',
      position: 2,
      size: { width: 4, height: 1 },
      contentLocalizationKey: 'Widget:C',
      style: 'Body',
    },
  ],
};

describe('reorderWidgets', () => {
  it('moves the source widget to the target position and re-ranks', () => {
    const next = reorderWidgets(baseDefinition, 'A', 'C');
    expect(next.widgets.map((w) => w.slug)).toEqual(['B', 'C', 'A']);
    expect(next.widgets.map((w) => w.position)).toEqual([0, 1, 2]);
  });

  it('returns the input unchanged when source equals target', () => {
    const next = reorderWidgets(baseDefinition, 'B', 'B');
    expect(next).toBe(baseDefinition);
  });

  it('returns the input unchanged when source is unknown', () => {
    const next = reorderWidgets(baseDefinition, 'Z', 'A');
    expect(next).toBe(baseDefinition);
  });

  it('returns the input unchanged when target is unknown', () => {
    const next = reorderWidgets(baseDefinition, 'A', 'Z');
    expect(next).toBe(baseDefinition);
  });

  it('preserves the dashboard metadata (name, category, layout)', () => {
    const next = reorderWidgets(baseDefinition, 'A', 'B');
    expect(next.name).toBe(baseDefinition.name);
    expect(next.category).toBe(baseDefinition.category);
    expect(next.layout).toEqual(baseDefinition.layout);
  });

  it('preserves widget content (only position changes)', () => {
    const next = reorderWidgets(baseDefinition, 'A', 'C');
    const moved = next.widgets.find((w) => w.slug === 'A');
    expect(moved).toMatchObject({
      slug: 'A',
      type: 'text',
      size: { width: 4, height: 1 },
      contentLocalizationKey: 'Widget:A',
    });
  });

  it('produces dense-ranked positions (0-based, contiguous) regardless of input gaps', () => {
    const sparse: DashboardDefinition = {
      ...baseDefinition,
      widgets: baseDefinition.widgets.map((w, i) => ({ ...w, position: i * 10 })),
    };
    const next = reorderWidgets(sparse, 'A', 'C');
    expect(next.widgets.map((w) => w.position)).toEqual([0, 1, 2]);
  });
});
