// Provider
export {
  NotificationProvider,
  useNotificationConfig,
  useNotificationContext,
} from './providers/notification-provider';

// Hooks
export { useRealTimeNotifications } from './hooks/use-real-time-notifications';
export type { UseRealTimeNotificationsReturn } from './hooks/use-real-time-notifications';

export { useUnreadCount } from './hooks/use-unread-count';
export type { UseUnreadCountOptions, UseUnreadCountReturn } from './hooks/use-unread-count';

export { useNotifications } from './hooks/use-notifications';
export type { UseNotificationsOptions, UseNotificationsReturn } from './hooks/use-notifications';

export { useEntityActivityFeed } from './hooks/use-entity-activity-feed';
export type {
  UseEntityActivityFeedOptions,
  UseEntityActivityFeedReturn,
} from './hooks/use-entity-activity-feed';

export { useNotificationPreferences } from './hooks/use-notification-preferences';
export type { UseNotificationPreferencesReturn } from './hooks/use-notification-preferences';

export {
  useEntityFollowers,
  useFollowEntity,
  useNotificationSubscriptions,
  useNotificationTypes,
  useSubscribeToNotificationType,
  useUnfollowEntity,
  useUnsubscribeFromNotificationType,
} from './hooks/use-notification-subscriptions';
export type { EntityFollowVariables } from './hooks/use-notification-subscriptions';
