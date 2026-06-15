/**
 * Wire-contract types for the Granit CMS API. Every shape mirrors the
 * corresponding .NET record/enum in `Granit.Cms.*.Endpoints/Dtos/` and the
 * CMS domain (`Granit.Cms.*`). IDs are GUIDs stringified; timestamps are ISO
 * 8601 UTC strings.
 *
 * Source of truth: the running backend's OpenAPI spec.
 */

import type { QueryRequest } from '@granit/query-engine';

// ─── Block Catalog ──────────────────────────────────────────────────────────

/**
 * Where a block is rendered.
 * Maps `Granit.Cms.Blocks.BlockRenderSide`.
 */
export type BlockRenderSide = 'Server' | 'Client';

/**
 * Semantic kind of a block field — the editor-agnostic vocabulary the CMS
 * commits to. Maps `Granit.Cms.Endpoints.Dtos.BlockFieldKind`.
 */
export type BlockFieldKind =
  | 'Text'
  | 'Number'
  | 'Boolean'
  | 'Choice'
  | 'DocumentReference'
  | 'List'
  | 'Nested';

/** One allowed value of a {@link BlockFieldKind} `Choice` field. */
export interface BlockFieldOption {
  readonly label: string;
  readonly value: string;
}

/**
 * Editor-agnostic field descriptor. `kind` carries the semantic; the
 * kind-specific shape is in `options` (Choice), `itemFields` (List), or
 * `fields` (Nested).
 */
export interface BlockFieldDescriptor {
  readonly kind: BlockFieldKind;
  readonly options?: readonly BlockFieldOption[];
  readonly itemFields?: Readonly<Record<string, BlockFieldDescriptor>>;
  readonly fields?: Readonly<Record<string, BlockFieldDescriptor>>;
}

/**
 * One block in the catalog. `dataSourceKey` is set for data-bound blocks;
 * `null` means the block is presentational.
 */
export interface BlockCatalogEntry {
  readonly name: string;
  readonly version: string;
  readonly sourceModule: string;
  readonly renderSide: BlockRenderSide;
  readonly dataSourceKey: string | null;
  readonly fields: Readonly<Record<string, BlockFieldDescriptor>>;
  /** `null` / absent for presentational blocks or data sources not yet registered. */
  readonly subscribedContentTypes?: readonly string[] | null;
}

/** One category group of the block catalog. */
export interface BlockCategoryGroup {
  readonly category: string;
  readonly blocks: readonly BlockCatalogEntry[];
}

/** Full block catalog returned by `GET /api/cms/blocks`. */
export interface BlockCatalogResponse {
  readonly categories: readonly BlockCategoryGroup[];
}

/** Request body for `POST /api/cms/blocks/data`. */
export interface BlockDataResolveRequest {
  readonly dataSourceKey: string;
  /** Opaque editor-configured binding; key required, value nullable (no C# default). */
  readonly query: string | null;
  readonly siteId: string;
  readonly culture: string;
}

/** Response from `POST /api/cms/blocks/data`. */
export interface BlockDataResponse {
  readonly data: unknown;
  readonly consumedContentKeys: readonly string[];
}

// ─── Pages ──────────────────────────────────────────────────────────────────

/**
 * Published page returned by `GET /api/cms/pages/by-path`.
 * `contentJson` is Puck `Data` as a JSON string.
 */
export interface PublishedPageResponse {
  readonly id: string;
  readonly siteId: string;
  readonly culture: string;
  readonly path: string;
  readonly title: string;
  readonly layoutKey: string | null;
  readonly contentJson: string;
}

/**
 * Draft page returned by `GET /api/cms/preview/resolve?token=`.
 * Mirrors {@link PublishedPageResponse} so the renderer uses a single
 * component for both production and preview.
 */
export interface DraftPagePreviewResponse {
  readonly id: string;
  readonly siteId: string;
  readonly culture: string;
  readonly title: string;
  readonly layoutKey: string | null;
  readonly contentJson: string;
}

