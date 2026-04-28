import { getPage } from '@granit/query-engine';

import type { RescheduleActionRequest, ScheduledActionResponse } from '../types/index.js';
import type { AxiosInstance } from '@granit/api-client';
import type { PagedResult, QueryRequest } from '@granit/query-engine';

/**
 * Get a scheduled action by ID.
 *
 * `GET {basePath}/{id}`
 */
export async function getScheduledActionById(
  client: AxiosInstance,
  basePath: string,
  id: string
): Promise<ScheduledActionResponse> {
  const { data } = await client.get<ScheduledActionResponse>(`${basePath}/${id}`);
  return data;
}

/**
 * List scheduled actions as a paginated, filterable, sortable collection via QueryEngine.
 *
 * `GET {basePath}?page=&pageSize=&...`
 */
export async function listScheduledActions(
  client: AxiosInstance,
  basePath: string,
  request: QueryRequest = {}
): Promise<PagedResult<ScheduledActionResponse>> {
  return getPage<ScheduledActionResponse>(client, basePath, request);
}

/**
 * Cancel a pending scheduled action.
 *
 * `DELETE {basePath}/{id}` — returns 204 on success, 404/409 on error.
 */
export async function cancelScheduledAction(
  client: AxiosInstance,
  basePath: string,
  id: string
): Promise<void> {
  await client.delete(`${basePath}/${id}`);
}

/**
 * Reschedule a pending action to a new execution time.
 *
 * `PUT {basePath}/{id}/reschedule` — returns 200 on success, 404/409 on error.
 */
export async function rescheduleScheduledAction(
  client: AxiosInstance,
  basePath: string,
  id: string,
  request: RescheduleActionRequest
): Promise<ScheduledActionResponse> {
  const { data } = await client.put<ScheduledActionResponse>(
    `${basePath}/${id}/reschedule`,
    request
  );
  return data;
}
