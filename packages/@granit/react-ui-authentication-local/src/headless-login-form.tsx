import { useAvailableExternalProviders } from '@granit/react-account';
import { useLogin } from '@granit/react-authentication-local';
import { useTranslation } from '@granit/react-localization';
import {
  Alert,
  AlertDescription,
  AlertTitle,
  Badge,
  Button,
  Input,
  Label,
  Separator,
} from '@granit/react-ui';
import { AlertCircle, CheckCircle } from 'lucide-react';
import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';

import { CredentialForm } from './credential-form';
import { ExternalLoginButtons } from './external-login-buttons';
import { logger } from './logger';
import { PublicLayout } from './public-layout';
import { TwoFactorForm } from './two-factor-form';

import type { AccountLoginResponse } from '@granit/authentication-local';

type LoginStep = 'credentials' | 'two-factor';

/**
 * Demo section showing the `useLogin` hook (direct, non-redirect flow).
 * Demonstrates the difference between `useLogin` (returns a token/session result)
 * and `useLoginWithRedirect` (used above, triggers a full OIDC redirect).
 */
function DirectLoginDemo() {
  const { t } = useTranslation();
  const login = useLogin();
  const [loginValue, setLoginValue] = useState('');
  const [password, setPassword] = useState('');
  const [result, setResult] = useState<AccountLoginResponse | null>(null);

  async function handleDirectLogin(e: React.FormEvent) {
    e.preventDefault();
    try {
      const response = await login.mutateAsync({ login: loginValue, password });
      setResult(response);
    } catch (err) {
      logger.error('[DirectLogin] Login failed', err);
      setResult(null);
    }
  }

  return (
    <div className="space-y-4 rounded-xl border border-border bg-card p-6">
      <div className="flex items-center gap-2">
        <Badge variant="secondary" className="text-xs">
          {t('Auth.HeadlessLogin.DirectDemoLabel', 'Demo')}
        </Badge>
        <p className="text-sm font-semibold text-foreground">
          {t('Auth.HeadlessLogin.DirectLoginTitle', 'Direct login (no redirect)')}
        </p>
      </div>
      <p className="text-xs text-muted-foreground">
        {t(
          'Auth.HeadlessLogin.DirectLoginDescription',
          'This form uses useLogin() which returns an AccountLoginResponse directly without triggering an OIDC redirect — useful for programmatic or embedded scenarios.'
        )}
      </p>

      {result ? (
        <div className="space-y-2">
          {result.succeeded && (
            <div className="flex items-center gap-2 text-sm text-success">
              <CheckCircle className="h-4 w-4" />
              {t('Auth.HeadlessLogin.DirectLoginSuccess', 'Login succeeded (session cookie set)')}
            </div>
          )}
          {result.requiresTwoFactor && (
            <p className="text-sm text-muted-foreground">
              {t('Auth.HeadlessLogin.RequiresTwoFactor', '2FA required')}
            </p>
          )}
          {result.isLockedOut && (
            <Alert variant="destructive">
              <AlertDescription>
                {t('Auth.HeadlessLogin.LockedOut', 'Account locked out')}
              </AlertDescription>
            </Alert>
          )}
          {result.isNotAllowed && (
            <Alert variant="destructive">
              <AlertDescription>
                {t('Auth.HeadlessLogin.NotAllowed', 'Login not allowed')}
              </AlertDescription>
            </Alert>
          )}
          <pre className="rounded bg-muted px-3 py-2 text-xs text-muted-foreground">
            {JSON.stringify(result, null, 2)}
          </pre>
          <Button variant="outline" size="sm" onClick={() => setResult(null)}>
            {t('Auth.HeadlessLogin.DirectLoginButton', 'Try direct login')}
          </Button>
        </div>
      ) : (
        <form onSubmit={handleDirectLogin} className="space-y-3">
          <div className="space-y-1.5">
            <Label htmlFor="directLogin">{t('Auth.HeadlessLogin.LoginLabel')}</Label>
            <Input
              id="directLogin"
              type="text"
              value={loginValue}
              onChange={(e) => setLoginValue(e.target.value)}
              autoComplete="username"
              required
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="directPassword">
              {t('Auth.HeadlessLogin.PasswordLabel', 'Password')}
            </Label>
            <Input
              id="directPassword"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
              required
            />
          </div>
          {login.isError && (
            <p className="text-xs text-destructive">
              {t('Auth.HeadlessLogin.DirectLoginError', 'Login request failed')}
            </p>
          )}
          <Button
            type="submit"
            variant="outline"
            size="sm"
            disabled={login.isPending}
            className="w-full"
          >
            {login.isPending
              ? t('Auth.HeadlessLogin.SendingEmailCode')
              : t('Auth.HeadlessLogin.DirectLoginButton', 'Try direct login')}
          </Button>
        </form>
      )}
    </div>
  );
}

export function HeadlessLoginForm() {
  const { t } = useTranslation();
  const [step, setStep] = useState<LoginStep>('credentials');
  const [serverError, setServerError] = useState<string | null>(null);
  // The opt-in second factors the server offers for this user, captured from
  // the login response and forwarded to the 2FA step (never assumed).
  const [twoFactorMethods, setTwoFactorMethods] = useState<readonly string[] | undefined>();
  const [searchParams] = useSearchParams();
  const redirectError = searchParams.get('error');
  const { providers: externalProviders } = useAvailableExternalProviders();
  const hasExternalProviders = externalProviders.length > 0;

  function handleBack() {
    setStep('credentials');
    setServerError(null);
    setTwoFactorMethods(undefined);
  }

  return (
    <PublicLayout
      footer={
        <p className="mt-6 text-center text-xs text-muted-foreground/70">
          {t('Auth.LoginPage.Restricted')}
        </p>
      }
    >
      {step === 'credentials' && redirectError && (
        <Alert variant="destructive" className="mb-6">
          <AlertCircle className="size-4" />
          <AlertTitle>{t('Auth.AccessDenied.Title')}</AlertTitle>
          <AlertDescription>{t(`Auth.AccessDenied.${redirectError}`)}</AlertDescription>
        </Alert>
      )}

      {step === 'credentials' && (
        <>
          <p className="mb-6 text-center text-sm text-muted-foreground">
            {t('Auth.LoginPage.Subtitle')}
          </p>

          {hasExternalProviders && (
            <>
              <ExternalLoginButtons variant="sign-in" className="mb-6" />

              <div className="mb-6 flex items-center gap-3">
                <Separator className="flex-1" />
                <span className="text-xs text-muted-foreground">
                  {t('Auth.HeadlessLogin.OrDivider')}
                </span>
                <Separator className="flex-1" />
              </div>
            </>
          )}

          <CredentialForm
            serverError={serverError}
            setServerError={setServerError}
            onTwoFactorRequired={(methods) => {
              setTwoFactorMethods(methods);
              setStep('two-factor');
              setServerError(null);
            }}
          />

          <Separator className="my-6" />
          <DirectLoginDemo />
        </>
      )}

      {step === 'two-factor' && (
        <TwoFactorForm
          methods={twoFactorMethods}
          serverError={serverError}
          setServerError={setServerError}
          onBack={handleBack}
        />
      )}
    </PublicLayout>
  );
}
