import { composeDeviceLabel } from '@granit/identity';
import { isHandheldUserAgent, parseUserAgent } from '@granit/identity';
import { useDateFormatter } from '@granit/react-localization';
import { Badge, Card, CardContent, CardHeader, CardTitle, Skeleton } from '@granit/react-ui';
import { cn } from '@granit/utils';
import {
  Cpu,
  Laptop,
  type LucideIcon,
  LogOut,
  MapPin,
  Monitor,
  Smartphone,
  Terminal,
  Tv,
  Watch,
} from 'lucide-react';
import { useEffect, useState } from 'react';

import { RiskButton } from './risk-button';
import { SessionRiskIndicator } from './session-risk-indicator';
import { useDeviceLabelStrings } from './use-device-label-strings';
import { useRiskLabelStrings } from './use-risk-label-strings';

import type { DeviceKind, GeoLocation, UserSessionId, UserSessionResponse } from '@granit/identity';

/**
 * A session renders with a green "active" dot when it's the current session or
 * was last seen within this window; otherwise it gets a grey "stale" dot —
 * mirroring GitHub's session list. Tune here if the product wants a tighter or
 * looser notion of "active".
 */
const ACTIVE_WITHIN_MS = 15 * 60 * 1000;

/** Lucide icon per device kind, used as the per-session glyph. */
const KIND_ICON: Record<DeviceKind, LucideIcon> = {
  Unknown: Monitor,
  Browser: Laptop,
  BrowserExtension: Laptop,
  MobileApp: Smartphone,
  DesktopApp: Laptop,
  Wearable: Watch,
  Tv: Tv,
  Embedded: Cpu,
  ApiClient: Terminal,
};

/** Pick the per-session icon: a mobile OS always reads as a phone. */
function deviceIcon(parsed: ReturnType<typeof parseUserAgent>): LucideIcon {
  if (!parsed) return Monitor;
  if (isHandheldUserAgent(parsed)) return Smartphone;
  return KIND_ICON[parsed.kind];
}

/**
 * Labels for {@link SessionsCard}. Each context (self-service "my sessions" vs
 * admin "another user's sessions") passes its own translated strings — the
 * rendering is shared because both consume the canonical `UserSessionResponse`.
 */
export interface SessionsCardLabels {
  readonly title: string;
  readonly empty: string;
  readonly current: string;
  readonly createdAt: string;
  readonly lastAccess: string;
  readonly unknownDevice: string;
  /** Prefix for the IP address row (e.g. "IP address"). */
  readonly ipAddress: string;
  /** Status-dot accessible label for a recently-active session (green dot). */
  readonly active: string;
  /** Status-dot accessible label for an idle/stale session (grey dot). */
  readonly inactive: string;
  /** Per-row revoke action (aria-label). */
  readonly revoke: string;
  /** Header "revoke all others" button. Omit to hide the button entirely. */
  readonly revokeAll?: string;
}

export interface SessionsCardProps {
  readonly sessions: readonly UserSessionResponse[] | undefined;
  readonly isLoading: boolean;
  readonly labels: SessionsCardLabels;
  readonly onRevoke: (sessionId: UserSessionId) => void;
  readonly onRevokeAll?: () => void;
  readonly isRevoking?: boolean;
  readonly isRevokingAll?: boolean;
  /**
   * Whether the current session may be revoked. `false` in self-service (the
   * caller can't revoke the session they're using — log out instead).
   */
  readonly allowRevokeCurrent?: boolean;
  readonly 'data-slot'?: string;
}

/** Compose "City, Country" from a session's geolocation, or null when unresolved. */
function locationLabel(location: GeoLocation | null): string | null {
  if (!location) return null;
  return [location.city, location.country].filter(Boolean).join(', ') || null;
}

/**
 * Presentational list of sessions, shared by the self-service and admin
 * session cards. Data fetching, revoke semantics and permission gating are the
 * caller's responsibility — this component only renders rows and emits intents.
 *
 * The raw `userAgent` is parsed into a friendly "Chrome on Windows" label (the
 * full string stays as a tooltip); timestamps render relative with the absolute
 * value on hover.
 */
