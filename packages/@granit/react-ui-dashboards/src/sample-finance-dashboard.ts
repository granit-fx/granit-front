import { Datasource, WIDGET_SIZE } from '@granit/dashboards';

import type { KpiWidgetDefinition } from '@granit/analytics';
import type { DashboardDefinition, MarkdownWidgetDefinition } from '@granit/dashboards';

/**
 * Hand-authored dashboard fixture for the showcase demo. Stands in for what
 * a real `Granit.Dashboards.IDashboardDefinitionRegistry` HTTP endpoint will
 * eventually return — the same JSON shape, just loaded synchronously here.
 *
 * Two `kpi` widgets surface metrics the showcase already exposes, framed by
 * a markdown banner explaining what the dashboard is for. The MSW handler at
 * `src/mocks/handlers/analytics-handlers.ts` returns realistic snapshots so
 * the dashboard renders end-to-end without a live backend.
 *
 * Once the backend ships the dashboard registry endpoint (story B4 #1385),
 * this fixture goes away — the page swaps to a `useDashboard()` hook against
 * the real `IDashboardDefinitionRegistry`.
 */

const banner: MarkdownWidgetDefinition = {
  slug: 'Banner',
  type: 'markdown',
  position: 0,
  // Full-width × 2 rows — the banner ships ~4 lines of text-sm content
  // which overflows a single 120px cell. WIDGET_SIZE.FULL_WIDTH_ROW
  // (height 1) suits a one-line banner; bump to 2 here.
  size: { width: 12, height: 2 },
  contentLocalizationKey: 'Widget:Granit.Showcase.InvoicingOverview.Banner.Content',
};

const unpaidCount: KpiWidgetDefinition = {
  slug: 'UnpaidCount',
  type: 'kpi',
  position: 1,
  size: WIDGET_SIZE.SMALL_KPI,
  datasource: Datasource.metric('Granit.Invoicing.UnpaidInvoiceCountMetric'),
  // Drill-down — clicking the tile navigates to the invoice list filtered to
  // the same scope. Validates P1.5 end-to-end: declarative target + no JS.
  actions: [
    {
      trigger: 'Click',
      kind: 'Navigate',
      target: '/invoicing',
      params: { status: 'unpaid' },
    },
  ],
};

const unpaidTotal: KpiWidgetDefinition = {
  slug: 'UnpaidTotal',
  type: 'kpi',
  position: 2,
  size: WIDGET_SIZE.SMALL_KPI,
  datasource: Datasource.metric('Granit.Invoicing.UnpaidInvoiceTotalMetric'),
  actions: [
    {
      trigger: 'Click',
      kind: 'Navigate',
      target: '/invoicing',
      params: { status: 'unpaid' },
    },
  ],
};

export const sampleFinanceDashboard: DashboardDefinition = {
  name: 'Granit.Showcase.InvoicingOverview',
  category: 'Finance',
  isSystem: false,
  version: '1.0.0',
  // rowHeight: 120 (vs the framework default of 80) — a stacked KPI tile
  // (title row + value text-2xl + delta) needs ~110px of content area
  // after p-4 padding. The framework default is tight enough that any
  // KPI on a 1-row cell visibly overflows; bumping it locally here is
  // the minimal showcase-side fix. Long-term the framework should
  // either (a) bump DEFAULT_DASHBOARD_LAYOUT.rowHeight, (b) bump
  // WIDGET_SIZE.SMALL_KPI to 3×2, or (c) ship a more compact KPI
  // chrome — none of which is worth a wire-format-adjacent change for
  // a single visual issue surfaced in the demo.
  layout: { columns: 12, rowHeight: 120 },
  widgets: [banner, unpaidCount, unpaidTotal],
};
