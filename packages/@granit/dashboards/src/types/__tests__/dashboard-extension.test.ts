import { describe, expect, it } from 'vitest';

import type {
  DashboardDefinition,
  DashboardFilter,
  DashboardLayout,
  DashboardView,
  EntityAlias,
} from '../index.js';

// Compile-time + runtime fixture proving the extended `DashboardDefinition`
// carries every backend field. Mirrors the corresponding
// `Granit.Dashboards.DashboardDefinition` shape on the wire.
//
// If the backend adds a new field, this fixture surfaces the drift —
// the test won't compile if the field is required.

const layout: DashboardLayout = {
  columns: 12,
  rowHeight: 80,
  widgetSizes: { Banner: { width: 12, height: 1 } },
  widgetOrder: ['Banner', 'Kpi'],
  breakpoints: {
    Sm: { columns: 6, hiddenWidgets: ['Pivot'] },
    Md: { rowHeight: 64 },
  },
};

const view: DashboardView = {
  name: 'list',
  widgets: [
    {
      slug: 'Banner',
      type: 'markdown',
      position: 0,
      size: { width: 12, height: 1 },
      contentLocalizationKey: 'Widget:View.Banner',
    },
  ],
  layout: null,
  displayNameLocalizationKey: 'Dashboard:Test.View.list',
};

const filter: DashboardFilter = {
  name: 'CurrentCustomer',
  labelLocalizationKey: 'Filter:CurrentCustomer',
  clauses: [{ field: 'customer.id', op: 'Eq', value: '${currentCustomer}' }],
  operation: 'And',
  editable: true,
};

const alias: EntityAlias = {
  name: 'currentCustomer',
  entityType: 'Customer',
  resolver: { kind: 'route-param', paramName: 'customerId' },
};

describe('DashboardDefinition — extended shape', () => {
  it('accepts every backend field including views / filters / aliases / time-window / responsive layout', () => {
    const definition: DashboardDefinition = {
      name: 'Granit.Test.Extended',
      category: 'General',
      isSystem: false,
      version: '1.0.0',
      layout,
      defaultTimeWindow: {
        period: { token: 'last_30d' },
        kind: 'History',
        aggregation: '00:01:00',
      },
      widgets: [],
      views: [view],
      defaultView: 'list',
      filters: [filter],
      aliases: [alias],
    };
    expect(definition.views).toHaveLength(1);
    expect(definition.filters?.[0]?.editable).toBe(true);
    expect(definition.aliases?.[0]?.resolver.kind).toBe('route-param');
    expect(definition.layout.breakpoints?.Sm?.hiddenWidgets).toEqual(['Pivot']);
    expect(definition.defaultTimeWindow?.aggregation).toBe('00:01:00');
  });

  it('accepts the minimal single-view shape (every multi-view field omitted)', () => {
    const minimal: DashboardDefinition = {
      name: 'Granit.Test.Minimal',
      category: 'General',
      isSystem: false,
      version: '1.0.0',
      layout: { columns: 12, rowHeight: 80 },
      widgets: [],
    };
    expect(minimal.views).toBeUndefined();
    expect(minimal.aliases).toBeUndefined();
  });

  it('round-trips through JSON without mutation', () => {
    const definition: DashboardDefinition = {
      name: 'Granit.Test.RoundTrip',
      category: 'General',
      isSystem: false,
      version: '1.0.0',
      layout,
      defaultTimeWindow: { period: { token: 'mtd' }, kind: 'History' },
      widgets: [],
      views: [view],
      defaultView: 'list',
      filters: [filter],
      aliases: [alias],
    };
    expect(JSON.parse(JSON.stringify(definition))).toEqual(definition);
  });
});
