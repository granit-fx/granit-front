// Types
export type {
  ActivityFeedEntry,
  ActivityFeedEntryId,
  ActivityFeedPage,
  ConnectionState,
  NotificationChannel,
  NotificationConfig,
  NotificationDefinition,
  NotificationId,
  NotificationPreference,
  NotificationPreferenceId,
  NotificationSeverity,
  NotificationSubscriptionId,
  NotificationSubscriptionResponse,
  NotificationTransport,
  NotificationTransportMessage,
  UserNotification,
  UserNotificationId,
  UserNotificationPage,
  UserNotificationState,
} from './types/index';

export { NotificationChannels } from './types/index';

// API (pure TypeScript functions)
export {
  followEntity,
  getEntityActivityFeed,
  getPreferences,
  getUnreadCount,
  listEntityFollowers,
  listNotificationTypes,
  listNotifications,
  listSubscriptions,
  markAllAsRead,
  markAsRead,
  subscribeToNotificationType,
  unfollowEntity,
  unsubscribeFromNotificationType,
  updatePreference,
} from './api/notification-api';
export { NotificationPermissions } from './permissions';
