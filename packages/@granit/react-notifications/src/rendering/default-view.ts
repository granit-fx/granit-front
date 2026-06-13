import type { NotificationPresentation, PresentableNotification } from './types';

interface DefaultNotificationData {
  readonly title?: string;
  readonly body?: string;
}

/**
 * Fallback presentation used when no view is registered for a type, or when a
 * view's data validation fails. Reads the conventional `title` / `body` fields
 * and degrades to the type name so a notification is never rendered blank.
 */
export function presentDefault(notification: PresentableNotification): NotificationPresentation {
  const data = (notification.data ?? {}) as DefaultNotificationData;
  const title =
    typeof data.title === 'string' && data.title.length > 0
      ? data.title
      : notification.notificationTypeName;
  return {
    title,
    body: typeof data.body === 'string' ? data.body : undefined,
  };
}
