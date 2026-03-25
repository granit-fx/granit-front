// ---------------------------------------------------------------------------
// Admin role types — mirrors Granit.OpenIddict.Endpoints .NET contract
// ---------------------------------------------------------------------------

/** Role descriptor — mirrors `AdminRoleResponse`. */
export interface AdminRole {
  readonly name: string;
  readonly description: string | null;
}

/** Request body for `POST /roles`. */
export interface AdminRoleCreateRequest {
  readonly name: string;
  readonly description?: string;
}

/** Role member (simplified user) — mirrors `AdminUserResponse` subset. */
export interface AdminRoleMember {
  readonly userId: string;
  readonly username: string | null;
  readonly email: string | null;
  readonly firstName: string | null;
  readonly lastName: string | null;
}
