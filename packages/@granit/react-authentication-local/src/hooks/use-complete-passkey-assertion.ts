import { completePasskeyAssertion } from '@granit/authentication-local';
import { useMutation } from '@tanstack/react-query';

import { useLocalAuthConfig } from '../providers/local-auth-provider';

import type {
  AccountLoginResponse,
  AccountPasskeyAssertionCompleteRequest,
} from '@granit/authentication-local';
import type { UseMutationResult } from '@tanstack/react-query';

/**
 * Completes a WebAuthn passkey assertion ceremony for login.
 *
 * Call after `navigator.credentials.get()` succeeds with the options
 * from `useBeginPasskeyAssertion()`.
 */
export function useCompletePasskeyAssertion(): UseMutationResult<
  AccountLoginResponse,
  Error,
  AccountPasskeyAssertionCompleteRequest
> {
  const config = useLocalAuthConfig();

  return useMutation({
    mutationFn: (request: AccountPasskeyAssertionCompleteRequest) =>
      completePasskeyAssertion(config.client, config.basePath!, request),
  });
}
