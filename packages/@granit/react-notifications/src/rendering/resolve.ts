import { presentDefault } from './default-view';
import { getNotificationView } from './registry';

import type {
  NotificationPresentContext,
  NotificationPresentation,
  PresentableNotification,
} from './types';

/**
 * Resolves the rendering descriptor for a notification: looks up its view by
 * `notificationTypeName`, validates the payload, and falls back to the default
 * view when no view matches or validation fails (defensive — a malformed
 * payload must never crash the inbox).
 */
export function resolveNotificationPresentation(
  notification: PresentableNotification,
  ctx: NotificationPresentContext
): NotificationPresentation {
  const view = getNotificationView(notification.notificationTypeName);
  if (!view) {
    return presentDefault(notification);
  }

  const data = view.parse(notification.data);
  if (data === null) {
    return presentDefault(notification);
  }

  return view.present(data, notification, ctx);
}
