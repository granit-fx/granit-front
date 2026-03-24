import type { ImportJobResponse } from '../types/import-job.js';
import type { ConfirmMappingsRequest, ImportPreviewResponse } from '../types/import-preview.js';
import type { ImportReportResponse } from '../types/import-report.js';
import type { PagedResult, PaginationParams } from '@granit/query-engine';
import type { AxiosInstance } from 'axios';

/** Query parameters for listing import jobs. */
export type ImportJobListParams = PaginationParams & {
  readonly status?: string;
};

/**
 * Uploads a file and creates a new import job.
 *
 * `POST {basePath}/`
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
  const response = await client.post<ImportJobResponse>(basePath, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return response.data;
}

/**
 * Previews the uploaded file: extracts headers, sample rows, and mapping suggestions.
 *
 * `POST {basePath}/{jobId}/preview`
 */
export async function previewImport(
  client: AxiosInstance,
  basePath: string,
  jobId: string
): Promise<ImportPreviewResponse> {
  const response = await client.post<ImportPreviewResponse>(
    `${basePath}/${encodeURIComponent(jobId)}/preview`
  );
  return response.data;
}

/**
 * Confirms the column mappings for an import job.
 *
 * `PUT {basePath}/{jobId}/mappings`
 */
export async function confirmMappings(
  client: AxiosInstance,
  basePath: string,
  jobId: string,
  request: ConfirmMappingsRequest
): Promise<void> {
  await client.put(`${basePath}/${encodeURIComponent(jobId)}/mappings`, request);
}

/**
 * Dispatches the import job for asynchronous execution.
 *
 * `POST {basePath}/{jobId}/execute`
 */
export async function executeImport(
  client: AxiosInstance,
  basePath: string,
  jobId: string
): Promise<void> {
  await client.post(`${basePath}/${encodeURIComponent(jobId)}/execute`);
}

/**
 * Runs a synchronous dry-run, validating without persisting.
 *
 * `POST {basePath}/{jobId}/dry-run`
 */
export async function dryRunImport(
  client: AxiosInstance,
  basePath: string,
  jobId: string
): Promise<ImportReportResponse> {
  const response = await client.post<ImportReportResponse>(
    `${basePath}/${encodeURIComponent(jobId)}/dry-run`
  );
  return response.data;
}

/**
 * Fetches the current status of an import job.
 *
 * `GET {basePath}/{jobId}`
 */
export async function fetchImportJob(
  client: AxiosInstance,
  basePath: string,
  jobId: string
): Promise<ImportJobResponse> {
  const response = await client.get<ImportJobResponse>(`${basePath}/${encodeURIComponent(jobId)}`);
  return response.data;
}

/**
 * Cancels an import job.
 *
 * `DELETE {basePath}/{jobId}`
 */
export async function cancelImportJob(
  client: AxiosInstance,
  basePath: string,
  jobId: string
): Promise<void> {
  await client.delete(`${basePath}/${encodeURIComponent(jobId)}`);
}

/**
 * Fetches the full execution report for a completed import job.
 *
 * `GET {basePath}/{jobId}/report`
 */
export async function fetchImportReport(
  client: AxiosInstance,
  basePath: string,
  jobId: string
): Promise<ImportReportResponse> {
  const response = await client.get<ImportReportResponse>(
    `${basePath}/${encodeURIComponent(jobId)}/report`
  );
  return response.data;
}

/**
 * Fetches a paginated list of import jobs.
 *
 * `GET {basePath}/jobs`
 */
export async function fetchImportJobs(
  client: AxiosInstance,
  basePath: string,
  params?: ImportJobListParams
): Promise<PagedResult<ImportJobResponse>> {
  const response = await client.get<PagedResult<ImportJobResponse>>(`${basePath}/jobs`, {
    params,
  });
  return response.data;
}

/**
 * Downloads the correction file (CSV/Excel with error rows only).
 *
 * `GET {basePath}/{jobId}/correction-file`
 */
export async function downloadCorrectionFile(
  client: AxiosInstance,
  basePath: string,
  jobId: string
): Promise<{ blob: Blob; fileName: string }> {
  const response = await client.get<Blob>(
    `${basePath}/${encodeURIComponent(jobId)}/correction-file`,
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
