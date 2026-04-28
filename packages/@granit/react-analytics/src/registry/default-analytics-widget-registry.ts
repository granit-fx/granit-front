import { KpiTile } from '../components/kpi-tile.js';

import type { WidgetRegistry, WidgetRendererFn } from '@granit/react-dashboards';

/**
 * Analytics widget renderers, keyed by their `type` discriminator. Compose
 * with the framework default registry via `composeRegistries(default, analytics)`
 * at the app root so dashboards rendering analytics widgets resolve their
 * renderers without per-app re-registration.
 *
 * v1 only ships `kpi`. `chart`, `table`, `pivot` land as the query-engine
 * integration is wired (see proposals doc P2.2).
 */
export const defaultAnalyticsWidgetRegistry: WidgetRegistry = Object.freeze({
  // The cast goes through `unknown` because TypeScript can't relate
  // `KpiTile`'s narrow `KpiWidgetDefinition` prop to the registry's open
  // `WidgetDefinition` type — the dispatcher's runtime contract guarantees
  // that the widget passed in matches the registered key (`'kpi'` here).
  kpi: KpiTile as unknown as WidgetRendererFn,
});
