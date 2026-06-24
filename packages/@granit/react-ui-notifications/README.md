# @granit/react-ui-notifications

Admin **UI feature kit** for the Granit **Notifications** module — the inbox page
and preferences page, a header notification **bell** (unread badge + preview
popover), the full **inbox**, the **preferences panel** (per-type / per-channel
opt-in), a **web-push** subscription manager, a real-time **toast handler**, and
the **notification-view rendering registry** (presentation keyed by
`notificationTypeName`).

This is the **react-ui** layer: it holds the rendering and composes the headless
[`@granit/react-notifications`](../react-notifications) (data hooks + provider +
the resolve/registry API) with the foundation UI packages
([`@granit/react-ui`](../react-ui)). The split over the same .NET
`Granit.Notifications` backend (contract: `contracts/openapi/notifications.json`)
is:

- [`@granit/notifications`](../notifications) — framework-agnostic core: DTOs +
  Axios calls (`updatePreference`, severity/channel/state enums, `UserNotification`).
- [`@granit/react-notifications`](../react-notifications) — React Query hooks,
  `NotificationProvider`, and the headless rendering registry this kit re-exports.
- `@granit/react-ui-notifications` (this package) — the admin pages and components.

Transports plug in below the headless layer:
[`@granit/react-notifications-web-push`](../react-notifications-web-push) (the
`WebPushProvider` / `useWebPush` the push manager wraps), plus
[`@granit/notifications-sse`](../notifications-sse) /
[`@granit/notifications-signalr`](../notifications-signalr) for real-time
delivery. The activity notification view bridges
[`@granit/react-activities`](../react-activities), which owns the activity
navigation contract.

## Install

Workspace-internal — consumed via the `@granit/*` Vite/Vitest aliases, not
published for app consumption through a public registry. A consumer must declare
these peers:

- `@granit/react-notifications` — headless data hooks, `NotificationProvider`,
  and the rendering registry this kit composes.
- `@granit/notifications` — core DTOs (`NotificationSeverity`, `NotificationChannel`,
  `NotificationDefinition`, `UserNotification`) and the `updatePreference` call.
- `@granit/react-notifications-web-push` — `WebPushProvider` / `useWebPush` behind
  the push manager.
- `@granit/react-activities` — activity-notification navigation contract bridged by
  the built-in activity view.
- `@granit/react-api-client` — supplies the `AxiosInstance` the headless provider
  resolves (CSRF, auth, tenant interceptors).
- `@granit/react-localization` — `useTranslation` / `useDateFormatter`.
- `@granit/react-ui` — foundation components (`Card`, `Popover`, `Badge`, `toast`, …).
- `@granit/utils` — `cn` class merge helper.
- `react` (`^19`), `react-dom` (`^19`), `react-router-dom` (`^7`) — routing of
  internal notification actions and page wiring.
- `lucide-react` (`^1.21`) — icons.
- `zod` (`^4`) — payload validation in the built-in test-notification view.

## Quick start

The host wraps the tree in the headless `NotificationProvider` (which resolves the
Axios client from the surrounding `GranitClientProvider`), registers the i18n
bundle, then mounts the bell, the toast handler, and the page routes. Importing any
rendering symbol self-registers the built-in views (test notification + activity
notifications) as a side effect.

```tsx
import { NotificationProvider } from '@granit/react-notifications';
import {
  NotificationListPage,
  NotificationPreferencesPage,
  NotificationBell,
  NotificationToastHandler,
  notificationsTranslationsEn,
} from '@granit/react-ui-notifications';
import { Route, Routes } from 'react-router-dom';

i18n.addResourceBundle('en', 'translation', notificationsTranslationsEn, true, true);

function NotificationsArea() {
  return (
    <NotificationProvider config={{ apiClient, basePath: '/api/v1' }}>
      <NotificationBell />
      <NotificationToastHandler />
      <Routes>
        <Route path="/notifications" element={<NotificationListPage />} />
        <Route
          path="/notifications/preferences"
          // VAPID key is optional — web push stays opt-in per deployment.
          element={
            <NotificationPreferencesPage vapidPublicKey={import.meta.env.VITE_VAPID_PUBLIC_KEY} />
          }
        />
      </Routes>
    </NotificationProvider>
  );
}
```

To render a custom notification type, register a view before anything is rendered.
The view turns the raw `data` payload into a `NotificationPresentation`; the kit
draws the chrome uniformly across the bell, inbox, and toasts.

```tsx
import { registerNotificationView } from '@granit/react-ui-notifications';
import { FileText } from 'lucide-react';

registerNotificationView<{ title: string; documentId: string }>({
  code: 'Documents.Shared',
  parse: (data) =>
    data && typeof (data as { title?: unknown }).title === 'string'
      ? (data as { title: string; documentId: string })
      : null,
  present: (data, _notification, ctx) => ({
    title: data.title,
    icon: FileText,
    action: { label: ctx.t('Documents.View', { defaultValue: 'Open' }), to: `/documents/${data.documentId}` },
  }),
});
```

## Public API

