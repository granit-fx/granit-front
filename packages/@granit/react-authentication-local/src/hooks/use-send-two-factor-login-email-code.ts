import { sendTwoFactorLoginEmailCode } from '@granit/authentication-local';
import { useMutation } from '@tanstack/react-query';

import { useLocalAuthConfig } from '../providers/local-auth-provider';

import type { UseMutationResult } from '@tanstack/react-query';

/**
 * Sends a one-time code by email to the user pending two-factor login.
 *
 * Call this when the user picks `"Email"` from the login response's
 * `twoFactorMethods`, then submit the received code via
 * {@link useVerifyTwoFactorLogin} with `method: "Email"`. The server resolves
 * the pending user from the two-factor session cookie, so the mutation takes no
 * arguments.
 */
export function useSendTwoFactorLoginEmailCode(): UseMutationResult<void, Error, void> {
  const config = useLocalAuthConfig();

  return useMutation({
    mutationFn: () => sendTwoFactorLoginEmailCode(config.client, config.basePath!),
  });
}
