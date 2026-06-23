import { isAxiosError } from '@granit/api-client';
import { useAccountSettings, useRegister } from '@granit/react-account';
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
  Skeleton,
} from '@granit/react-ui';
import { createConstraintsResolver } from '@granit/react-validation';
import { AlertCircle, Mail, ShieldOff } from 'lucide-react';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Link } from 'react-router-dom';

import { logger } from './logger';
import { PublicLayout } from './public-layout';
import { registerConstraints, type RegisterFormValues } from './validation';

import type { Resolver } from 'react-hook-form';

function RegisterFormSkeleton() {
  return (
    <PublicLayout>
      <div className="space-y-4">
        <Skeleton className="mx-auto h-6 w-48" />
        <Skeleton className="mx-auto h-4 w-64" />
        <div className="grid grid-cols-2 gap-4">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
        </div>
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
      </div>
    </PublicLayout>
  );
}

function RegistrationDisabled() {
  const { t } = useTranslation();

  return (
    <PublicLayout>
      <div className="text-center">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-muted">
          <ShieldOff className="h-6 w-6 text-muted-foreground" />
        </div>
        <h2 className="mb-2 text-lg font-semibold text-foreground">
          {t('Auth.Register.Disabled')}
        </h2>
        <p className="text-sm text-muted-foreground">{t('Auth.Register.DisabledMessage')}</p>
      </div>
      <div className="mt-4 text-center">
        <Link to={'/login'} className="text-sm text-primary hover:underline">
          {t('Auth.Register.AlreadyHaveAccount')}
        </Link>
      </div>
    </PublicLayout>
  );
}

function RegisterForm() {
  const { t } = useTranslation();
  const [serverError, setServerError] = useState<string | null>(null);
  const [emailConfirmationRequired, setEmailConfirmationRequired] = useState(false);

  const mutation = useRegister();

  const form = useForm<RegisterFormValues>({
    resolver: createConstraintsResolver(registerConstraints, t, {
      labelResolver: (field) => {
        const labels: Record<string, string> = {
          email: t('Auth.Register.EmailLabel'),
          password: t('Auth.Register.PasswordLabel'),
          confirmPassword: t('Auth.Register.ConfirmPasswordLabel'),
        };
        return labels[field] ?? field;
      },
    }) as unknown as Resolver<RegisterFormValues>,
    defaultValues: {
      email: '',
      firstName: '',
      lastName: '',
      password: '',
      confirmPassword: '',
    },
  });

  async function onSubmit(values: RegisterFormValues) {
    setServerError(null);
    try {
      await mutation.mutateAsync({
        email: values.email,
        password: values.password,
        firstName: values.firstName || undefined,
        lastName: values.lastName || undefined,
      });

      // `POST /register` is fire-and-forget (202 Accepted, no body): registration
      // is processed asynchronously and the user receives a confirmation email,
      // so we always surface the "check your inbox" state on success.
      setEmailConfirmationRequired(true);
    } catch (err: unknown) {
      if (isAxiosError(err) && err.response?.status === 403) {
        setServerError(t('Auth.Register.Disabled'));
      } else if (isAxiosError(err) && err.response?.status === 409) {
        setServerError(t('Auth.Register.EmailAlreadyExists'));
      } else if (isAxiosError(err) && err.response?.status === 400) {
        setServerError(t('Auth.Register.ValidationError'));
      } else {
        setServerError(t('Auth.Register.UnexpectedError'));
      }
      logger.error('[Register] Registration failed', err);
    }
  }

  return (
    <PublicLayout>
      {emailConfirmationRequired ? (
        <div className="text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
            <Mail className="h-6 w-6 text-primary" />
          </div>
          <h2 className="mb-2 text-lg font-semibold text-foreground">
            {t('Auth.Register.ConfirmEmailTitle')}
          </h2>
          <p className="text-sm text-muted-foreground">{t('Auth.Register.ConfirmEmailMessage')}</p>
        </div>
      ) : (
        <>
          <div className="mb-6 text-center">
            <h2 className="text-lg font-semibold text-foreground">{t('Auth.Register.Title')}</h2>
            <p className="mt-1 text-sm text-muted-foreground">{t('Auth.Register.Subtitle')}</p>
          </div>

          {serverError && (
            <Alert variant="destructive" className="mb-4">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{serverError}</AlertDescription>
            </Alert>
          )}

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="firstName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('Auth.Register.FirstNameLabel')}</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          placeholder={t('Auth.Register.FirstNamePlaceholder')}
                          autoComplete="given-name"
                          autoFocus
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="lastName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('Auth.Register.LastNameLabel')}</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          placeholder={t('Auth.Register.LastNamePlaceholder')}
                          autoComplete="family-name"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('Auth.Register.EmailLabel')}</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        type="email"
                        placeholder={t('Auth.Register.EmailPlaceholder')}
                        autoComplete="email"
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
                    <FormLabel>{t('Auth.Register.PasswordLabel')}</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        type="password"
                        placeholder={t('Auth.Register.PasswordPlaceholder')}
                        autoComplete="new-password"
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
                    <FormLabel>{t('Auth.Register.ConfirmPasswordLabel')}</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        type="password"
                        placeholder={t('Auth.Register.ConfirmPasswordPlaceholder')}
                        autoComplete="new-password"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button type="submit" className="w-full" disabled={mutation.isPending}>
                {mutation.isPending ? t('Auth.Register.Submitting') : t('Auth.Register.Submit')}
              </Button>
            </form>
          </Form>
        </>
      )}

      <div className="mt-4 text-center">
        <Link to={'/login'} className="text-sm text-muted-foreground hover:underline">
          {t('Auth.Register.AlreadyHaveAccount')}
        </Link>
      </div>
    </PublicLayout>
  );
}

/**
 * Registration page. Provider-agnostic: the host supplies the `AccountProvider`
 * (from `@granit/react-account`) which carries the API client. Reads
 * `allowSelfRegistration` from the account settings to gate the form.
 */
export function RegisterPage() {
  const { data: settings, isLoading } = useAccountSettings();
  const allowRegistration = settings?.allowSelfRegistration ?? false;

  if (isLoading) return <RegisterFormSkeleton />;
  if (!allowRegistration) return <RegistrationDisabled />;
  return <RegisterForm />;
}
