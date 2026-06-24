# @granit/notifications-signalr

SignalR **transport adapter** for the framework-agnostic
[`@granit/notifications`](../notifications) core. It wraps a
`@microsoft/signalr` `HubConnection` and exposes it as a
`NotificationTransport` — the connect/disconnect + listener interface that
`@granit/notifications` and the React provider drive without knowing the
underlying wire protocol.

This is a thin infrastructure layer, not a domain package: it owns the SignalR
connection lifecycle and delegates all listener bookkeeping to
`createTransportListeners` from the core. It is the WebSocket/long-polling
sibling of the EventSource adapter [`@granit/notifications-sse`](../notifications-sse);
both produce the same `NotificationTransport` shape and are interchangeable at
the `NotificationProvider` wiring point. React hooks, the provider, and the
admin feature kit live in [`@granit/react-notifications`](../react-notifications)
and [`@granit/react-ui-notifications`](../react-ui-notifications) respectively —
none of that lives here.

## Install

Workspace-internal — consumed via the `@granit/*` Vite/Vitest aliases, not added
as a published dependency for app consumption. Declare the two peers:

- `@granit/notifications` — supplies the `NotificationTransport` contract,
  `NotificationTransportMessage` shape, and the `createTransportListeners`
  helper this adapter builds on.
- `@microsoft/signalr` (`>=8.0.0`) — the SignalR client; provides
  `HubConnectionBuilder`, `HttpTransportType`, and `LogLevel`.

## Quick start

```ts
import { createSignalRTransport } from '@granit/notifications-signalr';
import { NotificationProvider } from '@granit/react-notifications';

// Build the transport once and pass it to the provider. `hubUrl` points at the
// .NET notifications hub; `tokenGetter` is called on every connection attempt
// (initial connect and each automatic reconnect), so return a fresh token.
const transport = createSignalRTransport({
  hubUrl: '/hubs/notifications',
  tokenGetter: async () => keycloak.token ?? null,
});

function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <NotificationProvider config={{ apiClient }} transport={transport}>
      {children}
    </NotificationProvider>
  );
}
```

The provider owns the lifecycle: it calls `transport.connect()` on mount,
subscribes via `onNotification` / `onStateChange`, and calls
`transport.disconnect()` on unmount. The `transport` prop is optional — omit it
and the notification surface falls back to REST polling only.

The transport receives messages on the hub's `ReceiveNotification` method,
negotiates `WebSockets | LongPolling`, enables automatic reconnect, and reports
state transitions (`connected` / `reconnecting` / `disconnected`) through
`onStateChange`.

## Public API

| Symbol                   | Kind | Purpose                                                              |
| ------------------------ | ---- | -------------------------------------------------------------------- |
| `createSignalRTransport` | fn   | Builds a `NotificationTransport` backed by a SignalR `HubConnection` |
| `SignalRTransportConfig` | type | Transport options: `hubUrl` and an optional async `tokenGetter`      |

`createSignalRTransport` returns a `NotificationTransport` (re-exported from
`@granit/notifications`); this package adds no new transport shape.

## Caveats

- **Token freshness.** `tokenGetter` is invoked on each connection attempt and
  wired as SignalR's `accessTokenFactory`; return a non-stale token so
  reconnects after a long disconnect still authenticate. A `null` result is
  coerced to an empty string (anonymous connect), not an error.
- **Transport negotiation.** Only `WebSockets` and `LongPolling` are offered —
  Server-Sent Events negotiation is deliberately excluded (use
  [`@granit/notifications-sse`](../notifications-sse) for an EventSource-based
  transport). SignalR logging is pinned to `LogLevel.Warning`.
- **No HTTP / domain surface.** This adapter never calls business endpoints; all
  REST notification calls (preferences, mark-as-read, feeds) live in
  `@granit/notifications` and go through `@granit/api-client`. It only manages
  the real-time channel.

## License

Apache-2.0
