// ---------------------------------------------------------------------------
// Admin OIDC application types — mirrors Granit.OpenIddict.Endpoints .NET contract
// ---------------------------------------------------------------------------

import type { PagedResult } from '@granit/query-engine';

/** OIDC application descriptor — mirrors `AdminOidcApplicationResponse`. */
export interface AdminOidcApplicationResponse {
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
  /**
   * Device-flow client kind (`Browser`, `MobileApp`, …); `null` for
   * non-device clients. Mirrors the backend `DeviceKind` enum.
   */
  readonly deviceKind: string | null;
  readonly hasSigningKey: boolean;
  /**
   * Server-generated client secret, in plaintext. Only ever populated on the
   * `POST /oidc/applications` response when the request set
   * `generateClientSecret: true` — the secret is hashed at rest and is never
   * returned again, so it must be surfaced to the operator once and discarded.
   */
  readonly generatedClientSecret?: string | null;
}

/** Query parameters for `GET /oidc/applications`. */
export interface AdminOidcApplicationListParams {
  /** 1-based page index. Defaults to 1 server-side. */
  readonly page?: number;
  /** Items per page. Defaults to 25 server-side, clamped to [1, 100]. */
  readonly pageSize?: number;
}

/** One page of OIDC applications — mirrors `PagedResult<AdminOidcApplicationResponse>`. */
export type AdminOidcApplicationPage = PagedResult<AdminOidcApplicationResponse>;

/** Request body for `POST /oidc/applications`. */
export interface AdminOidcCreateApplicationRequest {
  readonly clientId: string;
  readonly displayName?: string;
  /** Explicit secret. Mutually redundant with {@link generateClientSecret}. */
  readonly clientSecret?: string;
  readonly type?: string;
  readonly permissions?: string[];
  readonly redirectUris?: string[];
  readonly postLogoutRedirectUris?: string[];
  readonly consentType?: string;
  /** JSON string of a JWK (private params are stripped server-side). */
  readonly signingKeyJwk?: string;
  /** MultiTenancySides flags: 0=None 1=Host 2=Tenant 3=Both */
  readonly clientSide?: number;
  /** Device-flow client kind (`Browser`, `MobileApp`, …). Mirrors `DeviceKind`. */
  readonly deviceKind?: string;
  readonly tenantId?: string;
  /**
   * Ask the server to mint a cryptographically strong secret (confidential
   * client). The plaintext comes back once in
   * {@link AdminOidcApplicationResponse.generatedClientSecret}.
   */
  readonly generateClientSecret?: boolean;
}

/** Request body for `PUT /oidc/applications/{clientId}`. All fields optional — `null` clears the field. */
export interface AdminOidcUpdateApplicationRequest {
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
  /** Device-flow client kind (`Browser`, `MobileApp`, …). Mirrors `DeviceKind`. */
  readonly deviceKind?: string | null;
}

/** Response from `POST /oidc/applications/{clientId}/rotate-secret`. */
export interface AdminOidcRotateSecretResponse {
  readonly clientId: string | null;
  readonly displayName: string | null;
  readonly newClientSecret: string;
}
