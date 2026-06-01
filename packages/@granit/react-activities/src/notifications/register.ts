import { ACTIVITY_NOTIFICATION_RELATED_ENTITY_TYPE, ActivityNotificationTypes } from './types';

import type { ActivityNotificationAction, ActivityNotificationType } from './types';

/**
 * Minimal notification shape this module needs from
 * `@granit/notifications` (`UserNotification` / `NotificationTransportMessage`
 * both satisfy it). Inlined to keep `@granit/notifications` an optional
 * peer — apps without the notifications package can still consume the
 * type registry constants.
 */
export interface ActivityNotificationLike {
  readonly notificationTypeName: string;
  readonly relatedEntityType: string | null;
  readonly relatedEntityId: string | null;
}

/** Returns true when the notification was emitted by `Granit.Activities.Notifications`. */
export function isActivityNotification(
  n: ActivityNotificationLike
): n is ActivityNotificationLike & { notificationTypeName: ActivityNotificationType } {
  return (
    n.notificationTypeName === ActivityNotificationTypes.Assigned ||
    n.notificationTypeName === ActivityNotificationTypes.Reminder ||
    n.notificationTypeName === ActivityNotificationTypes.Overdue
  );
}

/** True when the notification is the `Assigned` variant. */
export function isAssignedActivityNotification(n: ActivityNotificationLike): boolean {
  return n.notificationTypeName === ActivityNotificationTypes.Assigned;
}

/** True when the notification is the `Reminder` variant. */
export function isReminderActivityNotification(n: ActivityNotificationLike): boolean {
  return n.notificationTypeName === ActivityNotificationTypes.Reminder;
}

/** True when the notification is the `Overdue` variant. */
export function isOverdueActivityNotification(n: ActivityNotificationLike): boolean {
  return n.notificationTypeName === ActivityNotificationTypes.Overdue;
}

/**
 * Resolve the canonical click-through action for an activity notification.
 *
 * - `Assigned` → `open-detail` (no scroll)
 * - `Reminder` → `open-detail` (scrolled to the action area)
 * - `Overdue` → `open-overdue-calendar` filtered on the current user
 *
 * Returns `null` when the notification is not an activity notification, or
 * when it lacks the `relatedEntityId` carrying the activity id (defensive —
 * malformed payloads should not crash the click handler).
 *
 * Labels and bodies are **not** owned here: the backend serializes them via
 * the standard localization pipeline. This resolver only owns the
 * navigation contract.
 */
export function resolveActivityNotificationAction(
  n: ActivityNotificationLike
): ActivityNotificationAction | null {
  if (!isActivityNotification(n)) {
    return null;
  }

  if (n.notificationTypeName === ActivityNotificationTypes.Overdue) {
    return { kind: 'open-overdue-calendar', assignee: 'me' };
  }

  if (n.relatedEntityType !== ACTIVITY_NOTIFICATION_RELATED_ENTITY_TYPE) {
    return null;
  }
  if (n.relatedEntityId === null || n.relatedEntityId.length === 0) {
    return null;
  }

  return {
    kind: 'open-detail',
    activityId: n.relatedEntityId,
    scrollToActions: n.notificationTypeName === ActivityNotificationTypes.Reminder,
  };
}
