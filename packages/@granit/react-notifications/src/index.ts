// Provider
export {
  NotificationProvider,
  useNotificationConfig,
  useNotificationContext,
} from './providers/notification-provider.js';

// Hooks
export { useRealTimeNotifications } from './hooks/use-real-time-notifications.js';
export type { UseRealTimeNotificationsReturn } from './hooks/use-real-time-notifications.js';

export { useUnreadCount } from './hooks/use-unread-count.js';
export type { UseUnreadCountOptions, UseUnreadCountReturn } from './hooks/use-unread-count.js';

export { useNotifications } from './hooks/use-notifications.js';
export type { UseNotificationsOptions, UseNotificationsReturn } from './hooks/use-notifications.js';

export { useEntityActivityFeed } from './hooks/use-entity-activity-feed.js';
export type {
  UseEntityActivityFeedOptions,
  UseEntityActivityFeedReturn,
} from './hooks/use-entity-activity-feed.js';

export { useNotificationPreferences } from './hooks/use-notification-preferences.js';
export type { UseNotificationPreferencesReturn } from './hooks/use-notification-preferences.js';

export {
  useEntityFollowers,
  useFollowEntity,
  useNotificationSubscriptions,
  useNotificationTypes,
  useSubscribeToNotificationType,
  useUnfollowEntity,
  useUnsubscribeFromNotificationType,
} from './hooks/use-notification-subscriptions.js';
export type { EntityFollowVariables } from './hooks/use-notification-subscriptions.js';
