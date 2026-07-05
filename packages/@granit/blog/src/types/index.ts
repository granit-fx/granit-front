import type { QueryRequest } from '@granit/query-engine';
import type { ISODateString } from '@granit/types';

/**
 * Wire-contract types for the Granit Blog API. Every shape mirrors the
 * corresponding .NET record/enum in `Granit.Blog.*.Endpoints/Dtos/` and the
 * Blog domain (`Granit.Blog.*`). IDs are GUIDs stringified; UTC instants are
 * branded ISO 8601 strings ({@link ISODateString}).
 *
 * The site is resolved server-side from the request host (`ICurrentSite`); the
 * tenant/auth headers are added by the `@granit/api-client` interceptors. Public
 * endpoints are anonymous; admin endpoints are gated by {@link BlogPermissions}.
 *
 * Source of truth: the running backend's OpenAPI spec (`contracts/openapi/blog.json`).
 */

// ─── Posts — public ─────────────────────────────────────────────────────────

/**
 * A published post as it appears in a list/archive page.
 * Maps `Granit.Blog.Posts.Endpoints.Dtos.BlogPostListItem`.
 */
export interface BlogPostListItem {
  readonly id: string;
  readonly slug: string;
  readonly authorId: string;
  readonly culture: string;
  readonly title: string;
  readonly summary?: string | null;
  readonly publishedAt?: ISODateString | null;
  readonly coverImageDocumentId?: string | null;
}

/**
 * A page of published posts. `total` is the full count; `skip`/`take` echo the
 * effective window (server may clamp `take`). Maps
 * `Granit.Blog.Posts.Endpoints.Dtos.BlogPostListResponse`.
 */
export interface BlogPostListResponse {
  readonly items: readonly BlogPostListItem[];
  readonly total: number;
  readonly skip: number;
  readonly take: number;
}

/**
 * A fully-rendered published post in a single culture. `contentJson` is the
 * opaque Puck block-tree (rendered with the shared block catalog). Media are
 * Document ids to be resolved to URLs by the renderer.
 * Maps `Granit.Blog.Posts.Endpoints.Dtos.BlogPostPublishedResponse`.
 */
export interface BlogPostPublishedResponse {
  readonly id: string;
  readonly slug: string;
  readonly authorId: string;
  readonly culture: string;
  readonly title: string;
  readonly summary?: string | null;
  /** Opaque Puck block-tree (JSON). Rendered via the shared CMS block catalog. */
  readonly contentJson: string;
  readonly publishedAt?: ISODateString | null;
  readonly coverImageDocumentId?: string | null;
  readonly attachmentDocumentIds: readonly string[];
}

// ─── Posts — admin ──────────────────────────────────────────────────────────

/** Lifecycle state of a post, derived from its draft/publication/schedule. */
export type BlogPostStatus = 'Draft' | 'Scheduled' | 'Published';

/**
 * One media attachment on a post. `sortOrder` is the gallery position.
 * Maps `Granit.Blog.Posts.Endpoints.Dtos.BlogPostAttachmentResponse`.
 */
export interface BlogPostAttachment {
  readonly documentId: string;
  readonly caption?: string | null;
  readonly altText?: string | null;
  readonly sortOrder: number;
}

/**
 * The admin projection of a post (metadata + gallery + concurrency stamp).
 * Content lives per-culture and is authored/read separately via the draft and
 * public endpoints. Maps `Granit.Blog.Posts.Endpoints.Dtos.BlogPostResponse`.
 */
export interface BlogPostResponse {
  readonly id: string;
  readonly siteId: string;
  readonly slug: string;
  readonly authorId: string;
  readonly coverImageDocumentId?: string | null;
  /** UTC instant the post is scheduled to publish, when in the `Scheduled` state. */
  readonly scheduledAtUtc?: ISODateString | null;
  readonly attachments: readonly BlogPostAttachment[];
  readonly concurrencyStamp: string;
  readonly createdAt: ISODateString;
  readonly modifiedAt?: ISODateString | null;
}

/** `POST /sites/{siteId}/posts`. Maps `BlogPostCreateRequest`. */
export interface BlogPostCreateRequest {
  readonly slug: string;
  readonly authorId: string;
  readonly coverImageDocumentId?: string | null;
}

/** `PUT /posts/{id}`. Maps `BlogPostUpdateRequest`. */
export interface BlogPostUpdateRequest {
  readonly slug: string;
  readonly authorId: string;
  readonly coverImageDocumentId?: string | null;
  readonly concurrencyStamp: string;
}

/**
 * `PUT /posts/{id}/content` — copy-on-write draft for one culture. `contentJson`
 * is the opaque Puck block-tree. `concurrencyStamp` guards against a stale draft.
 * Maps `BlogPostDraftContentRequest`.
 */
