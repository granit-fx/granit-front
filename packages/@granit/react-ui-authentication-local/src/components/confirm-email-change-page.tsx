import { useConfirmEmailChange } from '@granit/react-account';
import { useEffect, useState } from 'react';

import { logger } from '../logger';

import { TokenConfirmationResult, type ConfirmationStatus } from './token-confirmation-result';

const log = logger.child('ConfirmEmailChange');

/**
 * Email-change confirmation page. Provider-agnostic: the host supplies the
 * `AccountProvider` (from `@granit/react-account`) which carries the API client.
 * Reads `userId` / `newEmail` / `token` / `returnUrl` from the URL query string
 * and confirms on mount.
 */
export function ConfirmEmailChangePage() {
  const [status, setStatus] = useState<ConfirmationStatus>('loading');

  const params = new URLSearchParams(globalThis.location.search);
  const userId = params.get('userId');
  const newEmail = params.get('newEmail');
  const token = params.get('token');
  const returnUrl = params.get('returnUrl');

  const mutation = useConfirmEmailChange();

  useEffect(() => {
    if (!userId || !newEmail || !token) {
      setStatus('error');
      return;
    }

    mutation.mutate(
      { userId, newEmail, token },
      {
        onSuccess: () => setStatus('success'),
        onError: (err: Error) => {
          setStatus('error');
          log.error('Confirmation failed', err);
        },
      }
    );
    // Run once on mount
  }, []);

  return (
    <TokenConfirmationResult
      status={status}
      i18nPrefix="Auth.ConfirmEmailChange"
      returnUrl={returnUrl}
      isLinkValid={Boolean(userId && newEmail && token)}
    />
  );
}
