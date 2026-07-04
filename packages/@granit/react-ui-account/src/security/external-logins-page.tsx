import { useExternalLogins, useUnlinkExternalLogin } from '@granit/react-account';
import { useTranslation } from '@granit/react-localization';
import {
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Spinner,
  toast,
} from '@granit/react-ui';
import { ExternalLoginButtons, ExternalProviderIcon } from '@granit/react-ui-authentication-local';
import { EmptyState } from '@granit/react-ui-kit';
import { Link2Off } from 'lucide-react';

import { logger } from '../logger';

import { useAvailableExternalProviders } from './use-available-external-providers';

export function ExternalLoginsPage() {
  const { t } = useTranslation();
  const { data: logins, isLoading } = useExternalLogins();
  const unlink = useUnlinkExternalLogin();
  const { providers: availableProviders } = useAvailableExternalProviders();

  const linkedIds = new Set((logins ?? []).map((l) => l.loginProvider.toLowerCase()));
  const hasUnlinked = availableProviders.some((p) => !linkedIds.has(p.name.toLowerCase()));

  function renderLinkedAccounts() {
    if (isLoading) {
      return (
        <div className="flex h-24 items-center justify-center">
          <Spinner />
        </div>
      );
    }
    if (logins && logins.length > 0) {
      return (
        <div className="divide-y divide-border">
          {logins.map((login) => (
            <div key={login.loginProvider} className="flex items-center justify-between py-3">
              <div className="flex items-center gap-3">
                <ExternalProviderIcon
                  provider={login.loginProvider}
                  className="h-5 w-5 text-muted-foreground"
                />
                <div>
                  <p className="text-sm font-medium text-foreground">
                    {login.providerDisplayName ?? login.loginProvider}
                  </p>
                  <p className="font-mono text-xs text-muted-foreground">{login.providerKey}</p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleUnlink(login.loginProvider)}
                disabled={unlink.isPending}
                className="text-destructive hover:text-destructive"
                aria-label={t('Account.ExternalLogins.Unlink', 'Unlink')}
              >
                <Link2Off className="mr-2 h-4 w-4" />
                {t('Account.ExternalLogins.Unlink', 'Unlink')}
              </Button>
            </div>
          ))}
        </div>
      );
    }
    return (
      <EmptyState
        icon={Link2Off}
        message={t('Account.ExternalLogins.NoLogins', 'No external accounts linked')}
      />
    );
  }

  async function handleUnlink(provider: string) {
    try {
      await unlink.mutateAsync(provider);
      toast.success(t('Account.ExternalLogins.UnlinkSuccess', 'Account unlinked.'));
    } catch (err) {
      // API errors are surfaced by the global MutationCache.onError toast.
      logger.error('[ExternalLogins] Unlink failed', err);
    }
  }

  return (
    <div data-slot="external-logins-page" className="mx-auto max-w-2xl space-y-6">
      <div>
        <h2 className="text-2xl font-semibold text-foreground">
          {t('Account.ExternalLogins.Title', 'External accounts')}
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          {t('Account.ExternalLogins.Subtitle', 'Manage linked external login providers')}
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{t('Account.ExternalLogins.LinkedTitle', 'Linked accounts')}</CardTitle>
          <CardDescription>
            {t(
              'Account.ExternalLogins.LinkedDescription',
              'External providers currently linked to your account'
            )}
          </CardDescription>
        </CardHeader>
        <CardContent>{renderLinkedAccounts()}</CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t('Account.ExternalLogins.LinkNewTitle', 'Link a new provider')}</CardTitle>
          <CardDescription>
            {t(
              'Account.ExternalLogins.LinkNewDescription',
              'Connect another external provider to sign in faster.'
            )}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {hasUnlinked ? (
            <ExternalLoginButtons
              variant="link"
              linkedProviders={(logins ?? []).map((l) => l.loginProvider)}
            />
          ) : (
            <p className="text-sm text-muted-foreground">
              {t('Account.ExternalLogins.AllLinked', 'All available providers are already linked.')}
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
