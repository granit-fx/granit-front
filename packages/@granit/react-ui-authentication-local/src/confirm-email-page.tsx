import { useConfirmEmail, useResendConfirmation } from '@granit/react-account';
import { useTranslation } from '@granit/react-localization';
import { toast, Button } from '@granit/react-ui';
import { useEffect, useState } from 'react';

import { logger } from './logger';
import { TokenConfirmationResult, type ConfirmationStatus } from './token-confirmation-result';

const log = logger.child('ConfirmEmail');

/**
 * Email-confirmation page. Provider-agnostic: the host supplies the
 * `AccountProvider` (from `@granit/react-account`) which carries the API client.
 * Reads `userId` / `token` / `returnUrl` from the URL query string and confirms
 * on mount.
 */
export function ConfirmEmailPage() {
  const { t } = useTranslation();
  const [status, setStatus] = useState<ConfirmationStatus>('loading');

  const params = new URLSearchParams(globalThis.location.search);
  const userId = params.get('userId');
  const token = params.get('token');
  const returnUrl = params.get('returnUrl');

  const mutation = useConfirmEmail();
  const resend = useResendConfirmation();

  useEffect(() => {
    if (!userId || !token) {
      setStatus('error');
      return;
    }

    mutation.mutate(
      { userId, token },
      {
        onSuccess: () => setStatus('success'),
        onError: (err) => {
          setStatus('error');
          log.error('Confirmation failed', err);
        },
      }
    );
    // Run once on mount
  }, []);

  async function handleResend() {
    try {
      await resend.mutateAsync();
      toast.success(t('Auth.ConfirmEmail.ResendSuccess', 'Confirmation email sent.'));
    } catch (err) {
      // API errors are surfaced by the host's global MutationCache.onError toast.
      log.error('Resend failed', err);
    }
  }

  return (
    <>
      <TokenConfirmationResult
        status={status}
        i18nPrefix="Auth.ConfirmEmail"
        returnUrl={returnUrl}
        isLinkValid={Boolean(userId && token)}
      />
      {status !== 'loading' && (
        <div className="mt-4 text-center">
          <p className="mb-2 text-xs text-muted-foreground">
            {t('Auth.ConfirmEmail.ResendPrompt', "Didn't receive the email?")}
          </p>
          <Button variant="ghost" size="sm" onClick={handleResend} disabled={resend.isPending}>
            {resend.isPending
              ? t('Auth.ConfirmEmail.Resending', 'Sending…')
              : t('Auth.ConfirmEmail.ResendButton', 'Resend confirmation email')}
          </Button>
        </div>
      )}
    </>
  );
}
