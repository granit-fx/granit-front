// ---------------------------------------------------------------------------
// useSavedViews — CRUD operations for saved views (Story #50)
// ---------------------------------------------------------------------------

import {
  buildQueryKey,
  createSavedView,
  deleteSavedView,
  fetchSavedViews,
  setDefaultSavedView,
  updateSavedView,
} from '@granit/query-engine';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { useQueryConfig } from '../providers/query-provider.js';

import type {
  CreateSavedViewRequest,
  SavedViewSummary,
  UpdateSavedViewRequest,
} from '@granit/query-engine';
import type { UseMutationResult, UseQueryResult } from '@tanstack/react-query';

export interface UseSavedViewsReturn {
  /** List of saved views. */
  readonly views: UseQueryResult<SavedViewSummary[]>;
  /** Create a new saved view. */
  readonly create: UseMutationResult<SavedViewSummary, Error, CreateSavedViewRequest>;
  /** Update an existing saved view. */
  readonly update: UseMutationResult<
    SavedViewSummary,
    Error,
    { id: string; request: UpdateSavedViewRequest }
  >;
  /** Delete a saved view. */
  readonly remove: UseMutationResult<void, Error, string>;
  /** Set a saved view as the default. */
  readonly setDefault: UseMutationResult<SavedViewSummary, Error, string>;
}

/**
 * Hook for managing saved views (list, create, update, delete, set default).
 *
 * Uses optimistic invalidation — all mutations invalidate the views query
 * on success.
 *
 * @example
 * ```tsx
 * const { views, create, remove, setDefault } = useSavedViews();
 *
 * // Create a new view
 * create.mutate({ name: 'My View', isShared: false, isDefault: false, filterJson: '...' });
 * ```
 */
export function useSavedViews(): UseSavedViewsReturn {
  const config = useQueryConfig();
  const queryClient = useQueryClient();
  const viewsKey = buildQueryKey(config, 'saved-views');

  const invalidateViews = () => queryClient.invalidateQueries({ queryKey: viewsKey });

  const views = useQuery({
    queryKey: viewsKey,
    queryFn: () => fetchSavedViews(config.client, config.basePath),
  });

  const create = useMutation({
    mutationFn: (request: CreateSavedViewRequest) =>
      createSavedView(config.client, config.basePath, request),
    onSuccess: invalidateViews,
  });

  const update = useMutation({
    mutationFn: ({ id, request }: { id: string; request: UpdateSavedViewRequest }) =>
      updateSavedView(config.client, config.basePath, id, request),
    onSuccess: invalidateViews,
  });

  const remove = useMutation({
    mutationFn: (id: string) => deleteSavedView(config.client, config.basePath, id),
    onSuccess: invalidateViews,
  });

  const setDefault = useMutation({
    mutationFn: (id: string) => setDefaultSavedView(config.client, config.basePath, id),
    onSuccess: invalidateViews,
  });

  return { views, create, update, remove, setDefault };
}
