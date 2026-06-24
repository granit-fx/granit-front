# @granit/notifications

Transport-agnostic **notifications** SDK — the framework-level TypeScript
counterpart of the .NET `Granit.Notifications` module. Backed by the
`contracts/openapi/notifications.json` spec, which is authoritative for routes,
HTTP verbs and field names.

This is the framework-agnostic **core** layer: it exposes the DTOs, pure HTTP
functions, permission constants and the real-time `NotificationTransport`
abstraction needed to drive notifications from any client — React, React Native,
a CLI, tests. It holds **no** React, DOM or Node-only dependency, and it is fully
transport-agnostic: SignalR and SSE are pluggable adapters, never hard-wired.
The React hooks/providers layer lives in
[`@granit/react-notifications`](../react-notifications); the admin feature kit
(inbox page, bell, preferences panel, toast handler) lives in
[`@granit/react-ui-notifications`](../react-ui-notifications). Real-time delivery
is supplied by the [`@granit/notifications-signalr`](../notifications-signalr) and
[`@granit/notifications-sse`](../notifications-sse) adapters, which implement
`NotificationTransport`; push channels live in
[`@granit/notifications-web-push`](../notifications-web-push) and
[`@granit/notifications-mobile-push`](../notifications-mobile-push).

The surface covers the inbox (`listNotifications`, `markAsRead`,
`markAllAsRead`, `getUnreadCount`), the per-entity activity feed, user
preferences, type subscriptions (opt-in/opt-out), and entity following
(follow/unfollow + follower listing). The REST response shape (`UserNotification`)
is deliberately distinct from the real-time push shape
(`NotificationTransportMessage`): the inbox is a paged read model, the transport
delivers a lighter event.

## Install

Workspace-internal — consumed via the `@granit/*` Vite/Vitest aliases, not
published to a public registry for app consumption. Declare the peers:

- `@granit/api-client` — supplies the `AxiosInstance` (CSRF, auth, tenant
  interceptors) and `buildApiUrl`; passed into every call.
- `@granit/query-engine` — `PagedResult` / `PaginationParams` for the paged
  inbox and activity feed.
- `@granit/types` — branded `EntityId` / `UserId` / `ISODateString` primitives.

## Quick start

```ts
import {
  listNotifications,
  getUnreadCount,
  markAsRead,
  markAllAsRead,
  getPreferences,
  updatePreference,
  followEntity,
  NotificationPermissions,
} from '@granit/notifications';
import type { AxiosInstance } from '@granit/api-client';

// `basePath` is the API root; the functions append `notifications/...`.
// The React layer defaults it to '/api/v1'.
const basePath = '/api/v1';

declare const client: AxiosInstance;

// 1. Paged inbox + unread badge.
const page = await listNotifications(client, basePath, { page: 1, pageSize: 20 });
const unread = await getUnreadCount(client, basePath); // number

// 2. Mark one or all as read.
await markAsRead(client, basePath, page.items[0]!.id);
await markAllAsRead(client, basePath);

// 3. Per-channel preferences (upsert).
const prefs = await getPreferences(client, basePath);
await updatePreference(client, basePath, {
  notificationTypeName: 'Document.Shared',
  channelName: 'Email',
  isEnabled: false,
});

// 4. Follow an entity to receive its activity in the feed.
await followEntity(client, basePath, 'Document', documentId);

// Gate UI on the backend permission string.
const canManage = NotificationPermissions.UserNotifications.Manage;
```

Real-time delivery is wired separately: a transport adapter implements
`NotificationTransport`, and `createTransportListeners` supplies the shared
listener/state bookkeeping every adapter reuses.

```ts
import {
  createTransportListeners,
  type NotificationTransport,
} from '@granit/notifications';

// Skeleton of a custom transport (real adapters: -signalr / -sse).
function createPollingTransport(): NotificationTransport {
  const listeners = createTransportListeners('disconnected');
  return {
    get state() {
      return listeners.state;
    },
    async connect() {
      listeners.setState('connected');
    },
    async disconnect() {
      listeners.setState('disconnected');
    },
    onNotification: listeners.onNotification,
    onStateChange: listeners.onStateChange,
  };
}
```

## Public API

