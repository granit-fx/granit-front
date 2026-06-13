// ---------------------------------------------------------------------------
// @granit/react-dashboards/testing — mock data
// ---------------------------------------------------------------------------
//
// Fixtures backing the dashboards MSW handlers — stand-ins for B4-render
// (POST /:id/render), B4-write (lifecycle CRUD), and the catalog endpoint on
// `Granit.Dashboards.Endpoints`. Two seeded persisted dashboards so the list
// isn't empty on first load:
//
//   • `Granit.Showcase.InvoicingOverview` — Published, finance widgets, seeded
//     at v1.0.0 against a v1.1.0 catalog entry (drift = `Behind`, demos the
//     resync flow / ADR-038).
//   • `Granit.Showcase.Welcome` — Draft, framework-only static widgets
//     (markdown / image / text), aligned with its catalog.
//
// Mock data typed against `@granit/dashboards` wire contracts.

import { Datasource, WIDGET_SIZE, widgetDefinitionToAddRequest } from '@granit/dashboards';

import type {
  DashboardCatalogEntryResponse,
  DashboardDefinition,
  DashboardDetailResponse,
  DashboardRenderedWidget,
  DashboardRenderResponse,
  WidgetInstanceResponse,
} from '@granit/dashboards';
import type { Mutable } from '@granit/testing';

export const SAMPLE_FINANCE_DASHBOARD_ID = '8c6b1e10-0000-4000-8000-000000000001';
export const SAMPLE_WELCOME_DASHBOARD_ID = '8c6b1e10-0000-4000-8000-000000000002';

// ---------------------------------------------------------------------------
// Render bundles — synthetic projections mirroring what the KPI widget
// renderers (B3-2) + the static-content renderers (B3-3) would emit.
// ---------------------------------------------------------------------------

