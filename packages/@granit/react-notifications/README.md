# @granit/react-notifications

React hooks + provider + notification-view rendering layer for the Granit
**notifications** module — the in-app inbox, unread badge, per-entity activity
feed, preferences, type subscriptions, entity follows, and a pluggable per-type
rendering registry. This is the **React hooks layer**: it wraps the
framework-agnostic Axios calls and DTOs from
[`@granit/notifications`](../notifications) in TanStack Query hooks and a shared
`NotificationProvider`, and adds the headless rendering primitives that turn a
raw notification payload into a uniform presentation descriptor. It ships no
chrome — bell, inbox page, preferences panel, and toasts live one layer up.

The split is three packages over the same .NET `Granit.Notifications` backend
(contract: `contracts/openapi/notifications.json`):

- [`@granit/notifications`](../notifications) — framework-agnostic core: DTOs,
  Axios functions (`listNotifications`, `getUnreadCount`, `getPreferences`, …),
  `NotificationPermissions`, and the `NotificationTransport` contract.
- `@granit/react-notifications` (this package) — React Query hooks, provider, and
  the notification-view rendering registry.
- [`@granit/react-ui-notifications`](../react-ui-notifications) — admin UI kit:
  inbox page, notification bell, preferences panel, web-push manager, and the
  real-time toast handler.

Real-time delivery is transport-agnostic. The provider accepts an optional
`NotificationTransport` (the contract lives in core); concrete adapters ship
separately — [`@granit/notifications-signalr`](../notifications-signalr) and
[`@granit/notifications-sse`](../notifications-sse) — and when none is supplied
the hooks degrade to REST polling. Push channels are their own packages
([`@granit/react-notifications-web-push`](../react-notifications-web-push),
[`@granit/react-notifications-mobile-push`](../react-notifications-mobile-push)).

## Install

Workspace-internal — consumed via the `@granit/*` Vite/Vitest aliases, not
published for app consumption through a public registry. A consumer must declare
these peers:

- `@granit/notifications` — core DTOs + Axios calls this layer wraps, plus the
  `NotificationConfig` and `NotificationTransport` contracts.
- `@granit/api-client` — supplies the `AxiosInstance` (CSRF, auth, tenant
  interceptors) carried in `config.apiClient`.
- `@granit/query-engine` + `@granit/react-query-engine` — `useInfiniteScroll`
  load-more wiring behind the inbox and activity-feed hooks, and the query
  metadata used by the testing handlers.
- `@granit/logger` — `createLogger` for the package's structured logging.
- `@granit/types` — shared base types (`toISODateString`, branded ids).
- `@tanstack/react-query` (`^5`) and `react` (`^19`).
- `msw` (`^2.12`, **optional**) — only for the
  `@granit/react-notifications/testing` subpath.

## Quick start

Wire the provider once (it resolves the Axios client / base path and, optionally,
a real-time transport), then call the hooks anywhere below it.

```tsx
import { NotificationProvider } from '@granit/react-notifications';
import { useGranitClient } from '@granit/react-api-client';
import { createSseTransport } from '@granit/notifications-sse';

function App({ children }: { children: React.ReactNode }) {
  const apiClient = useGranitClient();
  return (
    <NotificationProvider
      config={{ apiClient }}
      transport={createSseTransport({ streamUrl: '/api/v1/notifications/stream' })}
    >
      {children}
    </NotificationProvider>
  );
}
```

`useUnreadCount()` keeps the badge in sync three ways: transport push increments
it on arrival, polling (default 60 s) reconciles it, and `refresh()` forces a
re-fetch. The inbox uses `useNotifications()` for load-more pagination with
optimistic mark-read.

```tsx
import { useNotifications, useUnreadCount } from '@granit/react-notifications';

function Bell() {
  const { count } = useUnreadCount();
  return <span aria-label={`${count} unread`}>{count}</span>;
}

function Inbox() {
  const { notifications, hasMore, loadMore, markRead, markAllRead } = useNotifications();
  return (
    <>
      <button type="button" onClick={() => void markAllRead()}>
        Mark all read
      </button>
      <ul>
        {notifications.map((n) => (
          <li key={n.id} onClick={() => void markRead(n.id)}>
            {n.notificationTypeName}
          </li>
        ))}
      </ul>
      {hasMore && <button type="button" onClick={loadMore}>Load more</button>}
    </>
  );
}
```

Each notification type can register a **view** that turns its opaque `data`
payload into a uniform `NotificationPresentation` (title, body, icon, severity,
action link). Resolution falls back to a default view when no view matches or the
payload fails validation, so a malformed payload never crashes the inbox.

```tsx
import {
  registerNotificationView,
  resolveNotificationPresentation,
} from '@granit/react-notifications';

registerNotificationView<{ partyName: string; partyId: string }>({
  code: 'Party.Merged',
  parse: (data) =>
    typeof (data as { partyName?: unknown }).partyName === 'string'
      ? (data as { partyName: string; partyId: string })
      : null,
  present: (data, _notification, { t }) => ({
    title: t('notifications.party.merged', { name: data.partyName }),
    action: { label: t('common.view'), to: `/parties/${data.partyId}` },
  }),
});

// In a row component:
const presentation = resolveNotificationPresentation(notification, { t });
```

## Public API

