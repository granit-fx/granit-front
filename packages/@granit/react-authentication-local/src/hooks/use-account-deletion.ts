import { deleteAccount } from '@granit/authentication-local';
import { useMutation } from '@tanstack/react-query';

import { useLocalAuthConfig } from '../providers/local-auth-provider';

import type { AccountDeleteRequest } from '@granit/authentication-local';
import type { UseMutationResult } from '@tanstack/react-query';

/** Requests deletion of the authenticated account (step-up: password). */
export function useDeleteAccount(): UseMutationResult<void, Error, AccountDeleteRequest> {
  const config = useLocalAuthConfig();

  return useMutation({
    mutationFn: (request: AccountDeleteRequest) =>
      deleteAccount(config.client, config.basePath!, request),
  });
}
