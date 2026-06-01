import { extractReturnUrl, loginAccount } from '@granit/authentication-local';
import { useMutation } from '@tanstack/react-query';
import { useCallback, useRef } from 'react';

import { useLocalAuthConfig } from '../providers/local-auth-provider';

import type { AccountLoginRequest, AccountLoginResponse } from '@granit/authentication-local';
import type { UseMutationResult } from '@tanstack/react-query';

export interface UseLoginWithRedirectOptions {
  /**
   * URL search string to extract `returnUrl` from.
   * Defaults to `globalThis.location.search`.
   */
  readonly search?: string;
  /** Fallback URL when no `returnUrl` is found. Defaults to `"/"`. */
  readonly fallbackUrl?: string;
  /** Called when the server requires two-factor authentication. */
  readonly onTwoFactorRequired?: () => void;
  /** Called when login is not allowed (e.g. unconfirmed email). */
  readonly onNotAllowed?: () => void;
  /** Called when the login request fails (network error, 401, etc.). */
  readonly onError?: (error: Error) => void;
}

export interface UseLoginWithRedirectResult {
  /**
   * Submit credentials and auto-redirect to `returnUrl` on success.
   *
   * On non-success responses (`requiresTwoFactor`, `isNotAllowed`),
   * the corresponding callback from {@link UseLoginWithRedirectOptions} is invoked.
   */
  readonly loginAndRedirect: (request: AccountLoginRequest) => void;
  /** The underlying React Query mutation for UI state (`isPending`, `error`, etc.). */
  readonly mutation: UseMutationResult<AccountLoginResponse, Error, AccountLoginRequest>;
}

/**
 * Wraps {@link useLogin} with automatic redirect to the `returnUrl` query
 * parameter on successful login.
 *
 * Designed for the BFF headless-login flow:
 * 1. BFF redirects unauthenticated users to `/login?returnUrl=/connect/authorize?…`
 * 2. The login page calls `loginAndRedirect({ login, password })`
 * 3. On `succeeded: true`, the browser navigates to `returnUrl`
 *    (which hits `/connect/authorize` with the Identity cookie now set)
 * 4. OpenIddict issues the authorization code and redirects back to the BFF callback
 */
export function useLoginWithRedirect(
  options?: UseLoginWithRedirectOptions
): UseLoginWithRedirectResult {
  const config = useLocalAuthConfig();
  const optionsRef = useRef(options);
  optionsRef.current = options;

  const mutation = useMutation({
    mutationFn: (request: AccountLoginRequest) =>
      loginAccount(config.client, config.basePath!, request),
  });

  const loginAndRedirect = useCallback(
    (request: AccountLoginRequest) => {
      mutation.mutate(request, {
        onSuccess: (data) => {
          if (data.succeeded) {
            const returnUrl = extractReturnUrl(optionsRef.current?.search);
            globalThis.location.href = returnUrl ?? optionsRef.current?.fallbackUrl ?? '/';
            return;
          }
          if (data.requiresTwoFactor) {
            optionsRef.current?.onTwoFactorRequired?.();
            return;
          }
          if (data.isNotAllowed) {
            optionsRef.current?.onNotAllowed?.();
          }
        },
        onError: (error) => {
          optionsRef.current?.onError?.(error);
        },
      });
    },
    [mutation]
  );

  return { loginAndRedirect, mutation };
}
