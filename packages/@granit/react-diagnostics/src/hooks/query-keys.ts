import type { MonitoringHealthOptions } from './use-monitoring-health';

// ---------------------------------------------------------------------------
// Query key builder
// ---------------------------------------------------------------------------

export const DEFAULT_QUERY_KEY_PREFIX = ['diagnostics'] as const;

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