| Symbol                               | Kind     | Purpose                                                          |
| ------------------------------------ | -------- | ---------------------------------------------------------------- |
| `NotificationProvider`               | provider | Supplies config + optional transport; tracks connection / unread |
| `useNotificationConfig`              | hook     | Read the context value (config, connection state, last message)  |
| `useNotifications`                   | hook     | Paginated inbox, optimistic `markRead` / `markAllRead`           |
| `useUnreadCount`                     | hook     | Live unread count (push + polling + manual `refresh`)            |
| `useRealTimeNotifications`           | hook     | Last transport message + `connectionState` for toasts / alerts   |
| `useEntityActivityFeed`              | hook     | Per-entity feed, same load-more shape as the inbox               |
| `useNotificationPreferences`         | hook     | Preference rows (type × channel), optimistic toggle + rollback   |
| `useNotificationTypes`               | hook     | `GET .../notifications/types` — drives the preferences UI        |
| `useNotificationSubscriptions`       | hook     | `GET .../subscriptions` — current user's type subscriptions      |
| `useSubscribeToNotificationType`     | hook     | `POST .../subscriptions/{type}` (idempotent)                     |
| `useUnsubscribeFromNotificationType` | hook     | `DELETE .../subscriptions/{type}` (idempotent)                   |
| `useFollowEntity`                    | hook     | `POST .../entity/{type}/{id}/follow` (idempotent)                |
| `useUnfollowEntity`                  | hook     | `DELETE .../entity/{type}/{id}/follow` (idempotent)              |
| `useEntityFollowers`                 | hook     | `GET .../entity/{type}/{id}/followers`                           |
| `registerNotificationView`           | fn       | Register / replace the view for a `notificationTypeName` code    |
| `getNotificationView`                | fn       | Look up the view registered for a type code, or `undefined`      |
| `resolveNotificationPresentation`    | fn       | Resolve a notification to a presentation (default fallback)      |
| `presentDefault`                     | fn       | The fallback presentation (reads `data.title` / `data.body`)     |
| `NotificationView`                   | type     | A per-type renderer (`code`, `parse`, `present`)                 |
| `NotificationPresentation`           | type     | Normalized render descriptor (title, body, icon, severity)       |
| `NotificationActionLink`             | type     | `{ label, to }` click-through produced by a view                 |
| `PresentableNotification`            | type     | Field subset shared by REST + transport notifications            |
| `NotificationPresentContext`         | type     | Ambient `{ t }` handed to every view                             |
| `TranslateFn`                        | type     | Structural i18n function shape (decoupled from i18next)          |
| `EntityFollowVariables`              | type     | `{ entityType, entityId }` for follow / unfollow mutations       |
| `Use*Options` / `Use*Return`         | type     | Per-hook option and return shapes for the exported hooks         |

## Testing

The `./testing` subpath (requires the optional `msw` peer) ships stateful MSW
handlers and fixtures: `createNotificationsHandlers(baseUrl = '/api/v1')`
(in-memory mutation — mark-read, preference upsert, follow/unfollow are reflected
in later GETs, plus an SSE heartbeat stream and a `/meta` query-metadata route),
the `notificationQueryMetadata` payload, and the `mockNotifications`,
`mockNotificationPreferences`, `mockNotificationDefinitions`, `mockSubscriptions`,
and `mockEntityFollowers` fixtures. Import these rather than hand-rolling DTOs.

## Caveats

- **Frontend routes are the view's job, never the backend's.** A
  `NotificationActionLink.to` must be derived by the view from the notification's
  semantic fields (`relatedEntityType` / `relatedEntityId`, typed `data`). The
  backend never emits frontend routes; relative `to` values are routed in-app and
  absolute `http(s)://` URLs open externally — that resolution is the host's
  concern.
- **Views must validate before they trust `data`.** `NotificationView.parse`
  receives `unknown`; return `null` on any shape it does not recognize so
  resolution degrades to `presentDefault` instead of throwing. A malformed
  payload must never crash the inbox.
- **The view registry is process-wide and last-write-wins.**
  `registerNotificationView` is module-load-time global state keyed by `code`;
  registering the same code twice replaces the earlier view. Register each type
  once at app/feature load.
- **Unread count is eventually consistent.** Polling failures are swallowed
  (last known count is kept) and the push increment is optimistic; treat the
  count as a UX hint, not an authoritative figure.
- **i18n is the caller's job.** Views receive a structural `TranslateFn` via
  `NotificationPresentContext`; this package owns no translation catalog.

## Out of scope

- **Rendering / chrome** — the inbox page, bell, preferences panel, web-push
  manager, and toast handler live in
  [`@granit/react-ui-notifications`](../react-ui-notifications). This package is
  headless apart from the presentation-descriptor primitives.
- **DTOs, HTTP transport, permissions** — owned by
  [`@granit/notifications`](../notifications) (mirror of `Granit.Notifications`);
  hooks here only adapt them to React Query.
- **Real-time transport implementations** — the `NotificationTransport` contract
  is core; concrete adapters are
  [`@granit/notifications-signalr`](../notifications-signalr) and
  [`@granit/notifications-sse`](../notifications-sse).
- **Push channels** — web/mobile push enrollment lives in
  [`@granit/react-notifications-web-push`](../react-notifications-web-push) and
  [`@granit/react-notifications-mobile-push`](../react-notifications-mobile-push).

## License

Apache-2.0
