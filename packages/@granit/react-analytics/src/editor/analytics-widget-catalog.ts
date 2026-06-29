import { Datasource } from '@granit/dashboards';

import type {
  ChartWidgetDefinition,
  KpiWidgetDefinition,
  PivotWidgetDefinition,
  TableWidgetDefinition,
} from '@granit/analytics';
import type { WidgetCatalogEntry } from '@granit/react-dashboard-editor';

/**
 * Catalog entries for every analytics widget kind shipped by
 * `@granit/analytics` (kpi / chart / table / pivot). Compose into the
 * editor's palette via:
 *
 *     <WidgetPalette catalog={composeCatalogs(defaultWidgetCatalog, analyticsWidgetCatalog)} ... />
 *
 * Default sizes are intentionally slim — KPI sits at the framework's
 * `SMALL_KPI` (3×1), the others default to a half-row 6×3 footprint
 * which fits two side-by-side widgets per row on the conventional
 * 12-column grid.
 *
 * Stub datasources / queries are placeholders: a freshly added analytics
 * widget needs the user to wire its query / datasource via the matching
 * config form (`AnalyticsWidgetConfigForms`). Until that happens, the
 * widget renders empty — the framework treats unbound queries as
 * "no data", not an error.
 */
export const analyticsWidgetCatalog: readonly WidgetCatalogEntry[] = Object.freeze([
  {
    type: 'kpi',
    labelLocalizationKey: 'Dashboard:Widget.Kpi.Label',
    iconKey: 'kpi',
    // Two rows so the framed tile fits its header + value without clipping.
    defaultSize: { width: 3, height: 2 },
    minSize: { width: 2, height: 2 },
    createDefaultWidget: (slug): KpiWidgetDefinition => ({
      slug,
      type: 'kpi',
      size: { width: 3, height: 2 },
      // Empty metric name — the user binds it in the config form. The
      // backend rejects empty metricName at construction, so a fresh
      // widget can't be saved before being configured (acceptable v1
      // behaviour: surfaces the contract).
      datasource: Datasource.metric(''),
    }),
  },
  {
    type: 'chart',
    labelLocalizationKey: 'Dashboard:Widget.Chart.Label',
    iconKey: 'chart',
    defaultSize: { width: 6, height: 3 },
    minSize: { width: 3, height: 2 },
    createDefaultWidget: (slug): ChartWidgetDefinition => ({
      slug,
      type: 'chart',
      size: { width: 6, height: 3 },
      queryName: '',
      groupBy: '',
      aggregation: 'Sum',
      field: null,
      chartType: 'Bar',
    }),
  },
  {
    type: 'table',
    labelLocalizationKey: 'Dashboard:Widget.Table.Label',
    iconKey: 'table',
    defaultSize: { width: 6, height: 3 },
    minSize: { width: 3, height: 2 },
    createDefaultWidget: (slug): TableWidgetDefinition => ({
      slug,
      type: 'table',
      size: { width: 6, height: 3 },
      queryName: '',
      visibleColumns: null,
      pageSize: 10,
    }),
  },
  {
    type: 'pivot',
    labelLocalizationKey: 'Dashboard:Widget.Pivot.Label',
    iconKey: 'pivot',
    defaultSize: { width: 6, height: 3 },
    minSize: { width: 3, height: 2 },
    createDefaultWidget: (slug): PivotWidgetDefinition => ({
      slug,
      type: 'pivot',
      size: { width: 6, height: 3 },
      queryName: '',
      rowFields: [],
      columnFields: [],
      valueField: null,
      valueAggregation: 'Sum',
    }),
  },
]);
