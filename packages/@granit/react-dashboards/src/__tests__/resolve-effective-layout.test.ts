import { describe, expect, it } from 'vitest';

import { applyLayoutOverride, resolveEffectiveLayout } from '../lib/resolve-effective-layout';

import type { DashboardLayout, WidgetDefinition } from '@granit/dashboards';

const baseLayout: DashboardLayout = {
  columns: 12,
  rowHeight: 80,
  widgetSizes: { Banner: { width: 12, height: 1 } },
  widgetOrder: ['Banner', 'Kpi'],
  breakpoints: {
    Sm: { columns: 6, hiddenWidgets: ['Pivot'] },
    Md: { rowHeight: 100, widgetSizes: { Banner: { width: 6, height: 1 } } },
  },
};

const widget = (slug: string, position: number, width = 3, height = 1): WidgetDefinition =>
  ({
    slug,
    type: 'markdown',
    position,
    size: { width, height },
    contentLocalizationKey: `Widget:${slug}.Content`,
  }) as WidgetDefinition;

describe('applyLayoutOverride', () => {
  it('returns the base layout verbatim when no override is provided', () => {
    const effective = applyLayoutOverride(baseLayout, undefined);
    expect(effective.columns).toBe(12);
    expect(effective.rowHeight).toBe(80);
    expect(effective.widgetSizes).toEqual({ Banner: { width: 12, height: 1 } });
    expect(effective.widgetOrder).toEqual(['Banner', 'Kpi']);
    expect(effective.hiddenWidgets.size).toBe(0);
  });

  it('replaces scalar fields when set on the override', () => {
    const effective = applyLayoutOverride(baseLayout, { columns: 6, rowHeight: 100 });
    expect(effective.columns).toBe(6);
    expect(effective.rowHeight).toBe(100);
  });

  it('shallow-merges widgetSizes (override slugs replace, others fall through)', () => {
    const effective = applyLayoutOverride(baseLayout, {
      widgetSizes: { Kpi: { width: 6, height: 2 } },
    });
    expect(effective.widgetSizes).toEqual({
      Banner: { width: 12, height: 1 },
      Kpi: { width: 6, height: 2 },
    });
  });

  it('overrides widgetOrder verbatim when set', () => {
    const effective = applyLayoutOverride(baseLayout, { widgetOrder: ['Kpi', 'Banner'] });
    expect(effective.widgetOrder).toEqual(['Kpi', 'Banner']);
  });

  it('exposes hiddenWidgets as a Set for O(1) lookups', () => {
    const effective = applyLayoutOverride(baseLayout, { hiddenWidgets: ['Pivot', 'Kpi'] });
    expect(effective.hiddenWidgets.has('Pivot')).toBe(true);
    expect(effective.hiddenWidgets.has('Banner')).toBe(false);
  });
});

describe('resolveEffectiveLayout', () => {
  const widgets: readonly WidgetDefinition[] = [
    widget('Banner', 0, 12, 1),
    widget('Kpi', 1, 3, 1),
    widget('Pivot', 2, 6, 2),
  ];

  it('returns the original widgets reference when no breakpoint override touches them', () => {
    const { layout, widgets: result } = resolveEffectiveLayout(baseLayout, widgets, 'Lg');
    // No 'Lg' override → base widgetSizes (Banner) match the declared
    // sizes → no per-widget mutation. The order list reorders, so
    // the array reference is allowed to differ but content matches.
    expect(layout.columns).toBe(12);
    expect(layout.rowHeight).toBe(80);
    expect(result.map((w) => w.slug)).toEqual(['Banner', 'Kpi', 'Pivot']);
  });

  it('applies the active-breakpoint override on top of the base', () => {
    const { layout } = resolveEffectiveLayout(baseLayout, widgets, 'Sm');
    expect(layout.columns).toBe(6);
    expect(layout.hiddenWidgets.has('Pivot')).toBe(true);
  });

  it('drops hiddenWidgets from the rendered list (widget pool stays intact)', () => {
    const { widgets: result } = resolveEffectiveLayout(baseLayout, widgets, 'Sm');
    expect(result.map((w) => w.slug)).toEqual(['Banner', 'Kpi']);
    expect(result).toHaveLength(2);
  });

  it('replaces widget size when the override carries widgetSizes', () => {
    const { widgets: result } = resolveEffectiveLayout(baseLayout, widgets, 'Md');
    const banner = result.find((w) => w.slug === 'Banner');
    expect(banner?.size).toEqual({ width: 6, height: 1 });
  });

  it('honours widgetOrder before declared position', () => {
    const layout: DashboardLayout = {
      columns: 12,
      rowHeight: 80,
      widgetOrder: ['Kpi', 'Banner', 'Pivot'],
    };
    const { widgets: result } = resolveEffectiveLayout(layout, widgets, 'Lg');
    expect(result.map((w) => w.slug)).toEqual(['Kpi', 'Banner', 'Pivot']);
  });

  it('appends widgets not listed in widgetOrder in declared position order', () => {
    const layout: DashboardLayout = {
      columns: 12,
      rowHeight: 80,
      widgetOrder: ['Kpi'],
    };
    const { widgets: result } = resolveEffectiveLayout(layout, widgets, 'Lg');
    expect(result.map((w) => w.slug)).toEqual(['Kpi', 'Banner', 'Pivot']);
  });

  it('emits the same widget references when no widget needs a size override', () => {
    const layout: DashboardLayout = { columns: 12, rowHeight: 80 };
    const { widgets: result } = resolveEffectiveLayout(layout, widgets, 'Lg');
    // No size overrides → mapping should not allocate replacement widget
    // objects. We can't assert reference equality on the array (sort
    // creates a new array) but per-widget references should match.
    for (const w of widgets) {
      const found = result.find((r) => r.slug === w.slug);
      expect(found).toBe(w);
    }
  });
});
