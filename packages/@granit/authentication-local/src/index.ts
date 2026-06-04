// Types
export type {
  AccountLoginRequest,
  AccountLoginResponse,
  AccountPasskeyLoginRequest,
  AccountTwoFactorLoginRequest,
} from './types/index';

// API — Login
export { loginAccount } from './api/account-login-api';

// API — Two-factor login verification
export { verifyTwoFactorLogin } from './api/account-two-factor-login-api';

// API — Passkey assertion (for login)
export {
  beginPasskeyAssertion,
  completePasskeyAssertion,
} from './api/account-passkey-assertion-api';

// Utilities
export { extractReturnUrl } from './utils/extract-return-url';
export { IdentityLocalPermissions } from './permissions';
