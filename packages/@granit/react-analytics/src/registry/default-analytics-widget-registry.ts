import { ChartTile } from '../components/chart-tile';
import { KpiTile } from '../components/kpi-tile';
import { PivotTile } from '../components/pivot-tile';
import { TableTile } from '../components/table-tile';

import type { WidgetRegistry, WidgetRendererFn } from '@granit/react-dashboards';

/**
 * Analytics widget renderers, keyed by their `type` discriminator.
 * Compose with the framework default registry via
 * `composeRegistries(default, analytics)` at the app root so
 * dashboards rendering analytics widgets resolve their renderers
 * without per-app re-registration.
 *
 * Definition-path renderers — fetch their own data via the per-kind
 * render endpoints (`POST /widgets/{kind}/render`, backend P3) and
 * dispatch through `<RenderedWidget>` for chrome / action symmetry
 * with the bundle path. KPI keeps the `useMetric` path because
 * standalone KPI tiles outside dashboards (admin pages) consume
 * metrics directly.
 */
export const defaultAnalyticsWidgetRegistry: WidgetRegistry = Object.freeze({
  // The casts route through `unknown` because TypeScript can't relate
  // each tile's narrow `*WidgetDefinition` prop to the registry's
  // open `WidgetDefinition` type — the dispatcher's runtime contract
  // guarantees the widget passed in matches the registered key.
  kpi: KpiTile as unknown as WidgetRendererFn,
  chart: ChartTile as unknown as WidgetRendererFn,
  table: TableTile as unknown as WidgetRendererFn,
  pivot: PivotTile as unknown as WidgetRendererFn,
});
