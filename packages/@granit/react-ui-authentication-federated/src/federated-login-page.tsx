import { useTranslation } from '@granit/react-localization';
import { Alert, AlertDescription, AlertTitle, Button } from '@granit/react-ui';
import { AlertCircle } from 'lucide-react';
import { Navigate, useSearchParams } from 'react-router-dom';

import type { ComponentType, ReactNode } from 'react';

export interface FederatedLoginPageProps {
  /** Triggers the IdP login redirect (the host's auth `login`). */
  readonly login: () => void;
  /** Whether a login/init is in flight (disables the button). */
  readonly loading: boolean;
  /** Whether the user is already authenticated (redirects to `/`). */
  readonly authenticated: boolean;
  /**
   * Host public-page layout (logo / centered card). Defaults to a passthrough.
   * Receives an optional `footer` node.
   */
  readonly layout?: ComponentType<{ readonly children: ReactNode; readonly footer?: ReactNode }>;
}

const Passthrough = ({ children }: { readonly children: ReactNode }) => <>{children}</>;

/**
 * Auth error codes with a dedicated `Auth.AccessDenied.<code>` message in the locale
 * bundle. Any other `?error=` value falls back to the generic `access_denied` message
 * so an attacker-controlled query value never produces a missing-key render.
 */
const KNOWN_ACCESS_DENIED_CODES = new Set([
  'access_denied',
  'invalid_state',
  'login_required',
  'server_error',
  'token_exchange_failed',
]);

/**
 * Federated (external-IdP) login landing. Provider-agnostic: it does not render a
 * credentials form (the IdP owns that) — it shows a branded "sign in" button that
 * calls `login()` to start the redirect, surfaces an `?error=<code>` auth error,
 * and redirects home when already authenticated. The host injects the auth state
 * and its public layout.
 */
export function FederatedLoginPage({
  login,
  loading,
  authenticated,
  layout: Layout = Passthrough,
}: FederatedLoginPageProps) {
  const { t } = useTranslation();
  const [searchParams] = useSearchParams();
  const rawError = searchParams.get('error');
  const error = rawError && KNOWN_ACCESS_DENIED_CODES.has(rawError) ? rawError : 'access_denied';

  if (authenticated) {
    return <Navigate to="/" replace />;
  }

  return (
    <Layout
      footer={
        <p className="mt-6 text-center text-xs text-muted-foreground/70">
          {t('Auth.LoginPage.Restricted')}
        </p>
      }
    >
      {rawError && (
        <Alert variant="destructive" className="mb-6">
          <AlertCircle className="size-4" />
          <AlertTitle>{t('Auth.AccessDenied.Title')}</AlertTitle>
          <AlertDescription>{t(`Auth.AccessDenied.${error}`)}</AlertDescription>
        </Alert>
      )}
      <p className="mb-6 text-center text-sm text-muted-foreground">
        {t('Auth.LoginPage.Subtitle')}
      </p>
      <Button className="w-full" onClick={() => login()} disabled={loading}>
        {loading ? t('Auth.SigningIn') : t('Auth.Login')}
      </Button>
    </Layout>
  );
}
