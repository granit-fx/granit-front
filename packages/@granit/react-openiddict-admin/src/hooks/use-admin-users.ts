import { impersonateUser, listUsers } from '@granit/openiddict-admin';
import { useMutation, useQuery } from '@tanstack/react-query';

import { buildAdminQueryKey, useAdminConfig } from '../providers/openiddict-admin-provider';

import type {
  AdminImpersonationResponse,
  AdminUserListParams,
  AdminUserPage,
} from '@granit/openiddict-admin';
import type { UseMutationResult, UseQueryResult } from '@tanstack/react-query';

/** Fetches paginated admin users via the QueryEngine-backed admin endpoint. */
export function useAdminUsers(params?: AdminUserListParams): UseQueryResult<AdminUserPage> {
  const config = useAdminConfig();

  return useQuery({
    queryKey: [...buildAdminQueryKey(config, 'users'), params],
    queryFn: () => listUsers(config.client, config.basePath!, params),
  });
}

/** Impersonates a user. Returns new tokens. */
export function useImpersonateUser(): UseMutationResult<AdminImpersonationResponse, Error, string> {
  const config = useAdminConfig();

  return useMutation({
    mutationFn: (userId: string) => impersonateUser(config.client, config.basePath!, userId),
  });
}
