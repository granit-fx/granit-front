import type {
  ActivityCalendarFilter,
  ActivityCalendarItemResponse,
  ActivityListFilter,
  ActivityListResponse,
  ActivityResponse,
  CancelActivityRequest,
  CompleteActivityRequest,
  CreateActivityRequest,
  ReassignActivityRequest,
  RescheduleActivityRequest,
} from '../types/index';
import type { AxiosInstance } from '@granit/api-client';

/**
 * List activities, paginated. Filters are passed as query parameters; only
 * defined keys are sent — undefined axes are treated as wildcards by the
 * backend.
 *
 * `GET {basePath}/`
 */
export async function listActivities(
  client: AxiosInstance,
  basePath: string,
  filter?: ActivityListFilter
): Promise<ActivityListResponse> {
  const params = buildListParams(filter);
  const response = await client.get<ActivityListResponse>(
    basePath,
    params ? { params } : undefined
  );
  return response.data;
}

/**
 * Get a single activity by ID.
 *
 * `GET {basePath}/{id}`
 */
export async function getActivity(
  client: AxiosInstance,
  basePath: string,
  id: string
): Promise<ActivityResponse> {
  const response = await client.get<ActivityResponse>(`${basePath}/${encodeURIComponent(id)}`);
  return response.data;
}

/**
 * Create a new activity.
 *
 * `POST {basePath}/`
 */
export async function createActivity(
  client: AxiosInstance,
  basePath: string,
  request: CreateActivityRequest
): Promise<ActivityResponse> {
  const response = await client.post<ActivityResponse>(basePath, request);
  return response.data;
}

/**
 * Mark an activity as completed.
 *
 * `POST {basePath}/{id}/complete`
 */
export async function completeActivity(
  client: AxiosInstance,
  basePath: string,
  id: string,
  request: CompleteActivityRequest
): Promise<ActivityResponse> {
  const response = await client.post<ActivityResponse>(
    `${basePath}/${encodeURIComponent(id)}/complete`,
    request
  );
  return response.data;
}

/**
 * Cancel an activity.
 *
 * `POST {basePath}/{id}/cancel`
 */
export async function cancelActivity(
  client: AxiosInstance,
  basePath: string,
  id: string,
  request: CancelActivityRequest
): Promise<ActivityResponse> {
  const response = await client.post<ActivityResponse>(
    `${basePath}/${encodeURIComponent(id)}/cancel`,
    request
  );
  return response.data;
}

/**
 * Reassign an activity to another user.
 *
 * `PUT {basePath}/{id}/assignee`
 */
export async function reassignActivity(
  client: AxiosInstance,
  basePath: string,
  id: string,
  request: ReassignActivityRequest
): Promise<ActivityResponse> {
  const response = await client.put<ActivityResponse>(
    `${basePath}/${encodeURIComponent(id)}/assignee`,
    request
  );
  return response.data;
}

/**
 * Reschedule an activity (update its due date).
 *
 * `PUT {basePath}/{id}/due-date`
 */
export async function rescheduleActivity(
  client: AxiosInstance,
  basePath: string,
  id: string,
  request: RescheduleActivityRequest
): Promise<ActivityResponse> {
  const response = await client.put<ActivityResponse>(
    `${basePath}/${encodeURIComponent(id)}/due-date`,
    request
  );
  return response.data;
}

/**
 * Cross-entity calendar view of activities. `from` and `to` are required;
 * other axes are optional and only included when defined.
 *
 * `GET {basePath}/calendar`
 */
export async function getActivitiesCalendar(
  client: AxiosInstance,
  basePath: string,
  filter: ActivityCalendarFilter
): Promise<readonly ActivityCalendarItemResponse[]> {
  const params = buildCalendarParams(filter);
  const response = await client.get<readonly ActivityCalendarItemResponse[]>(
    `${basePath}/calendar`,
    { params }
  );
  return response.data;
}

function buildListParams(
  filter: ActivityListFilter | undefined
): Record<string, string | number> | undefined {
  if (!filter) {
    return undefined;
  }
  const params: Record<string, string | number> = {};
  if (filter.status !== undefined) params.status = filter.status;
  if (filter.assignedToUserId !== undefined) params.assignedToUserId = filter.assignedToUserId;
  if (filter.entityType !== undefined) params.entityType = filter.entityType;
  if (filter.entityId !== undefined) params.entityId = filter.entityId;
  if (filter.type !== undefined) params.type = filter.type;
  if (filter.page !== undefined) params.page = filter.page;
  if (filter.pageSize !== undefined) params.pageSize = filter.pageSize;
  return Object.keys(params).length > 0 ? params : undefined;
}

function buildCalendarParams(filter: ActivityCalendarFilter): Record<string, string> {
  const params: Record<string, string> = { from: filter.from, to: filter.to };
  if (filter.assignee !== undefined) params.assignee = filter.assignee;
  if (filter.entityType !== undefined) params.entityType = filter.entityType;
  if (filter.type !== undefined) params.type = filter.type;
  if (filter.status !== undefined) params.status = filter.status;
  return params;
}