// Drift fields mirror the backend's render-time projection (ADR-038).
// The seeded persisted dashboard is at v1.0.0 while the catalog ships
// v1.1.0 to demonstrate the `Behind` state on the list page.
export const SAMPLE_FINANCE_BUNDLE: DashboardRenderResponse = {
  dashboardId: SAMPLE_FINANCE_DASHBOARD_ID,
  renderedAt: '2026-04-29T12:34:56.789Z',
  period: null,
  activeViewName: null,
  driftStatus: 'Behind',
  sourceDefinitionVersion: '1.0.0',
  registeredVersion: '1.1.0',
  widgets: [
    {
      id: '8c6b1e10-0000-0000-0000-000000000010',
      widgetType: 'Markdown',
      slug: 'Banner',
      position: 0,
      width: 12,
      // 2 rows so the multi-line markdown body doesn't overflow the
      // card at rowHeight 120 — single-row banners can't fit ~4 lines
      // of text-sm + the header chrome.
      height: 2,
      titleLocalizationKey: 'Widget:Granit.Showcase.InvoicingOverview.Banner',
      actions: null,
      requiredPermission: null,
      status: 'Snapshot',
      sequence: 1,
      emittedAt: '2026-04-29T12:34:56.789Z',
      refreshHint: 'Static',
      transport: 'Pull',
      snapshot: {
        contentLocalizationKey: 'Widget:Granit.Showcase.InvoicingOverview.Banner.Content',
      },
      reasonLocalizationKey: null,
    },
    {
      id: '8c6b1e10-0000-0000-0000-000000000011',
      widgetType: 'Kpi',
      slug: 'UnpaidCount',
      position: 1,
      width: 3,
      height: 2,
      titleLocalizationKey: 'Widget:Granit.Showcase.InvoicingOverview.UnpaidCount',
      actions: [{ trigger: 'Click', kind: 'Navigate', target: '/invoicing?status=unpaid' }],
      requiredPermission: null,
      status: 'Snapshot',
      sequence: 1,
      emittedAt: '2026-04-29T12:34:56.789Z',
      // Realtime + Push so usePushedDashboard opens the SSE stream and
      // the synthetic publisher in `handlers.ts` can demo live updates
      // without a real backend.
      refreshHint: 'Realtime',
      transport: 'Push',
      snapshot: {
        value: 12,
        valueKind: 'Count',
        currency: null,
        isHigherBetter: false,
        noData: false,
        previous: { value: 14, deltaRatio: -0.1428, trend: 'down', isFavorable: true },
      },
      reasonLocalizationKey: null,
    },
    {
      id: '8c6b1e10-0000-0000-0000-000000000012',
      widgetType: 'Kpi',
      slug: 'UnpaidTotal',
      position: 2,
      width: 3,
      height: 2,
      titleLocalizationKey: 'Widget:Granit.Showcase.InvoicingOverview.UnpaidTotal',
      actions: null,
      requiredPermission: null,
      status: 'Snapshot',
      sequence: 1,
      emittedAt: '2026-04-29T12:34:56.789Z',
      refreshHint: 'Realtime',
      transport: 'Push',
      snapshot: {
        value: 18540.5,
        valueKind: 'Currency',
        currency: 'EUR',
        isHigherBetter: false,
        noData: false,
        previous: { value: 14250, deltaRatio: 0.301, trend: 'up', isFavorable: false },
      },
      reasonLocalizationKey: null,
    },
    {
      id: '8c6b1e10-0000-0000-0000-000000000013',
      widgetType: 'Chart',
      slug: 'RevenueChart',
      position: 3,
      width: 6,
      height: 3,
      titleLocalizationKey: 'Widget:Granit.Showcase.InvoicingOverview.RevenueChart',
      actions: null,
      requiredPermission: null,
      status: 'Snapshot',
      sequence: 1,
      emittedAt: '2026-04-29T12:34:56.789Z',
      refreshHint: 'Dynamic',
      transport: 'Pull',
      snapshot: {
        chartType: 'Bar',
        groupBy: 'IssuedAtMonth',
        aggregation: 'Sum',
        field: 'Total',
        buckets: [
          { label: '2026-02', value: 12500 },
          { label: '2026-03', value: 18200 },
          { label: '2026-04', value: 21450 },
        ],
        currency: 'EUR',
      },
      reasonLocalizationKey: null,
    },
    {
      id: '8c6b1e10-0000-0000-0000-000000000014',
      widgetType: 'Table',
      slug: 'RecentInvoices',
      position: 4,
      width: 6,
      height: 3,
      titleLocalizationKey: 'Widget:Granit.Showcase.InvoicingOverview.RecentInvoices',
      actions: null,
      requiredPermission: null,
      status: 'Snapshot',
      sequence: 1,
      emittedAt: '2026-04-29T12:34:56.789Z',
      refreshHint: 'Dynamic',
      transport: 'Pull',
      snapshot: {
        columns: [
          { name: 'invoiceNumber', labelLocalizationKey: 'Column:Invoice.Number' },
          { name: 'amount', labelLocalizationKey: 'Column:Invoice.Amount', currencyCode: 'EUR' },
          { name: 'status', labelLocalizationKey: 'Column:Invoice.Status' },
        ],
        rows: [
          { invoiceNumber: 'INV-2026-0042', amount: 1240.5, status: 'Open' },
          { invoiceNumber: 'INV-2026-0043', amount: 890, status: 'Paid' },
          { invoiceNumber: 'INV-2026-0044', amount: 3210.75, status: 'Open' },
        ],
        totalRowCount: 27,
      },
      reasonLocalizationKey: null,
    },
    {
      id: '8c6b1e10-0000-0000-0000-000000000015',
      widgetType: 'Pivot',
      slug: 'RevenueByRegion',
      position: 5,
      width: 6,
      height: 3,
      titleLocalizationKey: 'Widget:Granit.Showcase.InvoicingOverview.RevenueByRegion',
      actions: null,
      requiredPermission: null,
      status: 'Snapshot',
      sequence: 1,
      emittedAt: '2026-04-29T12:34:56.789Z',
      refreshHint: 'Dynamic',
      transport: 'Pull',
      snapshot: {
        rowFields: ['Region'],
        columnFields: ['Status'],
        valueField: 'Total',
        aggregation: 'Sum',
        cells: [
          { rowKeys: ['EU'], columnKeys: ['Open'], value: 9500 },
          { rowKeys: ['EU'], columnKeys: ['Paid'], value: 12300 },
          { rowKeys: ['NA'], columnKeys: ['Open'], value: 4200 },
          { rowKeys: ['NA'], columnKeys: ['Paid'], value: null },
        ],
        currency: 'EUR',
      },
      reasonLocalizationKey: null,
    },
    {
      id: '8c6b1e10-0000-0000-0000-000000000016',
      widgetType: 'Map',
      slug: 'BranchMap',
      position: 6,
      width: 6,
      height: 4,
      titleLocalizationKey: 'Widget:Granit.Showcase.InvoicingOverview.BranchMap',
      actions: null,
      requiredPermission: null,
      status: 'Snapshot',
      sequence: 1,
      emittedAt: '2026-04-29T12:34:56.789Z',
      refreshHint: 'Dynamic',
      transport: 'Pull',
      snapshot: {
        points: [
          {
            id: '8c6b1e10-0000-0000-0000-00000000aaaa',
            latitude: 48.8566,
            longitude: 2.3522,
            popup: { name: 'Paris HQ', employees: 142 },
          },
          {
            id: '8c6b1e10-0000-0000-0000-00000000bbbb',
            latitude: 50.8503,
            longitude: 4.3517,
            popup: { name: 'Brussels Office', employees: 38 },
          },
          {
            id: '8c6b1e10-0000-0000-0000-00000000cccc',
            latitude: 40.4168,
            longitude: -3.7038,
            popup: { name: 'Madrid Branch', employees: 22 },
          },
        ],
        defaultZoom: 5,
        defaultCenter: { latitude: 47.5, longitude: 3.0 },
        clusterThreshold: 200,
        detailRoute: '/customers/{id}',
        tileUrlTemplate: null,
        defaultLayerKind: null,
      },
      reasonLocalizationKey: null,
    },
  ],
};

