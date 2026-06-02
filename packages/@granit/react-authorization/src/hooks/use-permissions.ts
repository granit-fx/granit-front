import { getMyPermissions } from '@granit/authorization';
import { useQuery } from '@tanstack/react-query';
import * as React from 'react';

import { DEFAULT_BASE_PATH } from '../constants';

export { buildPermissionQueryKey, permissionKeys } from './query-keys';
import { buildPermissionQueryKey } from './query-keys';

import type { UsePermissionsOptions, UsePermissionsReturn } from '../types';
import type { PermissionsResponse } from '@granit/authorization';

const EMPTY_SET: ReadonlySet<string> = new Set<string>();

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
