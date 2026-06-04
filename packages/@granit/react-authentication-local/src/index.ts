// Provider
export { LocalAuthProvider, useLocalAuthConfig } from './providers/local-auth-provider';
export type { LocalAuthConfig, LocalAuthProviderProps } from './providers/local-auth-provider';

// Query keys
export { localAuthKeys } from './hooks/query-keys';

// Hooks — login (anonymous: password, 2FA, passkey assertion)
export { useLogin } from './hooks/use-login';
export { useLoginWithRedirect } from './hooks/use-login-with-redirect';
export type {
  UseLoginWithRedirectOptions,
  UseLoginWithRedirectResult,
} from './hooks/use-login-with-redirect';
export { useVerifyTwoFactorLogin } from './hooks/use-verify-two-factor-login';
export { useBeginPasskeyAssertion } from './hooks/use-begin-passkey-assertion';
export { useCompletePasskeyAssertion } from './hooks/use-complete-passkey-assertion';

// Hooks — registration
export {
  useConfirmEmail,
  useRegisterAccount,
  useResendConfirmationEmail,
} from './hooks/use-registration';

// Hooks — password management
export { useChangePassword, useForgotPassword, useResetPassword } from './hooks/use-password';

// Hooks — email change
export { useChangeEmail, useConfirmEmailChange } from './hooks/use-email-change';

// Hooks — profile
export { useProfile, useUpdateProfile } from './hooks/use-profile';

// Hooks — two-factor management
export {
  useAuthenticatorKey,
  useDisableTwoFactor,
  useEnableTwoFactor,
  useGenerateRecoveryCodes,
  useTwoFactorStatus,
} from './hooks/use-two-factor';

// Hooks — passkey management
export {
  useBeginPasskeyRegistration,
  useCompletePasskeyRegistration,
  useDeletePasskey,
  usePasskeys,
  useRenamePasskey,
} from './hooks/use-passkeys';
export type { RenamePasskeyVariables } from './hooks/use-passkeys';

// Hooks — account deletion
export { useDeleteAccount } from './hooks/use-account-deletion';

// Hooks — session
export { useSendSessionHeartbeat } from './hooks/use-session-heartbeat';

// Hooks — public config
export { useAccountConfig } from './hooks/use-account-config';
