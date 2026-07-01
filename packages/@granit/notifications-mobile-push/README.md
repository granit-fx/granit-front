# @granit/notifications-mobile-push

Framework-agnostic **mobile push** device-token registration SDK — the
TypeScript counterpart of the .NET `Granit.Notifications` mobile-push surface.
It registers, lists and unregisters FCM (Android) / APNs (iOS) device tokens so
the backend can target a user's native devices, typically from a Capacitor
shell.

This is the framework-agnostic **core** layer: it exposes the DTO types and the
three HTTP calls needed to drive token lifecycle from any client — React, React
Native, a Capacitor app, tests. It holds **no** React, DOM, Capacitor or
Node-only dependency; the Capacitor push plugin and permission prompts live in
the consuming app, behind the React layer. The React hooks/provider layer
(`useMobilePush`, `MobilePushProvider`, `useDeviceTokens`) lives in
[`@granit/react-notifications-mobile-push`](../react-notifications-mobile-push);
there is no `react-ui` admin feature kit. The web-push counterpart is
[`@granit/notifications-web-push`](../notifications-web-push), and both sit under
the broader [`@granit/notifications`](../notifications) surface.

## Install

Workspace-internal — consumed via the `@granit/*` Vite/Vitest aliases, not
published to a public registry for app consumption. Declare the two peers:

- `@granit/api-client` — supplies the `AxiosInstance` (CSRF, auth, tenant
  interceptors) and the `buildApiUrl` path builder used by every call.
- `@granit/types` — supplies the branded `ISODateString` carried on
  `MobilePushTokenResponse.createdAt`.

## Quick start

```ts
import {
  registerDeviceToken,
  listDeviceTokens,
  unregisterDeviceToken,
} from '@granit/notifications-mobile-push';
import type { MobilePushTokenRegisterRequest } from '@granit/notifications-mobile-push';

// `basePath` is the API root; the calls append
// `/notifications/mobile-push/tokens` themselves.
const basePath = '/api/v1';

// 1. Register the token returned by the native FCM/APNs plugin.
const payload: MobilePushTokenRegisterRequest = {
  deviceToken: fcmToken, // opaque registration token from the device
  platform: 'Android', // 'Android' (FCM) | 'Ios' (APNs)
};
await registerDeviceToken(client, basePath, payload);

// 2. List the tokens currently registered for the signed-in user.
const tokens = await listDeviceTokens(client, basePath);
for (const t of tokens) {
  // t.deviceTokenPreview, t.platform, t.createdAt (ISODateString)
}

// 3. Unregister on sign-out / token rotation. The token is URL-encoded
//    into the path, so opaque tokens with `/`, `+` or `=` are safe.
await unregisterDeviceToken(client, basePath, fcmToken);
```

## Public API

| Symbol                           | Kind | Purpose                                                      |
| -------------------------------- | ---- | ------------------------------------------------------------ |
| `MobilePlatform`                 | type | `'Android'` (FCM) \| `'Ios'` (APNs)                          |
| `MobilePushTokenRegisterRequest` | type | Registration body: `deviceToken`, `platform`                 |
| `MobilePushTokenResponse`        | type | Listed token: `deviceTokenPreview`, `platform`, `createdAt`  |
| `registerDeviceToken`            | fn   | `POST {basePath}/notifications/mobile-push/tokens`           |
| `listDeviceTokens`               | fn   | `GET {basePath}/notifications/mobile-push/tokens`            |
| `unregisterDeviceToken`          | fn   | `DELETE .../tokens/{token}` (token is URL-encoded into path) |

## Out of scope / caveats

- **No platform plumbing here.** Acquiring the FCM/APNs registration token,
  requesting OS notification permission, and reacting to token refresh are the
  app's job (Capacitor push plugin), surfaced through
  [`@granit/react-notifications-mobile-push`](../react-notifications-mobile-push).
  This package only persists tokens server-side.
- **No React Query / caching.** These are bare Axios calls; query keys,
  caching and invalidation live in the React layer (`useDeviceTokens`).
- **Registration sends the full token; the list returns only a masked preview.**
  Registration sends a `MobilePushTokenRegisterRequest` (`deviceToken`, `platform`);
  the list endpoint returns `MobilePushTokenResponse` (`deviceTokenPreview`,
  `platform`, `createdAt`) — the backend never echoes the full token back, so the
  two DTOs are not interchangeable.
- **Tokens are sensitive.** A device token can be used to push to a user's
  device; treat it like a credential — never log it (the backend returns only a
  masked `deviceTokenPreview`), and rely on the `@granit/api-client` auth/CSRF
  interceptors for transport.

## License

Apache-2.0
