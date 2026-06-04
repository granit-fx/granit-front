import { changeEmail, confirmEmailChange } from '@granit/authentication-local';
import { useMutation, useQueryClient } from '@tanstack/react-query';

import { useLocalAuthConfig } from '../providers/local-auth-provider';

import { localAuthKeys } from './query-keys';

import type {
  AccountChangeEmailRequest,
  AccountConfirmEmailChangeRequest,
} from '@granit/authentication-local';
import type { UseMutationResult } from '@tanstack/react-query';

/** Requests an email-address change (authenticated, step-up: current password). */
export function useChangeEmail(): UseMutationResult<void, Error, AccountChangeEmailRequest> {
  const config = useLocalAuthConfig();

  return useMutation({
    mutationFn: (request: AccountChangeEmailRequest) =>
      changeEmail(config.client, config.basePath!, request),
  });
}

/** Confirms an email-address change (anonymous — from the e-mailed link). */
export function useConfirmEmailChange(): UseMutationResult<
  void,
  Error,
  AccountConfirmEmailChangeRequest
> {
  const config = useLocalAuthConfig();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (request: AccountConfirmEmailChangeRequest) =>
      confirmEmailChange(config.client, config.basePath!, request),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: localAuthKeys.profile() });
    },
  });
}
