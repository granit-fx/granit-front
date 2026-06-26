import {
  isAxiosError,
  useSendTwoFactorLoginEmailCode,
  useVerifyTwoFactorLogin,
} from '@granit/react-authentication-local';
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
import { AlertCircle, CheckCircle, Mail } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';

import { logger } from './logger';
import { handleLoginError, redirectToReturnUrl } from './login-helpers';
import { twoFactorConstraints, type TwoFactorFormValues } from './validation';

import type { TwoFactorMethod } from '@granit/authentication-local';
import type { Resolver } from 'react-hook-form';

interface TwoFactorFormProps {
  /**
   * The opt-in second factors offered by the server for this user (the login
   * response's `twoFactorMethods`). The UI only offers what is listed here —
   * `"Email"` appears solely when the user has enrolled it. When omitted we
   * fall back to authenticator-only.
   */
  readonly methods?: readonly string[];
  readonly serverError: string | null;
  readonly setServerError: (err: string | null) => void;
  readonly onBack: () => void;
}

/** Canonical display order; we intersect this with the server-provided set. */
const METHOD_ORDER: readonly TwoFactorMethod[] = ['Authenticator', 'Email', 'RecoveryCode'];

/** Seconds before a fresh email code can be requested again. */
const RESEND_COOLDOWN_SECONDS = 30;

