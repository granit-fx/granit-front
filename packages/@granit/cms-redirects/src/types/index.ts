/**
 * Redirect wire-contract types for the Granit CMS API.
 * Mirrors `Granit.Cms.Redirects.Endpoints.Dtos.*` and the domain enums under
 * `Granit.Cms.Redirects.Domain.*`.
 *
 * Optionality follows the C#-default rule: a record parameter without a default
 * is a required key (mirror as a required property, nullable value when the type
 * is nullable); a parameter with a default is genuinely optional (`?`).
 */

// ─── Grid (QueryEngine) re-exports ───────────────────────────────────────────
// The admin grid is backed by `MapGranitQuery<Redirect>` — use the QueryEngine
// contracts, never `PagedResponse` from `@granit/cms`.
export type { PagedResult, PaginationParams, QueryRequest } from '@granit/query-engine';

// ─── Domain enums (serialized as PascalCase names) ───────────────────────────

/**
 * HTTP status a redirect emits. Mirrors `RedirectType` — serialized by name
 * (`ApplyGranitConventions`), not by numeric value.
 */
export type RedirectType = 'MovedPermanently' | 'Found' | 'TemporaryRedirect' | 'PermanentRedirect';

/** How a redirect's source is matched against an incoming path. Mirrors `RedirectMatchType`. */
export type RedirectMatchType = 'Exact' | 'Prefix';

/** Where a redirect came from. Mirrors `RedirectOrigin`. */
export type RedirectOrigin = 'Manual' | 'AutoFromPageMove' | 'Imported';

// ─── Responses ───────────────────────────────────────────────────────────────

/**
 * The stored redirect. Mirrors `RedirectResponse`.
 * `Culture` / `LastHitAt` are nullable-value, required-key (C# params without a default).
 */
export interface RedirectResponse {
  readonly id: string;
  readonly siteId: string;
  readonly source: string;
  readonly matchType: RedirectMatchType;
  readonly target: string;
  readonly type: RedirectType;
  readonly statusCode: number;
  readonly isActive: boolean;
  readonly culture: string | null;
  readonly origin: RedirectOrigin;
  readonly hitCount: number;
  readonly lastHitAt: string | null;
}

/**
 * A create/update result, with an optional soft page-path-collision warning.
 * Mirrors `RedirectMutationResult` (`ConflictWarning` is required-key, nullable-value).
 */
export interface RedirectMutationResult {
  readonly redirect: RedirectResponse;
  readonly conflictWarning: string | null;
}

/** Resolution result for the public resolve endpoint. Mirrors `ResolveResponse` (HTTP 200). */
export interface ResolveResponse {
  readonly target: string;
  readonly statusCode: number;
}

/** Admin preview of resolving a candidate path. Mirrors `RedirectPreviewResponse`. */
export interface RedirectPreviewResponse {
  readonly matched: boolean;
  readonly target: string | null;
  readonly statusCode: number | null;
}

/** A site's redirect settings. Mirrors `SiteRedirectSettingsResponse`. */
export interface SiteRedirectSettingsResponse {
  readonly siteId: string;
  readonly autoRedirectOnMove: boolean;
}

// ─── Requests ────────────────────────────────────────────────────────────────

/**
 * Create body for a redirect. Mirrors `RedirectCreateRequest`.
 * `Type` / `MatchType` / `Culture` / `IsActive` all have C# defaults → optional.
 */
export interface RedirectCreateRequest {
  readonly source: string;
  readonly target: string;
  readonly type?: RedirectType;
  readonly matchType?: RedirectMatchType;
  readonly culture?: string | null;
  readonly isActive?: boolean;
}

/**
 * Update body for a redirect — repoints target / status / match type and toggles
 * active. The source path is immutable (delete + recreate to change it).
 * Mirrors `RedirectUpdateRequest`.
 */
export interface RedirectUpdateRequest {
  readonly target: string;
  readonly type?: RedirectType;
  readonly matchType?: RedirectMatchType;
  readonly isActive?: boolean;
}

/** Upsert body for a site's redirect settings. Mirrors `SiteRedirectSettingsRequest`. */
export interface SiteRedirectSettingsRequest {
  readonly autoRedirectOnMove: boolean;
}
