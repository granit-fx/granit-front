# @granit/react-ui-notifications

Admin UI for the **Notifications** module — the inbox page and preferences page,
a header notification **bell** (unread badge + preview popover), the full
**inbox**, the **preferences panel** (per-type / per-channel opt-in), a
**web-push** subscription manager, a real-time **toast handler**, and the
**notification-view rendering registry** (presentation keyed by
`notificationTypeName`).

The **visual** layer for notifications: it composes the headless
[`@granit/react-notifications`](../react-notifications) (data hooks + provider +
the resolve/registry API) with the foundation UI packages
([`@granit/react-ui`](../react-ui)). The activity notification view bridges
[`@granit/react-activities`](../react-activities), which owns the activity
navigation contract.

## Usage

```tsx
import {
  NotificationListPage,
  NotificationPreferencesPage,
  NotificationBell,
  NotificationToastHandler,
  registerNotificationView,
  notificationsTranslationsEn,
} from '@granit/react-ui-notifications';

i18n.addResourceBundle('en', 'translation', notificationsTranslationsEn, true, true);

// The host wraps the tree in the headless NotificationProvider (resolves the
// Axios client from the GranitClientProvider it sits under).
<NotificationProvider config={{ apiClient, basePath: '/api/v1' }}>
  <NotificationBell />
  <NotificationToastHandler />
  <Route path="/notifications" element={<NotificationListPage />} />
  <Route path="/notifications/preferences" element={<NotificationPreferencesPage />} />
</NotificationProvider>;
```

## Injection

- **API client** — the headless `NotificationProvider` (host-mounted) resolves the
  Axios client from a `GranitClientProvider`. The `PushNotificationManager` falls
  back to the same provider for its client; the VAPID public key is passed as a
  prop (the host reads it from its env).
- **i18n** — ships its `Notifications.*` strings (`notificationsTranslationsEn/Fr`);
  the host registers them. `Common.*` and `Components.Notifications.Preferences.*`
  keys are app-global.
- **Rendering registry** — `registerNotificationView` populates the
  presentation registry; the built-in views (test notification + activity
  notifications) self-register on import of the rendering barrel.
