# @granit/react-notifications-mobile-push

React hooks + provider for **mobile push** device-token registration —
FCM (Android) / APNs (iOS) token lifecycle for Capacitor shells. This is the
**React hooks layer**: it wraps the framework-agnostic Axios calls and DTOs from
[`@granit/notifications-mobile-push`](../notifications-mobile-push) in TanStack
Query hooks plus a `MobilePushProvider` for client/base-path configuration, and
bridges them to the native `@capacitor/push-notifications` plugin (permission
prompt, token capture, refresh listener). It holds no rendering.

The backend counterpart is the .NET `Granit.Notifications` mobile-push surface
(device-token endpoints under `/notifications/mobile-push/tokens`; these routes
are not part of `contracts/openapi/notifications.json`, which covers the in-app
notification, preference and subscription surfaces). The split is two packages —
there is no `react-ui` admin feature kit:

- [`@granit/notifications-mobile-push`](../notifications-mobile-push) —
  framework-agnostic core: `DeviceTokenDto` / `MobilePushTokenResponse` DTOs and
  the bare Axios calls (`registerDeviceToken`, `listDeviceTokens`,
  `unregisterDeviceToken`).
- `@granit/react-notifications-mobile-push` (this package) — React Query hooks,
  provider, and the Capacitor permission/registration flow.

The web-push counterpart is
[`@granit/react-notifications-web-push`](../react-notifications-web-push); both
sit under the broader [`@granit/react-notifications`](../react-notifications)
surface.

## Install

Workspace-internal — consumed via the `@granit/*` Vite/Vitest aliases, not
published for app consumption through a public registry. A consumer must declare
these peers:

- `@granit/notifications-mobile-push` — core DTOs + Axios calls this layer wraps.
- `@granit/api-client` — supplies the `AxiosInstance` (CSRF, auth, tenant
  interceptors).
- `@granit/react-api-client` — `useOptionalGranitClient`, the context fallback
  for the Axios client when `config.client` is omitted.
- `@granit/logger` — `createLogger` for the register/unregister/refresh logs.
- `@granit/types` — branded `ISODateString` carried on
  `MobilePushTokenResponse.createdAt`.
- `@capacitor/push-notifications` (`>=6`) — the native plugin driving the OS
  permission prompt and token events.
- `@tanstack/react-query` (`^5`) and `react` (`^19`).
- `msw` (`^2.12`, **optional**) — only for the
  `@granit/react-notifications-mobile-push/testing` subpath.

## Quick start

Wire the provider once (it resolves the Axios client and base path), then call
the hooks anywhere below it. `useMobilePush` takes only the target `platform`;
the base path comes from the provider, defaulting to `/api/v1/notifications`.

```tsx
import {
  MobilePushProvider,
  useMobilePush,
} from '@granit/react-notifications-mobile-push';
import { useGranitClient } from '@granit/react-api-client';

function App({ children }: { children: React.ReactNode }) {
  // `client` may be omitted if a <GranitClientProvider> is already mounted.
  return (
    <MobilePushProvider config={{ client: useGranitClient() }}>
      {children}
    </MobilePushProvider>
  );
}

function PushToggle() {
  // Requests OS permission, captures the FCM/APNs token, and registers it
  // with the backend; re-syncs automatically on token refresh while active.
  const { isRegistered, loading, error, register, unregister } = useMobilePush({
    platform: 'android', // 'android' (FCM) | 'ios' (APNs)
  });

  return (
    <button
      type="button"
      disabled={loading}
      onClick={isRegistered ? unregister : register}
    >
      {isRegistered ? 'Disable' : 'Enable'} push notifications
      {error ? ` — ${error.message}` : ''}
    </button>
  );
}
```

For an admin/diagnostics view of the tokens the signed-in user has registered,
`useDeviceTokens` is a read-only TanStack Query hook over the same provider:

```tsx
import { useDeviceTokens } from '@granit/react-notifications-mobile-push';

function RegisteredDevices() {
  const { data: tokens } = useDeviceTokens();
  return (
    <ul>
      {tokens?.map((t) => (
        <li key={t.deviceToken}>
          {t.platform} — registered {t.createdAt}
        </li>
      ))}
    </ul>
  );
}
```

## Public API

| Symbol | Kind | Purpose |
| --- | --- | --- |
| `MobilePushProvider` | provider | Supplies the resolved Axios client + base path to all hooks below it |
| `useMobilePushConfig` | hook | Read the resolved `{ client, basePath }`; throws outside a provider |
| `useMobilePush` | hook | Permission prompt + FCM/APNs token capture + register/unregister + refresh |
| `useDeviceTokens` | hook | `GET .../mobile-push/tokens` — the user's registered tokens (read-only) |
| `deviceTokenKeys` | const | Query-key factory for the device-token query |
| `MobilePushHookOptions` | type | `useMobilePush` input — `{ platform }` |
| `UseMobilePushReturn` | type | `{ isRegistered, loading, error, register, unregister }` |
| `MobilePushProviderConfig` | type | Resolved config — optional `client`, required `basePath` |
| `MobilePushProviderProps` | type | `{ config, children }`; `config.basePath` optional (provider defaults it) |

`./testing` subpath (requires the optional `msw` peer):
`createMobilePushHandlers` (stateful MSW handlers — register/unregister mutate an
in-memory list reflected in subsequent GETs, default base
`/api/v1/notifications`) plus the `mockMobilePushTokens` and
`mockDeviceTokenRegistration` fixtures.

## Out of scope / caveats

- **No PII in the push payload.** This layer registers tokens only; the backend
  sends wake-up-only payloads and the native OS renders the notification. Do not
  expect message bodies to flow through this package (ISO 27001 posture — see
  `useMobilePush` source).
- **Device tokens are credentials.** A token can be used to push to a user's
  device; the hook never logs token values (only the platform), and relies on
  the `@granit/api-client` auth/CSRF interceptors for transport. Keep that
  discipline in any UI built on `useDeviceTokens`.
- **Capacitor required.** `useMobilePush` imports
  `@capacitor/push-notifications`; it only works inside a Capacitor native shell
  (Android/iOS). On the web it has no functioning native layer — gate it behind a
  platform check. The headless token calls live in the core package for non-React
  / non-Capacitor callers.
- **Token-refresh sync runs while registered.** Once `register()` succeeds, a
  Capacitor `'registration'` listener unregisters the old token and registers the
  refreshed one automatically; it is torn down on unmount or when `isRegistered`
  flips false.
- **No caching for the lifecycle calls.** Register/unregister are imperative and
  do not invalidate the `useDeviceTokens` query — refetch it yourself after a
  mutation if both are mounted.
- **No admin UI.** Rendering (settings panels, device lists) is the consuming
  app's job; there is no `react-ui-notifications-mobile-push`.

## License

Apache-2.0
