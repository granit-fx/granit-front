// Types
export type { AccountRegisterRequest, AccountRegisterResponse } from './types/index.js';
export type { AccountProfileResponse, AccountProfileUpdateRequest } from './types/index.js';
export type {
  AccountForgotPasswordRequest,
  AccountPasswordChangeRequest,
  AccountPasswordResetRequest,
} from './types/index.js';
export type {
  AccountAuthenticatorKeyResponse,
  AccountRecoveryCodesResponse,
  AccountTwoFactorEnableRequest,
  AccountTwoFactorEnableResponse,
  AccountTwoFactorStatusResponse,
} from './types/index.js';
export type {
  AccountExternalLoginCallbackResponse,
  AccountExternalLoginInfo,
} from './types/index.js';
export type {
  AccountPasskeyCreatedResponse,
  AccountPasskeyInfo,
  AccountPasskeyRegistrationRequest,
  AccountPasskeyRenameRequest,
  PasskeyId,
} from './types/index.js';
export type { AccountImpersonationResult } from './types/index.js';
export type { AccountDeleteRequest } from './types/index.js';
export type { AccountSettingsResponse } from './types/index.js';
export type { AccountChangeEmailRequest, AccountConfirmEmailChangeRequest } from './types/index.js';

// Query keys
export { accountKeys } from './hooks/query-keys.js';

// API — Registration
export {
  confirmEmail,
  registerAccount,
  resendConfirmationEmail,
} from './api/account-registration-api.js';

// API — Profile
export { getProfile, updateProfile } from './api/account-profile-api.js';

// API — Password
export { changePassword, forgotPassword, resetPassword } from './api/account-password-api.js';

// API — Two-Factor
export {
  disableTwoFactor,
  enableTwoFactor,
  generateRecoveryCodes,
  getAuthenticatorKey,
  getTwoFactorStatus,
} from './api/account-two-factor-api.js';

// API — External Logins
export {
  challengeExternalLogin,
  externalLoginCallback,
  getExternalLogins,
  unlinkExternalLogin,
} from './api/account-external-login-api.js';

// API — Passkeys (beginPasskeyAssertion moved to @granit/authentication-local)
export {
  beginPasskeyRegistration,
  completePasskeyRegistration,
  deletePasskey,
  getPasskeys,
  renamePasskey,
} from './api/account-passkey-api.js';

// API — Session
export { backToImpersonator, sessionHeartbeat } from './api/account-session-api.js';

// API — Settings
export { getAccountSettings } from './api/account-settings-api.js';

// API — Email change
export { changeEmail, confirmEmailChange } from './api/account-email-api.js';

// API — Deletion
export { deleteAccount } from './api/account-deletion-api.js';
