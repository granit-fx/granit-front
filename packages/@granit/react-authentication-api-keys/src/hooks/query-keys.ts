// ---------------------------------------------------------------------------
// Query key builder
// ---------------------------------------------------------------------------

export const DEFAULT_QUERY_KEY_PREFIX = ['api-keys'] as const;

/**
 * Builds a query key for API key queries.
 *
 * @param config - Config containing an optional `queryKeyPrefix`.
 * @param segments - Additional segments appended after the prefix.
 */
export function buildApiKeyQueryKey(
  config: { queryKeyPrefix?: readonly string[] },
  ...segments: readonly unknown[]
): readonly unknown[] {
  return [...(config.queryKeyPrefix ?? DEFAULT_QUERY_KEY_PREFIX), ...segments];
}
