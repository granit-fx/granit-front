/**
 * Lifecycle status of an export job.
 * Mirrors `Granit.DataExchange.Export.ExportJobStatus`.
 */
export type ExportJobStatus = 'Queued' | 'Exporting' | 'Completed' | 'Failed';

/**
 * Response DTO for an export job.
 * Mirrors `Granit.DataExchange.Endpoints.Dtos.Export.ExportJobResponse`.
 */
export interface ExportJobResponse {
  readonly id: string;
  readonly definitionName: string;
  readonly format: string;
  readonly status: ExportJobStatus;
  readonly rowCount: number | null;
  readonly fileName: string | null;
  readonly errorMessage: string | null;
  readonly createdAt: string;
  readonly completedAt: string | null;
  readonly modifiedAt: string | null;
  readonly modifiedBy: string | null;
}

/**
 * Request DTO for creating an export job.
 * Mirrors `Granit.DataExchange.Endpoints.Dtos.Export.CreateExportJobRequest`.
 */
export interface CreateExportJobRequest {
  readonly definitionName: string;
  readonly format: string;
  readonly selectedFields: readonly string[] | null;
  readonly includeIdForImport: boolean;
  readonly sort: string | null;
  readonly filter: Readonly<Record<string, string>> | null;
  readonly presets: Readonly<Record<string, string>> | null;
  readonly search: string | null;
}