// Welcome dashboard render bundle. Mirrors the framework-only widget
// definitions (markdown banner + image hero + text CTA) so the bundle path
// renders end-to-end without touching the analytics or map registries.
export const SAMPLE_WELCOME_BUNDLE: DashboardRenderResponse = {
  dashboardId: SAMPLE_WELCOME_DASHBOARD_ID,
  renderedAt: '2026-04-30T08:00:00.000Z',
  period: null,
  activeViewName: null,
  driftStatus: 'Aligned',
  sourceDefinitionVersion: '1.0.0',
  registeredVersion: '1.0.0',
  widgets: [
    {
      id: '8c6b1e10-0000-0000-0000-000000000020',
      widgetType: 'Markdown',
      slug: 'Banner',
      position: 0,
      width: 12,
      height: 2,
      titleLocalizationKey: 'Widget:Granit.Showcase.Welcome.Banner',
      actions: null,
      requiredPermission: null,
      status: 'Snapshot',
      sequence: 1,
      emittedAt: '2026-04-30T08:00:00.000Z',
      refreshHint: 'Static',
      transport: 'Pull',
      snapshot: { contentLocalizationKey: 'Widget:Granit.Showcase.Welcome.Banner.Content' },
      reasonLocalizationKey: null,
    },
    {
      id: '8c6b1e10-0000-0000-0000-000000000021',
      widgetType: 'Image',
      slug: 'Hero',
      position: 1,
      width: 12,
      height: 3,
      titleLocalizationKey: 'Widget:Granit.Showcase.Welcome.Hero',
      actions: null,
      requiredPermission: null,
      status: 'Snapshot',
      sequence: 1,
      emittedAt: '2026-04-30T08:00:00.000Z',
      refreshHint: 'Static',
      transport: 'Pull',
      snapshot: {
        source: 'https://placehold.co/1200x600/0f172a/f8fafc.png?text=Granit+Showcase',
        altLocalizationKey: 'Widget:Granit.Showcase.Welcome.Hero.Alt',
        fit: 'Cover',
      },
      reasonLocalizationKey: null,
    },
    {
      id: '8c6b1e10-0000-0000-0000-000000000022',
      widgetType: 'Text',
      slug: 'NextSteps',
      position: 2,
      width: 12,
      height: 1,
      titleLocalizationKey: 'Widget:Granit.Showcase.Welcome.NextSteps',
      actions: null,
      requiredPermission: null,
      status: 'Snapshot',
      sequence: 1,
      emittedAt: '2026-04-30T08:00:00.000Z',
      refreshHint: 'Static',
      transport: 'Pull',
      snapshot: {
        contentLocalizationKey: 'Widget:Granit.Showcase.Welcome.NextSteps.Content',
        style: 'Subheading',
      },
      reasonLocalizationKey: null,
    },
  ],
};