export interface BlogPostDraftContentRequest {
  readonly culture: string;
  /** Opaque Puck block-tree (JSON) for this culture's draft. */
  readonly contentJson: string;
  readonly title: string;
  readonly summary?: string | null;
  readonly concurrencyStamp?: string | null;
}

/** Result of saving a draft. Maps `BlogPostDraftContentResponse`. */
export interface BlogPostDraftContentResponse {
  readonly versionId: string;
}

/** `POST /posts/{id}/attachments`. Maps `BlogPostAddAttachmentRequest`. */
export interface BlogPostAddAttachmentRequest {
  readonly documentId: string;
  readonly caption?: string | null;
  readonly altText?: string | null;
}

/** `PATCH /posts/{id}/attachments/{documentId}`. Maps `BlogPostUpdateAttachmentRequest`. */
export interface BlogPostUpdateAttachmentRequest {
  readonly caption?: string | null;
  readonly altText?: string | null;
}

/**
 * `PUT /posts/{id}/attachments/order` — must be the exact current set of
 * attachment document ids in the desired order (422 otherwise).
 * Maps `BlogPostReorderAttachmentsRequest`.
 */
export interface BlogPostReorderAttachmentsRequest {
  readonly documentIdsInOrder: readonly string[];
}

/**
 * One row of the admin posts grid (QueryEngine projection).
 * Maps `Granit.Blog.Posts.Endpoints.Dtos.BlogPostGridRow`.
 */
export interface BlogPostGridRow {
  readonly id: string;
  readonly siteId: string;
  readonly slug: string;
  readonly authorId: string;
  readonly authorDisplayName: string;
  readonly status: BlogPostStatus;
  readonly coverImageDocumentId?: string | null;
  readonly publishedAt?: ISODateString | null;
  readonly scheduledAtUtc?: ISODateString | null;
  readonly createdAt: ISODateString;
  readonly modifiedAt?: ISODateString | null;
}

// ─── Posts — lifecycle ──────────────────────────────────────────────────────

/** Result of a publish/unpublish transition. Maps `BlogPostPublicationResponse`. */
export interface BlogPostPublicationResponse {
  readonly postId: string;
  readonly siteId: string;
}

/**
 * `POST /posts/{id}/schedule` — schedule the current draft to publish at a
 * wall-clock local time in the given IANA zone. `localDateTime` is intentionally
 * NOT a branded UTC instant: it is civil (wall-clock) time, resolved to an
 * instant server-side against `timeZoneId` (DST-correct). Maps `BlogPostScheduleRequest`.
 */
export interface BlogPostScheduleRequest {
  /** Wall-clock local date-time, e.g. `2026-08-01T09:00:00`. Not UTC. */
  readonly localDateTime: string;
  /** IANA time-zone id, e.g. `Europe/Brussels`. */
  readonly timeZoneId: string;
}

// ─── Author profiles ────────────────────────────────────────────────────────

/** An author profile scoped to a site. Maps `BlogAuthorProfileResponse`. */
export interface BlogAuthorProfileResponse {
  readonly id: string;
  readonly siteId: string;
  readonly userId: string;
  readonly displayName: string;
  readonly bio?: string | null;
  readonly avatarDocumentId?: string | null;
  readonly createdAt: ISODateString;
  readonly modifiedAt?: ISODateString | null;
}

/** `POST /sites/{siteId}/authors`. Maps `BlogAuthorProfileCreateRequest`. */
export interface BlogAuthorProfileCreateRequest {
  readonly userId: string;
  readonly displayName: string;
  readonly bio?: string | null;
  readonly avatarDocumentId?: string | null;
}

/** `PUT /authors/{id}`. Maps `BlogAuthorProfileUpdateRequest`. */
export interface BlogAuthorProfileUpdateRequest {
  readonly displayName: string;
  readonly bio?: string | null;
  readonly avatarDocumentId?: string | null;
}

// ─── Blocks — blog-latest-posts data source ─────────────────────────────────

/** One post surfaced by the `blog.latest-posts` data source. */
export interface BlogLatestPostsItem {
  readonly id: string;
  readonly slug: string;
  readonly title: string;
  readonly summary?: string | null;
  readonly publishedAt?: ISODateString | null;
  readonly coverImageDocumentId?: string | null;
}

/**
 * Resolved data for the `blog-latest-posts` Puck block. Returned by
 * `POST /api/cms/blocks/data` for `dataSourceKey: 'blog.latest-posts'`.
 * Maps `Granit.Blog.Blocks.BlogLatestPostsData`.
 */
export interface BlogLatestPostsData {
  readonly posts: readonly BlogLatestPostsItem[];
}

// ─── Params ─────────────────────────────────────────────────────────────────

/** Query params for the anonymous posts list. `take <= 0` → server default page size. */
export interface ListPublicPostsParams {
  readonly culture?: string;
  readonly skip?: number;
  readonly take?: number;
  readonly authorId?: string;
}

/** QueryEngine request for the admin posts grid. */
export type ListBlogPostsParams = QueryRequest;
