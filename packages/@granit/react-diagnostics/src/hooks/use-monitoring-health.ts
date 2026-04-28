import { DEFAULT_DIAGNOSTICS_BASE_PATH, getMonitoringHealth } from '@granit/diagnostics';
import { useQuery } from '@tanstack/react-query';

import type { AxiosInstance } from '@granit/api-client';
import type { MonitoringHealthResponse } from '@granit/diagnostics';
import type { UseQueryResult } from '@tanstack/react-query';

/** Options accepted by the useMonitoringHealth hook. */
export interface MonitoringHealthOptions {
  /** Axios instance used for all requests. */
  readonly client: AxiosInstance;
  /** Base URL for the diagnostics API. Defaults to `/api/v1/diagnostics`. */
  readonly basePath?: string;
  /** Polling interval in milliseconds. Defaults to `30_000` (30 seconds). */
  readonly refetchInterval?: number;
  /** Custom prefix for all query keys produced by this module. */
  readonly queryKeyPrefix?: readonly string[];
}

// ---------------------------------------------------------------------------
// Query key builder
// ---------------------------------------------------------------------------

const DEFAULT_QUERY_KEY_PREFIX = ['diagnostics'] as const;

/**
 * Builds a query key for diagnostics queries.
 *
 * @param config - Options containing an optional `queryKeyPrefix`.
 * @param segments - Additional segments appended after the prefix.
 */
export function buildDiagnosticsQueryKey(
  config: Pick<MonitoringHealthOptions, 'queryKeyPrefix'>,
  ...segments: readonly unknown[]
): readonly unknown[] {
  return [...(config.queryKeyPrefix ?? DEFAULT_QUERY_KEY_PREFIX), ...segments];
}

// ---------------------------------------------------------------------------
// Legacy query key factory (delegates to default prefix)
// ---------------------------------------------------------------------------

/** @deprecated Use {@link buildDiagnosticsQueryKey} instead. */
export const diagnosticsKeys = {
  all: DEFAULT_QUERY_KEY_PREFIX as readonly string[],
  health: () => [...DEFAULT_QUERY_KEY_PREFIX, 'health'] as const,
};

/**
 * Query hook that fetches the monitoring health status of all registered services.
 *
 * Polls every 30 seconds by default to reflect live health state.
 *
 * @example
 * ```tsx
 * const { data } = useMonitoringHealth({ client: api });
 * // data.services, data.checkedAt
 * ```
 */
export function useMonitoringHealth(
  options: MonitoringHealthOptions
): UseQueryResult<MonitoringHealthResponse> {
  const { client, basePath = DEFAULT_DIAGNOSTICS_BASE_PATH, refetchInterval = 30_000 } = options;

  return useQuery({
    queryKey: buildDiagnosticsQueryKey(options, 'health'),
    queryFn: () => getMonitoringHealth(client, basePath),
    staleTime: 30_000,
    refetchInterval,
  });
}
