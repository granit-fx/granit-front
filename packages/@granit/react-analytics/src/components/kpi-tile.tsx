import { isMetricDatasource, toRefetchInterval } from '@granit/dashboards';
import {
  useEffectiveRefreshInterval,
  useEffectiveTimeWindow,
  useWidgetTriggerHandler,
} from '@granit/react-dashboards';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';

import { useMetric } from '../hooks/use-metric';
import { useMetricCatalog } from '../hooks/use-metric-catalog';
import { metricRequestFromTimeWindow } from '../lib/metric-request-from-time-window';

import { KpiTileView } from './kpi-tile-view';

import type { KpiWidgetDefinition } from '@granit/analytics';

/**
 * Smart KPI tile — registered as the renderer for `KpiWidgetDefinition`
 * (`type: 'kpi'`) in the analytics widget registry. Resolves the active time
 * window from dashboard context, fetches the metric snapshot via
 * {@link useMetric}, delegates rendering to {@link KpiTileView}.
 *
 * v1 only handles {@link MetricDatasource}. Other datasource kinds
 * ({@link QueryAggregateDatasource}, {@link TelemetryDatasource}) await the
 * query-engine evaluator (B5) and the SSE telemetry transport (B7-2)
 * respectively, and currently render an "unsupported" KpiTileView.
 *
 * The period comes from {@link useEffectiveTimeWindow} (override → dashboard
 * context → framework default), so a dashboard-level time-window control
 * propagates without touching the tile. A comparison window is only requested
 * for a metric whose catalogue entry reports `supportsPeriod` — a period-less
 * snapshot metric would otherwise be rejected with a 422.
 */
export interface KpiTileProps {
  readonly widget: KpiWidgetDefinition;
}

export function KpiTile({ widget }: KpiTileProps) {
  const { t, i18n } = useTranslation();
  const { datasource } = widget;

  // `datasource` can be undefined when a persisted KPI's `configJson` failed to
  // parse (or pre-fix data lifted the bare datasource flat) — guard before
  // narrowing so a malformed binding renders the "unsupported" tile instead of
  // crashing on `datasource.kind`.
  const metricName = datasource && isMetricDatasource(datasource) ? datasource.metricName : '';

  const timeWindow = useEffectiveTimeWindow();

  // Catalogue is shared (single React Query key) across every KPI tile, so this
  // is one fetch regardless of tile count. Until it resolves, `supportsPeriod`
  // defaults to `false` — the tile requests the period-only shape (never a 422)
  // and upgrades to a comparison once the entry confirms the metric supports it.
  const { data: catalog } = useMetricCatalog();
  const supportsPeriod = catalog?.find((entry) => entry.name === metricName)?.supportsPeriod ?? false;

  const request = useMemo(
    () => metricRequestFromTimeWindow(timeWindow, supportsPeriod),
    [timeWindow, supportsPeriod]
  );

  // Dashboard-level refresh cadence. `'auto'` maps to `undefined`, letting
  // useMetric keep its `refreshHint`-derived polling; `'off'`/a fixed interval
  // overrides it.
  const refetchInterval = toRefetchInterval(useEffectiveRefreshInterval());

  const query = useMetric(metricName, request, {
    enabled: metricName !== '',
    refetchInterval,
  });

  // `Click` actions on the widget definition. Hook lives at the top
  // of the component (before any conditional return) so the rules-of-
  // hooks order is stable across the metric-vs-unsupported branches.
  const onClick = useWidgetTriggerHandler('Click', widget.actions);
  const handleClick = onClick ? () => onClick() : undefined;

  if (!datasource || !isMetricDatasource(datasource)) {
    const kind = datasource?.kind ?? 'none';
    const message = t('Analytics.UnsupportedDatasource', {
      defaultValue: 'Datasource not supported yet ({{kind}})',
      kind,
    });
    return (
      <div
        data-slot="kpi-tile"
        data-datasource-kind={kind}
        className="flex h-full items-center text-xs text-muted-foreground"
      >
        {message}
      </div>
    );
  }

  return (
    <KpiTileView
      data={query.data}
      isLoading={query.isLoading}
      error={query.error}
      onRetry={() => {
        query.refetch().catch(() => {
          // refetch errors are surfaced via query.error in the next render
        });
      }}
      locale={i18n.language}
      noDataLabel={t('Analytics.NoData', { defaultValue: 'No data for this period' })}
      errorTitle={t('Analytics.Error.Title', { defaultValue: 'Failed to load metric' })}
      errorRetryLabel={t('Analytics.Error.Retry', { defaultValue: 'Retry' })}
      onClick={handleClick}
    />
  );
}
