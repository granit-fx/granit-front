import { cn } from '@granit/utils';
import { cva, type VariantProps } from 'class-variance-authority';
import * as React from 'react';

/**
 * Intent-driven status pill. Unlike {@link Badge} (whose variants map to
 * brand/structural roles), `StatusBadge` maps to semantic *outcome* intents
 * (success / warning / danger / info / accent / neutral) — the vocabulary admin
 * grids use to colour a row's lifecycle state. Consumers pass a domain status
 * through their own `Record<Status, StatusBadgeIntent>` map.
 */
const statusBadgeVariants = cva(
  'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium whitespace-nowrap',
  {
    variants: {
      intent: {
        success: 'bg-success-100 text-success-800 dark:bg-success-900/40 dark:text-success-200',
        warning: 'bg-warning-100 text-warning-800 dark:bg-warning-900/40 dark:text-warning-200',
        danger: 'bg-alert-100 text-alert-800 dark:bg-alert-900/40 dark:text-alert-200',
        info: 'bg-admin-100 text-admin-800 dark:bg-admin-900/40 dark:text-admin-200',
        accent: 'bg-info-100 text-info-800 dark:bg-info-900/40 dark:text-info-200',
        neutral: 'bg-muted/30 text-muted-foreground dark:bg-muted/20',
      },
      size: {
        sm: 'px-2 py-0.5 text-[10px]',
        md: 'px-2.5 py-0.5 text-xs',
      },
    },
    defaultVariants: {
      intent: 'neutral',
      size: 'md',
    },
  }
);

export type StatusBadgeIntent = NonNullable<VariantProps<typeof statusBadgeVariants>['intent']>;

interface StatusBadgeProps
  extends React.ComponentProps<'span'>, VariantProps<typeof statusBadgeVariants> {
  readonly intent?: StatusBadgeIntent;
}

function StatusBadge({ className, intent, size, ...props }: StatusBadgeProps) {
  return (
    <span
      data-slot="status-badge"
      data-intent={intent}
      className={cn(statusBadgeVariants({ intent, size }), className)}
      {...props}
    />
  );
}

export { StatusBadge, statusBadgeVariants };
