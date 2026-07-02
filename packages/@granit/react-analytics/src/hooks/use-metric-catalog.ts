import { listMetricCatalog } from '@granit/analytics';
import { useOptionalGranitClient } from '@granit/react-api-client';
import { useQuery, type UseQueryResult } from '@tanstack/react-query';

import { buildAnalyticsQueryKey } from './query-keys';
import { ANALYTICS_BASE_PATH } from './use-metric';

import type { MetricCatalogEntryResponse } from '@granit/analytics';

export interface UseMetricCatalogOptions {
  /** Disable the request — useful when the parent isn't ready (e.g. tenant pending). */
  readonly enabled?: boolean;
}

/**
 * Lists the metric catalogue (`GET /analytics/metrics/catalog`) so a KPI widget
 * editor can offer a dropdown of registered metrics instead of a free-text name.
 *
 * Mirrors {@link useMetric}: the Axios client is resolved directly from the
 * nearest `GranitClientProvider` (react-analytics has no config provider), so no
 * extra provider is required. The query is disabled — staying `pending` with no
 * data — when no client is in context, letting the metric picker degrade to
 * free-text input rather than throw.
 *
 * The catalogue is process-stable, so it is cached with `staleTime: Infinity`.
 */
export function useMetricCatalog(
  options: UseMetricCatalogOptions = {}
): UseQueryResult<readonly MetricCatalogEntryResponse[]> {
  const api = useOptionalGranitClient();

  return useQuery({
    queryKey: buildAnalyticsQueryKey('metric-catalog'),
    queryFn: ({ signal }) => listMetricCatalog(api!, ANALYTICS_BASE_PATH, { signal }),
    enabled: (options.enabled ?? true) && api != null,
    staleTime: Infinity,
  });
}
