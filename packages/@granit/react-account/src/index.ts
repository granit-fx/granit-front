// Provider
export {
  AccountProvider,
  buildAccountQueryKey,
  useAccountConfig,
} from './providers/account-provider';
export type { AccountConfig, AccountProviderProps } from './providers/account-provider';

// Hooks — Settings
export { useAccountSettings } from './hooks/use-account-settings';
export { useAvailableExternalProviders } from './hooks/use-available-external-providers';
export type { AvailableExternalProviders } from './hooks/use-available-external-providers';

// Hooks — Profile
export { useProfile, useUpdateProfile } from './hooks/use-profile';

// Hooks — Registration
export { useConfirmEmail, useRegister, useResendConfirmation } from './hooks/use-registration';
export type { ConfirmEmailVariables } from './hooks/use-registration';

// Hooks — Password
export { useChangePassword, useForgotPassword, useResetPassword } from './hooks/use-password';

// Hooks — Two-Factor
export {
  useAuthenticatorKey,
  useDisableTwoFactor,
  useDisableTwoFactorEmail,
  useEnableTwoFactor,
  useEnableTwoFactorEmail,
  useGenerateRecoveryCodes,
  useSendTwoFactorEmailEnrollmentCode,
  useTwoFactorStatus,
} from './hooks/use-two-factor';

// Hooks — External Logins
export {
  useChallengeExternalLogin,
  useCompleteExternalRegistration,
  useExternalLoginStartUrl,
  useExternalLogins,
  useUnlinkExternalLogin,
} from './hooks/use-external-logins';

// Hooks — Passkeys
export {
  useBeginPasskeyRegistration,
  useCompletePasskeyRegistration,
  useDeletePasskey,
  usePasskeys,
  useRenamePasskey,
} from './hooks/use-passkeys';
export type { RenamePasskeyVariables } from './hooks/use-passkeys';

// Hooks — Session
export { useBackToImpersonator, useSessionHeartbeat } from './hooks/use-session';

// Hooks — Email change
export { useChangeEmail, useConfirmEmailChange } from './hooks/use-email';

// Hooks — Deletion
export { useDeleteAccount } from './hooks/use-account-deletion';
