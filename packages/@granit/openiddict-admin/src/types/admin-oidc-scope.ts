// ---------------------------------------------------------------------------
// Admin OIDC scope types — mirrors Granit.OpenIddict.Endpoints .NET contract
// ---------------------------------------------------------------------------

/** OIDC scope descriptor — mirrors `AdminOidcScopeResponse`. */
export interface AdminOidcScopeResponse {
  readonly name: string | null;
  readonly displayName: string | null;
  readonly description: string | null;
  readonly resources: readonly string[];
}

/** Request body for `POST /oidc/scopes`. */
export interface AdminOidcCreateScopeRequest {
  readonly name: string;
  readonly displayName?: string;
  readonly description?: string;
  readonly resources?: string[];
}

/** Request body for `PUT /oidc/scopes/{scopeName}`. All fields optional — `null` clears the field. */
export interface AdminOidcUpdateScopeRequest {
  readonly displayName?: string | null;
  readonly description?: string | null;
  /** `null` leaves resources unchanged; `[]` clears all resources. */
  readonly resources?: string[] | null;
}

/** Request body for `PUT /oidc/scopes/{scopeName}`. All fields optional — `null` clears the field. */
export interface AdminOidcUpdateScopeRequest {
  readonly displayName?: string | null;
  readonly description?: string | null;
}
