// ---------------------------------------------------------------------------
// Query key builder
// ---------------------------------------------------------------------------

export const DEFAULT_QUERY_KEY_PREFIX = ['authorization', 'permissions'] as const;

/**
 * Builds a query key for permission / authorization queries.
 *
 * @param config - Options containing an optional `queryKeyPrefix`.
 * @param segments - Additional segments appended after the prefix.
 */
export function buildPermissionQueryKey(
  config: { queryKeyPrefix?: readonly string[] },
  ...segments: readonly unknown[]
): readonly unknown[] {
  return [...(config.queryKeyPrefix ?? DEFAULT_QUERY_KEY_PREFIX), ...segments];
}
