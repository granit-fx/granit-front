import { challengeExternalLogin, getExternalLogins, unlinkExternalLogin } from '@granit/account';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { buildAccountQueryKey, useAccountConfig } from '../providers/account-provider';

import type { AccountExternalLoginInfo } from '@granit/account';
import type { UseMutationResult, UseQueryResult } from '@tanstack/react-query';

/** Fetches the list of linked external login providers. */
export function useExternalLogins(): UseQueryResult<readonly AccountExternalLoginInfo[]> {
  const config = useAccountConfig();

  return useQuery({
    queryKey: buildAccountQueryKey(config, 'external-logins'),
    queryFn: () => getExternalLogins(config.client, config.basePath!),
  });
}

/** Initiates an OAuth challenge with an external provider. */
export function useChallengeExternalLogin(): UseMutationResult<void, Error, string> {
  const config = useAccountConfig();

  return useMutation({
    mutationFn: (provider: string) =>
      challengeExternalLogin(config.client, config.basePath!, provider),
  });
}

/** Unlinks an external login provider. Invalidates external logins query on success. */
export function useUnlinkExternalLogin(): UseMutationResult<void, Error, string> {
  const config = useAccountConfig();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (provider: string) =>
      unlinkExternalLogin(config.client, config.basePath!, provider),
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: buildAccountQueryKey(config, 'external-logins'),
      });
    },
  });
}
