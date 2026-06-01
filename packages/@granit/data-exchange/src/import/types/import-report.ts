import type { ImportJobStatus } from './import-job';

/**
 * Kind of error that can occur on an individual row.
 * Mirrors `Granit.DataExchange.Import.ImportRowErrorKind`.
 */
export type ImportRowErrorKind = 'Conversion' | 'Validation' | 'Persistence' | 'Identity';

/**
 * Error details for a single row.
 * Mirrors `Granit.DataExchange.Endpoints.Dtos.Import.ImportRowErrorDto`.
 */
export interface ImportRowError {
  readonly rowNumber: number;
  readonly kind: ImportRowErrorKind;
  readonly errorCodes: readonly string[];
  readonly message: string;
}

/**
 * Full execution report for an import job.
 * Mirrors `Granit.DataExchange.Endpoints.Dtos.Import.ImportReportResponse`.
 */
export interface ImportReportResponse {
  readonly importJobId: string;
  readonly finalStatus: ImportJobStatus;
  readonly totalRows: number;
  readonly succeededRows: number;
  readonly failedRows: number;
  readonly skippedRows: number;
  readonly insertedRows: number;
  readonly updatedRows: number;
  readonly duration: string;
  readonly rowErrors: readonly ImportRowError[];
}
