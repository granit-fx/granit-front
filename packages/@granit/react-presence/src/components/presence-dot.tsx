import type { PresenceStatus } from '@granit/presence';
import type { CSSProperties, ReactNode } from 'react';

/**
 * Default Tailwind-friendly colour mapping. Apps that theme through
 * design tokens can override per-status colours via `colorMap` or
 * `className` (or restyle via the `data-status` attribute).
 */
export const DEFAULT_PRESENCE_COLORS: Readonly<Record<PresenceStatus, string>> = {
  Online: '#22c55e', // emerald-500
  Away: '#eab308', // yellow-500
  Busy: '#ef4444', // red-500
  DoNotDisturb: '#b91c1c', // red-700
  Offline: '#9ca3af', // gray-400
};

export interface PresenceDotLabels {
  /** Tooltip / accessible label per status. */
  readonly statusLabel?: (status: PresenceStatus) => string;
}

const DEFAULT_LABELS: Required<PresenceDotLabels> = {
  statusLabel: (status) => (status === 'DoNotDisturb' ? 'Do not disturb' : status),
};

export interface PresenceDotProps {
  /** Effective status to render. */
  readonly status: PresenceStatus;
  /** Diameter in px. Default: 10. */
  readonly size?: number;
  /**
   * Whether to render a ring around the dot — useful when overlaid on an
   * avatar so the dot stays visible against any background. Default: `true`.
   */
  readonly bordered?: boolean;
  /** Custom colour map. Falls back to {@link DEFAULT_PRESENCE_COLORS}. */
  readonly colorMap?: Partial<Record<PresenceStatus, string>>;
  /** Render the dot inline (default) or as an overlay positioned on a parent. */
  readonly variant?: 'inline' | 'overlay';
  readonly labels?: PresenceDotLabels;
  readonly className?: string;
  readonly title?: string;
  readonly children?: ReactNode;
  /**
   * When `true`, the dot is purely decorative — it is hidden from the
   * accessibility tree (no role, `aria-hidden`). Use when the dot is
   * already next to a textual label describing the same status.
   * Default: `false`.
   */
  readonly presentational?: boolean;
}

/**
 * Single coloured pastille for a presence status. Headless: no chrome,
 * no animation — apps style via `className` or by selecting on the
 * `data-status` attribute.
 */
export function PresenceDot({
  status,
  size = 10,
  bordered = true,
  colorMap,
  variant = 'inline',
  labels,
  className,
  title,
  children,
  presentational = false,
}: Readonly<PresenceDotProps>) {
  const color = colorMap?.[status] ?? DEFAULT_PRESENCE_COLORS[status];
  const statusLabel = labels?.statusLabel ?? DEFAULT_LABELS.statusLabel;
  const accessibleLabel = title ?? statusLabel(status);

  const style: CSSProperties = {
    display: 'inline-block',
    width: size,
    height: size,
    borderRadius: '50%',
    backgroundColor: color,
    boxShadow: bordered ? '0 0 0 2px var(--granit-presence-ring, white)' : undefined,
    ...(variant === 'overlay'
      ? {
          position: 'absolute',
          right: 0,
          bottom: 0,
          pointerEvents: 'none',
        }
      : null),
  };

  return (
    <span
      {...(presentational
        ? { 'aria-hidden': true }
        : { role: 'status', 'aria-label': accessibleLabel })}
      data-granit-presence-dot=""
      data-status={status}
      data-variant={variant}
      className={className}
      style={style}
      title={presentational ? undefined : accessibleLabel}
    >
      {children}
    </span>
  );
}
