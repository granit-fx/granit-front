// Types
export type { AccountLoginRequest, AccountLoginResponse } from './types/index.js';

// Query keys
export { localAuthKeys } from './hooks/query-keys.js';

// API — Login
export { loginAccount } from './api/account-login-api.js';

// API — Passkey assertion (for login)
export { beginPasskeyAssertion } from './api/account-passkey-assertion-api.js';