/** Request body for `POST /api/cms/pages/{id}/preview-token`. */
export interface MintPreviewTokenRequest {
  readonly culture: string;
  /** Requested lifetime in seconds; clamped to 15 min server-side. */
  readonly lifetimeSeconds: number;
}

/** Response from `POST /api/cms/pages/{id}/preview-token`. */
export interface MintPreviewTokenResponse {
  readonly token: string;
  /** UTC ISO 8601 expiry instant. */
  readonly expiresAt: string;
}

// ─── Menus ──────────────────────────────────────────────────────────────────

/**
 * Destination kind of a resolved menu item.
 * Maps `Granit.Cms.Menus.Domain.MenuTargetKind`.
 */
export type MenuTargetKind = 'Page' | 'ExternalUrl' | 'Anchor' | 'None';

/** A render-ready menu item with resolved href. */
export interface ResolvedMenuItem {
  readonly label: string;
  readonly kind: MenuTargetKind;
  /** Resolved destination: live page path, absolute URL, fragment, or `null` for grouping headers. */
  readonly href: string | null;
  readonly children: readonly ResolvedMenuItem[];
  readonly icon?: string | null;
  readonly cssClass?: string | null;
}

/** Render-ready menu returned by `GET /api/cms/menus/resolve`. */
export interface ResolvedMenu {
  readonly key: string;
  readonly title: string;
  readonly culture: string;
  readonly items: readonly ResolvedMenuItem[];
}

// ─── Shared ──────────────────────────────────────────────────────────────────

// ─── Sites admin (§10) ───────────────────────────────────────────────────────

/** One CMS site. Returned by `GET /api/cms/sites` and `GET /api/cms/sites/{id}`. */
export interface SiteResponse {
  readonly id: string;
  readonly slug: string;
  readonly defaultCulture: string;
  readonly allowedCultures: readonly string[];
  /** Legacy field — manage custom domains via Hostnames. */
  readonly domains: readonly string[];
  readonly defaultTheme: string;
  readonly activated: boolean;
  readonly tenantId: string | null;
  readonly displayNames: Readonly<Record<string, string>>;
  /** Page designated at `/` (the site home page); `null` when none is set. */
  readonly homePageId: string | null;
}

/** Request body for `POST /api/cms/sites`. */
export interface CreateSiteRequest {
  readonly slug: string;
  readonly defaultCulture: string;
  readonly allowedCultures: readonly string[];
  readonly domains?: readonly string[];
  readonly defaultTheme?: string;
}

/** Request body for `PUT /api/cms/sites/{id}`. */
export interface UpdateSiteRequest {
  readonly defaultCulture: string;
  readonly allowedCultures: readonly string[];
  readonly domains: readonly string[];
  readonly defaultTheme: string;
  readonly activated: boolean;
}

// ─── Pages admin (§11) ───────────────────────────────────────────────────────

/** One node in the page tree. Returned by `GET /api/cms/pages/tree`. */
export interface PageTreeNodeResponse {
  readonly id: string;
  readonly parentId: string | null;
  readonly slugSegment: string;
  readonly structurePath: string;
  readonly depth: number;
  readonly isSiteRoot: boolean;
}

/** Per-culture translation of a page. */
export interface PageTranslation {
  readonly culture: string;
  readonly urlSlug: string;
  readonly title: string;
  readonly path: string;
}

/** Full page record. Returned by `GET /api/cms/pages/{id}`. */
export interface PageResponse {
  readonly id: string;
  readonly siteId: string;
  readonly parentId: string | null;
  readonly slugSegment: string;
  readonly structurePath: string;
  readonly depth: number;
  readonly kind: string;
  readonly isSiteRoot: boolean;
  readonly layoutKey: string | null;
  readonly translations: readonly PageTranslation[];
}

/** Summary of one page version. Returned by `GET /api/cms/pages/{id}/versions`. */
export interface PageVersionSummaryResponse {
  readonly versionId: string;
  readonly version: number;
  readonly lifecycleStatus: string;
  readonly isPublished: boolean;
  readonly publishedAt: string | null;
}

/**
 * Request body for `POST /api/cms/pages`. Creates a non-root page under
 * `parentId`. Site and tenant are inherited from the parent (no `siteId`).
 */
