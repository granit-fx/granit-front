import { useMyUserDevices } from '@granit/react-identity';
import { DevicesCard, useDevicesCardLabels } from '@granit/react-ui-identity';

interface MyDevicesCardProps {
  /**
   * Whether the host tracks server-side sessions/devices for this caller. Only
   * meaningful behind a cookie/BFF (or mock) session, so the host computes this
   * (`isBffMode || isMockMode`) and the card hides itself when it is false — the
   * package stays auth-pattern-agnostic.
   */
  readonly sessionTrackingEnabled: boolean;
}

/**
 * The caller's own devices, grouped with a session count — the self-service
 * counterpart to the admin `UserDevicesCard`. Backed by the canonical
 * `/devices` endpoint via `@granit/react-identity`; only meaningful when a
 * cookie/BFF session exists, so it's hidden when session tracking is off.
 */
export function MyDevicesCard({ sessionTrackingEnabled }: MyDevicesCardProps) {
  if (!sessionTrackingEnabled) return null;
  return <MyDevicesCardContent />;
}

function MyDevicesCardContent() {
  const { data: devices, isLoading } = useMyUserDevices();
  const labels = useDevicesCardLabels('self');

  return (
    <DevicesCard
      data-slot="my-devices-card"
      devices={devices}
      isLoading={isLoading}
      labels={labels}
    />
  );
}
