import { Button } from '@granit/react-ui';
import { cn } from '@granit/utils';

import type { ComponentProps } from 'react';

/**
 * Button for medium-risk, reversible actions — revoking a session, disabling an
 * account, evicting a cache entry. It sits between a neutral action and the
 * solid `destructive` variant, which we reserve for irreversible damage
 * (deleting an account, dropping data).
 *
 * Visually it's a ghost button with destructive-coloured text at rest that
 * washes red on hover, so the danger reads on intent without shouting from the
 * page the way a filled red button does. Forwards every `Button` prop (`size`,
 * `disabled`, `onClick`, …); the visible text is the accessible name, so no
 * `aria-label` is required.
 */
export function RiskButton({ className, ...props }: ComponentProps<typeof Button>) {
  return (
    <Button
      data-slot="risk-button"
      variant="ghost"
      className={cn(
        'text-destructive hover:bg-destructive/15 hover:text-destructive focus-visible:ring-destructive/20 dark:hover:bg-destructive/25',
        className
      )}
      {...props}
    />
  );
}
