import { describe, expect, it } from 'vitest';

import { resolveActiveView } from '../lib/resolve-active-view';

import type { DashboardDefinition, DashboardView, WidgetDefinition } from '@granit/dashboards';

const widget = (slug: string, position: number): WidgetDefinition =>
  ({
    slug,
    type: 'markdown',
    position,
    size: { width: 12, height: 1 },
    contentLocalizationKey: `Widget:${slug}.Content`,
  }) as WidgetDefinition;

const baseDefinition: DashboardDefinition = {
  name: 'Granit.Test.Dashboard',
  category: 'General',
  isSystem: false,
  version: '1.0.0',
  layout: { columns: 12, rowHeight: 80 },
  widgets: [widget('Top', 0)],
};

const listView: DashboardView = {
  name: 'list',
  widgets: [widget('TableWidget', 0)],
};

const detailView: DashboardView = {
  name: 'detail',
  widgets: [widget('DetailKpi', 0)],
  layout: { columns: 6, rowHeight: 100 },
};

describe('resolveActiveView — single-view dashboards', () => {
  it('returns the top-level pool with activeViewName: null when views is null', () => {
    const result = resolveActiveView(baseDefinition);
    expect(result.activeViewName).toBeNull();
    expect(result.widgets).toBe(baseDefinition.widgets);
    expect(result.layout).toBe(baseDefinition.layout);
  });

  it('returns the top-level pool when views is an empty array', () => {
    const result = resolveActiveView({ ...baseDefinition, views: [] });
    expect(result.activeViewName).toBeNull();
    expect(result.widgets).toBe(baseDefinition.widgets);
  });
});

describe('resolveActiveView — multi-view dashboards', () => {
  const multiView: DashboardDefinition = {
    ...baseDefinition,
    views: [listView, detailView],
    defaultView: 'detail',
  };

  it('honours the explicit currentViewName when set', () => {
    const result = resolveActiveView(multiView, 'list');
    expect(result.activeViewName).toBe('list');
    expect(result.widgets).toBe(listView.widgets);
  });

  it('falls back to defaultView when currentViewName is null', () => {
    const result = resolveActiveView(multiView, null);
    expect(result.activeViewName).toBe('detail');
    expect(result.widgets).toBe(detailView.widgets);
  });

  it('falls back to the first view when defaultView is null too', () => {
    const result = resolveActiveView({ ...multiView, defaultView: null }, null);
    expect(result.activeViewName).toBe('list');
    expect(result.widgets).toBe(listView.widgets);
  });

  it('replaces the layout with the view override when set', () => {
    const result = resolveActiveView(multiView, 'detail');
    expect(result.layout).toBe(detailView.layout);
    expect(result.layout.columns).toBe(6);
  });

  it('falls back to the dashboard layout when the view has no layout override', () => {
    const result = resolveActiveView(multiView, 'list');
    expect(result.layout).toBe(multiView.layout);
  });

  it('returns the top-level pool when the requested view is not found', () => {
    const result = resolveActiveView(multiView, 'nonexistent');
    expect(result.activeViewName).toBeNull();
    expect(result.widgets).toBe(baseDefinition.widgets);
  });
});
