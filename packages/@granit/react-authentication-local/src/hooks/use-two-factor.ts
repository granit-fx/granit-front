import {
  disableTwoFactor,
  enableTwoFactor,
  generateRecoveryCodes,
  getAuthenticatorKey,
  getTwoFactorStatus,
} from '@granit/authentication-local';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { useLocalAuthConfig } from '../providers/local-auth-provider';

import { localAuthKeys } from './query-keys';

import type {
  AccountAuthenticatorKeyResponse,
  AccountGenerateRecoveryCodesRequest,
  AccountRecoveryCodesResponse,
  AccountTwoFactorDisableRequest,
  AccountTwoFactorEnableRequest,
  AccountTwoFactorEnableResponse,
  AccountTwoFactorStatusResponse,
} from '@granit/authentication-local';
import type { UseMutationResult, UseQueryResult } from '@tanstack/react-query';

/** Fetches the authenticated user's two-factor status. */
export function useTwoFactorStatus(): UseQueryResult<AccountTwoFactorStatusResponse> {
  const config = useLocalAuthConfig();

  return useQuery({
    queryKey: localAuthKeys.twoFactorStatus(),
    queryFn: () => getTwoFactorStatus(config.client, config.basePath!),
  });
}

/**
 * Fetches the TOTP shared key + `otpauth://` QR-code URI.
 *
 * Generates a key server-side, so it is gated behind `enabled` (default
 * `false`) — enable it only when the enrolment UI is shown.
 */
export function useAuthenticatorKey(options?: {
  enabled?: boolean;
}): UseQueryResult<AccountAuthenticatorKeyResponse> {
  const config = useLocalAuthConfig();

  return useQuery({
    queryKey: localAuthKeys.authenticatorKey(),
    queryFn: () => getAuthenticatorKey(config.client, config.basePath!),
    enabled: options?.enabled ?? false,
    staleTime: 0,
    gcTime: 0,
  });
}

/** Enables two-factor after verifying a TOTP code; returns recovery codes. */
export function useEnableTwoFactor(): UseMutationResult<
  AccountTwoFactorEnableResponse,
  Error,
  AccountTwoFactorEnableRequest
> {
  const config = useLocalAuthConfig();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (request: AccountTwoFactorEnableRequest) =>
      enableTwoFactor(config.client, config.basePath!, request),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: localAuthKeys.twoFactorStatus() });
      queryClient.invalidateQueries({ queryKey: localAuthKeys.profile() });
    },
  });
}

/** Disables two-factor (step-up: password). */
export function useDisableTwoFactor(): UseMutationResult<
  void,
  Error,
  AccountTwoFactorDisableRequest
> {
  const config = useLocalAuthConfig();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (request: AccountTwoFactorDisableRequest) =>
      disableTwoFactor(config.client, config.basePath!, request),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: localAuthKeys.twoFactorStatus() });
      queryClient.invalidateQueries({ queryKey: localAuthKeys.profile() });
    },
  });
}

/** Regenerates the single-use recovery codes (step-up: password). */
export function useGenerateRecoveryCodes(): UseMutationResult<
  AccountRecoveryCodesResponse,
  Error,
  AccountGenerateRecoveryCodesRequest
> {
  const config = useLocalAuthConfig();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (request: AccountGenerateRecoveryCodesRequest) =>
      generateRecoveryCodes(config.client, config.basePath!, request),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: localAuthKeys.twoFactorStatus() });
    },
  });
}
