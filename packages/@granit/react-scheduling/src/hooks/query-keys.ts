import type { QueryRequest } from '@granit/query-engine';

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

// ---------------------------------------------------------------------------
// Legacy query key factory (delegates to default prefix)
// ---------------------------------------------------------------------------

/** @deprecated Use {@link buildSchedulingQueryKey} instead. */
export const schedulingKeys = {
  all: DEFAULT_QUERY_KEY_PREFIX as readonly string[],
  list: (request?: QueryRequest) => [...DEFAULT_QUERY_KEY_PREFIX, 'list', request ?? {}] as const,
  detail: (id: string) => [...DEFAULT_QUERY_KEY_PREFIX, 'detail', id] as const,
};
