import { composeDeviceLabel } from '@granit/identity';
import { useDateFormatter } from '@granit/react-localization';
import { Card, CardContent, CardHeader, CardTitle, Skeleton } from '@granit/react-ui';
import { Laptop, MapPin, Smartphone } from 'lucide-react';

import { useDeviceLabelStrings } from './use-device-label-strings';

import type { DeviceKind, UserDeviceResponse } from '@granit/identity';

/** Kinds rendered with a handheld icon; everything else gets the laptop icon. */
const HANDHELD_KINDS: ReadonlySet<DeviceKind> = new Set(['MobileApp', 'Wearable']);

/**
 * Labels for {@link DevicesCard}. The self-service and admin device cards pass
 * their own translated strings; only the title and the session-count wording
 * (pluralized) differ between contexts.
 */
export interface DevicesCardLabels {
  readonly title: string;
  readonly empty: string;
  /** Prefix for the last-seen date (e.g. "Last activity"), shared with the sessions card. */
  readonly lastActivity: string;
  /** Pluralized "{{count}} sessions" label for a device. */
  readonly sessionCount: (count: number) => string;
}

export interface DevicesCardProps {
  readonly devices: readonly UserDeviceResponse[] | undefined;
  readonly isLoading: boolean;
  readonly labels: DevicesCardLabels;
  readonly 'data-slot'?: string;
}

/** Compose "City, Country" from a device's last location, or null when unresolved. */
function locationLabel(device: UserDeviceResponse): string | null {
  const loc = device.lastLocation;
  if (!loc) return null;
  return [loc.city, loc.country].filter(Boolean).join(', ') || null;
}

/**
 * Presentational list of the devices a user has signed in from, grouped by
 * device (with a session count) rather than per session. Shared by the
 * self-service ("my devices") and admin ("device activity") cards — data
 * fetching is the caller's responsibility.
 */
export function DevicesCard({
  devices,
  isLoading,
  labels,
  'data-slot': dataSlot = 'devices-card',
}: Readonly<DevicesCardProps>) {
  const { formatDateTime, formatTimeAgo } = useDateFormatter();
  const deviceLabels = useDeviceLabelStrings();

  return (
    <Card data-slot={dataSlot}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Laptop className="h-4 w-4" />
          {labels.title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading && (
          <div className="space-y-2">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </div>
        )}
        {!isLoading && (!devices || devices.length === 0) && (
          <p className="text-sm text-muted-foreground">{labels.empty}</p>
        )}
        {!isLoading && devices && devices.length > 0 && (
          <ul className="divide-y divide-border">
            {devices.map((device) => {
              const location = locationLabel(device);
              const DeviceIcon = HANDHELD_KINDS.has(device.kind) ? Smartphone : Laptop;
              return (
                <li key={device.deviceId} className="flex flex-col gap-1 py-3 first:pt-0 last:pb-0">
                  <div className="flex min-w-0 items-center gap-2">
                    <DeviceIcon className="h-3.5 w-3.5 shrink-0 text-muted-foreground/70" />
                    <span className="truncate text-sm font-medium text-foreground">
                      {composeDeviceLabel(device, deviceLabels)}
                    </span>
                  </div>
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 pl-5 text-xs text-muted-foreground/70">
                    <span>{labels.sessionCount(device.sessionCount)}</span>
                    {device.lastSeen && (
                      <span title={formatDateTime(device.lastSeen)}>
                        {labels.lastActivity}: {formatTimeAgo(device.lastSeen)}
                      </span>
                    )}
                    {location && (
                      <span className="flex items-center gap-1">
                        <MapPin className="h-3 w-3" />
                        {location}
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