// ---------------------------------------------------------------------------
// Catalog of available definitions — surfaces what the user can import.
//
// Catalog version on InvoicingOverview is intentionally bumped to `1.1.0` so
// the seeded persisted instance (imported at v1.0.0) surfaces as `'Behind'`
// in the list page — demos the drift indicator (ADR-038). In a real
// deployment the bump would represent a module release with new widgets /
// layout changes.
// ---------------------------------------------------------------------------

export const CATALOG: readonly DashboardCatalogEntryResponse[] = [
  {
    name: 'Granit.Showcase.InvoicingOverview',
    category: 'Finance',
    isSystem: false,
    version: '1.1.0',
    widgetCount: 7,
    hasViews: false,
    hasAliases: false,
    hasFilters: false,
  },
  {
    name: 'Granit.Showcase.Welcome',
    category: 'General',
    isSystem: false,
    version: '1.0.0',
    widgetCount: 3,
    hasViews: false,
    hasAliases: false,
    hasFilters: false,
  },
];

// ---------------------------------------------------------------------------
// Seed definitions — drive the persisted-instance store. Stand-ins for what a
// `IDashboardDefinitionRegistry` HTTP endpoint would return: each widget is
// serialised verbatim into the persisted `configJson` blob, so the store's
// wire shape stays byte-compatible with a real import.
// ---------------------------------------------------------------------------

const sampleFinanceDashboard: DashboardDefinition = {
  name: 'Granit.Showcase.InvoicingOverview',
  category: 'Finance',
  isSystem: false,
  version: '1.0.0',
  layout: { columns: 12, rowHeight: 120 },
  widgets: [
    {
      slug: 'Banner',
      type: 'markdown',
      position: 0,
      size: { width: 12, height: 2 },
      contentLocalizationKey: 'Widget:Granit.Showcase.InvoicingOverview.Banner.Content',
    },
    {
      slug: 'UnpaidCount',
      type: 'kpi',
      position: 1,
      size: WIDGET_SIZE.SMALL_KPI,
      datasource: Datasource.metric('Granit.Invoicing.UnpaidInvoiceCountMetric'),
      actions: [
        { trigger: 'Click', kind: 'Navigate', target: '/invoicing', params: { status: 'unpaid' } },
      ],
    },
    {
      slug: 'UnpaidTotal',
      type: 'kpi',
      position: 2,
      size: WIDGET_SIZE.SMALL_KPI,
      datasource: Datasource.metric('Granit.Invoicing.UnpaidInvoiceTotalMetric'),
      actions: [
        { trigger: 'Click', kind: 'Navigate', target: '/invoicing', params: { status: 'unpaid' } },
      ],
    },
    // `kpi` widgets are declared by `@granit/analytics`; the testing module
    // serialises them as plain data (no analytics dependency). The persisted
    // `configJson` is produced by the write-direction bridge helper (see
    // `seedStoredDashboard`), which emits the bare `Datasource` for KPI so the
    // mock stays byte-compatible with the backend and the read-direction bridge.
  ] as DashboardDefinition['widgets'],
};

