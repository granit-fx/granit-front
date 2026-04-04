// Types
export type {
  ActivityFeedEntry,
  ActivityFeedEntryId,
  ActivityFeedPage,
  ConnectionState,
  NotificationChannel,
  NotificationConfig,
  NotificationId,
  NotificationPreference,
  NotificationPreferenceId,
  NotificationSeverity,
  NotificationTransport,
  NotificationTransportMessage,
  UserNotification,
  UserNotificationId,
  UserNotificationPage,
  UserNotificationState,
} from './types/index.js';

export { NotificationChannels } from './types/index.js';

// API (pure TypeScript functions)
export {
  fetchNotifications,
  fetchUnreadCount,
  markAllAsRead,
  markAsRead,
  fetchEntityActivityFeed,
  fetchPreferences,
  updatePreference,
} from './api/notification-api.js';
