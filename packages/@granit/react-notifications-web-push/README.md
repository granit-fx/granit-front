# @granit/react-notifications-web-push

React hooks + provider for **Web Push** (VAPID) subscription management. This is the
**React hooks layer**: it wraps the framework-agnostic Axios calls and the VAPID key
helper from [`@granit/notifications-web-push`](../notifications-web-push) in a
`WebPushProvider` (client / base-path / service-worker-path configuration) and a single
`useWebPush()` hook that drives the browser subscription lifecycle. It renders nothing —
the opt-in toggle, settings panel, and the service worker itself are app/UI-level code.

The split is two packages over the same notification backend domain:

- [`@granit/notifications-web-push`](../notifications-web-push) — framework-agnostic
  core: the `registerPushSubscription` / `unregisterPushSubscription` Axios calls and the
  `urlBase64ToUint8Array` VAPID key converter. No React, DOM-permission, or
  service-worker dependency.
- `@granit/react-notifications-web-push` (this package) — React provider + hook that
  binds the core calls to the browser `PushManager` and `Notification` APIs.

There is no dedicated `react-ui-notifications-web-push` admin kit; the broader
notification admin surface (preferences, channels, history) lives in
[`@granit/react-ui-notifications`](../react-ui-notifications). The non-Web-Push channels
are sibling packages: [`@granit/react-notifications`](../react-notifications) (in-app),
[`@granit/react-notifications-mobile-push`](../react-notifications-mobile-push), plus the
core [`@granit/notifications-signalr`](../notifications-signalr) and
[`@granit/notifications-sse`](../notifications-sse) transports.

## Install

Workspace-internal — consumed via the `@granit/*` Vite/Vitest aliases, not published for
app consumption through a public registry. A consumer must declare these peers:

- `@granit/notifications-web-push` — core Axios calls + VAPID key helper this layer wraps.
- `@granit/api-client` — supplies the `AxiosInstance` (CSRF, auth, tenant interceptors)
  and `buildApiUrl`.
- `@granit/react-api-client` — `useOptionalGranitClient`, the context fallback for the
  Axios client when `config.apiClient` is omitted.
- `@granit/logger` — `createLogger`, used for subscribe/unsubscribe lifecycle logging.
- `react` (`^19`).

## Quick start

Wire `WebPushProvider` once with the VAPID public key (the Axios client, base path, and
service-worker path are all optional — see the table), then call `useWebPush()` anywhere
below it. The provider falls back to the nearest `<GranitClientProvider>` for the Axios
client and to `/api/v1/notifications` / `/sw.js` for the paths.

```tsx
import { WebPushProvider, useWebPush } from '@granit/react-notifications-web-push';

function App({ children }: { children: React.ReactNode }) {
  return (
    <WebPushProvider config={{ vapidPublicKey: import.meta.env.VITE_VAPID_PUBLIC_KEY }}>
      {children}
    </WebPushProvider>
  );
}

function PushToggle() {
  const { isSupported, permission, isSubscribed, loading, error, subscribe, unsubscribe } =
    useWebPush();

  if (!isSupported) return <p>Push notifications are not supported in this browser.</p>;
  if (permission === 'denied') return <p>Notifications are blocked in browser settings.</p>;

  return (
    <button type="button" disabled={loading} onClick={isSubscribed ? unsubscribe : subscribe}>
      {isSubscribed ? 'Disable' : 'Enable'} notifications
      {error ? ` — ${error.message}` : ''}
    </button>
  );
}
```

`subscribe()` requests notification permission, registers the service worker
(`config.serviceWorkerPath`), calls `pushManager.subscribe({ userVisibleOnly: true })`
with the decoded VAPID key, and POSTs the resulting `PushSubscriptionJSON` to the backend.
`unsubscribe()` removes the subscription server-side, then unsubscribes the
`PushManager`. Both are no-ops when `isSupported` is `false`; both update `loading` /
`error` and are safe against unmount.

## Public API

| Symbol                  | Kind     | Purpose                                                                        |
| ----------------------- | -------- | ------------------------------------------------------------------------------ |
| `WebPushProvider`       | provider | Supplies VAPID key, Axios client, base path, SW path to hooks below            |
| `useWebPushConfig`      | hook     | Read the resolved config; throws outside a `WebPushProvider`                   |
| `useWebPush`            | hook     | Subscription lifecycle: `subscribe` / `unsubscribe` + status flags             |
| `WebPushProviderConfig` | type     | Resolved config (`vapidPublicKey`, `apiClient`, `basePath`, SW path)           |
| `WebPushProviderProps`  | type     | `{ config, children }`; only `vapidPublicKey` is required in `config`          |
| `UseWebPushReturn`      | type     | `isSupported` / `permission` / `isSubscribed` / `loading` / `error` + actions  |

`useWebPush()` takes **no arguments** — all configuration is read from the surrounding
`WebPushProvider`. The core HTTP calls and the VAPID decoder are re-exported from
[`@granit/notifications-web-push`](../notifications-web-push), not from this package.

## Out of scope / caveats

- **The service worker is app-level code.** This package registers the worker at
  `config.serviceWorkerPath` (default `/sw.js`) and manages only the *subscription*.
  Displaying notifications, handling `push` / `notificationclick` events, and shipping the
  worker file are the app's responsibility.
- **Permission is a one-shot browser prompt.** `subscribe()` calls
  `Notification.requestPermission()`; once a user picks `denied`, the browser will not
  re-prompt — surface a "blocked in browser settings" state rather than retrying.
- **Backend contract.** Subscriptions are synced to
  `POST` / `DELETE {basePath}/notifications/push-subscriptions` (DELETE sends
  `{ endpoint }` in the body). These browser-push routes are owned by the notifications
  backend and are **not** part of the `contracts/openapi/notifications.json` snapshot,
  which covers notification-*type* opt-ins — a distinct concept.
- **VAPID key handling.** The public key is decoded client-side via
  `urlBase64ToUint8Array`; it is a public value safe to ship in the bundle. The VAPID
  *private* key never leaves the backend.
- **HTTPS / secure context.** Service workers and the Push API require a secure context
  (HTTPS or `localhost`). `isSupported` reflects feature detection only, not the secure-
  context requirement.

## License

Apache-2.0
