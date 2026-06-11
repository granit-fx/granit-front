import {
  challengeExternalLogin,
  completeExternalRegistration,
  getExternalLoginStartUrl,
  getExternalLogins,
  unlinkExternalLogin,
} from '@granit/account';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useCallback } from 'react';

import { buildAccountQueryKey, useAccountConfig } from '../providers/account-provider';

import type {
  AccountCompleteExternalRegistrationRequest,
  AccountExternalLoginInfo,
} from '@granit/account';
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

/**
 * Returns a builder for the external login challenge start URL, bound to the
 * configured `basePath`.
 *
 * The returned URL is for a top-level browser navigation
 * (`window.location.assign(buildUrl(provider, returnUrl))`), not an XHR.
 */
export function useExternalLoginStartUrl(): (provider: string, returnUrl?: string) => string {
  const config = useAccountConfig();

  return useCallback(
    (provider: string, returnUrl?: string) =>
      getExternalLoginStartUrl(config.basePath!, provider, returnUrl),
    [config.basePath]
  );
}

/**
 * Completes an external login registration that required profile completion.
 *
 * On error, `mutation.error` is an `HttpError`:
 * - `status === 400` — token invalid / expired
 * - `status === 403` — self-registration disabled or tenant mismatch
 * - `status === 409` — email already taken
 * - `status === 422` — email differs from the provider-verified email / validation
 */
export function useCompleteExternalRegistration(): UseMutationResult<
  void,
  HttpError | Error,
  AccountCompleteExternalRegistrationRequest
> {
  const config = useAccountConfig();

  return useMutation({
    mutationFn: (request: AccountCompleteExternalRegistrationRequest) =>
      completeExternalRegistration(config.client, config.basePath!, request),
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
