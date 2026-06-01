import type { BulkActionRequest, BulkActionResponse } from '../types/index';
import type { AxiosInstance } from '@granit/api-client';

/**
 * `POST /api/v1/entities/{name}/bulk/{action}` — fan out one action across
 * many ids in a single round-trip. Mirrors the dotnet bulk endpoint shipped
 * in granit-fx/granit-dotnet#1792 / #1822.
 *
 * The backend captures per-id failures without short-circuiting and returns
 * them in `BulkActionResponse.failed`; success ids land in `ok`.
 * `BulkActionResponse.parents` carries the distinct
 * `"{ParentEntityName}:{ParentId}"` markers impacted by the batch — the
 * client uses this list to invalidate exactly the right relation-aggregate
 * caches in one step per parent (mirror of the backend's batched-event
 * semantics).
 */
export async function executeBulkAction(
  client: AxiosInstance,
  entityName: string,
  action: string,
  request: BulkActionRequest
): Promise<BulkActionResponse> {
  const response = await client.post<BulkActionResponse>(
    `/api/v1/entities/${encodeURIComponent(entityName)}/bulk/${encodeURIComponent(action)}`,
    request
  );
  return response.data;
}
