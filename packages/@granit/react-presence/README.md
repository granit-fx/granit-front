# @granit/react-presence

React Query hooks, a configuration provider, a heartbeat scheduler and headless
UI components for the Granit **presence** module — own status read/override,
other-user lookups, and resource-scoped participant rooms. This is the **React
hooks layer**: it wraps the framework-agnostic Axios calls and DTOs from
[`@granit/presence`](../presence) in TanStack Query hooks behind a shared
`PresenceProvider`. The components it ships are deliberately headless — no menu,
popover or design-token chrome; richer admin panels live one layer up.

The split is three packages over the same .NET `Granit.Presence` backend (and its
`Granit.Presence.Rooms` sub-namespace; contract:
`contracts/openapi/presence.json`):

- [`@granit/presence`](../presence) — framework-agnostic core: DTOs, Axios
  functions (`getMyPresence`, `pollMyPresence`, `joinResourceRoom`, …),
  `PresencePermissions` and `PRESENCE_DEFAULTS`.
- `@granit/react-presence` (this package) — React Query hooks, provider,
  heartbeat scheduler, headless components and i18n bundles.
- [`@granit/react-ui-presence`](../react-ui-presence) — admin UI kit: the
  live-presence demo page composing these headless parts with the foundation UI
  packages.

The module covers two surfaces. **User presence** is the per-user effective
status (`Online`/`Away`/`Busy`/`DoNotDisturb`/`Offline`) computed server-side
from heartbeats plus an optional manual override. **Resource rooms** are ad-hoc,
resource-scoped participant lists (e.g. who is viewing a CMS page) joined and
refreshed by heartbeat.

## Install

Workspace-internal — consumed via the `@granit/*` Vite/Vitest aliases, not
published for app consumption through a public registry. A consumer must declare
these peers:

- `@granit/presence` — core DTOs + Axios calls this layer wraps.
- `@granit/api-client` — supplies the `AxiosInstance` (CSRF, auth, tenant
  interceptors).
- `@granit/react-api-client` — `useOptionalGranitClient`, the context fallback for
  the Axios client when `config.client` is omitted.
- `@granit/logger` — `createLogger`, used for non-critical heartbeat diagnostics.
- `@tanstack/react-query` (`^5`) and `react` (`^19`).
- `msw` (`^2.12`, **optional**) — only for the `@granit/react-presence/testing`
  subpath.

## Quick start

Wire the provider once (it resolves the Axios client, base path, and an optional
query-key prefix), mount `<PresenceHeartbeat />` exactly once in the authenticated
shell, then call the hooks anywhere below it.

```tsx
import {
  PresenceProvider,
  PresenceHeartbeat,
  useMyPresence,
  PresenceDot,
} from '@granit/react-presence';
import { useGranitClient } from '@granit/react-api-client';

function App({ children }: { children: React.ReactNode }) {
  // `client` may be omitted if a <GranitClientProvider> is already mounted.
  return (
    <PresenceProvider config={{ client: useGranitClient() }}>
      {/* Mount ONCE — it polls POST /presence/my/poll every 30 s while visible. */}
      <PresenceHeartbeat />
      {children}
    </PresenceProvider>
  );
}

function MyStatusDot() {
  const { data: presence } = useMyPresence();
  if (!presence) return null;
  return <PresenceDot status={presence.effectiveStatus} />;
}
```

The heartbeat derives idle seconds from the last `keydown`/`mousemove`/`scroll`
timestamp (never the event values), pauses while the tab is hidden, and writes
the authoritative poll snapshot straight into `useMyPresence`'s cache. To let the
user pick a manual override, drop the headless `<PresencePicker>` into your own
menu or dialog — its mutations flow through the same hooks so every rendered
presence stays consistent:

```tsx
import {
  PresencePicker,
  DndBanner,
  useMyPresence,
  useClearMyPresenceOverride,
  useUserPresence,
  PresenceDot,
} from '@granit/react-presence';
import type { UserId } from '@granit/types';

function StatusMenu() {
  const { data: presence } = useMyPresence();
  const clear = useClearMyPresenceOverride();
  return (
    <>
      <DndBanner presence={presence} onClear={() => clear.mutate()} />
      <PresencePicker onApplied={() => {/* close the menu */}} />
    </>
  );
}

// Other users require `Presence.Users.Read`; gate the fetch with `enabled`.
function TeammateDot({ userId, canRead }: { userId: UserId; canRead: boolean }) {
  const { data } = useUserPresence(userId, { enabled: canRead });
  return <PresenceDot status={data?.effectiveStatus ?? 'Offline'} presentational />;
}
```

For collaborative views, `useResourcePresence(kind, id)` joins a room on mount,
re-heartbeats every 15 s while visible, drops stale participants client-side, and
fires a best-effort `DELETE` leave on unmount:

```tsx
import { useResourcePresence, PresenceDot } from '@granit/react-presence';

function ViewersStrip({ docId }: { docId: string }) {
  const { participants, isJoining } = useResourcePresence('document', docId);
  if (isJoining) return null;
  return participants.map((p) => <PresenceDot key={p.userId} status="Online" />);
}
```

## Public API

