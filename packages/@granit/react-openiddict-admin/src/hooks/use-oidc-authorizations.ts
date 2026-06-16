import {
  createAuthorization,
  listAuthorizations,
  revokeAuthorization,
  revokeUserAuthorizations,
} from '@granit/openiddict-admin';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { buildAdminQueryKey, useAdminConfig } from '../providers/openiddict-admin-provider';

import type {
  AdminOidcAuthorizationResponse,
  AdminOidcCreateAuthorizationRequest,
  AdminOidcAuthorizationListParams,
} from '@granit/openiddict-admin';
import type { UseMutationResult, UseQueryResult } from '@tanstack/react-query';

/** Creates an OIDC authorization (admin consent grant). Invalidates authorizations on success. */
export function useCreateOidcAuthorization(): UseMutationResult<
  AdminOidcAuthorizationResponse,
  Error,
  AdminOidcCreateAuthorizationRequest
> {
  const config = useAdminConfig();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (request: AdminOidcCreateAuthorizationRequest) =>
      createAuthorization(config.client, config.basePath!, request),
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: buildAdminQueryKey(config, 'oidc', 'authorizations'),
      });
    },
  });
}

/** Fetches OIDC authorizations with optional filtering. */
export function useOidcAuthorizations(
  params?: AdminOidcAuthorizationListParams
): UseQueryResult<readonly AdminOidcAuthorizationResponse[]> {
  const config = useAdminConfig();

  return useQuery({
    queryKey: [...buildAdminQueryKey(config, 'oidc', 'authorizations'), params],
    queryFn: () => listAuthorizations(config.client, config.basePath!, params),
  });
}

/** Revokes a single authorization. Invalidates authorizations on success. */
export function useRevokeAuthorization(): UseMutationResult<void, Error, string> {
  const config = useAdminConfig();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => revokeAuthorization(config.client, config.basePath!, id),
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: buildAdminQueryKey(config, 'oidc', 'authorizations'),
      });
    },
  });
}

/** Revokes all authorizations for a user. Invalidates authorizations on success. */
export function useRevokeUserAuthorizations(): UseMutationResult<void, Error, string> {
  const config = useAdminConfig();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (userId: string) =>
      revokeUserAuthorizations(config.client, config.basePath!, userId),
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: buildAdminQueryKey(config, 'oidc', 'authorizations'),
      });
    },
  });
}
