import type { NotificationView } from './types';

/**
 * Process-wide registry mapping `notificationTypeName` → view. Apps and feature
 * packages populate it at load time via {@link registerNotificationView};
 * lookups are idempotent and order-independent.
 */
const registry = new Map<string, NotificationView>();

/** Registers (or replaces) the view for a notification type code. */
export function registerNotificationView<TData>(view: NotificationView<TData>): void {
  registry.set(view.code, view as NotificationView);
}

/** Returns the view registered for a type code, or `undefined` when none exists. */
export function getNotificationView(code: string): NotificationView | undefined {
  return registry.get(code);
}
