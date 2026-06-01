import { changePassword, forgotPassword, resetPassword } from '@granit/account';
import { useMutation } from '@tanstack/react-query';

import { useAccountConfig } from '../providers/account-provider';

import type {
  AccountForgotPasswordRequest,
  AccountPasswordChangeRequest,
  AccountPasswordResetRequest,
} from '@granit/account';
import type { UseMutationResult } from '@tanstack/react-query';

/** Changes the current user's password. */
export function useChangePassword(): UseMutationResult<void, Error, AccountPasswordChangeRequest> {
  const config = useAccountConfig();

  return useMutation({
    mutationFn: (request: AccountPasswordChangeRequest) =>
      changePassword(config.client, config.basePath!, request),
  });
}

/** Requests a password reset email. */
export function useForgotPassword(): UseMutationResult<void, Error, AccountForgotPasswordRequest> {
  const config = useAccountConfig();

  return useMutation({
    mutationFn: (request: AccountForgotPasswordRequest) =>
      forgotPassword(config.client, config.basePath!, request),
  });
}

/** Resets a password using the token from the reset email. */
export function useResetPassword(): UseMutationResult<void, Error, AccountPasswordResetRequest> {
  const config = useAccountConfig();

  return useMutation({
    mutationFn: (request: AccountPasswordResetRequest) =>
      resetPassword(config.client, config.basePath!, request),
  });
}
