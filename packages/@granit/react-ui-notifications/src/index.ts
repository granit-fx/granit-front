// @granit/react-ui-notifications — admin UI for the Granit.Notifications module.
// Composes the headless @granit/react-notifications (data hooks + provider + the
// presentation registry) with the foundation UI packages. The Axios client
// resolves from the host-mounted NotificationProvider / GranitClientProvider.

// Pages
export { NotificationListPage } from './notification-list-page';
export { NotificationPreferencesPage } from './notification-preferences-page';
export type { NotificationPreferencesPageProps } from './notification-preferences-page';

// Components
export { NotificationBell } from './components/notification-bell';
export { NotificationInbox } from './components/notification-inbox';
export { NotificationAction } from './components/notification-action';
export type { NotificationActionProps } from './components/notification-action';
export { NotificationPreferencesPanel } from './components/notification-preferences-panel';
export { NotificationToastHandler } from './components/notification-toast-handler';
export { PushNotificationManager } from './components/push-notification-manager';
export type { PushNotificationManagerProps } from './components/push-notification-manager';

// Constants
export { BELL_PREVIEW_SIZE, INBOX_PAGE_SIZE, UNREAD_POLL_INTERVAL } from './constants';

// Notification-view rendering registry. Importing this barrel self-registers the
// built-in views (test notification + activity notifications) as a side effect.
export {
  resolveNotificationPresentation,
  registerNotificationView,
  getNotificationView,
  presentDefault,
} from './rendering';
export type {
  NotificationActionLink,
  NotificationPresentation,
  NotificationPresentContext,
  NotificationView,
  PresentableNotification,
  TranslateFn,
} from './rendering';
export { SHOWCASE_TEST_NOTIFICATION } from './rendering/views/test-notification';

// i18next resource bundles (flat keys, "translation" ns)
export { notificationsTranslationsEn, notificationsTranslationsFr } from './locales/index';
export type { NotificationsTranslations } from './locales/index';
