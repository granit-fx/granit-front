// @granit/react-ui-notifications — i18next resource bundle (flat keys, "translation" ns).
// Register in the host app:
//   import { notificationsTranslationsEn } from "@granit/react-ui-notifications";
//   i18n.addResourceBundle("en", "translation", notificationsTranslationsEn, true, true);

export const notificationsTranslationsEn = {
  'Notifications.Channels.Email': 'Email',
  'Notifications.Channels.InApp': 'In-app',
  'Notifications.Channels.Push': 'Push',
  'Notifications.DisablePush': 'Disable push notifications',
  'Notifications.EnablePush': 'Enable push notifications',
  'Notifications.Inbox': 'Inbox',
  'Notifications.LoadMore': 'Load more',
  'Notifications.MarkAllRead': 'Mark all as read',
  'Notifications.MarkRead': 'Mark as read',
  'Notifications.NewNotification': 'New notification',
  'Notifications.NoNotifications': 'No notifications',
  'Notifications.NoNotificationsDescription': "You're all caught up!",
  'Notifications.NoTypesAvailable': 'No notification types are available.',
  'Notifications.OpenLink': 'Open',
  'Notifications.Preferences': 'Preferences',
  'Notifications.PreferencesDescription': 'Choose how you want to be notified',
  'Notifications.PreferencesSubtitle': 'Manage notification preferences',
  'Notifications.PushDenied': 'Push notifications denied by browser',
  'Notifications.Saving': 'Saving...',
  'Notifications.Severity.Error': 'Error',
  'Notifications.Severity.Fatal': 'Fatal',
  'Notifications.Severity.Info': 'Info',
  'Notifications.Severity.Success': 'Success',
  'Notifications.Severity.Warning': 'Warning',
  'Notifications.Subtitle': 'Manage your notifications and preferences',
  'Notifications.Title': 'Notifications',
  'Notifications.ViewAll': 'View all notifications',
  'Notifications.WebPush': 'Web Push',
  'Notifications.WebPushDescription': 'Receive browser push notifications',
} as const;

export type NotificationsTranslations = typeof notificationsTranslationsEn;
