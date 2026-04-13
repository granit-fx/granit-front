import { useQuery } from '@tanstack/react-query';
import * as React from 'react';

import type {
  PermissionsResponse,
  UsePermissionsOptions,
  UsePermissionsReturn,
} from '@granit/authorization';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const DEFAULT_BASE_PATH = '/api/v1/authorization';
const EMPTY_SET: ReadonlySet<string> = new Set<string>();

/** Query key factory for permission queries. */
export const permissionKeys = {
  all: ['auth', 'permissions'] as const,
  me: (userId?: string) => [...permissionKeys.all, 'me', userId] as const,
  definitions: () => [...permissionKeys.all, 'definitions'] as const,
  role: (roleName: string) => [...permissionKeys.all, 'roles', roleName] as const,
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
    queryKey: permissionKeys.me(),
    queryFn: async () => {
      const response = await client.get<PermissionsResponse>(`${basePath}/permissions`);
      return response.data;
    },
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
