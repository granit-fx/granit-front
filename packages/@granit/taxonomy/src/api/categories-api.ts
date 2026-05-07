import type {
  CategoryAssignmentRequest,
  CategoryAssignmentResponse,
  CategoryDetailResponse,
  CategoryListFilter,
  CategoryResponse,
  CreateCategoryRequest,
  MoveCategoryRequest,
  UpdateCategoryRequest,
} from '../types.js';
import type { AxiosInstance } from '@granit/api-client';

/**
 * List categories within a scope. Pass `parentId` to fetch children of a
 * specific node; omit / pass `null` to fetch scope roots.
 *
 * `GET {basePath}/categories`
 */
export async function listCategories(
  client: AxiosInstance,
  basePath: string,
  filter: CategoryListFilter
): Promise<readonly CategoryResponse[]> {
  const params: Record<string, string> = { scope: filter.scope };
  if (filter.parentId !== undefined && filter.parentId !== null) {
    params.parentId = filter.parentId;
  }
  const response = await client.get<readonly CategoryResponse[]>(`${basePath}/categories`, {
    params,
  });
  return response.data;
}

/**
 * Get a single category, including its full root→leaf breadcrumb.
 *
 * `GET {basePath}/categories/{id}`
 */
export async function getCategory(
  client: AxiosInstance,
  basePath: string,
  id: string
): Promise<CategoryDetailResponse> {
  const response = await client.get<CategoryDetailResponse>(
    `${basePath}/categories/${encodeURIComponent(id)}`
  );
  return response.data;
}

/**
 * Create a category. Pass `parentId: null` to create a scope root.
 *
 * `POST {basePath}/categories`
 */
export async function createCategory(
  client: AxiosInstance,
  basePath: string,
  request: CreateCategoryRequest
): Promise<CategoryResponse> {
  const response = await client.post<CategoryResponse>(`${basePath}/categories`, request);
  return response.data;
}

/**
 * Patch a category — currently only rename is supported on the backend.
 *
 * `PATCH {basePath}/categories/{id}`
 */
export async function updateCategory(
  client: AxiosInstance,
  basePath: string,
  id: string,
  request: UpdateCategoryRequest
): Promise<CategoryResponse> {
  const response = await client.patch<CategoryResponse>(
    `${basePath}/categories/${encodeURIComponent(id)}`,
    request
  );
  return response.data;
}

/**
 * Move a category under a new parent. Backend rejects cross-scope moves and
 * cycles (returns 422 — surface the problem-detail in the UI).
 *
 * `POST {basePath}/categories/{id}/move`
 */
export async function moveCategory(
  client: AxiosInstance,
  basePath: string,
  id: string,
  request: MoveCategoryRequest
): Promise<CategoryResponse> {
  const response = await client.post<CategoryResponse>(
    `${basePath}/categories/${encodeURIComponent(id)}/move`,
    request
  );
  return response.data;
}

/**
 * Delete a category. Backend returns 422 if the category has descendants or
 * active assignments.
 *
 * `DELETE {basePath}/categories/{id}`
 */
export async function deleteCategory(
  client: AxiosInstance,
  basePath: string,
  id: string
): Promise<void> {
  await client.delete<void>(`${basePath}/categories/${encodeURIComponent(id)}`);
}

/**
 * Assign a category to a polymorphic target. Categories are single-assignment
 * per scope: re-posting a different `categoryId` for the same target updates
 * the assignment in place rather than 409'ing.
 *
 * `POST {basePath}/categories/{id}/assign`
 */
export async function assignCategory(
  client: AxiosInstance,
  basePath: string,
  id: string,
  request: CategoryAssignmentRequest
): Promise<CategoryAssignmentResponse> {
  const response = await client.post<CategoryAssignmentResponse>(
    `${basePath}/categories/${encodeURIComponent(id)}/assign`,
    request
  );
  return response.data;
}

/**
 * Remove the category assignment from a polymorphic target.
 *
 * `DELETE {basePath}/categories/assign/{targetType}/{targetId}`
 */
export async function unassignCategory(
  client: AxiosInstance,
  basePath: string,
  targetType: string,
  targetId: string
): Promise<void> {
  await client.delete<void>(
    `${basePath}/categories/assign/${encodeURIComponent(targetType)}/${encodeURIComponent(targetId)}`
  );
}
