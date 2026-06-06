import type {
  CategoryAssignmentRequest,
  CategoryAssignmentResponse,
  CategoryDetailResponse,
  CategoryListFilter,
  CategoryResponse,
  CreateCategoryRequest,
  MoveCategoryRequest,
  UpdateCategoryRequest,
} from '../types/index';
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
  // Backend wraps the listing in `ListCategoriesResponse { items }`. Older
  // mocks returned a bare array; tolerate both shapes so a stale fixture
  // doesn't crash the tree.
  const response = await client.get<
    { readonly items: readonly CategoryResponse[] } | readonly CategoryResponse[]
  >(`${basePath}/categories`, { params });
  const data: { readonly items: readonly CategoryResponse[] } | readonly CategoryResponse[] =
    response.data;
  if (Array.isArray(data)) return data;
  return (data as { readonly items: readonly CategoryResponse[] }).items;
}

/**
 * Get a single category, including its full root→leaf breadcrumb.
 *
 * Wire format: `{ category: CategoryResponse, breadcrumb: CategoryResponse[] }`.
 * This function adapts the envelope into the flat {@link CategoryDetailResponse}
 * so components can access all category fields without an extra `.category`
 * dereference.
 *
 * `GET {basePath}/categories/{id}`
 */
export async function getCategory(
  client: AxiosInstance,
  basePath: string,
  id: string
): Promise<CategoryDetailResponse> {
  const response = await client.get<{
    readonly category: CategoryResponse;
    readonly breadcrumb: readonly CategoryResponse[];
  }>(`${basePath}/categories/${encodeURIComponent(id)}`);
  const { category, breadcrumb } = response.data;
  return { ...category, breadcrumb };
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
 * Patch a category. Pass `null` for any field to leave it unchanged.
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
 * Assign (or re-assign — single-assignment, idempotent server-side) a
 * category to a target.
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