export function SessionsCard({
  sessions,
  isLoading,
  labels,
  onRevoke,
  onRevokeAll,
  isRevoking = false,
  isRevokingAll = false,
  allowRevokeCurrent = false,
  'data-slot': dataSlot = 'sessions-card',
}: Readonly<SessionsCardProps>) {
  const { formatDateTime, formatTimeAgo } = useDateFormatter();
  const deviceLabels = useDeviceLabelStrings();
  const riskLabels = useRiskLabelStrings();

  const hasOtherSessions = (sessions ?? []).some((s) => !s.isCurrent);
  const showRevokeAll = labels.revokeAll !== undefined && onRevokeAll !== undefined;

  // "Active" is relative to the wall clock, so read it in an effect (pure render)
  // and re-tick each minute to let dots go stale while the page stays open.
  const [now, setNow] = useState(0);
  useEffect(() => {
    const tick = () => setNow(Date.now());
    tick();
    const id = setInterval(tick, 60_000);
    return () => clearInterval(id);
  }, []);

  return (
    <Card data-slot={dataSlot}>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2">
          <Monitor className="h-4 w-4" />
          {labels.title}
        </CardTitle>
        {showRevokeAll && hasOtherSessions && (
          <RiskButton size="sm" onClick={onRevokeAll} disabled={isRevokingAll}>
            <LogOut className="mr-2 h-3 w-3" />
            {labels.revokeAll}
          </RiskButton>
        )}
      </CardHeader>
      <CardContent>
        {isLoading && (
          <div className="space-y-2">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </div>
        )}
        {!isLoading && (!sessions || sessions.length === 0) && (
          <p className="text-sm text-muted-foreground">{labels.empty}</p>
        )}
        {!isLoading && sessions && sessions.length > 0 && (
          <ul className="divide-y divide-border">
            {sessions.map((session) => {
              const revokeDisabled = isRevoking || (session.isCurrent && !allowRevokeCurrent);
              const parsed = parseUserAgent(session.userAgent);
              const deviceName = parsed ? composeDeviceLabel(parsed, deviceLabels) : null;
              const DeviceIcon = deviceIcon(parsed);
              const lastSeen = session.lastAccessedAt
                ? new Date(session.lastAccessedAt).getTime()
                : null;
              const isActive =
                session.isCurrent ||
                (now > 0 && lastSeen !== null && now - lastSeen <= ACTIVE_WITHIN_MS);
              const statusLabel = isActive ? labels.active : labels.inactive;
              const location = locationLabel(session.location);
              return (
                <li
                  key={session.sessionId}
                  className="flex flex-col gap-1 py-3 first:pt-0 last:pb-0"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex min-w-0 items-center gap-2">
                      <output
                        aria-label={statusLabel}
                        title={statusLabel}
                        className={cn(
                          'block h-2 w-2 shrink-0 rounded-full',
                          isActive ? 'bg-success-500' : 'bg-muted-foreground/40'
                        )}
                      />
                      <DeviceIcon className="h-3.5 w-3.5 shrink-0 text-muted-foreground/70" />
                      <span
                        className="truncate text-sm font-medium text-foreground"
                        title={session.userAgent ?? undefined}
                      >
                        {deviceName ?? labels.unknownDevice}
                      </span>
                      <SessionRiskIndicator
                        level={session.riskLevel}
                        reasons={session.riskReasons}
                        labels={riskLabels}
                      />
                    </div>
                    <div className="flex shrink-0 items-center gap-2">
                      {session.isCurrent && (
                        <Badge variant="outline" className="text-xs">
                          {labels.current}
                        </Badge>
                      )}
                      <RiskButton
                        size="sm"
                        onClick={() => onRevoke(session.sessionId)}
                        disabled={revokeDisabled}
                      >
                        {labels.revoke}
                      </RiskButton>
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 pl-5 text-xs text-muted-foreground/70">
                    <span title={formatDateTime(session.createdAt)}>
                      {labels.createdAt}: {formatTimeAgo(session.createdAt)}
                    </span>
                    {session.lastAccessedAt && (
                      <span title={formatDateTime(session.lastAccessedAt)}>
                        {labels.lastAccess}: {formatTimeAgo(session.lastAccessedAt)}
                      </span>
                    )}
                    {location && (
                      <span className="flex items-center gap-1">
                        <MapPin className="h-3 w-3" />
                        {location}
                      </span>
                    )}
                    {session.ipAddress && (
                      <span className="font-mono">
                        {labels.ipAddress}: {session.ipAddress}
                      </span>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
