import { toISODateString } from '@granit/types';

import type { MetricRequest, PeriodSpec } from '@granit/analytics';
import type { DashboardTimeWindow } from '@granit/dashboards';

/**
 * Maps a dashboard {@link DashboardTimeWindow} to a metric {@link MetricRequest},
 * reconciling two axes the two packages model independently:
 *
 * - A `DashboardPeriod` keeps its absolute range as plain `string`s (the
 *   dashboards package stays free of the analytics `ISODateString` brand); this
 *   re-brands them via {@link toISODateString} so the request typechecks.
 * - `compareTo` is forwarded only when `supportsPeriod` is `true`. A metric that
 *   declares no `PeriodSelector` rejects a comparison window with a 422
 *   (`Granit.Analytics:ComparisonWithoutPeriodSelector`), so a snapshot metric
 *   silently drops the comparison instead of firing a doomed request.
 */
export function metricRequestFromTimeWindow(
  timeWindow: DashboardTimeWindow,
  supportsPeriod: boolean
): MetricRequest {
  const period: PeriodSpec =
    'token' in timeWindow.period
      ? { token: timeWindow.period.token }
      : {
          from: toISODateString(timeWindow.period.from),
          to: toISODateString(timeWindow.period.to),
        };

  return supportsPeriod && timeWindow.compareTo
    ? { period, compareTo: { token: timeWindow.compareTo.token } }
    : { period };
}
