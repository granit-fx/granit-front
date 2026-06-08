import { createScope, deleteScope, listScopes, updateScope } from '@granit/openiddict-admin';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { buildAdminQueryKey, useAdminConfig } from '../providers/openiddict-admin-provider';

import type {
  AdminOidcScope,
  AdminOidcScopeCreateRequest,
  AdminOidcScopeUpdateRequest,
} from '@granit/openiddict-admin';
import type { UseMutationResult, UseQueryResult } from '@tanstack/react-query';

/** Fetches all OIDC scopes. */
export function useOidcScopes(): UseQueryResult<readonly AdminOidcScope[]> {
  const config = useAdminConfig();

  return useQuery({
    queryKey: buildAdminQueryKey(config, 'oidc', 'scopes'),
    queryFn: () => listScopes(config.client, config.basePath!),
  });
}

/** Creates an OIDC scope. Invalidates scopes on success. */
export function useCreateOidcScope(): UseMutationResult<
  AdminOidcScope,
  Error,
  AdminOidcScopeCreateRequest
> {
  const config = useAdminConfig();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (request: AdminOidcScopeCreateRequest) =>
      createScope(config.client, config.basePath!, request),
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: buildAdminQueryKey(config, 'oidc', 'scopes'),
      });
    },
  });
}

/** Updates an OIDC scope. Invalidates scopes on success. */
export function useUpdateOidcScope(): UseMutationResult<
  AdminOidcScope,
  Error,
  { scopeName: string; request: AdminOidcScopeUpdateRequest }
> {
  const config = useAdminConfig();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ scopeName, request }) =>
      updateScope(config.client, config.basePath!, scopeName, request),
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: buildAdminQueryKey(config, 'oidc', 'scopes'),
      });
    },
  });
}

/** Deletes an OIDC scope. Invalidates scopes on success. */
export function useDeleteOidcScope(): UseMutationResult<void, Error, string> {
  const config = useAdminConfig();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (scopeName: string) => deleteScope(config.client, config.basePath!, scopeName),
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: buildAdminQueryKey(config, 'oidc', 'scopes'),
      });
    },
  });
}
