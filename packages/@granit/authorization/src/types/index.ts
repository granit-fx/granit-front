// ---------------------------------------------------------------------------
// Permissions (GET {basePath}/permissions response DTO)
// ---------------------------------------------------------------------------

/** Response from the `GET {basePath}/permissions` backend endpoint — mirrors `MyPermissionsResponse`. */
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

// ---------------------------------------------------------------------------
// Admin query surfaces (MapGranitQuery entities — read-only)
// ---------------------------------------------------------------------------
//
// `GET {basePath}/grants` and `GET {basePath}/role-metadata` expose the raw
// audited aggregates via the query engine (paginated / filterable / groupable).
// The `domainEvents` / `integrationEvents` marker collections present in the
// .NET aggregates are persistence/eventing internals — never populated on the
// HTTP contract — and are intentionally not mirrored here.

/** A single permission grant row — mirrors the `PermissionGrant` aggregate exposed by `GET {basePath}/grants`. */
export type PermissionGrant = {
  readonly id: string;
  readonly name: string;
  readonly providerName: string;
  readonly providerKey: string;
  readonly tenantId: string | null;
  readonly createdAt: string;
  readonly createdBy: string;
  readonly modifiedAt: string | null;
  readonly modifiedBy: string | null;
};

/** Role metadata row — mirrors the `RoleMetadata` aggregate exposed by `GET {basePath}/role-metadata`. */
export type RoleMetadata = {
  readonly id: string;
  readonly name: string;
  readonly tenantId: string | null;
  readonly clientId: string | null;
  /** Tenancy sides where this role is valid. */
  readonly multiTenancySides: PermissionMultiTenancySide;
  readonly description: string | null;
  readonly isSystem: boolean;
  readonly isOrphaned: boolean;
  readonly orphanedAt: string | null;
  readonly concurrencyStamp: string;
  readonly createdAt: string;
  readonly createdBy: string;
  readonly modifiedAt: string | null;
  readonly modifiedBy: string | null;
};
