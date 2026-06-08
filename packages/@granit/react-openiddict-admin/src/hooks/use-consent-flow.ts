import { useMemo } from 'react';

import { useCreateOidcAuthorization } from './use-oidc-authorizations';

export interface ConsentFlowState {
  /** The `client_id` parsed from the returnUrl, or `null` if unavailable. */
  readonly clientId: string | null;
  /** The scopes parsed from the `scope` parameter in returnUrl. */
  readonly scopes: readonly string[];
  /** Whether the consent grant is in flight. */
  readonly isPending: boolean;
  /** Grant consent: POSTs the authorization and redirects to returnUrl. */
  readonly grant: () => Promise<void>;
  /** Deny consent: redirects away from the consent page. */
  readonly deny: (redirectUrl?: string) => void;
}

/**
 * Drives the OIDC explicit-consent redirect flow.
 *
 * Parse `returnUrl` from the `?returnUrl=` query param (it is the full
 * `/connect/authorize?…` URL). Pass the current user's subject so the hook
 * can call `POST /oidc/authorizations` and redirect on approval.
 *
 * Must be used inside an `<OpenIddictAdminProvider>`.
 */
export function useConsentFlow(returnUrl: string | null, subject: string | null): ConsentFlowState {
  const createAuth = useCreateOidcAuthorization();

  const parsed = useMemo(() => {
    if (!returnUrl) return null;
    try {
      const url = new URL(
        returnUrl,
        typeof window !== 'undefined' ? window.location.origin : 'http://localhost'
      );
      return {
        clientId: url.searchParams.get('client_id'),
        scopes: url.searchParams.get('scope')?.split(' ').filter(Boolean) ?? [],
      };
    } catch {
      return null;
    }
  }, [returnUrl]);

  const grant = async () => {
    if (!parsed?.clientId || !subject || !returnUrl) return;
    await createAuth.mutateAsync({
      subject,
      clientId: parsed.clientId,
      scopes: parsed.scopes,
    });
    window.location.href = returnUrl;
  };

  const deny = (redirectUrl = '/') => {
    window.location.href = redirectUrl;
  };

  return {
    clientId: parsed?.clientId ?? null,
    scopes: parsed?.scopes ?? [],
    isPending: createAuth.isPending,
    grant,
    deny,
  };
}
