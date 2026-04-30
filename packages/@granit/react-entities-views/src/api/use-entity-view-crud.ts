import { useGranitClient } from '@granit/react-api-client';
import { useMutation, useQueryClient, type UseMutationResult } from '@tanstack/react-query';

import { defaultEntityViewQueryKey } from './use-default-entity-view.js';
import { entityViewQueryKey } from './use-entity-view.js';
import { entityViewsQueryKey } from './use-entity-views.js';

import type {
  EntityViewCreateBodyRequest,
  EntityViewResponse,
  EntityViewUpdateBodyRequest,
} from '@granit/entities-views';

/**
 * Variables passed to `useUpdateEntityView().mutate()` — the view id
 * plus the new body. Kept separate from `EntityViewUpdateBodyRequest`
 * so the id stays in the URL and out of the wire payload.
 */
export interface UpdateEntityViewVariables {
  readonly id: string;
  readonly request: EntityViewUpdateBodyRequest;
}

/**
 * `POST /entities/{entityName}/views` — creates a new Personal saved
 * view owned by the caller. Mirrors
 * `EntityViewsEndpoints.CreateAsync`. Returns the persisted descriptor
 * on 201; the cached list + default for the entity are invalidated so
 * the next render picks the new view up.
 */
export function useCreateEntityView(
  entityName: string
): UseMutationResult<EntityViewResponse, Error, EntityViewCreateBodyRequest> {
  const api = useGranitClient();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (request) => {
      const { data } = await api.post<EntityViewResponse>(
        `/entities/${encodeURIComponent(entityName)}/views`,
        request
      );
      return data;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: entityViewsQueryKey(entityName) });
      void queryClient.invalidateQueries({ queryKey: defaultEntityViewQueryKey(entityName) });
    },
  });
}

/**
 * `PUT /entities/{entityName}/views/{id}` — updates the editable fields
 * (`name`, `description`, `icon`, `state`) of an existing saved view.
 * Mirrors `EntityViewsEndpoints.UpdateAsync`. `basedOn` and `kind` are
 * immutable post-creation and aren't accepted by the endpoint — see
 * `EntityViewUpdateBodyRequest`.
 */
export function useUpdateEntityView(
  entityName: string
): UseMutationResult<EntityViewResponse, Error, UpdateEntityViewVariables> {
  const api = useGranitClient();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, request }) => {
      const { data } = await api.put<EntityViewResponse>(
        `/entities/${encodeURIComponent(entityName)}/views/${encodeURIComponent(id)}`,
        request
      );
      return data;
    },
    onSuccess: (updated, { id }) => {
      queryClient.setQueryData(entityViewQueryKey(entityName, id), updated);
      void queryClient.invalidateQueries({ queryKey: entityViewsQueryKey(entityName) });
      void queryClient.invalidateQueries({ queryKey: defaultEntityViewQueryKey(entityName) });
    },
  });
}

/**
 * `DELETE /entities/{entityName}/views/{id}` — deletes a saved view.
 * Mirrors `EntityViewsEndpoints.DeleteAsync`. Owners can delete their
 * own views; moderation deletes require `Entities.Views.Delete.Any`.
 */
export function useDeleteEntityView(entityName: string): UseMutationResult<void, Error, string> {
  const api = useGranitClient();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id) => {
      await api.delete(
        `/entities/${encodeURIComponent(entityName)}/views/${encodeURIComponent(id)}`
      );
    },
    onSuccess: (_void, id) => {
      queryClient.removeQueries({ queryKey: entityViewQueryKey(entityName, id) });
      void queryClient.invalidateQueries({ queryKey: entityViewsQueryKey(entityName) });
      void queryClient.invalidateQueries({ queryKey: defaultEntityViewQueryKey(entityName) });
    },
  });
}