export function TwoFactorForm({
  methods,
  serverError,
  setServerError,
  onBack,
}: TwoFactorFormProps) {
  const { t } = useTranslation();

  // Derive the offered factors from the server set, preserving canonical order.
  // Fall back to authenticator-only if the server omitted the list.
  const offered = useMemo<readonly TwoFactorMethod[]>(() => {
    const available = METHOD_ORDER.filter((m) => methods?.includes(m));
    return available.length > 0 ? available : ['Authenticator'];
  }, [methods]);

  const [method, setMethod] = useState<TwoFactorMethod>(
    () => offered.find((m) => m === 'Authenticator') ?? offered[0]!
  );
  const [emailSent, setEmailSent] = useState(false);
  const [cooldown, setCooldown] = useState(0);

  const verifyMutation = useVerifyTwoFactorLogin();
  const sendEmailMutation = useSendTwoFactorLoginEmailCode();

  const form = useForm<TwoFactorFormValues>({
    resolver: createConstraintsResolver(twoFactorConstraints, t, {
      labelResolver: (field) =>
        field === 'code' ? t('Auth.HeadlessLogin.TwoFactorCodeLabel') : field,
    }) as unknown as Resolver<TwoFactorFormValues>,
    defaultValues: { code: '' },
  });

  // Tick the resend cooldown down to zero.
  const isCoolingDown = cooldown > 0;
  useEffect(() => {
    if (!isCoolingDown) return;
    const id = setInterval(() => setCooldown((c) => Math.max(0, c - 1)), 1000);
    return () => clearInterval(id);
  }, [isCoolingDown]);

  async function onSubmit(values: TwoFactorFormValues) {
    setServerError(null);
    try {
      const data = await verifyMutation.mutateAsync({ code: values.code, method });

      if (data.succeeded) {
        redirectToReturnUrl();
        return;
      }
    } catch (err: unknown) {
      if (isAxiosError(err) && err.response?.status === 401) {
        setServerError(t('Auth.HeadlessLogin.TwoFactorInvalidCode'));
      } else {
        handleLoginError(err, setServerError, t);
      }
    }
  }

  async function handleSendEmailCode() {
    setServerError(null);
    try {
      await sendEmailMutation.mutateAsync();
      setEmailSent(true);
      setCooldown(RESEND_COOLDOWN_SECONDS);
    } catch (err) {
      setServerError(t('Auth.HeadlessLogin.EmailCodeSendError'));
      logger.error('[HeadlessLogin] Sending email 2FA code failed', err);
    }
  }

  function switchMethod(next: TwoFactorMethod) {
    setMethod(next);
    setServerError(null);
    form.reset({ code: '' });
  }

  const codeLabel: Record<TwoFactorMethod, string> = {
    Authenticator: t('Auth.HeadlessLogin.TwoFactorCodeLabel'),
    Email: t('Auth.HeadlessLogin.EmailCodeLabel'),
    RecoveryCode: t('Auth.HeadlessLogin.RecoveryCodeLabel'),
  };
  const codePlaceholder: Record<TwoFactorMethod, string> = {
    Authenticator: t('Auth.HeadlessLogin.TwoFactorCodePlaceholder'),
    Email: t('Auth.HeadlessLogin.EmailCodePlaceholder'),
    RecoveryCode: t('Auth.HeadlessLogin.RecoveryCodePlaceholder'),
  };
  const switchLabel: Record<TwoFactorMethod, string> = {
    Authenticator: t('Auth.HeadlessLogin.UseAuthenticatorApp'),
    Email: t('Auth.HeadlessLogin.UseEmailCode'),
    RecoveryCode: t('Auth.HeadlessLogin.UseRecoveryCode'),
  };

  function subtitle(): string {
    if (method === 'Email') {
      return emailSent
        ? t('Auth.HeadlessLogin.EmailCodeSentSubtitle')
        : t('Auth.HeadlessLogin.EmailCodePromptSubtitle');
    }
    if (method === 'RecoveryCode') {
      return t('Auth.HeadlessLogin.RecoveryCodeSubtitle');
    }
    return t('Auth.HeadlessLogin.TwoFactorSubtitle');
  }

  // For email, the user must first request a code before the input is shown.
  const showCodeInput = method !== 'Email' || emailSent;
  const otherMethods = offered.filter((m) => m !== method);

  return (
    <>
      <div className="mb-4 text-center">
        <h2 className="text-lg font-semibold text-foreground">
          {t('Auth.HeadlessLogin.TwoFactorTitle')}
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">{subtitle()}</p>
      </div>

      {serverError && (
        <Alert variant="destructive" className="mb-4">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{serverError}</AlertDescription>
        </Alert>
      )}

      {method === 'Email' && !emailSent ? (
        <Button
          type="button"
          className="w-full"
          disabled={sendEmailMutation.isPending}
          onClick={handleSendEmailCode}
        >
          <Mail className="mr-2 h-4 w-4" />
          {sendEmailMutation.isPending
            ? t('Auth.HeadlessLogin.SendingEmailCode')
            : t('Auth.HeadlessLogin.SendEmailCode')}
        </Button>
      ) : null}

      {showCodeInput && (
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            {method === 'Email' && emailSent && (
              <div className="flex items-center gap-2 rounded-md border border-success-500/25 bg-success-500/10 px-3 py-2 text-sm text-success">
                <CheckCircle className="h-4 w-4 shrink-0" />
                <span>{t('Auth.HeadlessLogin.EmailCodeSent')}</span>
              </div>
            )}

            <FormField
              control={form.control}
              name="code"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{codeLabel[method]}</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      placeholder={codePlaceholder[method]}
                      autoComplete="one-time-code"
                      autoFocus
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button type="submit" className="w-full" disabled={verifyMutation.isPending}>
              {verifyMutation.isPending
                ? t('Auth.HeadlessLogin.TwoFactorVerifying')
                : t('Auth.HeadlessLogin.TwoFactorSubmit')}
            </Button>

            {method === 'Email' && emailSent && (
              <button
                type="button"
                className="w-full text-center text-sm text-primary hover:underline disabled:cursor-not-allowed disabled:text-muted-foreground disabled:no-underline"
                onClick={handleSendEmailCode}
                disabled={isCoolingDown || sendEmailMutation.isPending}
              >
                {isCoolingDown
                  ? t('Auth.HeadlessLogin.ResendEmailCodeCooldown', {
                      seconds: cooldown,
                      defaultValue: `Resend code in ${cooldown}s`,
                    })
                  : t('Auth.HeadlessLogin.ResendEmailCode')}
              </button>
            )}
          </form>
        </Form>
      )}

      <div className="mt-4 flex flex-col items-center gap-2">
        {otherMethods.map((m) => (
          <button
            key={m}
            type="button"
            className="text-sm text-primary hover:underline"
            onClick={() => switchMethod(m)}
          >
            {switchLabel[m]}
          </button>
        ))}
        <button
          type="button"
          className="text-sm text-muted-foreground hover:underline"
          onClick={onBack}
        >
          {t('Auth.HeadlessLogin.BackToLogin')}
        </button>
      </div>
    </>
  );
}
