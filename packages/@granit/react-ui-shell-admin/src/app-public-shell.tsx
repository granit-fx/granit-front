import { LanguageSwitcher } from '@granit/react-ui-localization';

import type { ReactNode } from 'react';

export interface AppPublicShellProps {
  /** App branding block (logo, title, subtitle) rendered, centered, above the card. */
  readonly brand?: ReactNode;
  /** The page content rendered inside the centered card. */
  readonly children: ReactNode;
  /** Optional content rendered below the card (e.g. a help link). */
  readonly footer?: ReactNode;
}

/**
 * Centered single-column frame for unauthenticated pages (login, consent,
 * device flow, error screens). App branding is injected via `brand`; the
 * package owns the centered card, the footer slot and the language switcher.
 */
export function AppPublicShell({ brand, children, footer }: AppPublicShellProps) {
  return (
    <div
      data-slot="app-public-shell"
      className="flex min-h-screen items-center justify-center bg-background px-4"
    >
      <div className="w-full max-w-sm">
        {brand ? <div className="mb-8 text-center">{brand}</div> : null}

        <div className="rounded-xl border border-border bg-card p-6 card-shadow">{children}</div>

        {footer}

        <LanguageSwitcher />
      </div>
    </div>
  );
}
