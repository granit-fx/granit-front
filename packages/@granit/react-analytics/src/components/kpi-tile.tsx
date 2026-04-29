import { isMetricDatasource } from '@granit/dashboards';
import { useWidgetTriggerHandler } from '@granit/react-dashboards';
import { useTranslation } from 'react-i18next';

import { useMetric } from '../api/use-metric.js';

import { KpiTileView } from './kpi-tile-view.js';

import type { KpiWidgetDefinition, MetricRequest } from '@granit/analytics';

const DEFAULT_PERIOD: MetricRequest = {
  period: { token: 'last_30d' },
  compareTo: { token: 'previous_period' },
};

/**
 * Smart KPI tile — registered as the renderer for `KpiWidgetDefinition`
 * (`type: 'kpi'`) in the analytics widget registry. Reads dashboard context
 * for breadcrumb data, fetches the metric snapshot via {@link useMetric},
 * delegates rendering to {@link KpiTileView}.
 *
 * v1 only handles {@link MetricDatasource}. Other datasource kinds
 * ({@link QueryAggregateDatasource}, {@link TelemetryDatasource}) await the
 * query-engine evaluator (B5) and the SSE telemetry transport (B7-2)
 * respectively, and currently render an "unsupported" KpiTileView.
 *
 * v1 also uses a hardcoded `last_30d / previous_period` request shape — the
 * runtime `DashboardTimeWindow` (proposals doc P1.3) will replace this once
 * the dashboard context propagates it.
 */
export interface KpiTileProps {
  readonly widget: KpiWidgetDefinition;
}

export function KpiTile({ widget }: KpiTileProps) {
  const { t, i18n } = useTranslation();
  const { datasource } = widget;

  const metricName = isMetricDatasource(datasource) ? datasource.metricName : '';

  const query = useMetric(metricName, DEFAULT_PERIOD, { enabled: metricName !== '' });

  // `Click` actions on the widget definition. Hook lives at the top
  // of the component (before any conditional return) so the rules-of-
  // hooks order is stable across the metric-vs-unsupported branches.
  const onClick = useWidgetTriggerHandler('Click', widget.actions);
  const handleClick = onClick ? () => onClick() : undefined;

  if (!isMetricDatasource(datasource)) {
    const message = t('Analytics.UnsupportedDatasource', {
      defaultValue: 'Datasource not supported yet ({{kind}})',
      kind: datasource.kind,
    });
    return (
      <div
        data-slot="kpi-tile"
        data-datasource-kind={datasource.kind}
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
      onRetry={() => void query.refetch()}
      locale={i18n.language}
      noDataLabel={t('Analytics.NoData', { defaultValue: 'No data for this period' })}
      errorTitle={t('Analytics.Error.Title', { defaultValue: 'Failed to load metric' })}
      errorRetryLabel={t('Analytics.Error.Retry', { defaultValue: 'Retry' })}
      onClick={handleClick}
    />
  );
}