| Symbol                             | Kind      | Purpose                                                            |
| ---------------------------------- | --------- | ------------------------------------------------------------------ |
| `NotificationListPage`             | component | Inbox page (title/subtitle + `NotificationInbox`)                  |
| `NotificationPreferencesPage`      | component | Preferences page (panel + web-push manager); accepts the VAPID key |
| `NotificationBell`                 | component | Header bell: unread badge + preview popover, mark-read on click    |
| `NotificationInbox`                | component | Paginated inbox list with per-row mark-read and load-more          |
| `NotificationAction`               | component | Action link — internal route vs. external new-tab anchor           |
| `NotificationPreferencesPanel`     | component | Per-type / per-channel opt-in table (`InApp`/`Email`/`Push`)       |
| `NotificationToastHandler`         | component | Headless: real-time notifications as severity-mapped toasts        |
| `PushNotificationManager`          | component | Web-push subscribe/unsubscribe; nothing without a VAPID key        |
| `resolveNotificationPresentation`  | fn        | Resolve a notification to its presentation (headless re-export)    |
| `registerNotificationView`         | fn        | Register a per-type renderer (headless re-export)                  |
| `getNotificationView`              | fn        | Look up a registered view by code (headless re-export)             |
| `presentDefault`                   | fn        | Fallback presentation when no view matches (headless re-export)    |
| `BELL_PREVIEW_SIZE`                | const     | `5` — notifications shown in the bell dropdown                     |
| `INBOX_PAGE_SIZE`                  | const     | `20` — notifications per inbox page                                |
| `UNREAD_POLL_INTERVAL`             | const     | `60_000` ms — unread-count polling fallback                        |
| `SHOWCASE_TEST_NOTIFICATION`       | const     | `'Showcase.TestNotification'` code of the built-in test view       |
| `notificationsTranslationsEn`      | const     | English i18next bundle (flat keys, `translation` ns)               |
| `notificationsTranslationsFr`      | const     | French i18next bundle                                              |
| `NotificationView`                 | type      | A registered renderer (`code` + `parse` + `present`)               |
| `NotificationPresentation`         | type      | Normalized rendering descriptor (title, body, icon, action, …)     |
| `NotificationPresentContext`       | type      | Ambient render context (`{ t }`)                                   |
| `NotificationActionLink`           | type      | `{ label, to }` click-through link                                 |
| `PresentableNotification`          | type      | View input subset shared by REST + real-time shapes                |
| `TranslateFn`                      | type      | Structural translate function the views rely on                    |
| `NotificationActionProps`          | type      | `NotificationAction` props                                         |
| `PushNotificationManagerProps`     | type      | `{ vapidPublicKey?, serviceWorkerPath? }`                          |
| `NotificationPreferencesPageProps` | type      | Alias of `PushNotificationManagerProps`                            |
| `NotificationsTranslations`        | type      | Shape of the i18next bundle                                        |

The four rendering functions and the six rendering types
(`NotificationView`, `NotificationPresentation`, `NotificationPresentContext`,
`NotificationActionLink`, `PresentableNotification`, `TranslateFn`) are re-exports
from [`@granit/react-notifications`](../react-notifications), surfaced here so the
host has a single entry point — importing the barrel also runs the side-effect
registration of the built-in views.

## Injection

- **API client** — the headless `NotificationProvider` (host-mounted) resolves the
  Axios client from a `GranitClientProvider`. The `PushNotificationManager` falls
  back to the same provider for its client; the VAPID public key is passed as a
  prop (the host reads it from its env).
- **i18n** — ships its `Notifications.*` strings (`notificationsTranslationsEn/Fr`);
  the host registers them. `Common.*` and `Components.Notifications.Preferences.*`
  keys are app-global, and the activity view reads from the `activities:` namespace
  owned by [`@granit/react-activities`](../react-activities).
- **Rendering registry** — `registerNotificationView` populates the presentation
  registry; the built-in views (test notification + activity notifications)
  self-register on import of the rendering barrel.

## Out of scope / caveats

- **Web push is opt-in per deployment.** `PushNotificationManager` renders nothing
  without a `vapidPublicKey`, and `PushNotificationManagerInner` further renders
  nothing when the browser lacks push support. The service worker defaults to
  `/sw-push.js`; the host must serve it.
- **Internal routes are derived, never wire-supplied.** A view builds an action's
  `to` from the notification's semantic fields; the backend never emits frontend
  routes. `NotificationAction` opens absolute `http(s)://` targets in a new tab
  with `rel="noopener noreferrer"` and routes everything else via React Router.
- **Data + transport live below this kit.** DTOs and Axios calls are
  [`@granit/notifications`](../notifications); hooks, the provider, and the
  registry are [`@granit/react-notifications`](../react-notifications); real-time
  delivery is the SSE / SignalR / web-push transport packages. This package only
  renders.
- **Preference opt-out respects backend gating.** The preferences panel only lists
  definitions with `allowUserOptOut`; rows without a stored preference fall back to
  each definition's `defaultChannels`. Toggling a yet-unsaved row upserts it via
  `updatePreference`.

## License

Apache-2.0
