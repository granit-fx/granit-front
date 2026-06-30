import { assignTag, createTag, deleteTag, unassignTag, updateTag } from '@granit/taxonomy';
import { useMutation, useQueryClient } from '@tanstack/react-query';

import { logMutationError } from '../logger';
import { buildTaxonomyQueryKey, useTaxonomyConfig } from '../providers/taxonomy-provider';

import type { ResolvedTaxonomyConfig } from '../providers/taxonomy-provider';
import type {
  CreateTagRequest,
  TagAssignmentRequest,
  TagAssignmentResponse,
  TagResponse,
  TaxonomyTargetRef,
  UpdateTagRequest,
} from '@granit/taxonomy';
import type { QueryClient, UseMutationResult } from '@tanstack/react-query';

interface TagIdMutationArgs<TRequest> {
  readonly id: string;
  readonly request: TRequest;
}

interface TagAssignmentMutationArgs {
  readonly tagId: string;
  readonly target: TaxonomyTargetRef;
}

/**
 * Invalidate the per-scope `['tags', { scope }]` query family. The object
 * literal is matched structurally by React Query, so this picks up every
 * autocomplete variant (any `q`) within the scope without disturbing other
 * scopes' caches.
 */
function invalidateTagsForScope(
  queryClient: QueryClient,
  config: ResolvedTaxonomyConfig,
  scope: string
): void {
  queryClient.invalidateQueries({
    queryKey: buildTaxonomyQueryKey(config, 'tags', { scope }),
  });
}

/**
 * Invalidate the assignment cache for a specific target.
 */
function invalidateTagAssignmentsForTarget(
  queryClient: QueryClient,
  config: ResolvedTaxonomyConfig,
  target: TaxonomyTargetRef
): void {
  queryClient.invalidateQueries({
    queryKey: buildTaxonomyQueryKey(config, 'tag-assignments', target),
  });
}

/**
 * Invalidate every assignment cache, regardless of target. Used by destructive
 * mutations (delete/update tag) where we cannot enumerate the impacted entity
 * cards: a renamed or deleted tag may show up in any target's chip strip.
 */
function invalidateAllTagAssignments(
  queryClient: QueryClient,
  config: ResolvedTaxonomyConfig
): void {
  queryClient.invalidateQueries({
    queryKey: buildTaxonomyQueryKey(config, 'tag-assignments'),
  });
}

/**
 * Create a tag in the given scope. Invalidates the `tags` autocomplete cache
 * for that scope.
 *
 * @example
 * ```tsx
 * const create = useCreateTag('documents');
 * await create.mutateAsync({ scope: 'documents', name: 'Urgent', color: '#FF0000', hideOnEntityCard: false });
 * ```
 */
export function useCreateTag(
  scope: string
): UseMutationResult<TagResponse, Error, CreateTagRequest> {
  const config = useTaxonomyConfig();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (request: CreateTagRequest) => createTag(config.client, config.basePath, request),
    onSuccess: () => {
      invalidateTagsForScope(queryClient, config, scope);
    },
    onError: (error) => logMutationError('createTag', error),
  });
}

/**
 * Patch a tag (rename / recolor / hide). Renames and recolors propagate to
 * every chip strip displaying the tag, so all `tag-assignments` caches are
 * invalidated alongside the per-scope tags list.
 *
 * @example
 * ```tsx
 * const update = useUpdateTag('documents');
 * await update.mutateAsync({ id: 'tag-1', request: { color: '#0000FF' } });
 * ```
 */
export function useUpdateTag(
  scope: string
): UseMutationResult<TagResponse, Error, TagIdMutationArgs<UpdateTagRequest>> {
  const config = useTaxonomyConfig();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, request }: TagIdMutationArgs<UpdateTagRequest>) =>
      updateTag(config.client, config.basePath, id, request),
    onSuccess: () => {
      invalidateTagsForScope(queryClient, config, scope);
      invalidateAllTagAssignments(queryClient, config);
    },
    onError: (error) => logMutationError('updateTag', error),
  });
}

/**
 * Delete a tag. Backend cascades all assignments — every chip strip needs to
 * refresh, so we invalidate the per-scope tags list and the entire
 * `tag-assignments` namespace.
 *
 * @example
 * ```tsx
 * const remove = useDeleteTag('documents');
 * await remove.mutateAsync('tag-1');
 * ```
 */
export function useDeleteTag(scope: string): UseMutationResult<void, Error, string> {
  const config = useTaxonomyConfig();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => deleteTag(config.client, config.basePath, id),
    onSuccess: () => {
      invalidateTagsForScope(queryClient, config, scope);
      invalidateAllTagAssignments(queryClient, config);
    },
    onError: (error) => logMutationError('deleteTag', error),
  });
}

/**
 * Assign a tag to a polymorphic target. Invalidates only the impacted
 * target's chip strip — other entity cards keep their cached state.
 *
 * @example
 * ```tsx
 * const assign = useAssignTag();
 * await assign.mutateAsync({ tagId: 'tag-1', target: { targetType: 'Granit.Documents.Domain.Document', targetId: docId } });
 * ```
 */
export function useAssignTag(): UseMutationResult<
  TagAssignmentResponse,
  Error,
  TagAssignmentMutationArgs
> {
  const config = useTaxonomyConfig();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ tagId, target }: TagAssignmentMutationArgs) => {
      const request: TagAssignmentRequest = target;
      return assignTag(config.client, config.basePath, tagId, request);
    },
    onSuccess: (_data, { target }) => {
      invalidateTagAssignmentsForTarget(queryClient, config, target);
    },
    onError: (error) => logMutationError('assignTag', error),
  });
}

/**
 * Remove a tag from a polymorphic target. Invalidates only the impacted
 * target's chip strip.
 *
 * @example
 * ```tsx
 * const unassign = useUnassignTag();
 * await unassign.mutateAsync({ tagId: 'tag-1', target: { targetType: '...', targetId: docId } });
 * ```
 */
export function useUnassignTag(): UseMutationResult<void, Error, TagAssignmentMutationArgs> {
  const config = useTaxonomyConfig();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ tagId, target }: TagAssignmentMutationArgs) =>
      unassignTag(config.client, config.basePath, tagId, target.targetType, target.targetId),
    onSuccess: (_data, { target }) => {
      invalidateTagAssignmentsForTarget(queryClient, config, target);
    },
    onError: (error) => logMutationError('unassignTag', error),
  });
}
