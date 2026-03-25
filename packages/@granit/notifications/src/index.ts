// Types
export type {
  ActivityFeedEntry,
  ActivityFeedPage,
  ConnectionState,
  NotificationChannel,
  NotificationConfig,
  NotificationPreference,
  NotificationSeverity,
  NotificationTransport,
  NotificationTransportMessage,
  UserNotification,
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
