import type { BackgroundJobListParams, BackgroundJobStatus } from '../types/index.js';
import type { PagedResult } from '@granit/query-engine';
import type { AxiosInstance } from 'axios';

/**
 * List a paginated collection of all background jobs.
 *
 * `GET {basePath}?page=&pageSize=`
 */
export async function listBackgroundJobs(
  client: AxiosInstance,
  basePath: string,
  params?: BackgroundJobListParams
): Promise<PagedResult<BackgroundJobStatus>> {
  const { data } = await client.get<PagedResult<BackgroundJobStatus>>(basePath, { params });
  return data;
}

/**
 * Get the status of a specific background job by name.
 *
 * `GET {basePath}/{name}`
 */
export async function getBackgroundJob(
  client: AxiosInstance,
  basePath: string,
  name: string
): Promise<BackgroundJobStatus> {
  const { data } = await client.get<BackgroundJobStatus>(`${basePath}/${encodeURIComponent(name)}`);
  return data;
}

/**
 * Pause a background job.
 *
 * `POST {basePath}/{name}/pause`
 */
export async function pauseJob(
  client: AxiosInstance,
  basePath: string,
  name: string
): Promise<void> {
  await client.post(`${basePath}/${encodeURIComponent(name)}/pause`);
}

/**
 * Resume a paused background job.
 *
 * `POST {basePath}/{name}/resume`
 */
export async function resumeJob(
  client: AxiosInstance,
  basePath: string,
  name: string
): Promise<void> {
  await client.post(`${basePath}/${encodeURIComponent(name)}/resume`);
}

/**
 * Manually trigger a background job.
 *
 * `POST {basePath}/{name}/trigger`
 */
export async function triggerJob(
  client: AxiosInstance,
  basePath: string,
  name: string
): Promise<void> {
  await client.post(`${basePath}/${encodeURIComponent(name)}/trigger`);
}
