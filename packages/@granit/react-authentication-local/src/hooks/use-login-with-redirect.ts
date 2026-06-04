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
  /**
   * Called when the login request fails. Invalid credentials, locked-out and
   * not-allowed (e.g. unconfirmed email) all surface here as a 401
   * `AxiosError<ProblemDetails>` — the backend returns a generic 401 (with a
   * distinguishing `detail`) for these, never a `200` body, to prevent account
   * enumeration. Inspect `error` to tailor the message.
   */
  readonly onError?: (error: Error) => void;
}

export interface UseLoginWithRedirectResult {
  /**
   * Submit credentials and auto-redirect to `returnUrl` on success.
   *
   * On a `requiresTwoFactor` response `onTwoFactorRequired` is invoked; any
   * failure (invalid credentials, locked-out, not-allowed) arrives via `onError`.
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
