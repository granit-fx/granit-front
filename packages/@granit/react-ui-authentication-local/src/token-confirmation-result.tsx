import { useTranslation } from '@granit/react-localization';
import { Alert, AlertDescription, Button, Spinner } from '@granit/react-ui';
import { AlertCircle, CheckCircle } from 'lucide-react';
import { Link } from 'react-router-dom';

import { PublicLayout } from './public-layout';
import { safeReturnUrl } from './safe-return-url';

export type ConfirmationStatus = 'loading' | 'success' | 'error';

/** Full browser redirect — exits the SPA. */
function redirectTo(url: string): void {
  globalThis.location.href = url;
}

/**
 * Shared status display for token-confirmation flows (confirm-email,
 * confirm-email-change). The translation keys must be defined under
 * `{i18nPrefix}.{Verifying,SuccessTitle,SuccessMessage,BackToLogin,
 * InvalidLink,ErrorMessage}`.
 */
export function TokenConfirmationResult({
  status,
  i18nPrefix,
  returnUrl,
  isLinkValid,
}: Readonly<{
  status: ConfirmationStatus;
  i18nPrefix: string;
  returnUrl: string | null;
  isLinkValid: boolean;
}>) {
  const { t } = useTranslation();

  return (
    <PublicLayout>
      {status === 'loading' && (
        <div className="flex flex-col items-center py-4">
          <Spinner size="lg" className="mb-4" />
          <p className="text-sm text-muted-foreground">{t(`${i18nPrefix}.Verifying`)}</p>
        </div>
      )}

      {status === 'success' && (
        <div className="text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
            <CheckCircle className="h-6 w-6 text-primary" />
          </div>
          <h2 className="mb-2 text-lg font-semibold text-foreground">
            {t(`${i18nPrefix}.SuccessTitle`)}
          </h2>
          <p className="mb-4 text-sm text-muted-foreground">{t(`${i18nPrefix}.SuccessMessage`)}</p>
          <Button className="w-full" onClick={() => redirectTo(safeReturnUrl(returnUrl))}>
            {t(`${i18nPrefix}.BackToLogin`)}
          </Button>
        </div>
      )}

      {status === 'error' && (
        <div className="text-center">
          <Alert variant="destructive" className="mb-4">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              {isLinkValid ? t(`${i18nPrefix}.ErrorMessage`) : t(`${i18nPrefix}.InvalidLink`)}
            </AlertDescription>
          </Alert>
          <Link to={'/login'} className="text-sm text-muted-foreground hover:underline">
            {t('Auth.HeadlessLogin.BackToLogin')}
          </Link>
        </div>
      )}
    </PublicLayout>
  );
}
