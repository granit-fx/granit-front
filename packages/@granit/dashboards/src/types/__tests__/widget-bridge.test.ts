import { describe, expect, it } from 'vitest';

import {
  dashboardDetailToDefinition,
  diffDashboardWidgets,
  extractSlugFromTitleKey,
  widgetDefinitionToAddRequest,
  widgetDefinitionToUpdateRequest,
  widgetInstanceToDefinition,
} from '../widget-bridge';

import type {
  MarkdownWidgetDefinition,
  TextWidgetDefinition,
  WidgetDefinition,
  WidgetDefinitionBase,
} from '../../types/index';
import type { DashboardDetailResponse } from '../dashboard-detail-response';
import type { WidgetInstanceResponse } from '../widget-instance-response';

// Minimal stand-ins for the analytics widget shapes — replicated locally
// to keep `@granit/dashboards` dep-free (the bridge works on the open
// `WidgetDefinition` union; analytics-specific tests live in their own
// package).
interface KpiWidgetStub extends WidgetDefinitionBase {
  readonly type: 'kpi';
  readonly datasource:
    | { readonly kind: 'metric'; readonly metricName: string }
    | {
        readonly kind: 'query-aggregate';
        readonly queryName: string;
        readonly aggregation: string;
        readonly field: string | null;
      };
}

interface MapWidgetStub extends WidgetDefinitionBase {
  readonly type: 'map';
  readonly queryName: string;
  readonly pointSource: {
    readonly kind: 'lat-lng';
    readonly latitudeColumn: string;
    readonly longitudeColumn: string;
  };
}

interface ChartWidgetStub extends WidgetDefinitionBase {
  readonly type: 'chart';
  readonly queryName: string;
  readonly groupBy: string;
  readonly aggregation: string;
  readonly field: string | null;
  readonly chartType: string;
}

const DASHBOARD_NAME = 'Granit.Showcase.Demo';
const ID = '8c6b1e10-0000-4000-8000-000000000001';
const WIDGET_ID = '8c6b1e10-0000-0000-0000-000000000010';

describe('extractSlugFromTitleKey', () => {
  it('strips the conventional `Widget:{DashboardName}.` prefix', () => {
    expect(extractSlugFromTitleKey(`Widget:${DASHBOARD_NAME}.Banner`, DASHBOARD_NAME)).toBe(
      'Banner'
    );
  });

  it('falls back to the suffix after the last dot when the prefix does not match', () => {
    expect(extractSlugFromTitleKey('Custom.Key.Banner', DASHBOARD_NAME)).toBe('Banner');
  });

  it('returns the verbatim string when no dot is present', () => {
    expect(extractSlugFromTitleKey('Banner', DASHBOARD_NAME)).toBe('Banner');
  });
});

