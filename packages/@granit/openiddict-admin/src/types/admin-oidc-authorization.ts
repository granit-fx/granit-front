// ---------------------------------------------------------------------------
// Admin OIDC authorization types — mirrors Granit.OpenIddict.Endpoints .NET contract
// ---------------------------------------------------------------------------

/** Query parameters for `GET /oidc/authorizations`. */
export interface AdminOidcAuthorizationListParams {
  readonly userId?: string;
  readonly clientId?: string;
}

/** OIDC authorization descriptor — mirrors `AdminOidcAuthorizationResponse`. */
export interface AdminOidcAuthorization {
  readonly id: string;
  readonly clientId: string | null;
  readonly subject: string;
  readonly status: string;
  readonly type: string;
  readonly scopes: readonly string[];
}

/** Request body for `POST /oidc/authorizations` (admin consent grant). All fields required. */
export interface AdminOidcAuthorizationCreateRequest {
  readonly subject: string;
  readonly clientId: string;
  readonly scopes: readonly string[];
}
