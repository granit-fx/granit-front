import { useDashboardContext } from '@granit/react-dashboards';
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
 * v1 uses a hardcoded `last_30d / previous_period` request shape — the
 * runtime `DashboardTimeWindow` (proposals doc P1.3) will replace this once
 * `Granit.Dashboards.DashboardTimeWindow` ships and is propagated via
 * dashboard context.
 */
export interface KpiTileProps {
  readonly widget: KpiWidgetDefinition;
}

export function KpiTile({ widget }: KpiTileProps) {
  const { t, i18n } = useTranslation();
  const dashboardCtx = useDashboardContext();

  const titleKey = dashboardCtx
    ? `Widget:${dashboardCtx.dashboardName}.${widget.slug}.Title`
    : `Widget:${widget.slug}.Title`;
  const translated = t(titleKey, { defaultValue: '' });
  const title = translated || widget.metricName;

  const query = useMetric(widget.metricName, DEFAULT_PERIOD);

  return (
    <KpiTileView
      title={title}
      data={query.data}
      isLoading={query.isLoading}
      error={query.error}
      onRetry={() => void query.refetch()}
      locale={i18n.language}
      noDataLabel={t('Analytics.NoData', { defaultValue: 'No data for this period' })}
      errorTitle={t('Analytics.Error.Title', { defaultValue: 'Failed to load metric' })}
      errorRetryLabel={t('Analytics.Error.Retry', { defaultValue: 'Retry' })}
    />
  );
}
