import { cn } from '@granit/utils';
import { CircleAlert, Info } from 'lucide-react';

import type { ReactNode } from 'react';

export type SystemMessageVariant = 'error' | 'info';

export interface SystemMessageProps {
  /** Visual + semantic tone. `error` announces assertively; defaults to `info`. */
  readonly variant?: SystemMessageVariant;
  /** The notice text (or richer node). */
  readonly children: ReactNode;
  /** Optional trailing affordance, e.g. a retry button. */
  readonly action?: ReactNode;
  readonly className?: string;
}

const VARIANT_ICON = { error: CircleAlert, info: Info } as const;

/**
 * A non-conversational notice rendered inline in the thread — a stream failure,
 * a quota message, or any system info. Presentational and headless of meaning:
 * the host supplies the text (e.g. localized from a `ChatErrorKind`). `error`
 * is announced as an `alert`, `info` as a polite `status`.
 */
export function SystemMessage({
  variant = 'info',
  children,
  action,
  className,
}: Readonly<SystemMessageProps>) {
  const Icon = VARIANT_ICON[variant];
  // `error` is an assertive `alert`; `info` uses a native `<output>`, whose
  // implicit `status` role announces politely without a hand-written role.
  const Tag = variant === 'error' ? 'div' : 'output';
  return (
    <Tag
      data-slot="system-message"
      data-variant={variant}
      role={variant === 'error' ? 'alert' : undefined}
      className={cn(
        'flex items-center gap-2 rounded-lg border px-3 py-2 text-sm',
        variant === 'error'
          ? 'border-destructive/30 bg-destructive/10 text-destructive'
          : 'border-border bg-muted/50 text-muted-foreground',
        className
      )}
    >
      <Icon className="size-4 shrink-0" aria-hidden />
      <span className="flex-1">{children}</span>
      {action ? <span className="shrink-0">{action}</span> : null}
    </Tag>
  );
}
