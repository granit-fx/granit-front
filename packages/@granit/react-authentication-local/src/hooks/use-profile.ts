import { getProfile, updateProfile } from '@granit/authentication-local';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { useLocalAuthConfig } from '../providers/local-auth-provider';

import { localAuthKeys } from './query-keys';

import type {
  AccountProfileResponse,
  AccountProfileUpdateRequest,
} from '@granit/authentication-local';
import type { UseMutationResult, UseQueryResult } from '@tanstack/react-query';

/** Fetches the authenticated user's profile. */
export function useProfile(): UseQueryResult<AccountProfileResponse> {
  const config = useLocalAuthConfig();

  return useQuery({
    queryKey: localAuthKeys.profile(),
    queryFn: () => getProfile(config.client, config.basePath!),
  });
}

/** Updates the authenticated user's profile and primes the profile cache. */
export function useUpdateProfile(): UseMutationResult<
  AccountProfileResponse,
  Error,
  AccountProfileUpdateRequest
> {
  const config = useLocalAuthConfig();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (request: AccountProfileUpdateRequest) =>
      updateProfile(config.client, config.basePath!, request),
    onSuccess: (data) => {
      queryClient.setQueryData(localAuthKeys.profile(), data);
    },
  });
}