describe('widgetInstanceToDefinition', () => {
  it('round-trips a markdown widget through the bridge', () => {
    const instance: WidgetInstanceResponse = {
      id: WIDGET_ID,
      widgetType: 'Markdown',
      x: 4,
      y: 3,
      width: 12,
      height: 1,
      titleLocalizationKey: `Widget:${DASHBOARD_NAME}.Banner`,
      metricName: null,
      queryName: null,
      configJson: JSON.stringify({ contentLocalizationKey: 'Widget:Demo.Banner.Content' }),
      requiredPermission: null,
    };
    const widget = widgetInstanceToDefinition(instance, DASHBOARD_NAME) as MarkdownWidgetDefinition;
    expect(widget.slug).toBe('Banner');
    expect(widget.type).toBe('markdown');
    expect(widget.x).toBe(4);
    expect(widget.y).toBe(3);
    expect(widget.size).toEqual({ width: 12, height: 1 });
    expect(widget.contentLocalizationKey).toBe('Widget:Demo.Banner.Content');
  });

  it('preserves requiredPermission when set', () => {
    const instance: WidgetInstanceResponse = {
      id: WIDGET_ID,
      widgetType: 'Text',
      x: 0,
      y: 0,
      width: 3,
      height: 1,
      titleLocalizationKey: `Widget:${DASHBOARD_NAME}.Note`,
      metricName: null,
      queryName: null,
      configJson: JSON.stringify({ contentLocalizationKey: 'Widget:Demo.Note', style: 'Body' }),
      requiredPermission: 'Granit.Demo.SeeNote',
    };
    const widget = widgetInstanceToDefinition(instance, DASHBOARD_NAME) as TextWidgetDefinition;
    expect(widget.requiredPermission).toBe('Granit.Demo.SeeNote');
  });

  it('survives malformed configJson by returning a minimal widget shape', () => {
    const instance: WidgetInstanceResponse = {
      id: WIDGET_ID,
      widgetType: 'Markdown',
      x: 0,
      y: 0,
      width: 6,
      height: 1,
      titleLocalizationKey: `Widget:${DASHBOARD_NAME}.Broken`,
      metricName: null,
      queryName: null,
      configJson: '{this is not valid json',
      requiredPermission: null,
    };
    const widget = widgetInstanceToDefinition(instance, DASHBOARD_NAME);
    expect(widget.slug).toBe('Broken');
    expect(widget.type).toBe('markdown');
  });

  it('reads queryName from configJson for a query-backed widget (backend-corrected path)', () => {
    const instance: WidgetInstanceResponse = {
      id: WIDGET_ID,
      widgetType: 'Chart',
      x: 0,
      y: 0,
      width: 6,
      height: 3,
      titleLocalizationKey: `Widget:${DASHBOARD_NAME}.Cancellations`,
      metricName: null,
      queryName: 'Granit.Subscriptions.SubscriptionsQuery',
      configJson: JSON.stringify({
        queryName: 'Granit.Subscriptions.SubscriptionsQuery',
        groupBy: 'Week',
        aggregation: 'Count',
        field: null,
        chartType: 'Line',
      }),
      requiredPermission: null,
    };
    const widget = widgetInstanceToDefinition(instance, DASHBOARD_NAME) as ChartWidgetStub;
    expect(widget.queryName).toBe('Granit.Subscriptions.SubscriptionsQuery');
  });

  it('falls back to the denormalized queryName column when configJson omits it (legacy dashboard)', () => {
    const instance: WidgetInstanceResponse = {
      id: WIDGET_ID,
      widgetType: 'Chart',
      x: 0,
      y: 0,
      width: 6,
      height: 3,
      titleLocalizationKey: `Widget:${DASHBOARD_NAME}.Cancellations`,
      metricName: null,
      // The denormalized column carries the query; the legacy configJson does not.
      queryName: 'Granit.Subscriptions.SubscriptionsQuery',
      configJson: JSON.stringify({
        groupBy: 'Week',
        aggregation: 'Count',
        field: null,
        chartType: 'Line',
      }),
      requiredPermission: null,
    };
    const widget = widgetInstanceToDefinition(instance, DASHBOARD_NAME) as ChartWidgetStub;
    expect(widget.queryName).toBe('Granit.Subscriptions.SubscriptionsQuery');
  });
});

