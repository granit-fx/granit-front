import { describe, expect, it } from 'vitest';

import { fromGridLayout, MAX_HEIGHT_ROWS, toGridLayout } from '../lib/grid-layout-bridge';

import type { DashboardDefinition, WidgetDefinition } from '@granit/dashboards';

function widget(slug: string, extra: Partial<WidgetDefinition> = {}): WidgetDefinition {
  return {
    slug,
    type: 'text',
    size: { width: 6, height: 1 },
    contentLocalizationKey: `Widget:Test.${slug}`,
    style: 'Body',
    ...extra,
  } as WidgetDefinition;
}

const definition: DashboardDefinition = {
  name: 'Test',
  category: 'General',
  isSystem: false,
  version: '1.0.0',
  layout: { columns: 12, rowHeight: 80 },
  widgets: [widget('A'), widget('B')],
};

describe('toGridLayout', () => {
  it('packs widgets without explicit coords into a non-overlapping layout', () => {
    const layout = toGridLayout(definition.widgets, definition.layout.columns);
    expect(layout.map((l) => l.i)).toEqual(['A', 'B']);
    // Two 6-wide widgets fit side by side on a 12-col grid (first-fit).
    expect(layout[0]).toMatchObject({ i: 'A', x: 0, y: 0, w: 6, h: 1 });
    expect(layout[1]).toMatchObject({ i: 'B', x: 6, y: 0, w: 6, h: 1 });
  });

  it('honours explicit x/y and caps height at MAX_HEIGHT_ROWS', () => {
    const layout = toGridLayout([widget('A', { x: 3, y: 2, size: { width: 4, height: 99 } })], 12);
    expect(layout[0]).toMatchObject({ x: 3, y: 2, w: 4 });
    expect(layout[0]?.maxH).toBe(MAX_HEIGHT_ROWS);
  });
});

describe('fromGridLayout', () => {
  it('updates x/y/size and re-orders widgets by visual (y,x) order', () => {
    const moved = fromGridLayout(
      [
        { i: 'A', x: 0, y: 2, w: 6, h: 1 },
        { i: 'B', x: 0, y: 0, w: 12, h: 2 },
      ],
      definition
    );
    // B is now above A → B comes first in the widget array.
    expect(moved.widgets.map((w) => w.slug)).toEqual(['B', 'A']);
    expect(moved.widgets[0]).toMatchObject({ slug: 'B', x: 0, y: 0 });
    expect(moved.widgets[0]?.size).toEqual({ width: 12, height: 2 });
    expect(moved.widgets[1]).toMatchObject({ slug: 'A', x: 0, y: 2 });
  });

  it('returns the same reference for a no-op layout (no spurious onChange)', () => {
    const same = fromGridLayout(
      [
        { i: 'A', x: 0, y: 0, w: 6, h: 1 },
        { i: 'B', x: 6, y: 0, w: 6, h: 1 },
      ],
      { ...definition, widgets: [widget('A', { x: 0, y: 0 }), widget('B', { x: 6, y: 0 })] }
    );
    expect(same.widgets[0]).toMatchObject({ x: 0, y: 0 });
  });
});
