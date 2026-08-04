import { useTranslation } from '@granit/react-localization';
import { useConsentApplication, useConsentFlow } from '@granit/react-openiddict-admin';
import { Button, Spinner } from '@granit/react-ui';
import { AlertTriangle, ShieldCheck } from 'lucide-react';
import { useSearchParams } from 'react-router';

import type { ComponentType, ReactNode } from 'react';

/** Minimal current-user shape the consent flow needs (the subject claim). */
export type ConsentCurrentUser = {
  readonly sub?: string;
};

export type ConsentPageProps = {
  /**
   * Host layout wrapper (e.g. the app's public auth shell). Defaults to a
   * passthrough so the page renders standalone in tests / stories.
   */
  readonly layout?: ComponentType<{ readonly children: ReactNode }>;
  /** The authenticated user; only `sub` is read to bind the consent grant. */
  readonly currentUser?: ConsentCurrentUser;
};

const Passthrough = ({ children }: { readonly children: ReactNode }) => <>{children}</>;

export function ConsentPage({ layout: Layout = Passthrough, currentUser }: ConsentPageProps) {
  const { t } = useTranslation();
  const [searchParams] = useSearchParams();

  const returnUrl = searchParams.get('returnUrl');
  const sub = currentUser?.sub ?? null;

  const { clientId, scopes, isPending, grant, deny } = useConsentFlow(returnUrl, sub);

  const {
    data: application,
    isLoading: isAppLoading,
    isError: isAppError,
  } = useConsentApplication(clientId);

  if (!returnUrl) {
    return (
      <Layout>
        <p className="text-center text-sm text-muted-foreground">
          {t('OpenIddict.Consent.NoReturnUrl')}
        </p>
      </Layout>
    );
  }

  if (!clientId) {
    return (
      <Layout>
        <div className="flex flex-col items-center gap-3 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10">
            <AlertTriangle className="size-6 text-destructive" />
          </div>
          <p className="text-sm text-muted-foreground">
            {t('OpenIddict.Consent.ApplicationNotFound')}
          </p>
        </div>
      </Layout>
    );
  }

  if (isAppLoading) {
    return (
      <Layout>
        <div className="flex justify-center py-8">
          <Spinner />
        </div>
      </Layout>
    );
  }

  if (isAppError || application == null) {
    return (
      <Layout>
        <div className="flex flex-col items-center gap-3 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10">
            <AlertTriangle className="size-6 text-destructive" />
          </div>
          <p className="text-sm text-muted-foreground">
            {t('OpenIddict.Consent.ApplicationNotFound')}
          </p>
        </div>
      </Layout>
    );
  }

  const displayName = application?.displayName ?? clientId;

  return (
    <Layout>
      <div className="space-y-6">
        <div className="text-center">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
            <ShieldCheck className="size-6 text-primary" />
          </div>
          <h2 className="text-lg font-semibold">{t('OpenIddict.Consent.Title')}</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            {t('OpenIddict.Consent.RequestedBy', { clientId: displayName })}
          </p>
        </div>

        {scopes.length > 0 && (
          <div>
            <p className="mb-2 text-sm font-medium">{t('OpenIddict.Consent.Scopes')}</p>
            <ul className="space-y-1">
              {scopes.map((scope) => (
                <li key={scope} className="rounded-md bg-muted px-3 py-1.5 font-mono text-xs">
                  {scope}
                </li>
              ))}
            </ul>
          </div>
        )}

        <div className="flex flex-col gap-2">
          <Button
            onClick={() => {
              grant();
            }}
            disabled={isPending || !sub}
            className="w-full"
          >
            {isPending ? <Spinner className="mr-2 size-4" /> : null}
            {t('OpenIddict.Consent.Allow')}
          </Button>
          <Button
            variant="outline"
            onClick={() => deny('/')}
            disabled={isPending}
            className="w-full"
          >
            {t('OpenIddict.Consent.Deny')}
          </Button>
        </div>
      </div>
    </Layout>
  );
}
