import { useForgotPassword } from '@granit/react-account';
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
import { AlertCircle, Mail } from 'lucide-react';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Link } from 'react-router-dom';

import { logger } from '../logger';
import { forgotPasswordConstraints, type ForgotPasswordFormValues } from '../validation';

import { PublicLayout } from './public-layout';

import type { Resolver } from 'react-hook-form';

const log = logger.child('ForgotPassword');

/**
 * Forgot-password page. Provider-agnostic: the host supplies the
 * `AccountProvider` (from `@granit/react-account`) which carries the API client.
 */
export function ForgotPasswordPage() {
  const { t } = useTranslation();
  const [serverError, setServerError] = useState<string | null>(null);
  const [emailSent, setEmailSent] = useState(false);

  const mutation = useForgotPassword();

  const form = useForm<ForgotPasswordFormValues>({
    resolver: createConstraintsResolver(forgotPasswordConstraints, t, {
      labelResolver: (field) => (field === 'email' ? t('Auth.ForgotPassword.EmailLabel') : field),
    }) as unknown as Resolver<ForgotPasswordFormValues>,
    defaultValues: { email: '' },
  });

  async function onSubmit(values: ForgotPasswordFormValues) {
    setServerError(null);
    try {
      await mutation.mutateAsync(values);
      setEmailSent(true);
    } catch (err: unknown) {
      if (isAxiosError(err) && err.response?.status === 429) {
        setServerError(t('Auth.ForgotPassword.TooManyRequests'));
      } else {
        setServerError(t('Auth.ForgotPassword.UnexpectedError'));
      }
      log.error('Request failed', err);
    }
  }

  return (
    <PublicLayout>
      {emailSent ? (
        <div className="text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
            <Mail className="h-6 w-6 text-primary" />
          </div>
          <h2 className="mb-2 text-lg font-semibold text-foreground">
            {t('Auth.ForgotPassword.EmailSentTitle')}
          </h2>
          <p className="text-sm text-muted-foreground">
            {t('Auth.ForgotPassword.EmailSentMessage')}
          </p>
        </div>
      ) : (
        <>
          <div className="mb-6 text-center">
            <h2 className="text-lg font-semibold text-foreground">
              {t('Auth.ForgotPassword.Title')}
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              {t('Auth.ForgotPassword.Subtitle')}
            </p>
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
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('Auth.ForgotPassword.EmailLabel')}</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        type="email"
                        placeholder={t('Auth.ForgotPassword.EmailPlaceholder')}
                        autoComplete="email"
                        autoFocus
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button type="submit" className="w-full" disabled={mutation.isPending}>
                {mutation.isPending
                  ? t('Auth.ForgotPassword.Submitting')
                  : t('Auth.ForgotPassword.Submit')}
              </Button>
            </form>
          </Form>
        </>
      )}

      <div className="mt-4 text-center">
        <Link to={'/login'} className="text-sm text-muted-foreground hover:underline">
          {t('Auth.HeadlessLogin.BackToLogin')}
        </Link>
      </div>
    </PublicLayout>
  );
}
