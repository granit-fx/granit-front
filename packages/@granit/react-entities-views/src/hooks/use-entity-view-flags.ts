import {
  setEntityViewPersonalDefault,
  setEntityViewPinned,
  setEntityViewTenantDefault,
  shareEntityView,
} from '@granit/entities-views';
import { useGranitClient } from '@granit/react-api-client';
import { useMutation, useQueryClient, type UseMutationResult } from '@tanstack/react-query';

import { defaultEntityViewQueryKey } from './use-default-entity-view.js';
import { entityViewQueryKey } from './use-entity-view.js';
import { entityViewsQueryKey } from './use-entity-views.js';

import type { EntityViewResponse, EntityViewShareBodyRequest } from '@granit/entities-views';

const ENTITIES_BASE_PATH = '/api/v1/entities';

/** Variables shared by every boolean-flag mutation (pin / star / set-default). */
export interface ToggleEntityViewFlagVariables {
  readonly id: string;
  readonly value: boolean;
}

/** Variables for the share mutation. */
export interface ShareEntityViewVariables {
  readonly id: string;
  readonly request: EntityViewShareBodyRequest;
}

function invalidateAll(
  queryClient: ReturnType<typeof useQueryClient>,
  entityName: string,
  id: string,
  updated: EntityViewResponse
): Promise<unknown> {
  queryClient.setQueryData(entityViewQueryKey(entityName, id), updated);
  return Promise.all([
    queryClient.invalidateQueries({ queryKey: entityViewsQueryKey(entityName) }),
    queryClient.invalidateQueries({ queryKey: defaultEntityViewQueryKey(entityName) }),
  ]);
}

/**
 * `POST /entities/{entityName}/views/{id}/pin` — sets or clears the
 * pinned-as-tab flag (admin-promoted). Mirrors
 * `EntityViewsEndpoints.SetPinnedAsync`. Requires
 * `Entities.Views.Manage`. Independent from `IsDefault` /
 * `IsPersonalDefault`.
 */
export function useSetEntityViewPinned(
  entityName: string
): UseMutationResult<EntityViewResponse, Error, ToggleEntityViewFlagVariables> {
  const api = useGranitClient();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, value }) =>
      setEntityViewPinned(api, ENTITIES_BASE_PATH, entityName, id, value),
    onSuccess: (updated, { id }) => invalidateAll(queryClient, entityName, id, updated),
  });
}

/**
 * `POST /entities/{entityName}/views/{id}/set-default` — sets or clears
 * the tenant-default flag. Mirrors
 * `EntityViewsEndpoints.SetTenantDefaultAsync`. Requires
 * `Entities.Views.Manage`. Setting one tenant default clears any
 * existing one server-side; the cache invalidation here forces every
 * other view's cached copy to refetch on next read.
 */
export function useSetEntityViewTenantDefault(
  entityName: string
): UseMutationResult<EntityViewResponse, Error, ToggleEntityViewFlagVariables> {
  const api = useGranitClient();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, value }) =>
      setEntityViewTenantDefault(api, ENTITIES_BASE_PATH, entityName, id, value),
    onSuccess: (updated, { id }) => invalidateAll(queryClient, entityName, id, updated),
  });
}

/**
 * `POST /entities/{entityName}/views/{id}/star` — sets or clears the
 * personal-default flag for the current user. Mirrors
 * `EntityViewsEndpoints.SetPersonalDefaultAsync`. Requires the caller
 * to own the view. At most one personal default per (entity, user) —
 * setting one clears the previous one server-side.
 */
export function useSetEntityViewPersonalDefault(
  entityName: string
): UseMutationResult<EntityViewResponse, Error, ToggleEntityViewFlagVariables> {
  const api = useGranitClient();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, value }) =>
      setEntityViewPersonalDefault(api, ENTITIES_BASE_PATH, entityName, id, value),
    onSuccess: (updated, { id }) => invalidateAll(queryClient, entityName, id, updated),
  });
}

/**
 * `POST /entities/{entityName}/views/{id}/share` — promotes a Personal
 * view to Shared, or updates the audience (roles + users) of an
 * already-Shared view. Mirrors `EntityViewsEndpoints.ShareAsync`.
 * Requires `Entities.Views.Share`.
 */
export function useShareEntityView(
  entityName: string
): UseMutationResult<EntityViewResponse, Error, ShareEntityViewVariables> {
  const api = useGranitClient();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, request }) =>
      shareEntityView(api, ENTITIES_BASE_PATH, entityName, id, request),
    onSuccess: (updated, { id }) => invalidateAll(queryClient, entityName, id, updated),
  });
}
