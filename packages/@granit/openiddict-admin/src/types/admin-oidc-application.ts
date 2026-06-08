// ---------------------------------------------------------------------------
// Admin OIDC application types — mirrors Granit.OpenIddict.Endpoints .NET contract
// ---------------------------------------------------------------------------

/** OIDC application descriptor — mirrors `AdminOidcApplicationResponse`. */
export interface AdminOidcApplication {
  readonly clientId: string | null;
  readonly displayName: string | null;
  readonly type: string | null;
  readonly tenantId: string | null;
  readonly permissions: string[];
  readonly redirectUris: string[];
  readonly postLogoutRedirectUris: string[];
  readonly consentType: string | null;
  /** MultiTenancySides flags: 0=None 1=Host 2=Tenant 3=Both */
  readonly clientSide: number | null;
  readonly hasSigningKey: boolean;
}

/** Request body for `POST /oidc/applications`. */
export interface AdminOidcApplicationCreateRequest {
  readonly clientId: string;
  readonly clientSecret?: string;
  readonly displayName?: string;
  readonly type?: string;
  readonly permissions?: string[];
  readonly redirectUris?: string[];
  readonly postLogoutRedirectUris?: string[];
  readonly consentType?: string;
  /** JSON string of a JWK (private params are stripped server-side). */
  readonly signingKeyJwk?: string;
  /** MultiTenancySides flags: 0=None 1=Host 2=Tenant 3=Both */
  readonly clientSide?: number;
}

/** Request body for `PUT /oidc/applications/{clientId}`. All fields optional — `null` clears the field. */
export interface AdminOidcApplicationUpdateRequest {
  readonly displayName?: string | null;
  readonly type?: string | null;
  readonly permissions?: string[] | null;
  readonly redirectUris?: string[] | null;
  readonly postLogoutRedirectUris?: string[] | null;
  readonly consentType?: string | null;
  /** JSON string of a JWK. Empty string clears the key; `null` leaves it unchanged. */
  readonly signingKeyJwk?: string | null;
  /** MultiTenancySides flags: 0=None 1=Host 2=Tenant 3=Both */
  readonly clientSide?: number | null;
}

/** Response from `POST /oidc/applications/{clientId}/rotate-secret`. */
export interface AdminOidcApplicationSecretResponse {
  readonly clientId: string;
  readonly newSecret: string;
}
