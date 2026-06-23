import { useTranslation } from '@granit/react-localization';

import type { DevicesCardLabels } from './devices-card';

/** Whose devices the card lists: the caller's own (`self`) or another user's (`admin`). */
export type DevicesScope = 'self' | 'admin';

/**
 * Resolve {@link DevicesCardLabels} from the `Users.Devices.*` namespace. The
 * common strings (empty state, session count) are shared; only the title is
 * scope-specific — "My devices" in self-service, "Device activity" for the
 * admin view of another user.
 */
export function useDevicesCardLabels(scope: DevicesScope): DevicesCardLabels {
  const { t } = useTranslation();
  return {
    title: t(scope === 'self' ? 'Users.Devices.MyTitle' : 'Users.Devices.Title'),
    empty: t('Users.Devices.Empty'),
    lastActivity: t('Sessions.LastActivity'),
    sessionCount: (count) => t('Users.Devices.Sessions', { count }),
  };
}