describe('dashboardDetailToDefinition', () => {
  it('lifts the full detail response into the editor-shaped DashboardDefinition', () => {
    const detail: DashboardDetailResponse = {
      id: ID,
      name: DASHBOARD_NAME,
      category: 'General',
      status: 'Draft',
      isSystem: false,
      sourceDefinitionName: DASHBOARD_NAME,
      sourceDefinitionVersion: '1.2.3',
      layoutColumns: 12,
      layoutRowHeight: 80,
      defaultTimeWindow: { period: { token: 'last_7d' }, kind: 'History' },
      widgets: [
        {
          id: WIDGET_ID,
          widgetType: 'Markdown',
          width: 12,
          x: 0,
          y: 0,
          height: 1,
          titleLocalizationKey: `Widget:${DASHBOARD_NAME}.Banner`,
          metricName: null,
          queryName: null,
          configJson: JSON.stringify({ contentLocalizationKey: 'Widget:Demo.Banner' }),
          requiredPermission: null,
        },
      ],
    };
    const definition = dashboardDetailToDefinition(detail);
    expect(definition.name).toBe(DASHBOARD_NAME);
    expect(definition.version).toBe('1.2.3');
    expect(definition.layout).toEqual({ columns: 12, rowHeight: 80 });
    expect(definition.defaultTimeWindow).toEqual({ period: { token: 'last_7d' }, kind: 'History' });
    expect(definition.widgets).toHaveLength(1);
    expect(definition.widgets[0]?.slug).toBe('Banner');
  });

  it('falls back to "1.0.0" when sourceDefinitionVersion is null (ad-hoc dashboard)', () => {
    const detail: DashboardDetailResponse = {
      id: ID,
      name: DASHBOARD_NAME,
      category: 'General',
      status: 'Draft',
      isSystem: false,
      sourceDefinitionName: null,
      sourceDefinitionVersion: null,
      layoutColumns: 12,
      layoutRowHeight: 80,
      defaultTimeWindow: null,
      widgets: [],
    };
    expect(dashboardDetailToDefinition(detail).version).toBe('1.0.0');
  });
});

describe('widgetDefinitionToAddRequest', () => {
  it('serializes a markdown widget into the AddWidgetRequest shape', () => {
    const widget: MarkdownWidgetDefinition = {
      slug: 'Banner',
      type: 'markdown',
      size: { width: 12, height: 1 },
      contentLocalizationKey: 'Widget:Demo.Banner.Content',
    };
    const request = widgetDefinitionToAddRequest(widget, DASHBOARD_NAME);
    expect(request.widgetType).toBe('Markdown');
    expect(request.titleLocalizationKey).toBe(`Widget:${DASHBOARD_NAME}.Banner`);
    expect(request.metricName).toBeNull();
    expect(request.queryName).toBeNull();
    expect(JSON.parse(request.configJson)).toEqual({
      contentLocalizationKey: 'Widget:Demo.Banner.Content',
    });
  });

  it('denormalizes metricName for a KPI bound to a Metric datasource', () => {
    const widget: KpiWidgetStub = {
      slug: 'UnpaidCount',
      type: 'kpi',
      size: { width: 3, height: 1 },
      datasource: { kind: 'metric', metricName: 'Granit.Invoicing.UnpaidInvoiceCountMetric' },
    };
    const request = widgetDefinitionToAddRequest(widget, DASHBOARD_NAME);
    expect(request.metricName).toBe('Granit.Invoicing.UnpaidInvoiceCountMetric');
    expect(request.queryName).toBeNull();
  });

  it('denormalizes queryName for a KPI bound to a QueryAggregate datasource', () => {
    const widget: KpiWidgetStub = {
      slug: 'TotalRevenue',
      type: 'kpi',
      size: { width: 3, height: 1 },
      datasource: {
        kind: 'query-aggregate',
        queryName: 'Granit.Invoicing.RevenueQuery',
        aggregation: 'Sum',
        field: 'Total',
      },
    };
    const request = widgetDefinitionToAddRequest(widget, DASHBOARD_NAME);
    expect(request.metricName).toBeNull();
    expect(request.queryName).toBe('Granit.Invoicing.RevenueQuery');
  });

  it('denormalizes queryName for non-KPI data widgets (chart / table / pivot / map)', () => {
    const widget: MapWidgetStub = {
      slug: 'Branches',
      type: 'map',
      size: { width: 6, height: 4 },
      queryName: 'Granit.Test.Branches',
      pointSource: { kind: 'lat-lng', latitudeColumn: 'Lat', longitudeColumn: 'Lng' },
    };
    const request = widgetDefinitionToAddRequest(widget, DASHBOARD_NAME);
    expect(request.queryName).toBe('Granit.Test.Branches');
    expect(request.metricName).toBeNull();
  });
});

