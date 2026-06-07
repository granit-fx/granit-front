// ---------------------------------------------------------------------------
// Query key builder
// ---------------------------------------------------------------------------

const DEFAULT_QUERY_KEY_PREFIX = ['scheduling', 'actions'] as const;

/**
 * Builds a query key for scheduling queries.
 *
 * @param config - Scheduling config containing an optional `queryKeyPrefix`.
 * @param segments - Additional segments appended after the prefix.
 */
export function buildSchedulingQueryKey(
  config: { queryKeyPrefix?: readonly string[] },
  ...segments: readonly unknown[]
): readonly unknown[] {
  return [...(config.queryKeyPrefix ?? DEFAULT_QUERY_KEY_PREFIX), ...segments];
}
