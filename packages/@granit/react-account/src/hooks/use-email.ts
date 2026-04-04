import { changeEmail, confirmEmailChange } from '@granit/account';
import { useMutation } from '@tanstack/react-query';

import { useAccountConfig } from '../providers/account-provider.js';

import type { AccountChangeEmailRequest, AccountConfirmEmailChangeRequest } from '@granit/account';
import type { UseMutationResult } from '@tanstack/react-query';

/** Requests an email change for the current user. */
export function useChangeEmail(): UseMutationResult<void, Error, AccountChangeEmailRequest> {
  const config = useAccountConfig();

  return useMutation({
    mutationFn: (request: AccountChangeEmailRequest) =>
      changeEmail(config.client, config.basePath!, request),
  });
}

/** Confirms an email change using the token from the confirmation email. */
export function useConfirmEmailChange(): UseMutationResult<
  void,
  Error,
  AccountConfirmEmailChangeRequest
> {
  const config = useAccountConfig();

  return useMutation({
    mutationFn: (request: AccountConfirmEmailChangeRequest) =>
      confirmEmailChange(config.client, config.basePath!, request),
  });
}
