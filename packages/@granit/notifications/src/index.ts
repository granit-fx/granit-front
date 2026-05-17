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
  listNotifications,
  getUnreadCount,
  markAllAsRead,
  markAsRead,
  getEntityActivityFeed,
  getPreferences,
  updatePreference,
} from './api/notification-api.js';
export { NotificationPermissions } from './permissions.js';
