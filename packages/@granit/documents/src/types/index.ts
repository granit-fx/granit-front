/**
 * Type-level mirror of the Phase 1 `Granit.Documents` wire contract. Every
 * response shape is fully `readonly` to keep the front honest about server-
 * owned state. ID fields typed as `string` are GUIDs on the backend; timestamps
 * are ISO 8601 UTC strings (round-tripped from .NET `DateTimeOffset`).
 */

import type { ISODateString } from '@granit/types';

// ─── Enums (string unions) ──────────────────────────────────────────────────

/** Lifecycle status of a {@link FolderResponse}. */
export type FolderStatus = 'Active' | 'Trashed';

/** Lifecycle status of a {@link DocumentResponse}. */
export type DocumentStatus = 'Active' | 'Trashed' | 'PermanentlyDeleted';

/** Kind of principal a {@link ShareResponse} is granted to. */
export type ShareGranteeType = 'User' | 'Role' | 'Group';

/**
 * Permission level conferred by a {@link ShareResponse}. Ordered
 * `Read < Edit < Manage`; effective permission across overlapping grants is
 * the highest level (no deny-override semantics in Phase 1).
 */
export type SharePermissionLevel = 'Read' | 'Edit' | 'Manage';

/** What a {@link ShareResponse} is granted on. */
export type ShareTargetType = 'Folder' | 'Document';

/**
 * Effective permission the calling principal holds on a folder or document,
 * resolved via the share ACL. `None` is returned when no grant matches; the
 * field is `null` when the caller did not request permission resolution.
 */
export type EffectivePermissionLevel = 'None' | 'Read' | 'Edit' | 'Manage';

// ─── Folders ────────────────────────────────────────────────────────────────

export interface FolderResponse {
  readonly id: string;
  /** `null` only when the folder is directly under the invisible tenant root. */
  readonly parentFolderId: string | null;
  readonly name: string;
  /** Materialised path from the tenant root, e.g. `"/Contracts/2026"`. */
  readonly path: string;
  /** Depth in the tenant tree. `1` for direct children of the tenant root. */
  readonly depth: number;
  readonly ownerId: string;
  readonly status: FolderStatus;
  /** UTC instant the folder was trashed; `null` while active. */
  readonly trashedAt: ISODateString | null;
  /** UTC instant the folder was created (ISO 8601). Always present. */
  readonly createdAt: ISODateString;
  /** UTC instant of the last change; `null` if never modified since creation. */
  readonly modifiedAt: ISODateString | null;
  /** Effective permission resolved via F6.5b; `null` when not requested. */
  readonly permission: EffectivePermissionLevel | null;
}

/** Wire-shape response for `GET /folders`. */
export interface ListFoldersResponse {
  readonly folders: readonly FolderResponse[];
}

/** Wire-shape response for `GET /folders/{id}/breadcrumb`. */
export interface FolderBreadcrumbResponse {
  readonly folders: readonly FolderResponse[];
}

/** PUT-like create payload for `POST /folders`. */
export interface CreateFolderRequest {
  readonly name: string;
  /** `null` creates the folder directly under the invisible tenant root. */
  readonly parentFolderId: string | null;
}

/** PATCH payload for `PATCH /folders/{id}`. */
export interface RenameFolderRequest {
  readonly name: string;
}

/** Payload for `POST /folders/{id}/move`. */
export interface MoveFolderRequest {
  /** `null` moves the folder directly under the invisible tenant root. */
  readonly newParentFolderId: string | null;
}

/** Optional filters for `GET /folders`. */
export interface ListFoldersFilter {
  /** Omit / pass `null` to fetch direct children of the tenant root. */
  readonly parentId?: string | null;
  /** Defaults to `Active` when omitted. */
  readonly status?: FolderStatus;
}

// ─── Documents ──────────────────────────────────────────────────────────────

export interface DocumentResponse {
  readonly id: string;
  readonly folderId: string;
  readonly name: string;
  readonly description: string | null;
  readonly ownerId: string;
  /** Identifier of the active version; `null` until the first version is uploaded. */
  readonly currentVersionId: string | null;
  readonly status: DocumentStatus;
  readonly trashedAt: ISODateString | null;
  /**
   * Size in bytes of the current version (.NET `long`; see
   * {@link DocumentVersionResponse.sizeBytes}). `null` until the first version
   * is uploaded.
   */
  readonly sizeBytes: number | null;
  /** Content type of the current version; `null` until the first version is uploaded. */
  readonly contentType: string | null;
  /** UTC instant the document was created (ISO 8601). Always present. */
  readonly createdAt: ISODateString;
  /** UTC instant of the last content/metadata change; `null` if never modified since creation. */
  readonly modifiedAt: ISODateString | null;
  /** Optimistic-concurrency token; echo back on edit to detect conflicts (409). */
  readonly concurrencyStamp: string;
  /** Effective permission resolved via F6.5; `null` when not requested. */
  readonly permission: EffectivePermissionLevel | null;
}

