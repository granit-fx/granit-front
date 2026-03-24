import type { ExportDefinitionResponse, ExportField } from '../types/export-definition.js';
import type { CreateExportJobRequest, ExportJobResponse } from '../types/export-job.js';
import type { PagedResult, PaginationParams } from '@granit/querying';
import type { AxiosInstance } from 'axios';

/** Query parameters for listing export jobs. */
export type ExportJobListParams = PaginationParams & {
  readonly status?: string;
};

/**
 * Fetches all registered export definitions.
 *
 * `GET {basePath}/definitions`
 */
export async function fetchExportDefinitions(
  client: AxiosInstance,
  basePath: string
): Promise<readonly ExportDefinitionResponse[]> {
  const response = await client.get<ExportDefinitionResponse[]>(`${basePath}/definitions`);
  return response.data;
}

/**
 * Fetches the available fields for a given export definition.
 *
 * `GET {basePath}/definitions/{name}/fields`
 */
export async function fetchExportFields(
  client: AxiosInstance,
  basePath: string,
  definitionName: string
): Promise<readonly ExportField[]> {
  const response = await client.get<ExportField[]>(
    `${basePath}/definitions/${encodeURIComponent(definitionName)}/fields`
  );
  return response.data;
}

/**
 * Creates an export job.
 *
 * `POST {basePath}/jobs`
 */
export async function createExportJob(
  client: AxiosInstance,
  basePath: string,
  request: CreateExportJobRequest
): Promise<ExportJobResponse> {
  const response = await client.post<ExportJobResponse>(`${basePath}/jobs`, request);
  return response.data;
}

/**
 * Fetches the current status of an export job.
 *
 * `GET {basePath}/jobs/{jobId}`
 */
export async function fetchExportJobStatus(
  client: AxiosInstance,
  basePath: string,
  jobId: string
): Promise<ExportJobResponse> {
  const response = await client.get<ExportJobResponse>(
    `${basePath}/jobs/${encodeURIComponent(jobId)}`
  );
  return response.data;
}

/**
 * Fetches a paginated list of export jobs.
 *
 * `GET {basePath}/jobs`
 */
export async function fetchExportJobs(
  client: AxiosInstance,
  basePath: string,
  params?: ExportJobListParams
): Promise<PagedResult<ExportJobResponse>> {
  const response = await client.get<PagedResult<ExportJobResponse>>(`${basePath}/jobs`, {
    params,
  });
  return response.data;
}

/**
 * Downloads the generated export file.
 *
 * `GET {basePath}/jobs/{jobId}/download`
 */
export async function downloadExportFile(
  client: AxiosInstance,
  basePath: string,
  jobId: string
): Promise<{ blob: Blob; fileName: string }> {
  const response = await client.get<Blob>(
    `${basePath}/jobs/${encodeURIComponent(jobId)}/download`,
    { responseType: 'blob' }
  );

  const contentDisposition = response.headers['content-disposition'] as string | undefined;
  let fileName = 'export';
  if (contentDisposition) {
    const match = /filename\*?=(?:UTF-8''|"?)([^";]+)/i.exec(contentDisposition);
    if (match) {
      fileName = decodeURIComponent(match[1]!.replaceAll('"', ''));
    }
  }

  return { blob: response.data, fileName };
}
