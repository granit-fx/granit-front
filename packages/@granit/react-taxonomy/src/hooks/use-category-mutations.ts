import {
  assignCategory,
  createCategory,
  deleteCategory,
  moveCategory,
  unassignCategory,
  updateCategory,
} from '@granit/taxonomy';
import { useMutation, useQueryClient } from '@tanstack/react-query';

import { buildTaxonomyQueryKey, useTaxonomyConfig } from '../providers/taxonomy-provider';

import type { ResolvedTaxonomyConfig } from '../providers/taxonomy-provider';
import type {
  CategoryAssignmentRequest,
  CategoryAssignmentResponse,
  CategoryResponse,
  CreateCategoryRequest,
  MoveCategoryRequest,
  TaxonomyTargetRef,
  UpdateCategoryRequest,
} from '@granit/taxonomy';
import type { QueryClient, UseMutationResult } from '@tanstack/react-query';

interface CategoryIdMutationArgs<TRequest> {
  readonly id: string;
  readonly request: TRequest;
}

interface CategoryAssignmentMutationArgs {
  readonly categoryId: string;
  readonly target: TaxonomyTargetRef;
}

/**
 * Invalidate the per-scope `categories` query family. Tree nodes at every
 * depth share the prefix, so a single key invalidates the full sub-forest
 * for the scope (any `parentId`).
 */
function invalidateCategoriesForScope(
  queryClient: QueryClient,
  config: ResolvedTaxonomyConfig,
  scope: string
): void {
  queryClient.invalidateQueries({
    queryKey: buildTaxonomyQueryKey(config, 'categories', { scope }),
  });
}

/**
 * Invalidate a single category-detail cache (with its breadcrumb).
 */
function invalidateCategoryDetail(
  queryClient: QueryClient,
  config: ResolvedTaxonomyConfig,
  id: string
): void {
  queryClient.invalidateQueries({
    queryKey: buildTaxonomyQueryKey(config, 'category', id),
  });
}

/**
 * Invalidate all category-detail caches. Used by `move` since the
 * breadcrumb of every descendant of the moved node changes; without
 * pre-walking the tree we cannot enumerate them.
 */
function invalidateAllCategoryDetails(
  queryClient: QueryClient,
  config: ResolvedTaxonomyConfig
): void {
  queryClient.invalidateQueries({
    queryKey: buildTaxonomyQueryKey(config, 'category'),
  });
}

/**
 * Invalidate the assignment cache for a specific target. Symmetric with the
 * tag-assignments key; T7's CategorySelector reads from this namespace.
 */
function invalidateCategoryAssignmentsForTarget(
  queryClient: QueryClient,
  config: ResolvedTaxonomyConfig,
  target: TaxonomyTargetRef
): void {
  queryClient.invalidateQueries({
    queryKey: buildTaxonomyQueryKey(config, 'category-assignments', target),
  });
}

/**
 * Create a category. Invalidates the impacted scope's tree.
 */
export function useCreateCategory(
  scope: string
): UseMutationResult<CategoryResponse, Error, CreateCategoryRequest> {
  const config = useTaxonomyConfig();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (request: CreateCategoryRequest) =>
      createCategory(config.client, config.basePath, request),
    onSuccess: () => {
      invalidateCategoriesForScope(queryClient, config, scope);
    },
  });
}

/**
 * Patch a category (rename). Invalidates the scope tree + the renamed node's
 * detail cache.
 */
export function useUpdateCategory(
  scope: string
): UseMutationResult<CategoryResponse, Error, CategoryIdMutationArgs<UpdateCategoryRequest>> {
  const config = useTaxonomyConfig();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, request }: CategoryIdMutationArgs<UpdateCategoryRequest>) =>
      updateCategory(config.client, config.basePath, id, request),
    onSuccess: (_data, { id }) => {
      invalidateCategoriesForScope(queryClient, config, scope);
      invalidateCategoryDetail(queryClient, config, id);
    },
  });
}

/**
 * Move a category. Old and new parent both need refresh, and every descendant
 * of the moved subtree has a new breadcrumb — we invalidate broadly. Backend
 * 422s on cross-scope moves and cycles; surface the problem-detail upstream.
 */
export function useMoveCategory(
  scope: string
): UseMutationResult<CategoryResponse, Error, CategoryIdMutationArgs<MoveCategoryRequest>> {
  const config = useTaxonomyConfig();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, request }: CategoryIdMutationArgs<MoveCategoryRequest>) =>
      moveCategory(config.client, config.basePath, id, request),
    onSuccess: () => {
      invalidateCategoriesForScope(queryClient, config, scope);
      invalidateAllCategoryDetails(queryClient, config);
    },
  });
}

/**
 * Delete a category. Backend 422s if descendants or active assignments exist;
 * surface the problem-detail upstream. Invalidates the scope tree.
 */
export function useDeleteCategory(scope: string): UseMutationResult<void, Error, string> {
  const config = useTaxonomyConfig();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => deleteCategory(config.client, config.basePath, id),
    onSuccess: (_data, id) => {
      invalidateCategoriesForScope(queryClient, config, scope);
      invalidateCategoryDetail(queryClient, config, id);
    },
  });
}

/**
 * Assign (or re-assign — single-assignment, idempotent server-side) a
 * category to a target. Invalidates the target's category-assignment cache.
 */
export function useAssignCategory(): UseMutationResult<
  CategoryAssignmentResponse,
  Error,
  CategoryAssignmentMutationArgs
> {
  const config = useTaxonomyConfig();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ categoryId, target }: CategoryAssignmentMutationArgs) => {
      const request: CategoryAssignmentRequest = target;
      return assignCategory(config.client, config.basePath, categoryId, request);
    },
    onSuccess: (_data, { target }) => {
      invalidateCategoryAssignmentsForTarget(queryClient, config, target);
    },
  });
}

/**
 * Remove the category assignment from a target. Invalidates the target's
 * category-assignment cache.
 */
export function useUnassignCategory(): UseMutationResult<void, Error, TaxonomyTargetRef> {
  const config = useTaxonomyConfig();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (target: TaxonomyTargetRef) =>
      unassignCategory(config.client, config.basePath, target.targetType, target.targetId),
    onSuccess: (_data, target) => {
      invalidateCategoryAssignmentsForTarget(queryClient, config, target);
    },
  });
}
