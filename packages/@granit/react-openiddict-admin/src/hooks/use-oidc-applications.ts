import {
  createApplication,
  deleteApplication,
  listApplications,
  rotateApplicationSecret,
  updateApplication,
} from '@granit/openiddict-admin';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { buildAdminQueryKey, useAdminConfig } from '../providers/openiddict-admin-provider';

import type {
  AdminOidcApplication,
  AdminOidcApplicationCreateRequest,
  AdminOidcApplicationSecretResponse,
  AdminOidcApplicationUpdateRequest,
} from '@granit/openiddict-admin';
import type { UseMutationResult, UseQueryResult } from '@tanstack/react-query';

/** Fetches all OIDC applications. */
export function useOidcApplications(): UseQueryResult<readonly AdminOidcApplication[]> {
  const config = useAdminConfig();

  return useQuery({
    queryKey: buildAdminQueryKey(config, 'oidc', 'applications'),
    queryFn: () => listApplications(config.client, config.basePath!),
  });
}

/** Creates an OIDC application. Invalidates applications on success. */
export function useCreateOidcApplication(): UseMutationResult<
  AdminOidcApplication,
  Error,
  AdminOidcApplicationCreateRequest
> {
  const config = useAdminConfig();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (request: AdminOidcApplicationCreateRequest) =>
      createApplication(config.client, config.basePath!, request),
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: buildAdminQueryKey(config, 'oidc', 'applications'),
      });
    },
  });
}

/** Deletes an OIDC application. Invalidates applications on success. */
export function useDeleteOidcApplication(): UseMutationResult<void, Error, string> {
  const config = useAdminConfig();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (clientId: string) => deleteApplication(config.client, config.basePath!, clientId),
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: buildAdminQueryKey(config, 'oidc', 'applications'),
      });
    },
  });
}

/** Updates an OIDC application. Invalidates applications on success. */
export function useUpdateOidcApplication(): UseMutationResult<
  AdminOidcApplication,
  Error,
  { clientId: string; request: AdminOidcApplicationUpdateRequest }
> {
  const config = useAdminConfig();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ clientId, request }) =>
      updateApplication(config.client, config.basePath!, clientId, request),
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: buildAdminQueryKey(config, 'oidc', 'applications'),
      });
    },
  });
}

/** Rotates an OIDC application's client secret. */
export function useRotateApplicationSecret(): UseMutationResult<
  AdminOidcApplicationSecretResponse,
  Error,
  string
> {
  const config = useAdminConfig();

  return useMutation({
    mutationFn: (clientId: string) =>
      rotateApplicationSecret(config.client, config.basePath!, clientId),
  });
}
