// ---------------------------------------------------------------------------
// Admin OIDC authorization types — mirrors Granit.OpenIddict.Endpoints .NET contract
// ---------------------------------------------------------------------------

import type { PagedResult } from '@granit/query-engine';

/** Query parameters for `GET /oidc/authorizations`. Filtering is applied server-side. */
export interface AdminOidcAuthorizationListParams {
  /** 1-based page index. Defaults to 1 server-side. */
  readonly page?: number;
  /** Items per page. Defaults to 25 server-side, clamped to [1, 100]. */
  readonly pageSize?: number;
  /** Filter by user id (the authorization's subject). */
  readonly subject?: string;
  /** Filter by client id. An unknown client id yields an empty page. */
  readonly clientId?: string;
}

/** OIDC authorization descriptor — mirrors `AdminOidcAuthorizationResponse`. */
export interface AdminOidcAuthorizationResponse {
  readonly id: string;
  readonly subject: string | null;
  readonly clientId: string | null;
  readonly status: string | null;
  readonly type: string | null;
  readonly scopes: readonly string[];
}

/** One page of OIDC authorizations — mirrors `PagedResult<AdminOidcAuthorizationResponse>`. */
export type AdminOidcAuthorizationPage = PagedResult<AdminOidcAuthorizationResponse>;

/** Request body for `POST /oidc/authorizations` (admin consent grant). All fields required. */
export interface AdminOidcCreateAuthorizationRequest {
  readonly subject: string;
  readonly clientId: string;
  readonly scopes: readonly string[];
}