const sampleWelcomeDashboard: DashboardDefinition = {
  name: 'Granit.Showcase.Welcome',
  category: 'General',
  isSystem: false,
  version: '1.0.0',
  layout: { columns: 12, rowHeight: 120 },
  widgets: [
    {
      slug: 'Banner',
      type: 'markdown',
      position: 0,
      size: { width: 12, height: 2 },
      contentLocalizationKey: 'Widget:Granit.Showcase.Welcome.Banner.Content',
    },
    {
      slug: 'Hero',
      type: 'image',
      position: 1,
      size: { width: 12, height: 3 },
      source: 'https://placehold.co/1200x600/0f172a/f8fafc.png?text=Granit+Showcase',
      altLocalizationKey: 'Widget:Granit.Showcase.Welcome.Hero.Alt',
      fit: 'Cover',
    },
    {
      slug: 'NextSteps',
      type: 'text',
      position: 2,
      size: { width: 12, height: 1 },
      contentLocalizationKey: 'Widget:Granit.Showcase.Welcome.NextSteps.Content',
      style: 'Subheading',
    },
  ],
};

// ---------------------------------------------------------------------------
// In-memory persisted-instance store, keyed by Guid id.
// ---------------------------------------------------------------------------

export interface StoredDashboard extends Omit<Mutable<DashboardDetailResponse>, 'widgets'> {
  widgets: Mutable<WidgetInstanceResponse>[];
}

function seedStoredDashboard(
  id: string,
  definition: DashboardDefinition,
  status: StoredDashboard['status'],
  widgetIdBase: number
): StoredDashboard {
  return {
    id,
    name: definition.name,
    category: definition.category,
    status,
    isSystem: false,
    sourceDefinitionName: definition.name,
    sourceDefinitionVersion: definition.version,
    layoutColumns: definition.layout.columns,
    layoutRowHeight: definition.layout.rowHeight,
    widgets: definition.widgets.map((widget, index) => {
      // Derive the persisted shape through the write-direction bridge so the
      // mock's `configJson` / `metricName` / `queryName` are byte-compatible
      // with what the backend persists (and what the read-direction bridge
      // expects) per widget kind — KPI emits a bare `Datasource`, not a
      // wrapped or whole-widget blob.
      const request = widgetDefinitionToAddRequest(widget, definition.name);
      return {
        id: `${id.slice(0, -3)}${(widgetIdBase + index).toString(16).padStart(3, '0')}`,
        widgetType: widget.type.charAt(0).toUpperCase() + widget.type.slice(1),
        position: widget.position,
        width: widget.size.width,
        height: widget.size.height,
        titleLocalizationKey: `Widget:${definition.name}.${widget.slug}`,
        metricName: request.metricName ?? null,
        queryName: request.queryName ?? null,
        configJson: request.configJson,
        requiredPermission: null,
      };
    }),
  };
}

/**
 * Builds a fresh, fully-seeded persisted-instance store. Returns a new
 * `Map` each call so handler suites don't leak mutations between tests —
 * call once per `createDashboardsHandlers(...)` invocation.
 *
 * Seed: two persisted dashboards — InvoicingOverview is Published and at
 * v1.0.0 against a v1.1.0 catalog (drift = `Behind`, demos the resync flow);
 * Welcome is Draft and aligned with its catalog so the publish / archive path
 * on framework-only widgets has a row to exercise.
 */
export function createDashboardsStore(): Map<string, StoredDashboard> {
  const store = new Map<string, StoredDashboard>();
  store.set(
    SAMPLE_FINANCE_DASHBOARD_ID,
    // Widget-id bases are decimal (`100` → hex `64`, `200` → hex `c8`) so the
    // synthesized ids stay byte-identical to the real persisted projection.
    seedStoredDashboard(SAMPLE_FINANCE_DASHBOARD_ID, sampleFinanceDashboard, 'Published', 100)
  );
  store.set(
    SAMPLE_WELCOME_DASHBOARD_ID,
    seedStoredDashboard(SAMPLE_WELCOME_DASHBOARD_ID, sampleWelcomeDashboard, 'Draft', 200)
  );
  return store;
}

// ---------------------------------------------------------------------------
// Per-kind synthetic snapshot fixtures — back the P3 single-widget render
// endpoints (POST /widgets/{kind}/render).
// ---------------------------------------------------------------------------

