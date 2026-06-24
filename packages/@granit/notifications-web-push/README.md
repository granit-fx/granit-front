# @granit/notifications-web-push

Browser-agnostic **Web Push (VAPID) subscription** SDK — the transport plugin
that syncs a [W3C Push API](https://www.w3.org/TR/push-api/) subscription with
the Granit `Notifications` backend. It is the Web Push counterpart of the
transport-agnostic notification core (`@granit/notifications`) and a sibling of
the other delivery transports (`@granit/notifications-sse`,
`@granit/notifications-signalr`, `@granit/notifications-mobile-push`).

This is the framework-agnostic **core** layer: two HTTP functions that
register/unregister a push subscription on the backend, plus the pure
`urlBase64ToUint8Array` codec needed to hand the VAPID public key to
`pushManager.subscribe(...)`. It holds **no** React, DOM-rendering or Node-only
dependency — the actual subscription lifecycle (service-worker registration,
permission prompt, React state) lives one layer up in
[`@granit/react-notifications-web-push`](../react-notifications-web-push), and
the admin-facing toggle UI in
[`@granit/react-ui-notifications`](../react-ui-notifications). The .NET backend
counterpart is the `Granit.Notifications` module.

## Install

Workspace-internal — consumed via the `@granit/*` Vite/Vitest aliases, not
published to a public registry for app consumption. Declare the single peer:

- `@granit/api-client` — supplies the `AxiosInstance` (CSRF, auth, tenant
  interceptors) and the `buildApiUrl` path helper used by both calls.

## Quick start

```ts
import {
  registerPushSubscription,
  unregisterPushSubscription,
  urlBase64ToUint8Array,
} from '@granit/notifications-web-push';
import type { AxiosInstance } from '@granit/api-client';

declare const client: AxiosInstance; // from @granit/api-client
const basePath = '/api/v1';
const vapidPublicKey = '<URL-safe Base64 VAPID public key>';

// 1. Subscribe in the browser. The codec turns the VAPID key into the
//    Uint8Array `pushManager.subscribe` expects as `applicationServerKey`.
const registration = await navigator.serviceWorker.register('/sw.js');
const subscription = await registration.pushManager.subscribe({
  userVisibleOnly: true,
  applicationServerKey: urlBase64ToUint8Array(vapidPublicKey),
});

// 2. Persist it server-side → POST {basePath}/notifications/push-subscriptions.
await registerPushSubscription(client, basePath, subscription.toJSON());

// 3. Later, drop the subscription → DELETE the same route, body { endpoint }.
await unregisterPushSubscription(client, basePath, subscription.endpoint);
```

In a React app, prefer the hook/provider layer
([`@granit/react-notifications-web-push`](../react-notifications-web-push)): its
`useWebPush()` orchestrates the service worker, the permission prompt and these
two calls, exposing `subscribe` / `unsubscribe` plus `isSupported`,
`permission`, `isSubscribed`, `loading` and `error`.

## Public API

| Symbol                       | Kind | Purpose                                                                          |
| ---------------------------- | ---- | -------------------------------------------------------------------------------- |
| `registerPushSubscription`   | fn   | `POST {basePath}/notifications/push-subscriptions` (`PushSubscriptionJSON` body) |
| `unregisterPushSubscription` | fn   | `DELETE {basePath}/notifications/push-subscriptions`, body `{ endpoint }`        |
| `urlBase64ToUint8Array`      | fn   | URL-safe Base64 VAPID key to `Uint8Array` for `applicationServerKey`             |

`PushSubscriptionJSON`, `AxiosInstance` and `NotificationPermission` come from
the DOM lib / `@granit/api-client`; this package adds no DTO types of its own.

## Caveats

- **Subscription endpoint is a capability URL.** A `PushSubscription.endpoint`
  is a bearer secret for the push service — anyone holding it can push to the
  device. The backend stores it per-user; do not log it, surface it in
  telemetry, or expose it to other tenants.
- **VAPID public key only.** This package never touches the VAPID **private**
  key — that stays server-side in `Granit.Notifications`. Only the public key
  (passed to `urlBase64ToUint8Array`) is allowed in the browser.
- **Idempotent unregister.** `unregisterPushSubscription` keys on the raw
  `endpoint` string; the matching client-side `subscription.unsubscribe()` is
  the caller's responsibility (the React hook does both).
- **`basePath` is the module root**, not a full URL — `buildApiUrl` joins it
  with `notifications/push-subscriptions`. Pass the same base path the rest of
  the notifications calls use (e.g. `/api/v1`).

## Out of scope

- **Service-worker lifecycle, permission prompt and React state** — owned by
  [`@granit/react-notifications-web-push`](../react-notifications-web-push)
  (`useWebPush`, `WebPushProvider`).
- **Notification rendering, the inbox and the admin toggle UI** — owned by
  [`@granit/react-ui-notifications`](../react-ui-notifications) and the
  transport-agnostic [`@granit/notifications`](../notifications) core.
- **Other transports** — server-sent events
  ([`@granit/notifications-sse`](../notifications-sse)), SignalR
  ([`@granit/notifications-signalr`](../notifications-signalr)) and native
  mobile push ([`@granit/notifications-mobile-push`](../notifications-mobile-push)).
- **The service worker file (`/sw.js`)** that receives and displays the push
  payload — that is app-level code, not framework-provided.

## License

Apache-2.0