export interface CreatePageRequest {
  /** Owning parent (the site root or any non-deleted page). Required. */
  readonly parentId: string;
  readonly slugSegment: string;
  /** Optional layout override; key required, value nullable (no C# default). */
  readonly layoutKey: string | null;
}

/** Request body for `PUT /api/cms/pages/{id}`. */
export interface UpdatePageRequest {
  readonly slugSegment: string;
}

/** Request body for `PUT /api/cms/pages/{id}/translations/{culture}`. */
export interface UpdatePageTranslationRequest {
  readonly urlSlug: string;
  readonly title: string;
}

/** Request body for `POST /api/cms/pages/{id}/move` — reparents the page. */
export interface MovePageRequest {
  readonly newParentId: string;
}

/** Request body for `PUT /api/cms/pages/{id}/draft/{culture}`. */
export interface SaveDraftRequest {
  readonly contentJson: string;
  readonly title?: string | null;
}

/** Problem detail returned in a 409 on concurrent draft edit. */
export interface PageDraftConflictResponse {
  readonly pageId: string;
  readonly culture: string;
}

// ─── Menus admin (§13) ───────────────────────────────────────────────────────

/** Editable menu item returned by `GET /api/cms/menus/{id}`. */
export interface MenuItemResponse {
  readonly label: string;
  readonly kind: MenuTargetKind;
  readonly pageId?: string | null;
  readonly url?: string | null;
  readonly anchor?: string | null;
  readonly isVisible: boolean;
  readonly icon?: string | null;
  readonly cssClass?: string | null;
  readonly children: readonly MenuItemResponse[];
}

/** Full admin menu. Returned by `GET /api/cms/menus/{id}`. */
export interface MenuResponse {
  readonly id: string;
  readonly siteId: string;
  readonly key: string;
  readonly title: string;
  readonly items: readonly MenuItemResponse[];
}

/** Writable menu item for create / update requests. */
export interface MenuItemRequest {
  readonly label: string;
  readonly kind: MenuTargetKind;
  readonly pageId?: string | null;
  readonly url?: string | null;
  readonly anchor?: string | null;
  readonly isVisible?: boolean;
  readonly icon?: string | null;
  readonly cssClass?: string | null;
  readonly children?: readonly MenuItemRequest[];
}

/** Request body for `POST /api/cms/menus`. */
export interface CreateMenuRequest {
  readonly siteId: string;
  readonly key: string;
  readonly title: string;
  readonly items?: readonly MenuItemRequest[];
}

/** Request body for `PUT /api/cms/menus/{id}`. */
export interface UpdateMenuRequest {
  readonly title: string;
  readonly items: readonly MenuItemRequest[];
}

// ─── Releases (§14) ──────────────────────────────────────────────────────────

/** Lifecycle state of a release. Maps `Granit.Cms.Releases.Domain.ReleaseStatus`. */
export type ReleaseStatus = 'Draft' | 'Ready' | 'Running' | 'Done' | 'Failed';

/** Type of a release action. Maps `Granit.Cms.Releases.Domain.ReleaseActionType`. */
export type ReleaseActionType = 'Publish' | 'Unpublish';

/** Execution status of a release action. Maps `Granit.Cms.Releases.Domain.ReleaseActionStatus`. */
export type ReleaseActionStatus = 'Pending' | 'Succeeded' | 'Failed';

/** Schedule specification for a release. */
export interface ReleaseSchedule {
  readonly localDateTime: string;
  readonly timeZoneId: string | null;
  readonly scheduledAtUtc: string;
}

/** One content action inside a release. */
export interface ReleaseActionResponse {
  readonly id: string;
  readonly contentType: string;
  readonly contentId: string;
  readonly culture: string | null;
  readonly type: ReleaseActionType;
  readonly status: ReleaseActionStatus;
  readonly error: string | null;
}

/** Full release record. Returned by `GET /api/cms/releases/{id}`. */
export interface ReleaseResponse {
  readonly id: string;
  readonly siteId: string;
  readonly name: string;
  readonly status: ReleaseStatus;
  readonly schedule: ReleaseSchedule | null;
  readonly tenantId: string | null;
  readonly actions: readonly ReleaseActionResponse[];
  readonly concurrencyStamp: string;
}

