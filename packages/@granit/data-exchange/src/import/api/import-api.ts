import type { ImportJobResponse } from '../types/import-job.js';
import type { ConfirmMappingsRequest, ImportPreviewResponse } from '../types/import-preview.js';
import type { ImportReportResponse } from '../types/import-report.js';
import type { AxiosInstance } from '@granit/api-client';
import type { PagedResult, PaginationParams } from '@granit/query-engine';

/** Query parameters for listing import jobs. */
export type ImportJobListParams = PaginationParams & {
  readonly status?: string;
};

/**
 * Uploads a file and creates a new import job.
 *
 * `POST {basePath}/import/`
 */
export async function uploadImportFile(
  client: AxiosInstance,
  basePath: string,
  file: File,
  definitionName: string
): Promise<ImportJobResponse> {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('definitionName', definitionName);
  const response = await client.post<ImportJobResponse>(`${basePath}/import`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return response.data;
}

/**
 * Previews the uploaded file: extracts headers, sample rows, and mapping suggestions.
 *
 * `POST {basePath}/import/{jobId}/preview`
 */
export async function previewImport(
  client: AxiosInstance,
  basePath: string,
  jobId: string
): Promise<ImportPreviewResponse> {
  const response = await client.post<ImportPreviewResponse>(
    `${basePath}/import/${encodeURIComponent(jobId)}/preview`
  );
  return response.data;
}

/**
 * Confirms the column mappings for an import job.
 *
 * `PUT {basePath}/import/{jobId}/mappings`
 */
export async function confirmMappings(
  client: AxiosInstance,
  basePath: string,
  jobId: string,
  request: ConfirmMappingsRequest
): Promise<void> {
  await client.put(`${basePath}/import/${encodeURIComponent(jobId)}/mappings`, request);
}

/**
 * Dispatches the import job for asynchronous execution.
 *
 * `POST {basePath}/import/{jobId}/execute`
 */
export async function executeImport(
  client: AxiosInstance,
  basePath: string,
  jobId: string
): Promise<void> {
  await client.post(`${basePath}/import/${encodeURIComponent(jobId)}/execute`);
}

/**
 * Runs a synchronous dry-run, validating without persisting.
 *
 * `POST {basePath}/import/{jobId}/dry-run`
 */
export async function dryRunImport(
  client: AxiosInstance,
  basePath: string,
  jobId: string
): Promise<ImportReportResponse> {
  const response = await client.post<ImportReportResponse>(
    `${basePath}/import/${encodeURIComponent(jobId)}/dry-run`
  );
  return response.data;
}

/**
 * Gets the current status of an import job.
 *
 * `GET {basePath}/import/{jobId}`
 */
export async function getImportJob(
  client: AxiosInstance,
  basePath: string,
  jobId: string
): Promise<ImportJobResponse> {
  const response = await client.get<ImportJobResponse>(
    `${basePath}/import/${encodeURIComponent(jobId)}`
  );
  return response.data;
}

/**
 * Cancels an import job.
 *
 * `DELETE {basePath}/import/{jobId}`
 */
export async function cancelImportJob(
  client: AxiosInstance,
  basePath: string,
  jobId: string
): Promise<void> {
  await client.delete(`${basePath}/import/${encodeURIComponent(jobId)}`);
}

/**
 * Gets the full execution report for a completed import job.
 *
 * `GET {basePath}/import/{jobId}/report`
 */
export async function getImportReport(
  client: AxiosInstance,
  basePath: string,
  jobId: string
): Promise<ImportReportResponse> {
  const response = await client.get<ImportReportResponse>(
    `${basePath}/import/${encodeURIComponent(jobId)}/report`
  );
  return response.data;
}

/**
 * Lists a paginated list of import jobs.
 *
 * `GET {basePath}/import/jobs`
 */
export async function listImportJobs(
  client: AxiosInstance,
  basePath: string,
  params?: ImportJobListParams
): Promise<PagedResult<ImportJobResponse>> {
  const response = await client.get<PagedResult<ImportJobResponse>>(`${basePath}/import/jobs`, {
    params,
  });
  return response.data;
}

/**
 * Downloads the correction file (CSV/Excel with error rows only).
 *
 * `GET {basePath}/import/{jobId}/correction-file`
 */
export async function downloadCorrectionFile(
  client: AxiosInstance,
  basePath: string,
  jobId: string
): Promise<{ blob: Blob; fileName: string }> {
  const response = await client.get<Blob>(
    `${basePath}/import/${encodeURIComponent(jobId)}/correction-file`,
    { responseType: 'blob' }
  );

  const contentDisposition = response.headers['content-disposition'] as string | undefined;
  let fileName = 'correction';
  if (contentDisposition) {
    const match = /filename\*?=(?:UTF-8''|"?)([^";]+)/i.exec(contentDisposition);
    if (match) {
      fileName = decodeURIComponent(match[1]!.replaceAll('"', ''));
    }
  }

  return { blob: response.data, fileName };
}
