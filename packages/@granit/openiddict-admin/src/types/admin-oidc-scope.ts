// ---------------------------------------------------------------------------
// Admin OIDC scope types — mirrors Granit.OpenIddict.Endpoints .NET contract
// ---------------------------------------------------------------------------

import type { PagedResult } from '@granit/query-engine';

/** OIDC scope descriptor — mirrors `AdminOidcScopeResponse`. */
export interface AdminOidcScopeResponse {
  readonly name: string | null;
  readonly displayName: string | null;
  readonly description: string | null;
  readonly resources: readonly string[];
  readonly tenantId: string | null;
}

/** Query parameters for `GET /oidc/scopes`. */
export interface AdminOidcScopeListParams {
  /** 1-based page index. Defaults to 1 server-side. */
  readonly page?: number;
  /** Items per page. Defaults to 25 server-side, clamped to [1, 100]. */
  readonly pageSize?: number;
}

/** One page of OIDC scopes — mirrors `PagedResult<AdminOidcScopeResponse>`. */
export type AdminOidcScopePage = PagedResult<AdminOidcScopeResponse>;

/** Request body for `POST /oidc/scopes`. */
export interface AdminOidcCreateScopeRequest {
  readonly name: string;
  readonly displayName?: string;
  readonly description?: string;
  readonly resources?: string[];
  readonly tenantId?: string;
}

/** Request body for `PUT /oidc/scopes/{scopeName}`. All fields optional — `null` clears the field. */
export interface AdminOidcUpdateScopeRequest {
  readonly displayName?: string | null;
  readonly description?: string | null;
  /** `null` leaves resources unchanged; `[]` clears all resources. */
  readonly resources?: string[] | null;
}
