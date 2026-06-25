# @granit/presence

User-presence SDK — the framework-level TypeScript counterpart of the .NET
`Granit.Presence` module (and its `Granit.Presence.Rooms` sub-namespace).
The wire contract is mirrored from `contracts/openapi/presence.json`.

This is the framework-agnostic **core** layer: it exposes the types, HTTP
client, permission constants and server defaults needed to read and write
presence from any client — React, React Native, a CLI, tests. It holds **no**
React, DOM or Node-only dependency. The React Query hooks/providers layer lives
in [`@granit/react-presence`](../react-presence) (provider, heartbeat
scheduler, headless components). A live-presence demo page composing these
parts lives in the showcase app's playground (`granit-showcase-react`).

The module covers two presence surfaces. **User presence** is the per-user
effective status (`Online`/`Away`/`Busy`/`DoNotDisturb`/`Offline`) computed
server-side from heartbeats plus an optional manual override. **Resource rooms**
are ad-hoc, resource-scoped participant lists (e.g. who is currently viewing a
CMS page or a document) joined and refreshed by heartbeat.

## Install

Workspace-internal — consumed via the `@granit/*` Vite/Vitest aliases, not
published to a public registry for app consumption. Declare both peers:

- `@granit/api-client` — supplies the `AxiosInstance` (CSRF, auth, tenant
  interceptors) and the `buildApiUrl` helper passed into every call.
- `@granit/types` — provides the branded `UserId` and `ISODateString` types
  used across the DTOs.

## Quick start

```ts
import {
  getMyPresence,
  setMyPresence,
  pollMyPresence,
  getBatchPresence,
  normalizeUserIds,
  joinResourceRoom,
  leaveResourceRoom,
  PRESENCE_DEFAULTS,
} from '@granit/presence';
import type { UserId } from '@granit/types';

// `basePath` is the presence API root; every call appends `/presence/...`.
const basePath = '/api/v1';

// 1. Read + override the current user's own presence.
const me = await getMyPresence(client, basePath); // { effectiveStatus, ... }
await setMyPresence(client, basePath, { manualStatus: 'DoNotDisturb' });

// 2. Heartbeat loop — call every 30–45 s while the tab is visible. The server
//    clamps `idleSeconds` to [0, MaxIdleSeconds]; flips Online → Away past the
//    activity threshold and → Offline once OfflineThresholdSeconds elapse.
await pollMyPresence(client, basePath, { idleSeconds: 12 });
const cadence = PRESENCE_DEFAULTS.OfflineThresholdSeconds; // 90

// 3. Batch lookup for a roster — dedupe/sort the ids first, chunk at MaxBatchSize.
const ids = normalizeUserIds(roster as UserId[]);
const { presences } = await getBatchPresence(client, basePath, { userIds: ids });

// 4. Resource room — show who is viewing this document, then leave on unmount.
const room = await joinResourceRoom(client, basePath, 'document', docId, {
  metadata: JSON.stringify({ section: 'header' }), // ≤ 512 bytes UTF-8
});
room.participants.forEach((p) => console.log(p.userId, p.lastSeenUtc));
await leaveResourceRoom(client, basePath, 'document', docId);
```

## Public API

