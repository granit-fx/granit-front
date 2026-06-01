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

// ─── Redirects ──────────────────────────────────────────────────────────────

/**
 * Redirect result returned by `GET /api/cms/redirects/resolve` (HTTP 200).
 * When no redirect matches, the endpoint returns 204 — callers receive `null`.
 */
export interface RedirectResolveResponse {
  readonly target: string;
  readonly statusCode: number;
}

// ─── SEO ────────────────────────────────────────────────────────────────────

/** Crawler policy for a content item. Maps `Granit.Cms.Seo.Domain.RobotsDirective`. */
export interface RobotsDirective {
  readonly index: boolean;
  readonly follow: boolean;
  readonly noArchive: boolean;
  readonly noSnippet: boolean;
  readonly maxSnippet?: number | null;
  readonly maxImagePreview?: string | null;
}

/** Open Graph / Twitter-card image reference. Maps `Granit.Cms.Seo.Domain.OgImage`. */
export interface OgImage {
  readonly documentId?: string | null;
  readonly versionId?: string | null;
  readonly renditionId?: string | null;
  readonly publicLinkId?: string | null;
  /** Absolute URL emitted as `og:image`. */
  readonly url?: string | null;
  readonly dimensions?: { readonly width: number; readonly height: number } | null;
  readonly mimeType?: string | null;
  readonly altText?: string | null;
}

/** `article:*` Open Graph fields. Maps `Granit.Cms.Seo.Domain.OpenGraphArticle`. */
export interface OpenGraphArticle {
  readonly publishedTime?: string | null;
  readonly modifiedTime?: string | null;
  readonly expirationTime?: string | null;
  readonly section?: string | null;
  readonly authors: readonly string[];
  readonly tags: readonly string[];
}

/** Open Graph protocol fields. Maps `Granit.Cms.Seo.Domain.OpenGraph`. */
export interface OpenGraph {
  readonly type: string;
  readonly title?: string | null;
  readonly description?: string | null;
  readonly url?: string | null;
  readonly siteName?: string | null;
  readonly locale?: string | null;
  readonly alternateLocales: readonly string[];
  readonly image?: OgImage | null;
  readonly article?: OpenGraphArticle | null;
}

/** Twitter / X Card fields. Maps `Granit.Cms.Seo.Domain.TwitterCard`. */
export interface TwitterCard {
  readonly card: string;
  readonly title?: string | null;
  readonly description?: string | null;
  readonly image?: OgImage | null;
  readonly site?: string | null;
  readonly creator?: string | null;
}

/** One `hreflang` alternate. Maps `Granit.Cms.Seo.Domain.Hreflang`. */
export interface Hreflang {
  readonly culture: string;
  readonly href: string;
}

/**
 * Cascade-resolved, render-ready SEO for a content item.
 * Returned by `GET /api/cms/seo/sites/{siteId}/metadata/{contentType}/{contentId}/{culture}/effective`.
 */
export interface EffectiveSeoResponse {
  readonly title: string;
  readonly description?: string | null;
  readonly canonicalUrl?: string | null;
  readonly robots: RobotsDirective;
  readonly keywords: readonly string[];
  readonly openGraph: OpenGraph;
  readonly twitterCard: TwitterCard;
  readonly alternates: readonly Hreflang[];
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
