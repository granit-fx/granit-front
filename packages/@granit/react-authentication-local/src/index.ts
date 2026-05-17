// Provider
export {
  LocalAuthProvider,
  buildLocalAuthQueryKey,
  useLocalAuthConfig,
} from './providers/local-auth-provider.js';
export type { LocalAuthConfig, LocalAuthProviderProps } from './providers/local-auth-provider.js';

// Hooks
export { useLogin } from './hooks/use-login.js';
export { useLoginWithRedirect } from './hooks/use-login-with-redirect.js';
export type {
  UseLoginWithRedirectOptions,
  UseLoginWithRedirectResult,
} from './hooks/use-login-with-redirect.js';
export { useVerifyTwoFactorLogin } from './hooks/use-verify-two-factor-login.js';
export { useBeginPasskeyAssertion } from './hooks/use-begin-passkey-assertion.js';
export { useCompletePasskeyAssertion } from './hooks/use-complete-passkey-assertion.js';

// Query keys
export { localAuthKeys } from './hooks/query-keys.js';
