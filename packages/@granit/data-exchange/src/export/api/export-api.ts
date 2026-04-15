import type { ExportDefinitionResponse, ExportField } from '../types/export-definition.js';
import type { CreateExportJobRequest, ExportJobResponse } from '../types/export-job.js';
import type { PagedResult, PaginationParams } from '@granit/query-engine';
import type { AxiosInstance } from 'axios';

/** Query parameters for listing export jobs. */
export type ExportJobListParams = PaginationParams & {
  readonly status?: string;
};

/**
 * Lists all registered export definitions.
 *
 * `GET {basePath}/metadata/definitions`
 */
export async function listExportDefinitions(
  client: AxiosInstance,
  basePath: string
): Promise<readonly ExportDefinitionResponse[]> {
  const response = await client.get<ExportDefinitionResponse[]>(`${basePath}/metadata/definitions`);
  return response.data;
}

/**
 * Gets the available fields for a given export definition.
 *
 * `GET {basePath}/metadata/definitions/{name}/fields`
 */
export async function getExportFields(
  client: AxiosInstance,
  basePath: string,
  definitionName: string
): Promise<readonly ExportField[]> {
  const response = await client.get<ExportField[]>(
    `${basePath}/metadata/definitions/${encodeURIComponent(definitionName)}/fields`
  );
  return response.data;
}

/**
 * Creates an export job.
 *
 * `POST {basePath}/export/jobs`
 */
export async function createExportJob(
  client: AxiosInstance,
  basePath: string,
  request: CreateExportJobRequest
): Promise<ExportJobResponse> {
  const response = await client.post<ExportJobResponse>(`${basePath}/export/jobs`, request);
  return response.data;
}

/**
 * Gets the current status of an export job.
 *
 * `GET {basePath}/export/jobs/{jobId}`
 */
export async function getExportJobStatus(
  client: AxiosInstance,
  basePath: string,
  jobId: string
): Promise<ExportJobResponse> {
  const response = await client.get<ExportJobResponse>(
    `${basePath}/export/jobs/${encodeURIComponent(jobId)}`
  );
  return response.data;
}

/**
 * Lists a paginated list of export jobs.
 *
 * `GET {basePath}/export/jobs`
 */
export async function listExportJobs(
  client: AxiosInstance,
  basePath: string,
  params?: ExportJobListParams
): Promise<PagedResult<ExportJobResponse>> {
  const response = await client.get<PagedResult<ExportJobResponse>>(`${basePath}/export/jobs`, {
    params,
  });
  return response.data;
}

/**
 * Downloads the generated export file.
 *
 * `GET {basePath}/export/jobs/{jobId}/download`
 */
export async function downloadExportFile(
  client: AxiosInstance,
  basePath: string,
  jobId: string
): Promise<{ blob: Blob; fileName: string }> {
  const response = await client.get<Blob>(
    `${basePath}/export/jobs/${encodeURIComponent(jobId)}/download`,
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
