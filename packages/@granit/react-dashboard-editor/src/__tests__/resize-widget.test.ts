import { describe, expect, it } from 'vitest';

import { resizeWidget } from '../lib/resize-widget';

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
  ],
};

describe('resizeWidget', () => {
  it('updates the targeted widget size, leaves siblings untouched', () => {
    const next = resizeWidget(baseDefinition, 'A', { width: 6, height: 2 });
    expect(next.widgets[0]?.size).toEqual({ width: 6, height: 2 });
    expect(next.widgets[1]?.size).toEqual({ width: 4, height: 1 });
  });

  it('returns the original definition when the slug is unknown (referential equality)', () => {
    const next = resizeWidget(baseDefinition, 'Z', { width: 6, height: 2 });
    expect(next).toBe(baseDefinition);
  });

  it('returns the original definition when the new size matches the current size', () => {
    const next = resizeWidget(baseDefinition, 'A', { width: 4, height: 1 });
    expect(next).toBe(baseDefinition);
  });

  it('clamps width to [1, layout.columns]', () => {
    expect(resizeWidget(baseDefinition, 'A', { width: 0, height: 1 }).widgets[0]?.size.width).toBe(
      1
    );
    expect(resizeWidget(baseDefinition, 'A', { width: 99, height: 1 }).widgets[0]?.size.width).toBe(
      12
    );
  });

  it('clamps height to [1, 12]', () => {
    expect(resizeWidget(baseDefinition, 'A', { width: 4, height: 0 }).widgets[0]?.size.height).toBe(
      1
    );
    expect(
      resizeWidget(baseDefinition, 'A', { width: 4, height: 99 }).widgets[0]?.size.height
    ).toBe(12);
  });

  it('clamps width/height up to the supplied minSize floor', () => {
    const next = resizeWidget(
      baseDefinition,
      'A',
      { width: 1, height: 1 },
      { width: 2, height: 2 }
    );
    expect(next.widgets[0]?.size).toEqual({ width: 2, height: 2 });
  });

  it('allows sizes at or above the minSize floor', () => {
    const next = resizeWidget(
      baseDefinition,
      'A',
      { width: 5, height: 3 },
      { width: 2, height: 2 }
    );
    expect(next.widgets[0]?.size).toEqual({ width: 5, height: 3 });
  });

  it('clamps the minSize itself to the grid bounds (min never exceeds columns)', () => {
    const next = resizeWidget(
      baseDefinition,
      'A',
      { width: 1, height: 1 },
      { width: 99, height: 1 }
    );
    expect(next.widgets[0]?.size.width).toBe(12);
  });

  it('defaults the minSize to 1x1 when omitted (historical behaviour)', () => {
    const next = resizeWidget(baseDefinition, 'A', { width: 1, height: 1 });
    expect(next.widgets[0]?.size).toEqual({ width: 1, height: 1 });
  });

  it('preserves all non-size fields on the resized widget', () => {
    const next = resizeWidget(baseDefinition, 'A', { width: 6, height: 2 });
    const a = next.widgets[0];
    expect(a).toMatchObject({
      slug: 'A',
      type: 'text',
      position: 0,
      contentLocalizationKey: 'Widget:A',
      style: 'Body',
    });
  });
});
