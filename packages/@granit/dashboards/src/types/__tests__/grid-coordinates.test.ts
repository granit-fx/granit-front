import { describe, expect, it } from 'vitest';

import { packWidgetCoordinates, resolveWidgetCoordinates } from '../grid-coordinates';

import type { WidgetDefinitionBase } from '../widget-definition';

function w(slug: string, width: number, height: number, extra: Partial<WidgetDefinitionBase> = {}) {
  return {
    slug,
    type: 'text',
    position: 0,
    size: { width, height },
    ...extra,
  } as WidgetDefinitionBase;
}

describe('packWidgetCoordinates', () => {
  it('first-fits widgets row by row on a fixed-width grid', () => {
    const coords = packWidgetCoordinates([w('A', 6, 1), w('B', 6, 1), w('C', 6, 1)], 12);
    expect(coords).toEqual([
      { x: 0, y: 0 },
      { x: 6, y: 0 },
      { x: 0, y: 1 },
    ]);
  });

  it('clamps widths wider than the grid to the column count', () => {
    const coords = packWidgetCoordinates([w('A', 99, 1)], 12);
    expect(coords[0]).toEqual({ x: 0, y: 0 });
  });

  it('stacks tall widgets so later ones skip occupied rows', () => {
    const coords = packWidgetCoordinates([w('A', 12, 2), w('B', 12, 1)], 12);
    expect(coords).toEqual([
      { x: 0, y: 0 },
      { x: 0, y: 2 },
    ]);
  });
});

describe('resolveWidgetCoordinates', () => {
  it('honours explicit coords and packs the rest around them', () => {
    const coords = resolveWidgetCoordinates([w('A', 6, 1, { x: 6, y: 0 }), w('B', 6, 1)], 12);
    // A is pinned at (6,0); B first-fits into the free (0,0) slot.
    expect(coords[0]).toEqual({ x: 6, y: 0 });
    expect(coords[1]).toEqual({ x: 0, y: 0 });
  });

  it('treats a widget with only one coord as unplaced', () => {
    const coords = resolveWidgetCoordinates([w('A', 6, 1, { x: 3 })], 12);
    expect(coords[0]).toEqual({ x: 0, y: 0 });
  });
});
