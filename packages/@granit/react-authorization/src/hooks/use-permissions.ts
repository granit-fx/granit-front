import { getMyPermissions } from '@granit/authorization';
import { useQuery } from '@tanstack/react-query';
import * as React from 'react';

import { DEFAULT_BASE_PATH } from '../constants';

import type {
  PermissionsResponse,
  UsePermissionsOptions,
  UsePermissionsReturn,
} from '@granit/authorization';
const EMPTY_SET: ReadonlySet<string> = new Set<string>();

// ---------------------------------------------------------------------------
// Query key builder
// ---------------------------------------------------------------------------

const DEFAULT_QUERY_KEY_PREFIX = ['auth', 'permissions'] as const;

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

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

/**
 * Fetches and caches the current user's granted permissions from the backend.
 *
 * Calls `GET {basePath}/permissions` (default `/api/v1/authorization/permissions`) and returns a `Set<string>`
 * of granted permission names with O(1) lookup helpers.
 *
 * Permissions are cached for the lifetime of the Keycloak session
 * (`staleTime: Infinity`). Call `refetch()` to force a refresh.
 *
 * @param options - Axios client instance and optional configuration.
 * @returns Object with permissions set and helper functions.
 *
 * @example
 * ```tsx
 * const { hasPermission, isLoading } = usePermissions({ client: api });
 *
 * if (isLoading) return <Spinner />;
 * if (!hasPermission('Invoices.Delete')) return null;
 * return <DeleteButton />;
 * ```
 */
export function usePermissions(options: UsePermissionsOptions): UsePermissionsReturn {
  const { client, basePath = DEFAULT_BASE_PATH, enabled } = options;

  const query = useQuery<PermissionsResponse>({
    queryKey: buildPermissionQueryKey(options, 'me'),
    queryFn: () => getMyPermissions(client, basePath),
    enabled: enabled ?? true,
    staleTime: Infinity,
  });

  const permissionSet = React.useMemo<ReadonlySet<string>>(() => {
    if (!query.data?.permissions) return EMPTY_SET;
    return new Set(query.data.permissions);
  }, [query.data?.permissions]);

  const hasPermission = React.useCallback(
    (permission: string): boolean => permissionSet.has(permission),
    [permissionSet]
  );

  const hasAnyPermission = React.useCallback(
    (permissions: readonly string[]): boolean => permissions.some((p) => permissionSet.has(p)),
    [permissionSet]
  );

  const hasAllPermissions = React.useCallback(
    (permissions: readonly string[]): boolean => permissions.every((p) => permissionSet.has(p)),
    [permissionSet]
  );

  return {
    permissions: permissionSet,
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
    isLoading: query.isLoading,
    error: query.error,
    refetch: query.refetch,
  };
}
