// Provider
export { LocalAuthProvider, useLocalAuthConfig } from './providers/local-auth-provider';
export type { LocalAuthConfig, LocalAuthProviderProps } from './providers/local-auth-provider';

// Hooks
export { useLogin } from './hooks/use-login';
export { useLoginWithRedirect } from './hooks/use-login-with-redirect';
export type {
  UseLoginWithRedirectOptions,
  UseLoginWithRedirectResult,
} from './hooks/use-login-with-redirect';
export { useVerifyTwoFactorLogin } from './hooks/use-verify-two-factor-login';
export { useBeginPasskeyAssertion } from './hooks/use-begin-passkey-assertion';
export { useCompletePasskeyAssertion } from './hooks/use-complete-passkey-assertion';
