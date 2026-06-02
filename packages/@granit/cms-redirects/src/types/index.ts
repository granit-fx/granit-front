/**
 * Redirect wire-contract types for the Granit CMS API.
 * Mirrors `Granit.Cms.Redirects.*` .NET types.
 */

// ─── Shared ──────────────────────────────────────────────────────────────────

/** Generic paged list returned by admin list endpoints. */
export interface PagedResponse<T> {
  readonly items: readonly T[];
  readonly totalCount: number;
  readonly page: number;
  readonly pageSize: number;
}

/**
 * Redirect result returned by `GET /api/cms/redirects/resolve` (HTTP 200).
 * When no redirect matches the endpoint returns 204 — callers receive `null`.
 */
export interface RedirectResolveResponse {
  readonly target: string;
  readonly statusCode: number;
}

/** One CMS redirect rule. Returned by `GET /api/cms/redirects`. */
export interface RedirectResponse {
  readonly id: string;
  readonly siteId: string;
  readonly fromPath: string;
  readonly toPath: string;
  readonly culture: string | null;
  readonly statusCode: number;
  readonly isEnabled: boolean;
}

/** Request body for `POST /api/cms/redirects`. */
export interface CreateRedirectRequest {
  readonly siteId: string;
  readonly fromPath: string;
  readonly toPath: string;
  readonly culture?: string | null;
  readonly statusCode?: number;
}

/** Request body for `PUT /api/cms/redirects/{id}`. */
export interface UpdateRedirectRequest {
  readonly fromPath: string;
  readonly toPath: string;
  readonly culture?: string | null;
  readonly statusCode?: number;
  readonly isEnabled?: boolean;
}