describe('widgetDefinitionToUpdateRequest', () => {
  it('emits the editable fields the backend accepts on PUT (incl. grid coords)', () => {
    const widget: MarkdownWidgetDefinition = {
      slug: 'Banner',
      type: 'markdown',
      x: 4,
      y: 2,
      size: { width: 6, height: 2 },
      contentLocalizationKey: 'Widget:Demo.Banner.Content',
    };
    const request = widgetDefinitionToUpdateRequest(widget, DASHBOARD_NAME);
    expect(request).toEqual({
      x: 4,
      y: 2,
      width: 6,
      height: 2,
      titleLocalizationKey: `Widget:${DASHBOARD_NAME}.Banner`,
      configJson: JSON.stringify({ contentLocalizationKey: 'Widget:Demo.Banner.Content' }),
    });
  });

  it('defaults grid coords to 0 when the definition omits x/y', () => {
    const widget: MarkdownWidgetDefinition = {
      slug: 'Banner',
      type: 'markdown',
      size: { width: 6, height: 2 },
      contentLocalizationKey: 'Widget:Demo.Banner.Content',
    };
    const request = widgetDefinitionToUpdateRequest(widget, DASHBOARD_NAME);
    expect(request.x).toBe(0);
    expect(request.y).toBe(0);
  });
});

describe('KPI configJson bridge (bare-Datasource contract)', () => {
  // The backend treats a KPI's `configJson` as the bare polymorphic
  // `Datasource` (`JsonSerializer.Serialize<Datasource>`): a top-level
  // `{ kind, metricName }`, NOT a `{ datasource: { … } }` wrapper. The bridge
  // must lift it under `datasource` on read and re-emit it bare on write.
  const BARE_DATASOURCE = {
    kind: 'metric',
    metricName: 'Granit.Invoicing.UnpaidInvoiceCountMetric',
  };

  it('lifts a bare-datasource configJson under `widget.datasource` (regression: KpiTile crash)', () => {
    const instance: WidgetInstanceResponse = {
      id: WIDGET_ID,
      widgetType: 'Kpi',
      x: 0,
      y: 0,
      width: 3,
      height: 2,
      titleLocalizationKey: `Widget:${DASHBOARD_NAME}.UnpaidCount`,
      metricName: 'Granit.Invoicing.UnpaidInvoiceCountMetric',
      queryName: null,
      configJson: JSON.stringify(BARE_DATASOURCE),
      requiredPermission: null,
    };
    const widget = widgetInstanceToDefinition(instance, DASHBOARD_NAME) as KpiWidgetStub;
    // The crash was `isMetricDatasource(undefined)` — assert the binding is
    // present and correctly shaped, not spread flat onto the widget.
    expect(widget.datasource).toBeDefined();
    expect(widget.datasource).toEqual(BARE_DATASOURCE);
    expect((widget as unknown as Record<string, unknown>)['kind']).toBeUndefined();
    expect((widget as unknown as Record<string, unknown>)['metricName']).toBeUndefined();
  });

  it('re-emits the bare datasource (not a wrapper) on write', () => {
    const widget: KpiWidgetStub = {
      slug: 'UnpaidCount',
      type: 'kpi',
      size: { width: 3, height: 2 },
      datasource: { kind: 'metric', metricName: 'Granit.Invoicing.UnpaidInvoiceCountMetric' },
    };
    const request = widgetDefinitionToAddRequest(widget, DASHBOARD_NAME);
    expect(JSON.parse(request.configJson)).toEqual(BARE_DATASOURCE);
    expect(JSON.parse(request.configJson)).not.toHaveProperty('datasource');
  });
});

