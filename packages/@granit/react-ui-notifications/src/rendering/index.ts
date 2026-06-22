// Registers the built-in notification views (side effect) so resolution can find
// them. Must be imported before any notification is rendered.
import './register';

// Re-export the rendering API from the headless lib so consumers have a single
// entry point.
export {
  resolveNotificationPresentation,
  registerNotificationView,
  getNotificationView,
  presentDefault,
} from '@granit/react-notifications';
export type {
  NotificationActionLink,
  NotificationPresentation,
  NotificationPresentContext,
  NotificationView,
  PresentableNotification,
  TranslateFn,
} from '@granit/react-notifications';
