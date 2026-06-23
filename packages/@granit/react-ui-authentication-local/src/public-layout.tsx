import { useTranslation } from '@granit/react-localization';
import { Shield } from 'lucide-react';

import type { ReactNode } from 'react';

interface PublicLayoutProps {
  readonly children: ReactNode;
  readonly footer?: ReactNode;
}

/**
 * Centered card chrome for the unauthenticated auth pages. The branding header
 * reads the host-owned `Common.AppName` / `Auth.LoginPage.PlatformTitle` keys so
 * the host controls the product name; the package only owns the layout. The host
 * supplies any locale/theme switcher around this layout, not inside it.
 */
export function PublicLayout({ children, footer }: PublicLayoutProps) {
  const { t } = useTranslation();

  return (
    <div
      data-slot="public-layout"
      className="flex min-h-screen items-center justify-center bg-background px-4"
    >
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary">
            <Shield className="h-8 w-8 text-primary-foreground" aria-hidden="true" />
          </div>
          <h1 className="text-2xl font-semibold text-foreground">{t('Common.AppName')}</h1>
          <p className="mt-1 text-sm text-muted-foreground">{t('Auth.LoginPage.PlatformTitle')}</p>
        </div>

        <div className="rounded-xl border border-border bg-card p-6 card-shadow">{children}</div>

        {footer}
      </div>
    </div>
  );
}
