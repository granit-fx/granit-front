import {
  disableTwoFactor,
  enableTwoFactor,
  generateRecoveryCodes,
  getAuthenticatorKey,
  getTwoFactorStatus,
} from '@granit/account';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { buildAccountQueryKey, useAccountConfig } from '../providers/account-provider';

import type {
  AccountAuthenticatorKeyResponse,
  AccountGenerateRecoveryCodesRequest,
  AccountRecoveryCodesResponse,
  AccountTwoFactorDisableRequest,
  AccountTwoFactorEnableRequest,
  AccountTwoFactorEnableResponse,
  AccountTwoFactorStatusResponse,
} from '@granit/account';
import type { UseMutationResult, UseQueryResult } from '@tanstack/react-query';

/** Fetches the current user's 2FA status. */
export function useTwoFactorStatus(): UseQueryResult<AccountTwoFactorStatusResponse> {
  const config = useAccountConfig();

  return useQuery({
    queryKey: buildAccountQueryKey(config, 'two-factor'),
    queryFn: () => getTwoFactorStatus(config.client, config.basePath!),
  });
}

/** Fetches the TOTP authenticator key and QR code URI. */
export function useAuthenticatorKey(): UseQueryResult<AccountAuthenticatorKeyResponse> {
  const config = useAccountConfig();

  return useQuery({
    queryKey: buildAccountQueryKey(config, 'two-factor', 'authenticator-key'),
    queryFn: () => getAuthenticatorKey(config.client, config.basePath!),
  });
}

/** Enables 2FA with a TOTP verification code. Invalidates 2FA status on success. */
export function useEnableTwoFactor(): UseMutationResult<
  AccountTwoFactorEnableResponse,
  Error,
  AccountTwoFactorEnableRequest
> {
  const config = useAccountConfig();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (request: AccountTwoFactorEnableRequest) =>
      enableTwoFactor(config.client, config.basePath!, request),
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: buildAccountQueryKey(config, 'two-factor'),
      });
    },
  });
}

/** Disables 2FA (requires the current password). Invalidates 2FA status on success. */
export function useDisableTwoFactor(): UseMutationResult<
  void,
  Error,
  AccountTwoFactorDisableRequest
> {
  const config = useAccountConfig();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (request: AccountTwoFactorDisableRequest) =>
      disableTwoFactor(config.client, config.basePath!, request),
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: buildAccountQueryKey(config, 'two-factor'),
      });
    },
  });
}

/** Generates new recovery codes (requires the current password). Invalidates 2FA status on success. */
export function useGenerateRecoveryCodes(): UseMutationResult<
  AccountRecoveryCodesResponse,
  Error,
  AccountGenerateRecoveryCodesRequest
> {
  const config = useAccountConfig();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (request: AccountGenerateRecoveryCodesRequest) =>
      generateRecoveryCodes(config.client, config.basePath!, request),
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: buildAccountQueryKey(config, 'two-factor'),
      });
    },
  });
}
