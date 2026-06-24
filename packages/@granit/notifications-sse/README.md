# @granit/notifications-sse

Server-Sent Events (SSE) **transport adapter** for the Granit notifications
stack. It builds a `NotificationTransport` (the abstraction defined by
[`@granit/notifications`](../notifications)) on top of
[`@microsoft/fetch-event-source`](https://github.com/Azure/fetch-event-source),
giving real-time push over a single long-lived HTTP stream with automatic
reconnection and per-reconnect auth header injection.

This is a **framework-agnostic** layer: one factory, one config type, no React,
no DOM, no Node-only dependency. It owns only the connection lifecycle and
delegates listener bookkeeping to `createTransportListeners` from the core. The
sibling [`@granit/notifications-signalr`](../notifications-signalr) implements
the same `NotificationTransport` contract over a WebSocket/SignalR hub — pick
one per app. The transport is consumed by the React layer
[`@granit/react-notifications`](../react-notifications), whose
`NotificationProvider` accepts an optional `transport` prop; the admin feature
kit is [`@granit/react-ui-notifications`](../react-ui-notifications). The backend
counterpart is the `Granit.Notifications` .NET module (wire contract:
`contracts/openapi/notifications.json`).

## Install

Workspace-internal — consumed via the `@granit/*` Vite/Vitest aliases, not
installed from a public registry for app consumption. Declare the peers:

- `@granit/notifications` — supplies the `NotificationTransport` contract, the
  `NotificationTransportMessage` shape, and `createTransportListeners`.
- `@granit/logger` — supplies `createLogger`; this adapter logs lifecycle and
  skipped-frame events through it.
- `@microsoft/fetch-event-source` (`>=2.0.0`) — the underlying SSE client.

## Quick start

`createSseTransport` returns a `NotificationTransport`. Hand it to the
`NotificationProvider` from `@granit/react-notifications`; the provider drives
`connect()` / `disconnect()` and subscribes to its callbacks. When omitted, the
provider falls back to REST polling only.

```tsx
import { createSseTransport } from '@granit/notifications-sse';
import { NotificationProvider } from '@granit/react-notifications';

// Built once, outside render — same-origin streamUrl, Bearer token re-read on
// every (re)connect via tokenGetter.
const transport = createSseTransport({
  streamUrl: '/api/v1/notifications/stream',
  tokenGetter: async () => keycloak.token ?? null,
});

export function App({ children }: { children: React.ReactNode }) {
  return (
    <NotificationProvider config={{ apiClient }} transport={transport}>
      {children}
    </NotificationProvider>
  );
}
```

Standalone (no React) — subscribe directly to the transport:

```ts
import { createSseTransport } from '@granit/notifications-sse';

const transport = createSseTransport({ streamUrl: '/api/v1/notifications/stream' });

const off = transport.onNotification((message) => {
  // message: NotificationTransportMessage — notificationTypeName, severity, data, …
  console.info(message.notificationTypeName);
});
transport.onStateChange((state) => {
  // 'disconnected' | 'connecting' | 'connected' | 'reconnecting'
});

await transport.connect();
// …
off();
await transport.disconnect();
```

## Public API

| Symbol               | Kind | Purpose                                                        |
| -------------------- | ---- | -------------------------------------------------------------- |
| `createSseTransport` | fn   | Builds a `NotificationTransport` backed by an SSE stream       |
| `SseTransportConfig` | type | Factory options (`streamUrl`, `tokenGetter`, heartbeat, CORS)  |

### `SseTransportConfig`

| Field               | Type                            | Default           | Purpose                                                               |
| ------------------- | ------------------------------- | ----------------- | --------------------------------------------------------------------- |
| `streamUrl`         | `string`                        | — (required)      | SSE endpoint, e.g. `/api/v1/notifications/stream`.                     |
| `tokenGetter`       | `() => Promise<string \| null>` | none              | Called on each connection attempt; result is sent as `Bearer` if set. |
| `heartbeatTypeName` | `string`                        | `'__heartbeat__'` | Event name treated as a keep-alive and filtered from notifications.   |
| `allowCrossOrigin`  | `boolean`                       | `false`           | Opt in to a cross-origin `streamUrl` (see caveats).                   |

## Behaviour

- **Reconnection.** Delegated to `@microsoft/fetch-event-source`. A `5xx`/`429`
  open is retriable (state → `reconnecting`); a non-`429` `4xx` is fatal (state →
  `disconnected`, no reconnect). `openWhenHidden: true` keeps the stream alive on
  background tabs.
- **Auth on every reconnect.** When `tokenGetter` is set, a custom `fetch`
  wrapper re-reads the token and sets `Authorization: Bearer <token>` on each
  (re)connect, so a rotated/refreshed token is picked up automatically. A `null`
  token sends no header.
- **Heartbeats & malformed frames.** Events of type `heartbeatTypeName` and
  empty-`data` frames are dropped. A frame whose `data` fails `JSON.parse` is
  skipped (warned, raw payload omitted) rather than tearing down the stream.
- **State.** `connect()` opens an `AbortController`-scoped stream; `disconnect()`
  aborts it and sets `disconnected`. `transport.state` reflects the current
  `ConnectionState` at all times.

## Caveats

- **Same-origin by default (token exfiltration guard).** `createSseTransport`
  throws synchronously if `streamUrl` resolves to a different origin than
  `globalThis.location`, to avoid leaking the `Bearer` token to a third party
  on a misconfigured URL. Set `allowCrossOrigin: true` only when the target
  origin shares your trust boundary. (The check is skipped when `location` is
  undefined, e.g. SSR/test.)
- **Native `fetch` is intentional here.** Unlike domain HTTP calls, this
  transport sits below `@granit/api-client` and uses `fetch` via
  `@microsoft/fetch-event-source`; CSRF/tenant interceptors do not apply.
  Authentication is the explicit `tokenGetter` Bearer header.
- **Untrusted payloads are not logged.** Malformed-frame warnings omit the raw
  `data` to avoid writing attacker-controlled server output into logs.
- **Wire shape, not REST shape.** Listeners receive
  `NotificationTransportMessage` (real-time push shape), which is distinct from
  the `UserNotification` REST response; mapping/persistence is the React layer's
  job, not this adapter's.

## License

Apache-2.0