/** Request payload for `POST /documents/upload-ticket`. */
export interface UploadTicketRequest {
  readonly fileName: string;
  readonly contentType: string;
  readonly maxAllowedBytes: number;
}

/**
 * Response payload for `POST /documents/upload-ticket`. The client uploads the
 * bytes directly to {@link uploadUrl} using {@link httpMethod} and the headers
 * listed in {@link requiredHeaders}, then finalises via
 * `POST /documents/finalize`.
 */
export interface UploadTicketResponse {
  readonly blobId: string;
  readonly uploadUrl: string;
  /** Always `"PUT"` for S3-compatible providers. */
  readonly httpMethod: string;
  readonly expiresAt: ISODateString;
  readonly requiredHeaders: Readonly<Record<string, string>>;
}

/** Request payload for `POST /documents/finalize`. */
export interface FinalizeUploadRequest {
  readonly blobId: string;
  readonly name: string;
  /** `null` drops the document directly under the tenant root. */
  readonly folderId: string | null;
  readonly description: string | null;
  readonly commitMessage: string | null;
}

/** Request payload for `POST /documents/{id}/versions`. */
export interface AppendVersionRequest {
  readonly blobId: string;
  readonly commitMessage: string | null;
}

/**
 * PATCH payload for `PATCH /documents/{id}`. Pass `null` for `name` or
 * `description` to leave the field unchanged; use {@link clearDescription}
 * to explicitly drop an existing description (sending an empty string sets a
 * non-null empty value instead).
 */
export interface RenameDocumentRequest {
  /** Optimistic-concurrency token echoed from the document's last read. */
  readonly concurrencyStamp: string;
  readonly name: string | null;
  readonly description: string | null;
  /** When `true`, clears the description regardless of {@link description}. */
  readonly clearDescription?: boolean;
}

/** Payload for `POST /documents/{id}/move`. */
export interface MoveDocumentRequest {
  /** `null` moves the document directly under the tenant root. */
  readonly newFolderId: string | null;
}

/**
 * Payload for `PUT /documents/{id}/owner` and `PUT /folders/{id}/owner`.
 * Backend rejects empty / nil GUIDs, the tenant root, and trashed targets
 * with 422; missing target with 404; insufficient permission with 403.
 */
export interface TransferOwnerRequest {
  readonly newOwnerId: string;
}

/** Response payload for `GET /documents/{id}/download`. */
export interface DownloadUrlResponse {
  readonly url: string;
  readonly expiresAt: ISODateString;
}

export interface DocumentVersionResponse {
  readonly id: string;
  readonly documentId: string;
  readonly versionNumber: number;
  readonly blobDescriptorId: string;
  /**
   * Size in bytes (.NET `long`). Backend wires this as a JSON number; realistic
   * tenants stay under `Number.MAX_SAFE_INTEGER` (~9 PB).
   */
  readonly sizeBytes: number;
  readonly contentType: string;
  readonly contentHash: string | null;
  readonly uploadedByUserId: string;
  readonly uploadedAt: ISODateString;
  readonly commitMessage: string | null;
  /** `true` when this version matches the parent document's `currentVersionId`. */
  readonly isCurrent: boolean;
}

/** Paged response for `GET /documents/{id}/versions`. */
export interface ListDocumentVersionsResponse {
  readonly versions: readonly DocumentVersionResponse[];
  readonly totalCount: number;
  readonly skip: number;
  readonly take: number;
}

export interface TrashedDocumentResponse {
  readonly id: string;
  readonly folderId: string;
  readonly name: string;
  readonly ownerId: string;
  readonly trashedAt: ISODateString;
  /**
   * Days remaining before the empty-trash background job permanently deletes
   * the row. Clamped at zero for past-due rows awaiting the next cleanup run.
   */
  readonly daysUntilPermanentDeletion: number;
}

