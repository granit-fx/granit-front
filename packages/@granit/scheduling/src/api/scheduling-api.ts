import { fetchPage } from '@granit/query-engine';

import type { RescheduleActionRequest, ScheduledActionResponse } from '../types/index.js';
import type { QueryRequest } from '@granit/query-engine';
import type { PagedResult } from '@granit/query-engine';
import type { AxiosInstance } from 'axios';

/**
 * Fetch a scheduled action by ID.
 *
 * `GET {basePath}/{id}`
 */
export async function fetchScheduledActionById(
  client: AxiosInstance,
  basePath: string,
  id: string
): Promise<ScheduledActionResponse> {
  const { data } = await client.get<ScheduledActionResponse>(`${basePath}/${id}`);
  return data;
}

/**
 * Fetch a paginated, filterable, sortable list of scheduled actions via QueryEngine.
 *
 * `GET {basePath}/query?page=&pageSize=&...`
 */
export async function fetchScheduledActions(
  client: AxiosInstance,
  basePath: string,
  request: QueryRequest = {}
): Promise<PagedResult<ScheduledActionResponse>> {
  return fetchPage<ScheduledActionResponse>(client, `${basePath}/query`, request);
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
