// Provider
export {
  AccountProvider,
  buildAccountQueryKey,
  useAccountConfig,
} from './providers/account-provider.js';
export type { AccountConfig, AccountProviderProps } from './providers/account-provider.js';

// Hooks — Profile
export { useProfile, useUpdateProfile } from './hooks/use-profile.js';

// Hooks — Registration
export { useConfirmEmail, useRegister, useResendConfirmation } from './hooks/use-registration.js';
export type { ConfirmEmailVariables } from './hooks/use-registration.js';

// Hooks — Password
export { useChangePassword, useForgotPassword, useResetPassword } from './hooks/use-password.js';

// Hooks — Two-Factor
export {
  useAuthenticatorKey,
  useDisableTwoFactor,
  useEnableTwoFactor,
  useGenerateRecoveryCodes,
  useTwoFactorStatus,
} from './hooks/use-two-factor.js';

// Hooks — External Logins
export {
  useChallengeExternalLogin,
  useExternalLogins,
  useUnlinkExternalLogin,
} from './hooks/use-external-logins.js';

// Hooks — Passkeys
export {
  useBeginPasskeyRegistration,
  useCompletePasskeyRegistration,
  useDeletePasskey,
  usePasskeys,
  useRenamePasskey,
} from './hooks/use-passkeys.js';
export type { RenamePasskeyVariables } from './hooks/use-passkeys.js';

// Hooks — Session
export { useBackToImpersonator, useSessionHeartbeat } from './hooks/use-session.js';

// Hooks — Email change
export { useChangeEmail, useConfirmEmailChange } from './hooks/use-email.js';

// Hooks — Deletion
export { useDeleteAccount } from './hooks/use-account-deletion.js';
