// ---------------------------------------------------------------------------
// Admin OIDC scope types — mirrors Granit.OpenIddict.Endpoints .NET contract
// ---------------------------------------------------------------------------

/** OIDC scope descriptor — mirrors `AdminOidcScopeResponse`. */
export interface AdminOidcScope {
  readonly name: string | null;
  readonly displayName: string | null;
  readonly description: string | null;
}

/** Request body for `POST /oidc/scopes`. */
export interface AdminOidcScopeCreateRequest {
  readonly name: string;
  readonly displayName?: string;
  readonly description?: string;
}
