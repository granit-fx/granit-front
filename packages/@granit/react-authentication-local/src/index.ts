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
export { useSendTwoFactorLoginEmailCode } from './hooks/use-send-two-factor-login-email-code';
export { useBeginPasskeyAssertion } from './hooks/use-begin-passkey-assertion';
export { useCompletePasskeyAssertion } from './hooks/use-complete-passkey-assertion';

// HTTP error helpers — re-exported so the UI tier narrows errors without
// depending on @granit/api-client directly (layer boundary: UI → headless).
export { isAxiosError, HttpError } from '@granit/api-client';
