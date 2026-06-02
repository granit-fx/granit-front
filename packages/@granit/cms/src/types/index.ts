/**
 * Wire-contract types for the Granit CMS API. Every shape mirrors the
 * corresponding .NET record/enum in `Granit.Cms.*.Endpoints/Dtos/` and the
 * CMS domain (`Granit.Cms.*`). IDs are GUIDs stringified; timestamps are ISO
 * 8601 UTC strings.
 *
 * Source of truth: the running backend's OpenAPI spec.
 */

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
  readonly subscribedContentTypes: readonly string[];
  readonly fields: Readonly<Record<string, BlockFieldDescriptor>>;
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
  readonly query?: string | null;
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

/** Generic paged list returned by admin list endpoints. */
export interface PagedResponse<T> {
  readonly items: readonly T[];
  readonly totalCount: number;
  readonly page: number;
  readonly pageSize: number;
}

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

/** Request body for `POST /api/cms/pages`. */
export interface CreatePageRequest {
  readonly siteId: string;
  readonly parentId?: string | null;
  readonly slugSegment: string;
  readonly layoutKey?: string | null;
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

/** Request body for `POST /api/cms/pages/{id}/move`. */
export interface MovePageRequest {
  readonly parentId: string | null;
  readonly targetIndex?: number;
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
  readonly id: string;
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
export type ReleaseStatus = 'Draft' | 'Ready' | 'Executed';

/** Type of a release action. Maps `Granit.Cms.Releases.Domain.ReleaseActionType`. */
export type ReleaseActionType = 'Publish' | 'Unpublish';

/** Execution status of a release action. Maps `Granit.Cms.Releases.Domain.ReleaseActionStatus`. */
export type ReleaseActionStatus = 'Pending' | 'Succeeded' | 'Failed';

/** Schedule specification for a release. */
export interface ReleaseSchedule {
  readonly localDateTime: string;
  readonly timeZoneId: string;
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

/** Request body for `DELETE /api/cms/releases/{id}/actions/{actionId}` (add action). */
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

// ─── Document Resolution ─────────────────────────────────────────────────────

/** Single item in a {@link BatchResolveDocumentsRequest}. */
export interface ResolveDocumentItem {
  readonly documentId: string;
  readonly versionId?: string | null;
  readonly renditionType?: string | null;
  readonly renditionFormat?: string | null;
}

/** Request body for `POST /documents/resolution/resolve`. */
export interface BatchResolveDocumentsRequest {
  readonly requests: readonly ResolveDocumentItem[];
}

/**
 * One resolved asset. A `null` slot in the batch response indicates a missing
 * or revoked document.
 */
export interface ResolvedDocumentResponse {
  readonly documentId: string;
  readonly versionId: string;
  /** Stable, CDN-frontable URL for the document content. */
  readonly url: string;
  readonly width?: number | null;
  readonly height?: number | null;
  readonly mimeType?: string | null;
  readonly sizeBytes?: number | null;
  readonly lastModified?: string | null;
}
