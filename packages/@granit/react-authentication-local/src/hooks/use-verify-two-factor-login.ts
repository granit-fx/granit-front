import { verifyTwoFactorLogin } from '@granit/authentication-local';
import { useMutation } from '@tanstack/react-query';

import { useLocalAuthConfig } from '../providers/local-auth-provider';

import type {
  AccountLoginResponse,
  AccountTwoFactorLoginRequest,
} from '@granit/authentication-local';
import type { UseMutationResult } from '@tanstack/react-query';

/**
 * Completes a two-factor login after the initial login returned
 * `requiresTwoFactor: true`. Set `request.method` to pick the factor the code
 * belongs to (`"Authenticator"` — the default — `"RecoveryCode"`, or `"Email"`);
 * only offer methods present in the login response's `twoFactorMethods`.
 */
export function useVerifyTwoFactorLogin(): UseMutationResult<
  AccountLoginResponse,
  Error,
  AccountTwoFactorLoginRequest
> {
  const config = useLocalAuthConfig();

  return useMutation({
    mutationFn: (request: AccountTwoFactorLoginRequest) =>
      verifyTwoFactorLogin(config.client, config.basePath!, request),
  });
}
