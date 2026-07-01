import { useChangeEmail } from '@granit/react-account';
import { useTranslation } from '@granit/react-localization';
import {
  Button,
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  Input,
  Toaster,
} from '@granit/react-ui';
import { createConstraintsResolver } from '@granit/react-validation';
import { CheckCircle, Mail } from 'lucide-react';
import { useState } from 'react';
import { useForm } from 'react-hook-form';

import { logger } from '../logger';
import { changeEmailConstraints, type ChangeEmailFormValues } from '../validation';

import type { Resolver } from 'react-hook-form';

const log = logger.child('ChangeEmail');

/**
 * Change-email page (authenticated). Provider-agnostic: the host supplies the
 * `AccountProvider` (from `@granit/react-account`) which carries the API client.
 * Renders inside the host's authenticated chrome, not the public auth layout.
 */
export function ChangeEmailPage() {
  const { t } = useTranslation();
  const [success, setSuccess] = useState(false);

  const mutation = useChangeEmail();

  const form = useForm<ChangeEmailFormValues>({
    resolver: createConstraintsResolver(changeEmailConstraints, t, {
      labelResolver: (field) => {
        const labels: Record<string, string> = {
          newEmail: t('Auth.ChangeEmail.NewEmailLabel'),
          currentPassword: t('Auth.ChangeEmail.CurrentPasswordLabel'),
        };
        return labels[field] ?? field;
      },
    }) as unknown as Resolver<ChangeEmailFormValues>,
    defaultValues: { newEmail: '', currentPassword: '' },
  });

  async function onSubmit(values: ChangeEmailFormValues) {
    try {
      await mutation.mutateAsync({
        newEmail: values.newEmail,
        currentPassword: values.currentPassword,
      });
      setSuccess(true);
    } catch (err: unknown) {
      // API errors are surfaced by the host's global MutationCache.onError toast.
      log.error('Request failed', err);
    }
  }

  return (
    <div data-slot="change-email-page" className="mx-auto max-w-md space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-foreground">{t('Auth.ChangeEmail.Title')}</h2>
        <p className="mt-1 text-sm text-muted-foreground">{t('Auth.ChangeEmail.Subtitle')}</p>
      </div>

      {success ? (
        <div className="rounded-xl border border-border bg-card p-6 text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
            <CheckCircle className="h-6 w-6 text-primary" />
          </div>
          <h3 className="mb-2 text-lg font-semibold text-foreground">
            {t('Auth.ChangeEmail.SuccessTitle')}
          </h3>
          <p className="text-sm text-muted-foreground">{t('Auth.ChangeEmail.SuccessMessage')}</p>
          <Button variant="outline" className="mt-4" onClick={() => setSuccess(false)}>
            {t('Auth.ChangeEmail.ChangeAgain')}
          </Button>
        </div>
      ) : (
        <div className="rounded-xl border border-border bg-card p-6">
          <div className="mb-4 flex items-center gap-2 text-muted-foreground">
            <Mail className="h-4 w-4" />
            <span className="text-sm">{t('Auth.ChangeEmail.Description')}</span>
          </div>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="newEmail"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('Auth.ChangeEmail.NewEmailLabel')}</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        type="email"
                        placeholder={t('Auth.ChangeEmail.NewEmailPlaceholder')}
                        autoComplete="email"
                        autoFocus
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="currentPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('Auth.ChangeEmail.CurrentPasswordLabel')}</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        type="password"
                        placeholder={t('Auth.ChangeEmail.CurrentPasswordPlaceholder')}
                        autoComplete="current-password"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button type="submit" className="w-full" disabled={mutation.isPending}>
                {mutation.isPending
                  ? t('Auth.ChangeEmail.Submitting')
                  : t('Auth.ChangeEmail.Submit')}
              </Button>
            </form>
          </Form>
        </div>
      )}

      <Toaster position="bottom-right" />
    </div>
  );
}
