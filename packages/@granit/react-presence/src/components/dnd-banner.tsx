import type { PresenceResponse } from '@granit/presence';
import type { CSSProperties, ReactNode } from 'react';

export interface DndBannerLabels {
  /** Banner copy when the user is in DoNotDisturb. */
  readonly doNotDisturb?: string;
  /** Banner copy when the user appears Offline. */
  readonly appearOffline?: string;
  /** Label for the "clear override" action button. */
  readonly clearAction?: string;
}

const DEFAULT_LABELS: Required<DndBannerLabels> = {
  doNotDisturb:
    'You are in Do not disturb — real-time notifications (push, SignalR, SSE) are muted.',
  appearOffline:
    'You appear offline — others see you as Offline and real-time notifications are muted.',
  clearAction: 'Clear status',
};

export interface DndBannerProps {
  /** Current presence snapshot. Banner renders nothing when not in DnD/AppearOffline. */
  readonly presence: PresenceResponse | null | undefined;
  /** Click handler for the "clear override" CTA. Hidden when omitted. */
  readonly onClear?: () => void;
  readonly labels?: DndBannerLabels;
  readonly className?: string;
  /** Optional trailing element (e.g. countdown until override expiry). */
  readonly children?: ReactNode;
}

const STYLES: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '0.75rem',
  padding: '0.5rem 0.75rem',
  borderRadius: 6,
  background: '#fef3c7', // amber-100
  color: '#92400e', // amber-800
  fontSize: 14,
};

/**
 * Passive reminder shown when the current user has muted real-time
 * notifications. The backend Granit.Presence.Notifications gate already
 * suppresses delivery — this banner just explains *why* the user no
 * longer sees toasts.
 *
 * Headless: a single inline-styled `<div>` so any app can drop it in
 * without conflicts. Apps that already own a styled banner can ignore
 * this component and write their own using `useMyPresence`.
 */
export function DndBanner({
  presence,
  onClear,
  labels,
  className,
  children,
}: Readonly<DndBannerProps>) {
  if (!presence) return null;
  const override = presence.manualOverride;
  if (override !== 'DoNotDisturb' && override !== 'AppearOffline') return null;

  const merged = { ...DEFAULT_LABELS, ...labels };
  const message = override === 'DoNotDisturb' ? merged.doNotDisturb : merged.appearOffline;

  return (
    <div
      role="status"
      data-granit-presence-dnd-banner=""
      data-override={override}
      className={className}
      style={STYLES}
    >
      <span style={{ flex: 1 }}>{message}</span>
      {children}
      {onClear ? (
        <button
          type="button"
          onClick={onClear}
          data-granit-presence-dnd-clear=""
          style={{
            background: 'transparent',
            border: '1px solid currentColor',
            borderRadius: 4,
            padding: '0.125rem 0.5rem',
            color: 'inherit',
            cursor: 'pointer',
            font: 'inherit',
          }}
        >
          {merged.clearAction}
        </button>
      ) : null}
    </div>
  );
}
