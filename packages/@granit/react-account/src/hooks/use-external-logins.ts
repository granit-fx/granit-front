import { challengeExternalLogin, getExternalLogins, unlinkExternalLogin } from '@granit/account';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { buildAccountQueryKey, useAccountConfig } from '../providers/account-provider';

import type { AccountExternalLoginInfo } from '@granit/account';
import type { HttpError } from '@granit/api-client';
import type { UseMutationResult, UseQueryResult } from '@tanstack/react-query';

/** Fetches the list of linked external login providers. */
export function useExternalLogins(): UseQueryResult<readonly AccountExternalLoginInfo[]> {
  const config = useAccountConfig();

  return useQuery({
    queryKey: buildAccountQueryKey(config, 'external-logins'),
    queryFn: () => getExternalLogins(config.client, config.basePath!),
  });
}

/**
 * Initiates an OAuth challenge with an external provider.
 *
 * On error, `mutation.error` is an `HttpError`:
 * - `status === 400` — provider name unknown / not configured
 * - `status === 500` — provider configured but authentication handler not registered
 */
export function useChallengeExternalLogin(): UseMutationResult<void, HttpError | Error, string> {
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
