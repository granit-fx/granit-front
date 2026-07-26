import {
  createApplication,
  deleteApplication,
  getApplication,
  listApplications,
  rotateApplicationSecret,
  updateApplication,
} from '@granit/openiddict-admin';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { buildAdminQueryKey, useAdminConfig } from '../providers/openiddict-admin-provider';

import type {
  AdminOidcApplicationListParams,
  AdminOidcApplicationPage,
  AdminOidcApplicationResponse,
  AdminOidcCreateApplicationRequest,
  AdminOidcRotateSecretResponse,
  AdminOidcUpdateApplicationRequest,
} from '@granit/openiddict-admin';
import type { UseMutationResult, UseQueryResult } from '@tanstack/react-query';

/** Fetches a single OIDC application by client ID. Returns `undefined` while loading, `null` on 404. */
export function useOidcApplication(
  clientId: string | null
): UseQueryResult<AdminOidcApplicationResponse | null> {
  const config = useAdminConfig();

  return useQuery({
    queryKey: buildAdminQueryKey(config, 'oidc', 'applications', clientId ?? ''),
    queryFn: async () => {
      try {
        return await getApplication(config.client, config.basePath!, clientId!);
      } catch (err: unknown) {
        const status = (err as { response?: { status?: number } })?.response?.status;
        if (status === 404) return null;
        throw err;
      }
    },
    enabled: !!clientId,
  });
}

/** Fetches one page of OIDC applications. */
export function useOidcApplications(
  params?: AdminOidcApplicationListParams
): UseQueryResult<AdminOidcApplicationPage> {
  const config = useAdminConfig();

  return useQuery({
    queryKey: [...buildAdminQueryKey(config, 'oidc', 'applications'), params],
    queryFn: () => listApplications(config.client, config.basePath!, params),
  });
}

/** Creates an OIDC application. Invalidates applications on success. */
export function useCreateOidcApplication(): UseMutationResult<
  AdminOidcApplicationResponse,
  Error,
  AdminOidcCreateApplicationRequest
> {
  const config = useAdminConfig();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (request: AdminOidcCreateApplicationRequest) =>
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
  AdminOidcApplicationResponse,
  Error,
  { clientId: string; request: AdminOidcUpdateApplicationRequest }
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
  AdminOidcRotateSecretResponse,
  Error,
  string
> {
  const config = useAdminConfig();

  return useMutation({
    mutationFn: (clientId: string) =>
      rotateApplicationSecret(config.client, config.basePath!, clientId),
  });
}
