import { deleteAccount } from '@granit/account';
import { useMutation } from '@tanstack/react-query';

import { useAccountConfig } from '../providers/account-provider';

import type { AccountDeleteRequest } from '@granit/account';
import type { UseMutationResult } from '@tanstack/react-query';

/** Requests account deletion (GDPR Art. 17). */
export function useDeleteAccount(): UseMutationResult<void, Error, AccountDeleteRequest> {
  const config = useAccountConfig();

  return useMutation({
    mutationFn: (request: AccountDeleteRequest) =>
      deleteAccount(config.client, config.basePath!, request),
  });
}
