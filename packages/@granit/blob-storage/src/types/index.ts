// ---------------------------------------------------------------------------
// Blob storage types — mirrors Granit.BlobStorage .NET contract
// ---------------------------------------------------------------------------

/**
 * Blob lifecycle status.
 *
 * Mirrors `Granit.BlobStorage.Domain.BlobStatus` (.NET).
 * Serialized as PascalCase strings via the framework's global `JsonStringEnumConverter`.
 */
export type BlobStatus = 'Pending' | 'Uploading' | 'Valid' | 'Rejected' | 'Deleted';

export const BlobStatus = {
  Pending: 'Pending',
  Uploading: 'Uploading',
  Valid: 'Valid',
  Rejected: 'Rejected',
  Deleted: 'Deleted',
} as const satisfies Record<string, BlobStatus>;

// ── Upload initiation ───────────────────────────────────────────────────────

/** Request body for `POST /upload`. */
export interface BlobUploadInitiateRequest {
  readonly containerName: string;
  readonly fileName: string;
  readonly contentType: string;
  readonly sizeBytes: number;
}

/** Response from `POST /upload` (201 Created). */
export interface BlobUploadInitiateResponse {
  readonly blobId: string;
  readonly uploadUrl: string;
  readonly httpMethod: string;
  readonly expiresAt: string;
  readonly requiredHeaders: Readonly<Record<string, string>>;
}

// ── Upload confirmation ─────────────────────────────────────────────────────

/** Request body for `POST /{id}/confirm`. */
export interface BlobConfirmUploadRequest {
  readonly containerName: string;
}

/** Response from `POST /{id}/confirm`. */
export interface BlobConfirmUploadResponse {
  readonly blobId: string;
  readonly isValid: boolean;
  readonly status: BlobStatus;
  readonly verifiedContentType: string | null;
  readonly sizeBytes: number | null;
  readonly rejectionReason: string | null;
}

// ── Download URL ────────────────────────────────────────────────────────────

/** Request body for `POST /{id}/download-url`. */
export interface BlobDownloadUrlRequest {
  readonly containerName: string;
  readonly fileName?: string;
}

/** Response from `POST /{id}/download-url`. */
export interface BlobDownloadUrlResponse {
  readonly downloadUrl: string;
  readonly expiresAt: string;
}

// ── Delete ───────────────────────────────────────────────────────────────────

/** Request body for `DELETE /{id}`. */
export interface BlobDeleteRequest {
  readonly containerName: string;
  readonly deletionReason?: string;
}

// ── Cancel pending upload ─────────────────────────────────────────────────────

/**
 * Request body for `DELETE /{id}/pending`.
 *
 * Cancels a `Pending` upload whose pre-signed PUT failed client-side,
 * transitioning the blob straight to `Rejected` instead of waiting for the
 * orphan-cleanup window. Mirrors `Granit.BlobStorage.Endpoints.Dtos.BlobCancelPendingRequest`.
 */
export interface BlobCancelPendingRequest {
  readonly containerName: string;
  /** Human-readable cancellation reason for the audit trail (required, max 512). */
  readonly reason: string;
}

// ── Descriptor ──────────────────────────────────────────────────────────────

/** Full blob descriptor. Mirrors `BlobDescriptorResponse` (.NET). */
export interface BlobDescriptorResponse {
  readonly id: string;
  readonly containerName: string;
  readonly originalFileName: string;
  readonly declaredContentType: string;
  readonly verifiedContentType: string | null;
  readonly declaredSizeBytes: number;
  readonly actualSizeBytes: number | null;
  readonly status: BlobStatus;
  readonly rejectionReason: string | null;
  readonly deletionReason: string | null;
  readonly createdAt: string;
  readonly validatedAt: string | null;
  readonly deletedAt: string | null;
}

// ── Query / list row ──────────────────────────────────────────────────────────

/**
 * Row shape returned by the blob query/list endpoint
 * (`GET {basePath}/blobs` → `QueryBlobDescriptor`, paged as `PagedResult<T>`).
 *
 * Mirrors the **domain** `Granit.BlobStorage.Domain.BlobDescriptor` projection,
 * which differs from {@link BlobDescriptorResponse} (the `getBlob` DTO): the
 * actual validated size is a single `sizeBytes` (null until `Valid`) rather than
 * the DTO's `declaredSizeBytes` / `actualSizeBytes` split, and it carries the
 * tenant / storage-key audit fields.
 */
export interface BlobDescriptorListItem {
  readonly id: string;
  readonly tenantId: string | null;
  readonly containerName: string;
  readonly objectKey: string;
  readonly originalFileName: string;
  readonly declaredContentType: string;
  readonly maxAllowedBytes: number;
  readonly verifiedContentType: string | null;
  readonly sizeBytes: number | null;
  readonly status: BlobStatus;
  readonly rejectionReason: string | null;
  readonly deletionReason: string | null;
  readonly createdAt: string;
  readonly createdBy: string;
  readonly validatedAt: string | null;
  readonly deletedAt: string | null;
}

// ── Cleanup orphans ─────────────────────────────────────────────────────────

/** Response from `POST /cleanup-orphans`. */
export interface BlobCleanupOrphansResponse {
  readonly cleanedCount: number;
}
