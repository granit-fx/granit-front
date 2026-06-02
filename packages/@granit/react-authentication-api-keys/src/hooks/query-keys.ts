import type { ApiKeyHookOptions, UseApiKeysParams } from './use-api-keys';

// ---------------------------------------------------------------------------
// Query key builder
// ---------------------------------------------------------------------------

export const DEFAULT_QUERY_KEY_PREFIX = ['api-keys'] as const;

/**
 * Builds a query key for API key queries.
 *
 * @param config - Hook options containing an optional `queryKeyPrefix`.
 * @param segments - Additional segments appended after the prefix.
 */
export function buildApiKeyQueryKey(
  config: Pick<ApiKeyHookOptions, 'queryKeyPrefix'>,
  ...segments: readonly unknown[]
): readonly unknown[] {
  return [...(config.queryKeyPrefix ?? DEFAULT_QUERY_KEY_PREFIX), ...segments];
}

// ---------------------------------------------------------------------------
// Legacy query key factory (delegates to buildApiKeyQueryKey)
// ---------------------------------------------------------------------------

/** @deprecated Use {@link buildApiKeyQueryKey} instead. */
export const apiKeyKeys = {
  all: DEFAULT_QUERY_KEY_PREFIX as readonly string[],
  lists: () => [...DEFAULT_QUERY_KEY_PREFIX, 'list'] as const,
  list: (params: UseApiKeysParams) => [...DEFAULT_QUERY_KEY_PREFIX, 'list', params] as const,
  details: () => [...DEFAULT_QUERY_KEY_PREFIX, 'detail'] as const,
  detail: (id: string) => [...DEFAULT_QUERY_KEY_PREFIX, 'detail', id] as const,
};