| Symbol                                | Kind  | Purpose                                                               |
| ------------------------------------- | ----- | --------------------------------------------------------------------- |
| `PresenceStatus`                      | type  | Effective status: `Online \| Away \| Busy \| DoNotDisturb \| Offline` |
| `ManualPresenceStatus`                | type  | User override: `Available \| Busy \| DoNotDisturb \| AppearOffline`   |
| `PresenceResponse`                    | type  | Presence snapshot (effective status, override, `lastSeenUtc`)         |
| `SetPresenceRequest`                  | type  | `PUT /presence/my` body (manual status + optional `untilUtc`)         |
| `HeartbeatRequest`                    | type  | `POST /presence/my/poll` body (`idleSeconds`)                         |
| `BatchPresenceRequest`                | type  | `POST /presence/users/batch` body (`userIds`)                         |
| `BatchPresenceResponse`               | type  | Batch result keyed by `userId` (unknown users → Offline)              |
| `HeartbeatRoomRequest`                | type  | Room heartbeat body (opaque `metadata`, ≤ 512 bytes)                  |
| `ResourceRoomResponse`                | type  | A room's `kind`/`id` + participant list                               |
| `ResourcePresenceParticipantResponse` | type  | One room participant (`userId`, `lastSeenUtc`, `metadata`)            |
| `getMyPresence`                       | fn    | `GET {basePath}/presence/my`                                          |
| `setMyPresence`                       | fn    | `PUT {basePath}/presence/my` (set manual override)                    |
| `clearMyPresenceOverride`             | fn    | `DELETE {basePath}/presence/my/override`                              |
| `pollMyPresence`                      | fn    | `POST {basePath}/presence/my/poll` (heartbeat)                        |
| `getUserPresence`                     | fn    | `GET {basePath}/presence/users/{userId}` (never 404s)                 |
| `getBatchPresence`                    | fn    | `POST {basePath}/presence/users/batch`                                |
| `normalizeUserIds`                    | fn    | Dedupe + drop empties + sort a list of `UserId`                       |
| `joinResourceRoom`                    | fn    | `POST {basePath}/presence/rooms/{kind}/{id}/heartbeat`                |
| `getResourceRoom`                     | fn    | `GET {basePath}/presence/rooms/{kind}/{id}` (may 404)                 |
| `leaveResourceRoom`                   | fn    | `DELETE {basePath}/presence/rooms/{kind}/{id}` (idempotent)           |
| `PresencePermissions`                 | const | Permission string constants (`Self`, `Users`, `Rooms`)                |
| `PRESENCE_DEFAULTS`                   | const | Server-default thresholds (offline/away/idle/batch/override)          |

## Caveats

- **Client-side validation is a fast-fail, not the authority.** The room API
  validates `kind` (`/^[a-z][a-z0-9_.-]{0,63}$/`), `id` (≤ 256 chars) and
  `metadata` (≤ 512 bytes UTF-8) and throws `TypeError` before the request
  leaves the browser; the backend re-validates everything. Likewise the
  override rules documented on `SetPresenceRequest` (`untilUtc` must be future,
  within `MaxOverrideDuration`) are server-enforced — the front only
  short-circuits to avoid a guaranteed 422.

- **`Offline` is a value, never a 404.** `getUserPresence` and the batch lookup
  return an Offline snapshot with `lastSeenUtc = null` for users the server has
  never seen; `getResourceRoom`/`joinResourceRoom`, by contrast, **can** return
  404 when the visibility policy blocks the room or it has been dissolved —
  handle that case explicitly.

- **Privacy.** `AppearOffline` is a manual override the user controls; the
  backend reports it as `Offline` to other users while still accepting the
  owner's own reads. Room `metadata` is opaque to this layer — never put PII or
  secrets in it, since every room participant can read it.

- **Server defaults are a mirror, not a source of truth.** `PRESENCE_DEFAULTS`
  duplicates the `Granit.Presence` `PresenceOptions` defaults so React hooks can
  align poll cadence with the offline threshold without re-querying config. If
  the backend is reconfigured these constants drift — treat them as hints, and
  rely on the server's own clamping for correctness.

## Out of scope

- **React Query hooks, the heartbeat scheduler and headless components** — see
  [`@granit/react-presence`](../react-presence).
- **Live-presence demo page** — composed in the showcase app's playground
  (`granit-showcase-react`) from the headless `@granit/react-presence` parts.
- **Real-time push** (SignalR/SSE fan-out of status changes) — this package is
  request/response only; subscribe via the realtime transport instead of
  polling other users.

## License

Apache-2.0
