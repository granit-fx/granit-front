import { changePassword, forgotPassword, resetPassword } from '@granit/authentication-local';
import { useMutation } from '@tanstack/react-query';

import { useLocalAuthConfig } from '../providers/local-auth-provider';

import type {
  AccountForgotPasswordRequest,
  AccountPasswordChangeRequest,
  AccountPasswordResetRequest,
} from '@granit/authentication-local';
import type { UseMutationResult } from '@tanstack/react-query';

/** Changes the authenticated user's password (requires the current password). */
export function useChangePassword(): UseMutationResult<void, Error, AccountPasswordChangeRequest> {
  const config = useLocalAuthConfig();

  return useMutation({
    mutationFn: (request: AccountPasswordChangeRequest) =>
      changePassword(config.client, config.basePath!, request),
  });
}

/** Requests a password-reset link (anonymous). */
export function useForgotPassword(): UseMutationResult<void, Error, AccountForgotPasswordRequest> {
  const config = useLocalAuthConfig();

  return useMutation({
    mutationFn: (request: AccountForgotPasswordRequest) =>
      forgotPassword(config.client, config.basePath!, request),
  });
}

/** Resets the password using the token from the forgot-password email (anonymous). */
export function useResetPassword(): UseMutationResult<void, Error, AccountPasswordResetRequest> {
  const config = useLocalAuthConfig();

  return useMutation({
    mutationFn: (request: AccountPasswordResetRequest) =>
      resetPassword(config.client, config.basePath!, request),
  });
}
