import type { AxiosInstance } from 'axios';

// ---------------------------------------------------------------------------
// Permissions (usePermissions hook)
// ---------------------------------------------------------------------------

/** Response from the `GET /auth/me` backend endpoint. */
export type PermissionsResponse = {
  permissions: readonly string[];
};

/** Configuration options for the {@link usePermissions} hook. */
export type UsePermissionsOptions = {
  /** Axios instance to use for the API call. */
  client: AxiosInstance;
  /** Base path for the authorization API. Default: `'/auth'`. */
  basePath?: string;
  /** Override the enabled state. Default: `true` when authenticated. */
  enabled?: boolean;
  /** Custom prefix for all query keys produced by this module. */
  queryKeyPrefix?: readonly string[];
};

/** Return type of the {@link usePermissions} hook. */
export type UsePermissionsReturn = {
  /** Set of permission names granted to the current user. Empty while loading or on error. */
  readonly permissions: ReadonlySet<string>;
  /** Returns `true` if the current user has been granted the specified permission. O(1) lookup. */
  hasPermission: (permission: string) => boolean;
  /** Returns `true` if the current user has **any** of the specified permissions. */
  hasAnyPermission: (permissions: readonly string[]) => boolean;
  /** Returns `true` if the current user has **all** of the specified permissions. */
  hasAllPermissions: (permissions: readonly string[]) => boolean;
  /** Whether the permissions query is in-flight. */
  readonly isLoading: boolean;
  /** Query error (network, 401, parsing, etc.). `null` if loading or successful. */
  readonly error: Error | null;
  /** Manual refetch trigger (e.g. after an admin grants a new permission). */
  readonly refetch: () => void;
};

// ---------------------------------------------------------------------------
// Admin permission management (mirrors .NET Authorization DTOs)
// ---------------------------------------------------------------------------

/**
 * Which multi-tenancy sides a permission targets.
 *
 * - `'Host'`: only grantable / checkable from the host context.
 * - `'Tenant'`: only grantable / checkable inside a tenant context.
 * - `'Both'`: grantable / checkable from either side.
 *
 * Mirrors the .NET `MultiTenancySides` flag exposed by `PermissionDefinition` on the
 * backend since `Granit.Authorization` PR #1057.
 */
export type PermissionMultiTenancySide = 'Host' | 'Tenant' | 'Both';

/** A single permission definition with optional display name. */
export type PermissionDefinitionDto = {
  name: string;
  displayName: string | null;
  /** Tenancy sides where this permission is valid. */
  multiTenancySide: PermissionMultiTenancySide;
};

/** A group of related permission definitions. */
export type PermissionGroupDto = {
  name: string;
  displayName: string | null;
  permissions: readonly PermissionDefinitionDto[];
};

/** Permissions granted to a specific role. */
export type PermissionGrantDto = {
  roleName: string;
  permissions: readonly string[];
};

/** Options for the {@link usePermissionDefinitions} hook. */
export type UsePermissionDefinitionsOptions = {
  client: AxiosInstance;
  basePath?: string;
  enabled?: boolean;
  /** Custom prefix for all query keys produced by this module. */
  queryKeyPrefix?: readonly string[];
};

/** Options for the {@link useRolePermissions} hook. */
export type UseRolePermissionsOptions = {
  client: AxiosInstance;
  roleName: string;
  basePath?: string;
  enabled?: boolean;
  /** Custom prefix for all query keys produced by this module. */
  queryKeyPrefix?: readonly string[];
};

/** Options for the {@link usePermissionGrant} hook. */
export type UsePermissionGrantOptions = {
  client: AxiosInstance;
  basePath?: string;
  /** Custom prefix for all query keys produced by this module. */
  queryKeyPrefix?: readonly string[];
};

/** Parameters for granting or revoking a permission. */
export type PermissionGrantParams = {
  roleName: string;
  permissionName: string;
};
