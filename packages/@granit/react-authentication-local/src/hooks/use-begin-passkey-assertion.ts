import { beginPasskeyAssertion } from '@granit/authentication-local';
import { useMutation } from '@tanstack/react-query';

import { useLocalAuthConfig } from '../providers/local-auth-provider';

import type { UseMutationResult } from '@tanstack/react-query';

/** Begins a WebAuthn passkey assertion ceremony for login. */
export function useBeginPasskeyAssertion(): UseMutationResult<string, Error, void> {
  const config = useLocalAuthConfig();

  return useMutation({
    mutationFn: () => beginPasskeyAssertion(config.client, config.basePath!),
  });
}
