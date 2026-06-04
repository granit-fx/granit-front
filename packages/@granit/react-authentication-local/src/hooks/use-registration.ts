import {
  confirmEmail,
  registerAccount,
  resendConfirmationEmail,
} from '@granit/authentication-local';
import { useMutation } from '@tanstack/react-query';

import { useLocalAuthConfig } from '../providers/local-auth-provider';

import type { AccountRegisterRequest } from '@granit/authentication-local';
import type { UseMutationResult } from '@tanstack/react-query';

/** Registers a new local account (anonymous). */
export function useRegisterAccount(): UseMutationResult<void, Error, AccountRegisterRequest> {
  const config = useLocalAuthConfig();

  return useMutation({
    mutationFn: (request: AccountRegisterRequest) =>
      registerAccount(config.client, config.basePath!, request),
  });
}

/** Confirms a newly registered account's email via the `userId` + `token` link params. */
export function useConfirmEmail(): UseMutationResult<
  void,
  Error,
  { userId: string; token: string }
> {
  const config = useLocalAuthConfig();

  return useMutation({
    mutationFn: ({ userId, token }: { userId: string; token: string }) =>
      confirmEmail(config.client, config.basePath!, userId, token),
  });
}

/** Resends the email-confirmation link for the authenticated account. */
export function useResendConfirmationEmail(): UseMutationResult<void, Error, void> {
  const config = useLocalAuthConfig();

  return useMutation({
    mutationFn: () => resendConfirmationEmail(config.client, config.basePath!),
  });
}
