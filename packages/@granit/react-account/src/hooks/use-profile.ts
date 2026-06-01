import { getProfile, updateProfile } from '@granit/account';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { buildAccountQueryKey, useAccountConfig } from '../providers/account-provider';

import type { AccountProfileResponse, AccountProfileUpdateRequest } from '@granit/account';
import type { UseMutationResult, UseQueryResult } from '@tanstack/react-query';

/** Fetches the current user's profile. */
export function useProfile(): UseQueryResult<AccountProfileResponse> {
  const config = useAccountConfig();

  return useQuery({
    queryKey: buildAccountQueryKey(config, 'profile'),
    queryFn: () => getProfile(config.client, config.basePath!),
  });
}

/** Updates the current user's profile. Invalidates the profile query on success. */
export function useUpdateProfile(): UseMutationResult<
  AccountProfileResponse,
  Error,
  AccountProfileUpdateRequest
> {
  const config = useAccountConfig();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (request: AccountProfileUpdateRequest) =>
      updateProfile(config.client, config.basePath!, request),
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: buildAccountQueryKey(config, 'profile'),
      });
    },
  });
}
