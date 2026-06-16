/**
 * Lifecycle status of an import job.
 * Mirrors `Granit.DataExchange.Import.ImportJobStatus`.
 */
export type ImportJobStatus =
  | 'Created'
  | 'Previewed'
  | 'Mapped'
  | 'Executing'
  | 'Completed'
  | 'PartiallyCompleted'
  | 'Failed'
  | 'Cancelled';

/**
 * Response DTO for an import job.
 * Mirrors `Granit.DataExchange.Endpoints.Dtos.Import.ImportJobResponse`.
 */
export interface ImportJobResponse {
  readonly id: string;
  readonly definitionName: string;
  /** Target entity type being imported. */
  readonly entityTypeName: string;
  readonly originalFileName: string;
  readonly mimeType: string;
  readonly fileSizeBytes: number;
  readonly status: ImportJobStatus;
  readonly createdAt: string;
  readonly completedAt: string | null;
  readonly modifiedAt: string | null;
  readonly modifiedBy: string | null;
  /** Opaque optimistic-concurrency token. Echo back in update requests to detect concurrent modifications (HTTP 409). */
  readonly concurrencyStamp: string;
}
