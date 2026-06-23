import { useTranslation } from '@granit/react-localization';
import { Button } from '@granit/react-ui';
import { ShieldX } from 'lucide-react';

export interface AccessDeniedPageProps {
  /** Email of the signed-in user, shown as "Connected as …" (optional). */
  readonly userEmail?: string;
  /** Sign-out / switch-account action; the button is hidden when absent. */
  readonly onSignOut?: () => void;
}

/**
 * Full-screen 403 page. App-agnostic: the host injects the current user's email
 * and the sign-out action (the app owns its auth context), so this stays free of
 * any `useAuth` dependency.
 */
export function AccessDeniedPage({ userEmail, onSignOut }: AccessDeniedPageProps) {
  const { t } = useTranslation();

  return (
    <div
      data-slot="access-denied-page"
      className="flex min-h-screen items-center justify-center bg-background px-4"
    >
      <div className="w-full max-w-md text-center">
        <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-alert-500/10">
          <ShieldX className="h-10 w-10 text-alert-600" aria-hidden="true" />
        </div>

        <h1 className="mb-2 text-2xl font-semibold text-foreground">
          {t('Auth.AccessDenied.Title')}
        </h1>

        {userEmail && (
          <p className="mb-4 text-sm text-muted-foreground">
            {t('Auth.AccessDenied.ConnectedAs', 'Connected as')}{' '}
            <span className="font-medium">{userEmail}</span>
          </p>
        )}

        <p className="mb-2 text-muted-foreground">{t('Auth.AccessDeniedMessage')}</p>
        <p className="mb-8 text-sm text-muted-foreground">{t('Auth.AccessDeniedContact')}</p>

        {onSignOut && (
          <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
            <Button variant="outline" onClick={onSignOut}>
              {t('Auth.SwitchAccount')}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