export const SYNTHETIC_ENVELOPES: Readonly<
  Record<string, { widgetType: string; refreshHint: 'Static' | 'Dynamic'; snapshot: unknown }>
> = {
  kpi: {
    widgetType: 'Kpi',
    refreshHint: 'Dynamic',
    snapshot: {
      value: 12,
      valueKind: 'Count',
      currency: null,
      isHigherBetter: false,
      noData: false,
      previous: { value: 14, deltaRatio: -0.1428, trend: 'down', isFavorable: true },
    },
  },
  chart: {
    widgetType: 'Chart',
    refreshHint: 'Dynamic',
    snapshot: {
      chartType: 'Bar',
      groupBy: 'IssuedAtMonth',
      aggregation: 'Sum',
      field: 'Total',
      buckets: [
        { label: '2026-02', value: 12500 },
        { label: '2026-03', value: 18200 },
        { label: '2026-04', value: 21450 },
      ],
      currency: 'EUR',
    },
  },
  table: {
    widgetType: 'Table',
    refreshHint: 'Dynamic',
    snapshot: {
      columns: [
        { name: 'invoiceNumber', labelLocalizationKey: 'Column:Invoice.Number' },
        { name: 'amount', labelLocalizationKey: 'Column:Invoice.Amount', currencyCode: 'EUR' },
        { name: 'status', labelLocalizationKey: 'Column:Invoice.Status' },
      ],
      rows: [
        { invoiceNumber: 'INV-2026-0042', amount: 1240.5, status: 'Open' },
        { invoiceNumber: 'INV-2026-0043', amount: 890, status: 'Paid' },
      ],
      totalRowCount: 27,
    },
  },
  pivot: {
    widgetType: 'Pivot',
    refreshHint: 'Dynamic',
    snapshot: {
      rowFields: ['Region'],
      columnFields: ['Status'],
      valueField: 'Total',
      aggregation: 'Sum',
      cells: [
        { rowKeys: ['EU'], columnKeys: ['Open'], value: 9500 },
        { rowKeys: ['EU'], columnKeys: ['Paid'], value: 12300 },
      ],
      currency: 'EUR',
    },
  },
  map: {
    widgetType: 'Map',
    refreshHint: 'Dynamic',
    snapshot: {
      points: [
        {
          id: '8c6b1e10-0000-0000-0000-00000000aaaa',
          latitude: 48.8566,
          longitude: 2.3522,
          popup: { name: 'Paris HQ' },
        },
      ],
      defaultZoom: 5,
      defaultCenter: { latitude: 47.5, longitude: 3.0 },
      clusterThreshold: 200,
      detailRoute: null,
      tileUrlTemplate: null,
      defaultLayerKind: null,
    },
  },
};

/**
 * Synthesizes the next KPI snapshot for a push-eligible widget. Drifts the
 * value within a plausible band around the seed so the live demo shows visible
 * motion without diverging from the original units. Slug-keyed because the
 * synthetic publisher doesn't try to narrow the unknown snapshot at runtime —
 * the seed bundle picks the shape, this helper keeps it.
 */
export function nextSyntheticKpi(widget: DashboardRenderedWidget): unknown {
  if (widget.widgetType !== 'Kpi') return widget.snapshot;
  if (widget.slug === 'UnpaidCount') {
    const value = 8 + Math.round(Math.random() * 22);
    return {
      value,
      valueKind: 'Count',
      currency: null,
      isHigherBetter: false,
      noData: false,
      previous: {
        value: 14,
        deltaRatio: (value - 14) / 14,
        trend: value < 14 ? 'down' : 'up',
        isFavorable: value < 14,
      },
    };
  }
  if (widget.slug === 'UnpaidTotal') {
    const value = Math.round(8000 + Math.random() * 25_000);
    return {
      value,
      valueKind: 'Currency',
      currency: 'EUR',
      isHigherBetter: false,
      noData: false,
      previous: {
        value: 14250,
        deltaRatio: (value - 14250) / 14250,
        trend: value > 14250 ? 'up' : 'down',
        isFavorable: value < 14250,
      },
    };
  }
  return widget.snapshot;
}