/** Paged response for `GET /documents/trash`. */
export interface ListTrashedDocumentsResponse {
  readonly documents: readonly TrashedDocumentResponse[];
  /** Backend wires this as a .NET `long`; see {@link DocumentVersionResponse.sizeBytes}. */
  readonly totalCount: number;
  readonly skip: number;
  readonly take: number;
}

/** Optional pagination filter for the trash and version listings. */
export interface PageFilter {
  readonly skip?: number;
  readonly take?: number;
}

// ─── Document tags (proxy over Granit.Taxonomy) ─────────────────────────────

export interface DocumentTagResponse {
  readonly id: string;
  readonly tenantId: string | null;
  readonly scope: string;
  readonly name: string;
  readonly color: string;
  readonly hideOnEntityCard: boolean;
}

export interface ListDocumentTagsResponse {
  readonly items: readonly DocumentTagResponse[];
}

export interface DocumentTagAssignmentResponse {
  readonly id: string;
  readonly tenantId: string | null;
  readonly tagId: string;
  readonly documentId: string;
  readonly assignedAt: ISODateString;
  readonly assignedByUserId: string;
}

// ─── Shares (ACL) ───────────────────────────────────────────────────────────

/**
 * Wire-shape representation of a single share grant. Exactly one of
 * {@link folderId} / {@link documentId} is non-null, matching {@link targetType} —
 * the discriminator lets consumers branch without fishing through nullables.
 */
export interface ShareResponse {
  readonly id: string;
  readonly targetType: ShareTargetType;
  readonly folderId: string | null;
  readonly documentId: string | null;
  readonly granteeType: ShareGranteeType;
  readonly granteeId: string;
  readonly permission: SharePermissionLevel;
  /** Folder-share inheritance flag; ignored for document shares. */
  readonly isDefault: boolean;
  readonly expiresAt: ISODateString | null;
  readonly createdAt: ISODateString;
  readonly createdBy: string;
}

/** Wrapper response for the folder- and document-scoped share listings. */
export interface ListSharesResponse {
  readonly items: readonly ShareResponse[];
}

/**
 * Request payload for `POST /folders/{id}/shares` and
 * `POST /documents/{id}/shares`. Backend defaults: `isDefault: true`,
 * `expiresAt: null`.
 */
export interface GrantShareRequest {
  readonly granteeType: ShareGranteeType;
  readonly granteeId: string;
  readonly permission: SharePermissionLevel;
  /** Defaults to `true` on the backend; ignored for document shares. */
  readonly isDefault?: boolean;
  /** `null` (default) means the grant never expires. */
  readonly expiresAt?: string | null;
}

// ─── Quota ──────────────────────────────────────────────────────────────────

export interface TenantStorageQuotaResponse {
  /** Soft cap on the tenant's stored bytes (.NET `long`; see size note above). */
  readonly limitBytes: number;
  /** Sum of active version sizes for the tenant (.NET `long`). */
  readonly usageBytes: number;
  /** `usageBytes / limitBytes * 100`, clamped at 100 and rounded to two decimals. */
  readonly percentUsed: number;
  readonly updatedAt: ISODateString;
}

// ─── Document properties (extracted metadata) ───────────────────────────────

export type DocumentPropertiesStatus = 'Pending' | 'Extracting' | 'Ready' | 'Failed';

/**
 * Rich metadata extracted from a document version by the background extractor
 * pipeline. All domain-specific fields (`width`, `pageCount`, `durationMs`, …)
 * are `null` when the extractor did not populate them for the given content
 * type.
 */
export interface DocumentPropertiesResponse {
  readonly id: string;
  readonly documentId: string;
  readonly documentVersionId: string;
  readonly sourceContentType: string;
  readonly status: DocumentPropertiesStatus;
  readonly createdAt: ISODateString;
  readonly completedAt: ISODateString | null;
  readonly failureReason: string | null;
  readonly extractorCount: number;
  // Image / photo
  readonly width: number | null;
  readonly height: number | null;
  readonly cameraMake: string | null;
  readonly cameraModel: string | null;
  readonly lensModel: string | null;
  readonly iso: number | null;
  readonly fNumber: number | null;
  readonly exposureTimeMs: number | null;
  readonly takenAt: ISODateString | null;
  readonly gpsLatitude: number | null;
  readonly gpsLongitude: number | null;
  readonly gpsAltitude: number | null;
  // Document / PDF
  readonly pageCount: number | null;
  readonly title: string | null;
  readonly author: string | null;
  readonly subject: string | null;
  readonly keywords: string | null;
  readonly producer: string | null;
  readonly revision: number | null;
  readonly lastModifiedBy: string | null;
  // Audio / video
  readonly durationMs: number | null;
  readonly codec: string | null;
  readonly bitrate: number | null;
  readonly artist: string | null;
  readonly album: string | null;
  readonly trackNumber: number | null;
  readonly genre: string | null;
  /** Raw key/value pairs emitted by all extractors. */
  readonly rawMetadata: Readonly<Record<string, string>>;
}

