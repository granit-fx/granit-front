// Types
export type {
  AccountLoginRequest,
  AccountLoginResponse,
  AccountPasskeyAssertionCompleteRequest,
  AccountTwoFactorLoginRequest,
} from './types/index.js';

// Query keys
export { localAuthKeys } from './hooks/query-keys.js';

// API — Login
export { loginAccount } from './api/account-login-api.js';

// API — Two-factor login verification
export { verifyTwoFactorLogin } from './api/account-two-factor-login-api.js';

// API — Passkey assertion (for login)
export {
  beginPasskeyAssertion,
  completePasskeyAssertion,
} from './api/account-passkey-assertion-api.js';

// Utilities
export { extractReturnUrl } from './utils/extract-return-url.js';
