// ---------------------------------------------------------------------------
// Query key builder
// ---------------------------------------------------------------------------

export const DEFAULT_QUERY_KEY_PREFIX = ['auth', 'permissions'] as const;

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

// ---------------------------------------------------------------------------
// Legacy query key factory (delegates to default prefix)
// ---------------------------------------------------------------------------

/** @deprecated Use {@link buildPermissionQueryKey} instead. */
export const permissionKeys = {
  all: DEFAULT_QUERY_KEY_PREFIX as readonly string[],
  me: (userId?: string) => [...DEFAULT_QUERY_KEY_PREFIX, 'me', userId] as const,
  definitions: () => [...DEFAULT_QUERY_KEY_PREFIX, 'definitions'] as const,
  role: (roleName: string) => [...DEFAULT_QUERY_KEY_PREFIX, 'roles', roleName] as const,
};
