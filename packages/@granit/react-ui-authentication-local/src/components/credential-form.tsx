import { useAccountSettings } from '@granit/react-account';
import {
  useBeginPasskeyAssertion,
  useCompletePasskeyAssertion,
  useLoginWithRedirect,
} from '@granit/react-authentication-local';
import { useTranslation } from '@granit/react-localization';
import {
  Alert,
  AlertDescription,
  Button,
  Checkbox,
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  Input,
  Separator,
} from '@granit/react-ui';
import { createConstraintsResolver } from '@granit/react-validation';
import { AlertCircle, Fingerprint } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { Link } from 'react-router-dom';

import { logger } from '../logger';
import {
  fromBase64Url,
  handleLoginError,
  redirectToReturnUrl,
  serializeCredential,
} from '../login-helpers';
import { loginConstraints, type LoginFormValues } from '../validation';

import type { Resolver } from 'react-hook-form';

const log = logger.child('HeadlessLogin');

interface CredentialFormProps {
  readonly serverError: string | null;
  readonly setServerError: (err: string | null) => void;
  /**
   * Called when the server requires a second factor. `methods` is the login
   * response's `twoFactorMethods` — the opt-in set the UI must offer (never
   * assume a method is available). `undefined` when the server omits it.
   */
  readonly onTwoFactorRequired: (methods?: readonly string[]) => void;
}

export function CredentialForm({
  serverError,
  setServerError,
  onTwoFactorRequired,
}: CredentialFormProps) {
  const { t } = useTranslation();

  // We await the mutation directly (rather than fire-and-forget via
  // `loginAndRedirect`) so we can read `twoFactorMethods` off the response and
  // hand it to the 2FA step. The hook still owns the success redirect through
  // its own `onSuccess`; errors (invalid credentials / locked-out / not-allowed
  // — all generic 401s for anti-enumeration) surface via `onError`.
  const { mutation: loginMutation } = useLoginWithRedirect({
    onError: (err) => handleLoginError(err, setServerError, t),
  });

  const beginPasskey = useBeginPasskeyAssertion();
  const completePasskey = useCompletePasskeyAssertion();

  const supportsPasskeys = typeof globalThis !== 'undefined' && !!globalThis.PublicKeyCredential;

  const fieldLabels: Record<string, string> = {
    login: t('Auth.HeadlessLogin.LoginLabel'),
    password: t('Auth.HeadlessLogin.PasswordLabel'),
  };

  const form = useForm<LoginFormValues>({
    resolver: createConstraintsResolver(loginConstraints, t, {
      labelResolver: (field) => fieldLabels[field] ?? field,
    }) as unknown as Resolver<LoginFormValues>,
    defaultValues: { login: '', password: '', rememberMe: false },
  });

  async function onSubmit(values: LoginFormValues) {
    setServerError(null);
    try {
      const data = await loginMutation.mutateAsync(values);
      // We await the bare mutation (not `loginAndRedirect`) to read
      // `twoFactorMethods`, so the redirect is ours to fire — mirror the
      // passkey/2FA paths rather than relying on the hook's `onSuccess`,
      // which only runs inside `loginAndRedirect`.
      if (data.succeeded) {
        redirectToReturnUrl();
        return;
      }
      if (data.requiresTwoFactor) {
        onTwoFactorRequired(data.twoFactorMethods);
      }
    } catch (err) {
      // The hook's `onError` already surfaced the message to the user; we only
      // log here for diagnostics rather than swallowing the rejection silently.
      log.error('Login mutation rejected', err);
    }
  }

  async function onPasskeyLogin() {
    setServerError(null);
    try {
      const optionsJson = await beginPasskey.mutateAsync();
      const options = JSON.parse(optionsJson) as PublicKeyCredentialRequestOptions;

      if (options.challenge && typeof options.challenge === 'string') {
        options.challenge = fromBase64Url(options.challenge);
      }
      if (options.allowCredentials) {
        for (const cred of options.allowCredentials) {
          if (typeof cred.id === 'string') {
            cred.id = fromBase64Url(cred.id);
          }
        }
      }

      const credential = (await navigator.credentials.get({
        publicKey: options,
      })) as PublicKeyCredential | null;

      if (!credential) return;

      const credentialJson = serializeCredential(credential);
      const data = await completePasskey.mutateAsync({ credentialJson });

      if (data.succeeded) {
        redirectToReturnUrl();
        return;
      }
      if (data.requiresTwoFactor) {
        onTwoFactorRequired(data.twoFactorMethods);
      }
    } catch (err: unknown) {
      if (err instanceof DOMException && err.name === 'NotAllowedError') {
        return;
      }
      setServerError(t('Auth.HeadlessLogin.PasskeyError'));
      log.error('Passkey login failed', err);
    }
  }

  const isPasskeyPending = beginPasskey.isPending || completePasskey.isPending;

  return (
    <>
      {serverError && (
        <Alert variant="destructive" className="mb-4">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{serverError}</AlertDescription>
        </Alert>
      )}

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <FormField
            control={form.control}
            name="login"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t('Auth.HeadlessLogin.LoginLabel')}</FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    placeholder={t('Auth.HeadlessLogin.LoginPlaceholder')}
                    autoComplete="username"
                    autoFocus
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="password"
            render={({ field }) => (
              <FormItem>
                <div className="flex items-center justify-between">
                  <FormLabel>{t('Auth.HeadlessLogin.PasswordLabel')}</FormLabel>
                  <Link to={'/forgot-password'} className="text-xs text-primary hover:underline">
                    {t('Auth.HeadlessLogin.ForgotPassword')}
                  </Link>
                </div>
                <FormControl>
                  <Input
                    {...field}
                    type="password"
                    placeholder={t('Auth.HeadlessLogin.PasswordPlaceholder')}
                    autoComplete="current-password"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="rememberMe"
            render={({ field }) => (
              <FormItem className="flex items-center gap-2 space-y-0">
                <FormControl>
                  <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                </FormControl>
                <FormLabel className="text-sm font-normal">
                  {t('Auth.HeadlessLogin.RememberMe')}
                </FormLabel>
              </FormItem>
            )}
          />

          <Button type="submit" className="w-full" disabled={loginMutation.isPending}>
            {loginMutation.isPending ? t('Auth.SigningIn') : t('Auth.Login')}
          </Button>
        </form>
      </Form>

      {supportsPasskeys && (
        <>
          <div className="my-4 flex items-center gap-3">
            <Separator className="flex-1" />
            <span className="text-xs text-muted-foreground">
              {t('Auth.HeadlessLogin.OrDivider')}
            </span>
            <Separator className="flex-1" />
          </div>

          <Button
            type="button"
            variant="outline"
            className="w-full"
            disabled={isPasskeyPending}
            onClick={onPasskeyLogin}
          >
            <Fingerprint className="mr-2 h-4 w-4" />
            {t('Auth.HeadlessLogin.PasskeyButton')}
          </Button>
        </>
      )}

      <RegisterLink />
    </>
  );
}

function RegisterLink() {
  const { t } = useTranslation();
  const { data: settings } = useAccountSettings();

  if (!settings?.allowSelfRegistration) return null;

  return (
    <div className="mt-4 text-center">
      <Link to={'/register'} className="text-sm text-muted-foreground hover:underline">
        {t('Auth.LoginPage.NoAccount')}
      </Link>
    </div>
  );
}