describe('round-trip: instance → definition → addRequest → instance-shaped fields', () => {
  it('preserves every widget field across the bridge', () => {
    const original: WidgetInstanceResponse = {
      id: WIDGET_ID,
      widgetType: 'Kpi',
      x: 0,
      y: 0,
      width: 3,
      height: 1,
      titleLocalizationKey: `Widget:${DASHBOARD_NAME}.UnpaidCount`,
      metricName: 'Granit.Invoicing.UnpaidInvoiceCountMetric',
      queryName: null,
      // Bare polymorphic Datasource — exactly what the backend persists.
      configJson: JSON.stringify({
        kind: 'metric',
        metricName: 'Granit.Invoicing.UnpaidInvoiceCountMetric',
      }),
      requiredPermission: null,
    };
    const definition = widgetInstanceToDefinition(original, DASHBOARD_NAME);
    const addRequest = widgetDefinitionToAddRequest(definition, DASHBOARD_NAME);
    expect(addRequest.widgetType).toBe(original.widgetType);
    expect(addRequest.width).toBe(original.width);
    expect(addRequest.height).toBe(original.height);
    expect(addRequest.titleLocalizationKey).toBe(original.titleLocalizationKey);
    // `metricName` is denormalized off the datasource, reproducing the column.
    expect(addRequest.metricName).toBe(original.metricName);
    expect(addRequest.queryName).toBe(original.queryName);
    expect(JSON.parse(addRequest.configJson)).toEqual(JSON.parse(original.configJson));
  });
});

describe('diffDashboardWidgets', () => {
  function makeServerInstance(slug: string, y = 0): WidgetInstanceResponse {
    return {
      id: `id-${slug}`,
      widgetType: 'Markdown',
      x: 0,
      y,
      width: 12,
      height: 1,
      titleLocalizationKey: `Widget:${DASHBOARD_NAME}.${slug}`,
      metricName: null,
      queryName: null,
      configJson: JSON.stringify({ contentLocalizationKey: `Widget:${DASHBOARD_NAME}.${slug}` }),
      requiredPermission: null,
    };
  }

  function makeLocalWidget(slug: string, y = 0): WidgetDefinition {
    return {
      slug,
      type: 'markdown',
      x: 0,
      y,
      size: { width: 12, height: 1 },
      contentLocalizationKey: `Widget:${DASHBOARD_NAME}.${slug}`,
    } satisfies MarkdownWidgetDefinition;
  }

  it('classifies new local slugs as `added`', () => {
    const diff = diffDashboardWidgets([], [makeLocalWidget('Banner', 0)], DASHBOARD_NAME);
    expect(diff.added).toHaveLength(1);
    expect(diff.added[0]?.slug).toBe('Banner');
    expect(diff.updated).toHaveLength(0);
    expect(diff.removed).toHaveLength(0);
  });

  it('classifies missing slugs as `removed` and carries the server widget id', () => {
    const diff = diffDashboardWidgets([makeServerInstance('Banner', 0)], [], DASHBOARD_NAME);
    expect(diff.removed).toEqual([{ slug: 'Banner', widgetId: 'id-Banner' }]);
  });

  it('classifies grid-coordinate changes as `updated`', () => {
    const diff = diffDashboardWidgets(
      [makeServerInstance('Banner', 0)],
      [makeLocalWidget('Banner', 1)],
      DASHBOARD_NAME
    );
    expect(diff.updated).toHaveLength(1);
    expect(diff.updated[0]?.widgetId).toBe('id-Banner');
    expect(diff.updated[0]?.request.y).toBe(1);
  });

  it('emits zero ops when local + server match exactly (no-op idempotency)', () => {
    const diff = diffDashboardWidgets(
      [makeServerInstance('Banner', 0)],
      [makeLocalWidget('Banner', 0)],
      DASHBOARD_NAME
    );
    expect(diff.added).toHaveLength(0);
    expect(diff.updated).toHaveLength(0);
    expect(diff.removed).toHaveLength(0);
  });

  it('handles a mixed diff (add + update + remove in one pass)', () => {
    const server: WidgetInstanceResponse[] = [
      makeServerInstance('Banner', 0),
      makeServerInstance('Note', 1),
    ];
    const local: WidgetDefinition[] = [
      makeLocalWidget('Banner', 0), // unchanged
      makeLocalWidget('Kpi', 1), // new
      // 'Note' removed
    ];
    const diff = diffDashboardWidgets(server, local, DASHBOARD_NAME);
    expect(diff.added.map((a) => a.slug)).toEqual(['Kpi']);
    expect(diff.removed.map((r) => r.slug)).toEqual(['Note']);
    expect(diff.updated).toHaveLength(0);
  });
});
