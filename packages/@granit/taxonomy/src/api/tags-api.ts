import type {
  CreateTagRequest,
  TagAssignmentRequest,
  TagAssignmentResponse,
  TagListFilter,
  TagResponse,
  UpdateTagRequest,
} from '../types/index.js';
import type { AxiosInstance } from '@granit/api-client';

/**
 * List tags scoped to `filter.scope`, optionally narrowed by autocomplete query
 * `filter.q`. The backend already enforces `scope` as required.
 *
 * `GET {basePath}/tags`
 */
export async function listTags(
  client: AxiosInstance,
  basePath: string,
  filter: TagListFilter
): Promise<readonly TagResponse[]> {
  const params: Record<string, string> = { scope: filter.scope };
  if (filter.q !== undefined) params.q = filter.q;
  const response = await client.get<readonly TagResponse[]>(`${basePath}/tags`, { params });
  return response.data;
}

/**
 * Create a tag in the given scope.
 *
 * `POST {basePath}/tags`
 */
export async function createTag(
  client: AxiosInstance,
  basePath: string,
  request: CreateTagRequest
): Promise<TagResponse> {
  const response = await client.post<TagResponse>(`${basePath}/tags`, request);
  return response.data;
}

/**
 * Patch a tag — rename, recolor, or toggle `hideOnEntityCard`. Only supplied
 * fields are mutated.
 *
 * `PATCH {basePath}/tags/{id}`
 */
export async function updateTag(
  client: AxiosInstance,
  basePath: string,
  id: string,
  request: UpdateTagRequest
): Promise<TagResponse> {
  const response = await client.patch<TagResponse>(
    `${basePath}/tags/${encodeURIComponent(id)}`,
    request
  );
  return response.data;
}

/**
 * Delete a tag. The backend cascades all assignments.
 *
 * `DELETE {basePath}/tags/{id}`
 */
export async function deleteTag(
  client: AxiosInstance,
  basePath: string,
  id: string
): Promise<void> {
  await client.delete<void>(`${basePath}/tags/${encodeURIComponent(id)}`);
}

/**
 * Assign a tag to a polymorphic target.
 *
 * `POST {basePath}/tags/{id}/assign`
 */
export async function assignTag(
  client: AxiosInstance,
  basePath: string,
  id: string,
  request: TagAssignmentRequest
): Promise<TagAssignmentResponse> {
  const response = await client.post<TagAssignmentResponse>(
    `${basePath}/tags/${encodeURIComponent(id)}/assign`,
    request
  );
  return response.data;
}

/**
 * Remove a tag from a polymorphic target.
 *
 * `DELETE {basePath}/tags/{id}/assign/{targetType}/{targetId}`
 */
export async function unassignTag(
  client: AxiosInstance,
  basePath: string,
  id: string,
  targetType: string,
  targetId: string
): Promise<void> {
  await client.delete<void>(
    `${basePath}/tags/${encodeURIComponent(id)}/assign/${encodeURIComponent(targetType)}/${encodeURIComponent(targetId)}`
  );
}

/**
 * List all tag assignments for a polymorphic target — used by entity cards
 * to render their chip strip.
 *
 * `GET {basePath}/tags/assignments`
 */
export async function getTagAssignments(
  client: AxiosInstance,
  basePath: string,
  target: { readonly targetType: string; readonly targetId: string }
): Promise<readonly TagAssignmentResponse[]> {
  const response = await client.get<readonly TagAssignmentResponse[]>(
    `${basePath}/tags/assignments`,
    { params: { targetType: target.targetType, targetId: target.targetId } }
  );
  return response.data;
}