/** Request body for `POST /api/cms/releases`. */
export interface CreateReleaseRequest {
  readonly siteId: string;
  readonly name: string;
}

/** Request body for `PUT /api/cms/releases/{id}`. */
export interface UpdateReleaseRequest {
  readonly name: string;
}

/** Request body for `POST /api/cms/releases/{id}/actions` (add action). */
export interface AddReleaseActionRequest {
  readonly contentType: string;
  readonly contentId: string;
  readonly culture: string | null;
  readonly type: ReleaseActionType;
}

/** Request body for `POST /api/cms/releases/{id}/schedule`. */
export interface ScheduleReleaseRequest {
  readonly localDateTime: string;
  /** IANA time-zone identifier (e.g. `"Europe/Brussels"`). */
  readonly timeZoneId: string;
}

// ─── List params (admin) ─────────────────────────────────────────────────────
//
// All admin list endpoints are mapped via `MapGranitQuery<T>()` on the backend,
// which binds the standard QueryEngine request (page/pageSize/filter/sort/
// quickFilters/…). We expose the full `QueryRequest` so callers can drive
// server-side filtering, sorting and quick filters — same as the sibling CMS
// grids (`@granit/cms-redirects`, `@granit/cms-seo`).

/** Query parameters for `GET /api/cms/sites` (QueryEngine grid). */
export type ListSitesParams = QueryRequest;

/** Query parameters for `GET /api/cms/pages` (QueryEngine grid). */
export type ListPagesParams = QueryRequest;

/** Query parameters for `GET /api/cms/menus` (QueryEngine grid). */
export type ListMenusParams = QueryRequest;

/** Query parameters for `GET /api/cms/releases` (QueryEngine grid). */
export type ListReleasesParams = QueryRequest;

/**
 * Result of {@link saveDraft}.
 * Returns `{ ok: false, conflict }` on `409` (concurrent edit).
 */
export type SaveDraftResult =
  | { readonly ok: true; readonly version: PageVersionSummaryResponse }
  | { readonly ok: false; readonly conflict: PageDraftConflictResponse };

// ─── Page search ─────────────────────────────────────────────────────────────

/**
 * One search-hit row returned by the admin (`GET /api/cms/pages/search`) or
 * public (`GET /api/cms/search`) search endpoints. `title` / `path` are resolved
 * for the requested culture (falling back to the first available translation).
 */
export interface PageSearchHitResponse {
  readonly pageId: string;
  readonly siteId: string;
  /** Culture the `title` / `path` were resolved for. */
  readonly culture: string;
  readonly path: string;
  readonly title: string;
}

/** Paged search response returned by the admin and public search endpoints. */
export interface PageSearchPageResponse {
  /** Hits in score-descending order. */
  readonly items: readonly PageSearchHitResponse[];
  /** 1-based page index this response covers. */
  readonly page: number;
  readonly pageSize: number;
  /** Count of items in {@link items} — NOT a tenant-wide row count. */
  readonly totalAuthorized: number;
  /** `true` when the authorisation depth was exhausted before filling the page. */
  readonly hitAuthorizationLimit: boolean;
}

/** Query parameters shared by both search endpoints. */
export interface PageSearchParams {
  /** Free-text query (required server-side). */
  readonly q: string;
  /** BCP-47 culture to resolve titles/paths in (required server-side). */
  readonly culture: string;
  readonly page?: number;
  readonly pageSize?: number;
}

// ─── Page editing presence ─────────────────────────────────────────────────────

/** One participant of a page-editing room. */
export interface PageEditingPresenceEntryResponse {
  readonly userId: string;
  /** UTC ISO 8601 instant the participant was last seen. */
  readonly lastSeenAt: string;
}

/** Active participants for `GET /api/cms/pages/{id}/editing`. */
export interface PageEditingPresenceResponse {
  readonly editors: readonly PageEditingPresenceEntryResponse[];
}
