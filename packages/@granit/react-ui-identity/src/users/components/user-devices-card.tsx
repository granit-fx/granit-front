import { useUserDevices } from '@granit/react-identity';

import { DevicesCard } from '../../components/devices-card';
import { useDevicesCardLabels } from '../../components/use-devices-card-labels';

import type { UserId } from '@granit/types';

interface UserDevicesCardProps {
  userId: UserId;
}

/**
 * Admin view of the devices another user has signed in from. Thin wrapper over
 * the shared {@link DevicesCard}, wired to the permission-gated provider
 * endpoint.
 */
export function UserDevicesCard({ userId }: Readonly<UserDevicesCardProps>) {
  const { data: devices, isLoading } = useUserDevices(userId);
  const labels = useDevicesCardLabels('admin');

  return (
    <DevicesCard
      data-slot="user-devices-card"
      devices={devices}
      isLoading={isLoading}
      labels={labels}
    />
  );
}