| Symbol | Kind | Purpose |
| --- | --- | --- |
| `UserNotification` | type | Inbox row (REST read model): severity, state, related entity, `readAt` |
| `UserNotificationPage` | type | `PagedResult<UserNotification>` for inbox / activity feed |
| `UserNotificationState` | type | `'Unread' \| 'Read'` |
| `NotificationSeverity` | type | `'Info' \| 'Success' \| 'Warning' \| 'Error' \| 'Fatal'` |
| `NotificationTransportMessage` | type | Lighter event shape pushed over SignalR/SSE (not the REST row) |
| `NotificationChannel` | type | Extensible channel id (`'InApp' \| 'Email' \| … \| (string & {})`) |
| `NotificationChannels` | const | Well-known channel ids matching the .NET `NotificationChannels` |
| `NotificationDefinition` | type | Notification-type metadata (`GET .../types`): defaults, opt-out flags |
| `NotificationPreferenceResponse` | type | Flat per-type/per-channel preference row |
| `NotificationPreferenceUpdateRequest` | type | Upsert body for `updatePreference` |
| `NotificationSubscriptionResponse` | type | Type subscription or entity-follower entry |
| `NotificationConfig` | type | `{ apiClient, basePath? }` consumed by the React provider |
| `ConnectionState` | type | `'disconnected' \| 'connecting' \| 'connected' \| 'reconnecting'` |
| `NotificationTransport` | type | Real-time transport interface implemented by SignalR/SSE adapters |
| `*Id` (branded ids) | type | `NotificationId`, `UserNotificationId`, `NotificationPreferenceId`, … |
| `listNotifications` | fn | `GET {basePath}/notifications` — paged inbox |
| `markAsRead` | fn | `POST {basePath}/notifications/{id}/read` |
| `markAllAsRead` | fn | `POST {basePath}/notifications/read-all` |
| `getUnreadCount` | fn | `GET {basePath}/notifications/unread/count` → `number` |
| `getEntityActivityFeed` | fn | `GET {basePath}/notifications/entity/{type}/{id}` — paged |
| `getPreferences` | fn | `GET {basePath}/notifications/preferences` |
| `updatePreference` | fn | `PUT {basePath}/notifications/preferences` (upsert) |
| `listNotificationTypes` | fn | `GET {basePath}/notifications/types` |
| `listSubscriptions` | fn | `GET {basePath}/notifications/subscriptions` |
| `subscribeToNotificationType` | fn | `POST .../subscriptions/{typeName}` (idempotent) |
| `unsubscribeFromNotificationType` | fn | `DELETE .../subscriptions/{typeName}` (idempotent) |
| `followEntity` | fn | `POST .../entity/{type}/{id}/follow` (idempotent) |
| `unfollowEntity` | fn | `DELETE .../entity/{type}/{id}/follow` (idempotent) |
| `listEntityFollowers` | fn | `GET .../entity/{type}/{id}/followers` |
| `createTransportListeners` | fn | Shared listener/state registry reused by every transport adapter |
| `TransportListeners` | type | Return shape of `createTransportListeners` |
| `NotificationPermissions` | const | Backend permission strings (`Notifications.UserNotifications.*`) |

## Caveats

- **`UserNotification` ≠ `NotificationTransportMessage`.** The inbox is a paged
  REST read model with `id`/`state`/`readAt`; the transport push is a lighter
  event keyed on `notificationId`/`occurredAt`. Map the push event into your
  client cache yourself — they are not interchangeable.
- **`NotificationChannel` is open.** It is `… | (string & {})`: backend and
  consumer apps may register channels beyond `NotificationChannels`. Never
  `switch` exhaustively without a default branch.
- **`data` is `unknown`.** `UserNotification.data` /
  `NotificationTransportMessage.data` carry a per-type payload; narrow it against
  `notificationTypeName` before reading fields.
- **Mandatory notifications.** `NotificationDefinition.allowUserOptOut === false`
  marks notifications that are always sent regardless of preferences (e.g.
  security / GDPR breach alerts). The UI must not present an opt-out toggle for
  them, and `updatePreference` will not silence them.
- **Permission checks are UX hints.** `NotificationPermissions` mirrors the
  backend strings so the UI can hide controls, but the `Granit.Notifications`
  endpoints remain the only authoritative enforcement point.

## Out of scope

- **React hooks, providers and query keys** — in
  [`@granit/react-notifications`](../react-notifications). This core layer never
  imports React.
- **Admin UI** (inbox page, bell, preferences panel, toast handler) — in
  [`@granit/react-ui-notifications`](../react-ui-notifications).
- **Real-time transport implementations** — `NotificationTransport` is only an
  interface here; concrete adapters are
  [`@granit/notifications-signalr`](../notifications-signalr) and
  [`@granit/notifications-sse`](../notifications-sse).
- **Push channels** (web / mobile token registration) —
  [`@granit/notifications-web-push`](../notifications-web-push) and
  [`@granit/notifications-mobile-push`](../notifications-mobile-push).

## License

Apache-2.0
