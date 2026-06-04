// ---------------------------------------------------------------------------
// Permissions (GET /auth/me response DTO)
// ---------------------------------------------------------------------------

/** Response from the `GET /auth/me` backend endpoint — mirrors `MyPermissionsResponse`. */
export type MyPermissionsResponse = {
  permissions: readonly string[];
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

/** A single permission definition with optional display name — mirrors `PermissionDefinitionResponse`. */
export type PermissionDefinitionResponse = {
  name: string;
  displayName: string | null;
  /** Tenancy sides where this permission is valid. */
  multiTenancySides: PermissionMultiTenancySide;
};

/** A group of related permission definitions — mirrors `PermissionGroupResponse`. */
export type PermissionGroupResponse = {
  name: string;
  displayName: string | null;
  permissions: readonly PermissionDefinitionResponse[];
};

/** Permissions granted to a specific role — mirrors `PermissionGrantResponse`. */
export type PermissionGrantResponse = {
  roleName: string;
  permissions: readonly string[];
};

/** Parameters for granting or revoking a permission. */
export type PermissionGrantParams = {
  roleName: string;
  permissionName: string;
};