| Symbol                       | Kind      | Purpose                                                                  |
| ---------------------------- | --------- | ------------------------------------------------------------------------ |
| `PresenceProvider`           | provider  | Supplies resolved client, base path, query-key prefix to hooks below it  |
| `usePresenceConfig`          | hook      | Read the resolved config; throws outside a provider                      |
| `buildPresenceQueryKey`      | fn        | Prepend the configured `queryKeyPrefix` to module-relative key segments  |
| `presenceKeys`               | const     | Module-relative key factory (`all`/`my`/`user`/`batch`)                  |
| `useMyPresence`              | hook      | `GET /presence/my` — current user's snapshot (refetch on focus, 30 s)    |
| `useSetMyPresence`           | hook      | `PUT /presence/my` mutation — optimistic manual override + rollback      |
| `useClearMyPresenceOverride` | hook      | `DELETE /presence/my/override` mutation — drop the manual override       |
| `useHeartbeat`               | hook      | Visibility-aware `POST /presence/my/poll` loop; mount once, renders none |
| `useUserPresence`            | hook      | `GET /presence/users/{userId}` — one user (needs `Presence.Users.Read`)  |
| `useBatchPresence`           | hook      | `POST /presence/users/batch` — dedup/sort/chunk a roster into one cache  |
| `useResourcePresence`        | hook      | Join/heartbeat/leave a resource room; live, stale-filtered participants  |
| `PresenceHeartbeat`          | component | Render-less mount wrapper around `useHeartbeat`                          |
| `PresenceDot`                | component | Headless coloured status pastille (`data-status`, inline/overlay)        |
| `PresencePicker`             | component | Headless manual-override form (status + expiry presets), cache-driven    |
| `DndBanner`                  | component | Passive reminder in `DoNotDisturb`/`AppearOffline`; else renders nothing  |
| `DEFAULT_PRESENCE_COLORS`    | const     | Per-status hex map used by `PresenceDot` (overridable via `colorMap`)    |
| `presenceTranslationsEn`     | const     | English i18next bundle (namespace `presence`)                            |
| `presenceTranslationsFr`     | const     | French i18next bundle (namespace `presence`)                             |
| `PresenceConfig`             | type      | Provider input (optional `client` / `basePath` / `queryKeyPrefix`)       |
| `ResolvedPresenceConfig`     | type      | Provider output with the resolved required client + base path            |
| `PresenceProviderProps`      | type      | `{ config?, children }`                                                  |
| `UseHeartbeatOptions`        | type      | `{ intervalMs?, disabled? }`                                             |
| `UseUserPresenceOptions`     | type      | `{ enabled? }`                                                           |
| `UseBatchPresenceOptions`    | type      | `{ enabled? }`                                                           |
| `UseResourcePresenceOptions` | type      | `{ heartbeatIntervalMs?, staleThresholdMs?, metadata?, enabled? }`       |
| `UseResourcePresenceResult`  | type      | `{ participants, isJoining, error, leave }`                              |
| `Presence*Props` / `*Labels` | type      | Per-component props and overridable label bags (dot / picker / banner)   |
| `PresenceTranslations`       | type      | Shape of the i18next bundles                                             |

The i18next bundles are registered under the `presence` namespace; components do
not call `useTranslation` themselves — apps thread `t()` results into each
component's `labels` prop.

`./testing` subpath (requires the optional `msw` peer): `createPresenceHandlers`
(stateful user-presence handlers for `my`/`poll`/`users`/`batch`) and
`createResourceRoomsHandlers` (stateful room handlers), both defaulting to base
`/api/v1`, plus the `mockMyPresence`, `mockOtherPresences` and `mockUsers`
fixtures (GUID-formatted ids that round-trip the .NET stack).

## Caveats

- **Mount the heartbeat exactly once.** `useHeartbeat` / `<PresenceHeartbeat />`
  run a single polling loop; mounting either more than once spawns parallel
  polls. Place it at the authenticated shell, inside the `PresenceProvider`.

- **The poll owns the `my` cache.** Each heartbeat cancels any in-flight
  `useMyPresence` GET on the same key before writing, so a slower concurrent GET
  cannot clobber the fresh snapshot with a staler one. Heartbeat failures are
  non-critical and logged via `@granit/logger` (never thrown).

- **Other-user reads need a permission and a gate.** `useUserPresence` /
  `useBatchPresence` require `Presence.Users.Read` and `useResourcePresence`
  requires `Presence.Rooms.Join`. Callers without the permission should pass
  `enabled: false` and fall back to a muted `Offline` indicator rather than let
  the request 403. As elsewhere in the framework, client-side gating is a UX
  hint — the .NET backend is the authority on every call.

- **`Offline` is a value, never a 404.** Single and batch user lookups resolve
  unknown users to an `Offline` snapshot with `lastSeenUtc = null`; do not treat
  absence as an error. Resource rooms, by contrast, *can* 404 (visibility policy
  or dissolved room).

- **Privacy.** `AppearOffline` is owner-controlled; the backend reports it as
  `Offline` to others. Resource-room `metadata` (≤ 512 bytes UTF-8) is opaque and
  readable by every participant — never put PII or secrets in it.

- **Real-time notification gate.** When the user is in `DoNotDisturb` or
  `AppearOffline`, the backend `Granit.Presence.Notifications` gate suppresses
  push / SignalR / SSE delivery. `<DndBanner>` is a passive reminder that
  explains *why* toasts stopped; it neither performs nor enforces the muting.

## Out of scope

- **Admin UI** — the live-presence demo page and any styled chrome live in
  [`@granit/react-ui-presence`](../react-ui-presence). The components here are
  headless.

- **DTOs and HTTP transport** — owned by [`@granit/presence`](../presence)
  (mirror of `Granit.Presence`); hooks here only adapt them to React Query.

- **Real-time push** — fan-out of status changes over SignalR/SSE is not provided
  by this package; it is request/response polling only. Subscribe via the
  realtime transport instead of polling other users.

## License

Apache-2.0
