import { loginAccount } from '@granit/authentication-local';
import { useMutation } from '@tanstack/react-query';

import { useLocalAuthConfig } from '../providers/local-auth-provider';

import type { AccountLoginRequest, AccountLoginResponse } from '@granit/authentication-local';
import type { UseMutationResult } from '@tanstack/react-query';

/** Authenticates a user via local credentials (email/username + password). */
export function useLogin(): UseMutationResult<AccountLoginResponse, Error, AccountLoginRequest> {
  const config = useLocalAuthConfig();

  return useMutation({
    mutationFn: (request: AccountLoginRequest) =>
      loginAccount(config.client, config.basePath!, request),
  });
}
