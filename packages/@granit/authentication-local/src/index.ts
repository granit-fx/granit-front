// ---------------------------------------------------------------------------
// @granit/authentication-local — local credential authentication: headless
// login + full account self-service surface. Mirrors the
// Granit.Identity.Local.Endpoints .NET contract.
// ---------------------------------------------------------------------------

// Types
export type * from './types/index';

// API — Login (anonymous: password, 2FA, passkey assertion)
export { loginAccount } from './api/account-login-api';
export { verifyTwoFactorLogin } from './api/account-two-factor-login-api';
export {
  beginPasskeyAssertion,
  completePasskeyAssertion,
} from './api/account-passkey-assertion-api';

// API — Registration
export {
  confirmEmail,
  registerAccount,
  resendConfirmationEmail,
} from './api/account-registration-api';

// API — Password management
export { changePassword, forgotPassword, resetPassword } from './api/account-password-api';

// API — Email change
export { changeEmail, confirmEmailChange } from './api/account-email-change-api';

// API — Profile
export { getProfile, updateProfile } from './api/account-profile-api';

// API — Two-factor management
export {
  disableTwoFactor,
  enableTwoFactor,
  generateRecoveryCodes,
  getAuthenticatorKey,
  getTwoFactorStatus,
} from './api/account-two-factor-api';

// API — Passkey management
export {
  beginPasskeyRegistration,
  completePasskeyRegistration,
  deletePasskey,
  listPasskeys,
  renamePasskey,
} from './api/account-passkey-api';

// API — Account deletion
export { deleteAccount } from './api/account-deletion-api';

// API — Session
export { sendSessionHeartbeat } from './api/account-session-api';

// API — Public config
export { getAccountConfig } from './api/account-config-api';

// Utilities
export { extractReturnUrl } from './utils/extract-return-url';
export { IdentityLocalPermissions } from './permissions';
