/** Permission constants for the notifications module. Mirrors `Granit.Notifications.Endpoints.Permissions.NotificationPermissions`. */
export const NotificationPermissions = {
  /** Permissions for user notifications. */
  UserNotifications: {
    /** Grants read-only access to view notifications (inbox, activity feed). */
    Read: 'Notifications.UserNotifications.Read',
    /** Grants management access to notification settings (preferences, subscriptions, push tokens). */
    Manage: 'Notifications.UserNotifications.Manage',
  },
} as const;
