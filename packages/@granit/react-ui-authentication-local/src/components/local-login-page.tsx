import { HeadlessLoginForm } from './headless-login-form';

interface LocalLoginPageProps {
  /**
   * Optional hook for the host to react once the user is authenticated (e.g. to
   * close a modal or refresh app state). The login flow itself owns navigation:
   * `useLoginWithRedirect` (inside the credential form) performs the post-login
   * OIDC redirect, so this is purely an app-level notification, not required for
   * the redirect to happen.
   */
  readonly onAuthenticated?: () => void;
}

/**
 * Self-hosted local login page (credentials + passkey + two-factor + the direct
 * login demo). Provider-agnostic: the host wraps this in the `LocalAuthProvider`
 * (from `@granit/react-authentication-local`) and `AccountProvider` (from
 * `@granit/react-account`), which carry the API client. The post-login redirect
 * is owned by `useLoginWithRedirect`, so no app current-user context is needed.
 */
export function LocalLoginPage(_props: LocalLoginPageProps) {
  return <HeadlessLoginForm />;
}
