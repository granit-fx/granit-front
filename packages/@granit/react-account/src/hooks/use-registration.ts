import { confirmEmail, registerAccount, resendConfirmationEmail } from '@granit/account';
import { useMutation } from '@tanstack/react-query';

import { useAccountConfig } from '../providers/account-provider';

import type { AccountRegisterRequest } from '@granit/account';
import type { UseMutationResult } from '@tanstack/react-query';

/** Registers a new user account. Resolves to `void` — `POST /register` returns 202 with no body. */
export function useRegister(): UseMutationResult<void, Error, AccountRegisterRequest> {
  const config = useAccountConfig();

  return useMutation({
    mutationFn: (request: AccountRegisterRequest) =>
      registerAccount(config.client, config.basePath!, request),
  });
}

/** Confirm email variables. */
export interface ConfirmEmailVariables {
  readonly userId: string;
  readonly token: string;
}

/** Confirms a user's email address using the token from the confirmation email. */
export function useConfirmEmail(): UseMutationResult<void, Error, ConfirmEmailVariables> {
  const config = useAccountConfig();

  return useMutation({
    mutationFn: ({ userId, token }: ConfirmEmailVariables) =>
      confirmEmail(config.client, config.basePath!, userId, token),
  });
}

/** Resends the email confirmation link. */
export function useResendConfirmation(): UseMutationResult<void, Error, void> {
  const config = useAccountConfig();

  return useMutation({
    mutationFn: () => resendConfirmationEmail(config.client, config.basePath!),
  });
}
