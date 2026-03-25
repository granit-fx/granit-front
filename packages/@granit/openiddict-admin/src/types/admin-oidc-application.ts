// ---------------------------------------------------------------------------
// Admin OIDC application types — mirrors Granit.OpenIddict.Endpoints .NET contract
// ---------------------------------------------------------------------------

/** OIDC application descriptor — mirrors `AdminOidcApplicationResponse`. */
export interface AdminOidcApplication {
  readonly clientId: string | null;
  readonly displayName: string | null;
  readonly type: string | null;
  readonly tenantId: string | null;
}

/** Request body for `POST /oidc/applications`. */
export interface AdminOidcApplicationCreateRequest {
  readonly clientId: string;
  readonly clientSecret?: string;
  readonly displayName?: string;
}

/** Response from `POST /oidc/applications/{clientId}/rotate-secret`. */
export interface AdminOidcApplicationSecretResponse {
  readonly clientId: string;
  readonly newSecret: string;
}
