// Types
export type * from './types/index';

// Query keys

// API — Registration
export {
  confirmEmail,
  registerAccount,
  resendConfirmationEmail,
} from './api/account-registration-api';

// API — Profile
export { getProfile, updateProfile } from './api/account-profile-api';

// API — Password
export { changePassword, forgotPassword, resetPassword } from './api/account-password-api';

// API — Two-Factor
export {
  disableTwoFactor,
  enableTwoFactor,
  generateRecoveryCodes,
  getAuthenticatorKey,
  getTwoFactorStatus,
} from './api/account-two-factor-api';

// API — External Logins
export {
  challengeExternalLogin,
  externalLoginCallback,
  getExternalLogins,
  unlinkExternalLogin,
} from './api/account-external-login-api';

// API — Passkeys (beginPasskeyAssertion moved to @granit/authentication-local)
export {
  beginPasskeyRegistration,
  completePasskeyRegistration,
  deletePasskey,
  getPasskeys,
  renamePasskey,
} from './api/account-passkey-api';

// API — Session
export { backToImpersonator, sessionHeartbeat } from './api/account-session-api';

// API — Settings
export { getAccountSettings } from './api/account-settings-api';

// API — Email change
export { changeEmail, confirmEmailChange } from './api/account-email-api';

// API — Deletion
export { deleteAccount } from './api/account-deletion-api';
