/**
 * Wire-aligned notification type names emitted by `Granit.Activities.Notifications`.
 * Apps match these strings against the `notificationTypeName` field of any
 * `UserNotification` / `NotificationTransportMessage` to identify activity
 * notifications. Keep these in sync with the .NET backend.
 */
export const ActivityNotificationTypes = {
  Assigned: 'Activities.Activity.Assigned',
  Reminder: 'Activities.Activity.Reminder',
  Overdue: 'Activities.Activity.Overdue',
} as const;

/** Compile-time union of the three activity notification type names. */
export type ActivityNotificationType =
  (typeof ActivityNotificationTypes)[keyof typeof ActivityNotificationTypes];

/**
 * The wire `relatedEntityType` carried by activity notifications. Apps may
 * receive notifications for many entities; only those carrying this type
 * marker are activity notifications.
 */
export const ACTIVITY_NOTIFICATION_RELATED_ENTITY_TYPE = 'Activity';

/**
 * Canonical click-through action for an activity notification. Apps wire
 * each variant to their own router/UI:
 *
 * - `open-detail` → typically open `<ActivityDetailPanel activityId={…} />`
 *   in a drawer/sheet. `scrollToActions` is set for `Reminder` notifications
 *   so the user lands directly on the action area.
 * - `open-overdue-calendar` → typically navigate to a calendar view filtered
 *   by `assignee=me, status=Overdue`.
 */
export type ActivityNotificationAction =
  | { readonly kind: 'open-detail'; readonly activityId: string; readonly scrollToActions: boolean }
  | { readonly kind: 'open-overdue-calendar'; readonly assignee: 'me' };