// ─── Public links ────────────────────────────────────────────────────────────

/** Scope of a public link: download-only or view (preview). */
export type PublicLinkScope = 'Download' | 'View';

/** Request body for `POST /documents/{id}/public-links`. */
export interface CreatePublicLinkRequest {
  readonly scope: PublicLinkScope;
  /** Number of days until the link expires. */
  readonly ttlDays: number;
  /** Maximum number of uses; `null` means unlimited. */
  readonly maxUses: number | null;
}

/** Response from `POST /documents/{id}/public-links`. Includes the one-time `token` and the full `url`. */
export interface CreatePublicLinkResponse {
  readonly id: string;
  readonly documentId: string;
  readonly token: string;
  readonly url: string;
  readonly scope: PublicLinkScope;
  readonly expiresAt: ISODateString;
  readonly maxUses: number | null;
}

/** Read-only view of a public link returned by `GET /documents/{id}/public-links`. */
export interface PublicLinkResponse {
  readonly id: string;
  readonly documentId: string;
  readonly scope: PublicLinkScope;
  readonly expiresAt: ISODateString;
  readonly maxUses: number | null;
  readonly currentUses: number;
  readonly revokedAt: ISODateString | null;
  readonly revocationReason: string | null;
  readonly createdAt: ISODateString;
  /** Optimistic-concurrency token; echo back on edit to detect conflicts (409). */
  readonly concurrencyStamp: string;
}

/** Request body for `DELETE /documents/public-links/{id}`. */
export interface RevokePublicLinkRequest {
  /** `null` records no reason. */
  readonly reason: string | null;
}

// ─── Renditions ──────────────────────────────────────────────────────────────

/** Rendition variant: thumbnail, web-optimised, print, or video poster frame. */
export type RenditionType = 'Thumbnail' | 'Web' | 'Print' | 'Poster';

/** Generation status of a rendition. */
export type RenditionStatus = 'Pending' | 'Generating' | 'Ready' | 'Failed';

export interface RenditionResponse {
  readonly id: string;
  readonly documentId: string;
  readonly documentVersionId: string;
  readonly type: RenditionType;
  /** Output format (e.g. `"image/webp"`). */
  readonly format: string;
  readonly status: RenditionStatus;
  readonly sizeBytes: number | null;
  readonly width: number | null;
  readonly height: number | null;
  readonly createdAt: ISODateString;
  readonly completedAt: ISODateString | null;
  readonly failureReason: string | null;
}

/** Response for `GET /documents/{id}/renditions`. */
export interface ListRenditionsResponse {
  readonly documentId: string;
  readonly documentVersionId: string;
  readonly renditions: readonly RenditionResponse[];
}

/** Response for `GET /documents/{id}/renditions/{type}/download`. */
export interface RenditionDownloadUrlResponse {
  readonly url: string;
  readonly expiresAt: ISODateString;
}

// ─── Document resolution ─────────────────────────────────────────────────────

/** A single item in a batch-resolve request. */
export interface ResolveItemRequest {
  readonly documentId: string;
  /** Omit to resolve the current version. */
  readonly versionId?: string | null;
  /** Omit to resolve the original blob; provide to request a specific rendition. */
  readonly renditionType?: RenditionType | null;
  readonly renditionFormat?: string | null;
}

/** Request body for `POST /documents/resolution/resolve`. */
export interface BatchResolveRequest {
  readonly requests: readonly ResolveItemRequest[];
}

/** Single resolved asset returned by `POST /documents/resolution/resolve`. */
export interface ResolvedDocumentResponse {
  readonly documentId: string;
  readonly versionId: string;
  readonly url: string;
  readonly width: number | null;
  readonly height: number | null;
  readonly mimeType: string | null;
  readonly sizeBytes: number | null;
  readonly lastModified: string | null;
}
