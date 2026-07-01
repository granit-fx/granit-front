import { useNotificationConfig } from '../providers/notifications-provider';

import type { ConnectionState, NotificationTransportMessage } from '@granit/notifications';

export interface UseRealTimeNotificationsReturn {
  lastMessage: NotificationTransportMessage | null;
  connectionState: ConnectionState;
}

/**
 * Exposes the most recently received real-time transport message and connection
 * state. Useful for triggering toasts or in-app alerts.
 */
export function useRealTimeNotifications(): UseRealTimeNotificationsReturn {
  const { lastMessage, connectionState } = useNotificationConfig();
  return { lastMessage, connectionState };
}
