import { useResetPassword } from '@granit/react-account';
import { isAxiosError } from '@granit/react-authentication-local';
import { useTranslation } from '@granit/react-localization';
import {
  Alert,
  AlertDescription,
  Button,
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  Input,
} from '@granit/react-ui';
import { createConstraintsResolver } from '@granit/react-validation';
import { AlertCircle, CheckCircle } from 'lucide-react';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Link } from 'react-router-dom';

import { logger } from '../logger';
import { safeReturnUrl } from '../safe-return-url';
import { resetPasswordConstraints, type ResetPasswordFormValues } from '../validation';

import { PublicLayout } from './public-layout';

import type { Resolver } from 'react-hook-form';

const log = logger.child('ResetPassword');

/** Full browser redirect — exits the SPA. */
function redirectTo(url: string): void {
  globalThis.location.href = url;
}

/**
 * Reset-password page. Provider-agnostic: the host supplies the `AccountProvider`
 * (from `@granit/react-account`) which carries the API client. Reads `userId` /
 * `token` / `returnUrl` from the URL query string.
 */
export function ResetPasswordPage() {
  const { t } = useTranslation();
  const [serverError, setServerError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const params = new URLSearchParams(globalThis.location.search);
  const userId = params.get('userId');
  const token = params.get('token');
  const returnUrl = params.get('returnUrl');

  const mutation = useResetPassword();

  const form = useForm<ResetPasswordFormValues>({
    resolver: createConstraintsResolver(resetPasswordConstraints, t, {
      labelResolver: (field) => {
        const labels: Record<string, string> = {
          newPassword: t('Auth.ResetPassword.NewPasswordLabel'),
          confirmPassword: t('Auth.ResetPassword.ConfirmPasswordLabel'),
        };
        return labels[field] ?? field;
      },
    }) as unknown as Resolver<ResetPasswordFormValues>,
    defaultValues: { newPassword: '', confirmPassword: '' },
  });

  if (!userId || !token) {
    return (
      <PublicLayout>
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{t('Auth.ResetPassword.InvalidLink')}</AlertDescription>
        </Alert>
      </PublicLayout>
    );
  }

  async function onSubmit(values: ResetPasswordFormValues) {
    setServerError(null);
    try {
      await mutation.mutateAsync({
        userId: userId!,
        token: token!,
        newPassword: values.newPassword,
      });
      setSuccess(true);
    } catch (err: unknown) {
      if (isAxiosError(err) && err.response?.status === 400) {
        setServerError(t('Auth.ResetPassword.InvalidToken'));
      } else {
        setServerError(t('Auth.ResetPassword.UnexpectedError'));
      }
      log.error('Reset failed', err);
    }
  }

  return (
    <PublicLayout>
      {success ? (
        <div className="text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
            <CheckCircle className="h-6 w-6 text-primary" />
          </div>
          <h2 className="mb-2 text-lg font-semibold text-foreground">
            {t('Auth.ResetPassword.SuccessTitle')}
          </h2>
          <p className="mb-4 text-sm text-muted-foreground">
            {t('Auth.ResetPassword.SuccessMessage')}
          </p>
          <Button className="w-full" onClick={() => redirectTo(safeReturnUrl(returnUrl))}>
            {t('Auth.ResetPassword.BackToLogin')}
          </Button>
        </div>
      ) : (
        <>
          <div className="mb-6 text-center">
            <h2 className="text-lg font-semibold text-foreground">
              {t('Auth.ResetPassword.Title')}
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">{t('Auth.ResetPassword.Subtitle')}</p>
          </div>

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
                name="newPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('Auth.ResetPassword.NewPasswordLabel')}</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        type="password"
                        placeholder={t('Auth.ResetPassword.NewPasswordPlaceholder')}
                        autoComplete="new-password"
                        autoFocus
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="confirmPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('Auth.ResetPassword.ConfirmPasswordLabel')}</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        type="password"
                        placeholder={t('Auth.ResetPassword.ConfirmPasswordPlaceholder')}
                        autoComplete="new-password"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button type="submit" className="w-full" disabled={mutation.isPending}>
                {mutation.isPending
                  ? t('Auth.ResetPassword.Submitting')
                  : t('Auth.ResetPassword.Submit')}
              </Button>
            </form>
          </Form>
        </>
      )}

      {!success && (
        <div className="mt-4 text-center">
          <Link to={'/login'} className="text-sm text-muted-foreground hover:underline">
            {t('Auth.HeadlessLogin.BackToLogin')}
          </Link>
        </div>
      )}
    </PublicLayout>
  );
}
