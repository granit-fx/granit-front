# @granit/scheduling

Scheduled-action types and HTTP client — the framework-level TypeScript
counterpart of the .NET `Granit.Scheduling` module
(contract: `contracts/openapi/scheduling.json`). A scheduled action is a
deferred, server-side job (a typed payload to run at `executeAt`); this package
exposes the read/list/cancel/reschedule surface over those actions.

This is the framework-agnostic **core** layer: it ships the DTOs, the
QueryEngine-backed Axios functions, the status enum, UI-neutral status mappings,
and the permission constants needed to drive scheduling from any client — React,
React Native, a CLI, tests. It holds **no** React, DOM or Node-only dependency.
The React hooks/providers layer lives in
[`@granit/react-scheduling`](../react-scheduling); the admin feature kit (the
scheduled-actions grid plus cancel/reschedule dialogs) lives in
[`@granit/react-ui-scheduling`](../react-ui-scheduling).

## Install

Workspace-internal — consumed via the `@granit/*` Vite/Vitest aliases, not
published for app consumption through a public registry. A consumer must declare
these peers:

- `@granit/api-client` — supplies the `AxiosInstance` (CSRF, auth, tenant
  interceptors) passed into every call.
- `@granit/query-engine` — `getPage`, `QueryRequest`, `PagedResult` for the
  paginated/filterable/sortable list surface.
- `@granit/types` — shared branded base types (`EntityId`, `CorrelationId`,
  `ISODateString`).

## Quick start

`basePath` is the scheduled-actions collection root
(`/api/v1/scheduling/scheduled-actions`); every call composes paths beneath it.

```ts
import {
  listScheduledActions,
  getScheduledActionById,
  cancelScheduledAction,
  rescheduleScheduledAction,
  ScheduledActionStatus,
  SCHEDULING_STATUS_COLORS,
} from '@granit/scheduling';
import { toISODateString } from '@granit/types';

const basePath = '/api/v1/scheduling/scheduled-actions';

// 1. List — paginated/filterable/sortable via QueryEngine (GET {basePath}).
const page = await listScheduledActions(client, basePath, {
  page: 1,
  pageSize: 20,
});
const pending = page.items.filter((a) => a.status === ScheduledActionStatus.Pending);

// 2. Read one (GET {basePath}/{id}).
const action = await getScheduledActionById(client, basePath, pending[0]!.id);
const badge = SCHEDULING_STATUS_COLORS[action.status]; // 'blue' | 'green' | ...

// 3. Reschedule a pending action (PUT {basePath}/{id}/reschedule).
await rescheduleScheduledAction(client, basePath, action.id, {
  newExecuteAt: toISODateString('2026-07-01T09:00:00Z'),
});

// 4. Cancel a pending action (DELETE {basePath}/{id}).
await cancelScheduledAction(client, basePath, action.id);
```

## Public API

| Symbol | Kind | Purpose | | | | |
| --------------------------- | ----- | ----------------------------------------------------------- | | | | |
| `ScheduledActionStatus` | type | `'Pending' \                                                | 'Executed' \ | 'Cancelled' \ | 'Failed' \ | 'Processing'` |
| `ScheduledActionStatus` | const | Value object mirroring the enum (PascalCase members) | | | | |
| `ScheduledActionId` | type | Branded `EntityId<'ScheduledAction'>` | | | | |
| `ScheduledActionResponse` | type | Response DTO (payload type, schedule, status, audit fields) | | | | |
| `RescheduleActionRequest` | type | `{ newExecuteAt }` body for the reschedule call | | | | |
| `listScheduledActions` | fn | `GET {basePath}` via QueryEngine returning a `PagedResult` | | | | |
| `getScheduledActionById` | fn | `GET {basePath}/{id}` returning one action | | | | |
| `cancelScheduledAction` | fn | `DELETE {basePath}/{id}` — cancels a pending action | | | | |
| `rescheduleScheduledAction` | fn | `PUT {basePath}/{id}/reschedule` — moves `executeAt` | | | | |
| `SCHEDULING_STATUS_COLORS` | const | Status → badge color (`blue`/`green`/`gray`/`red`/`amber`) | | | | |
| `SCHEDULING_STATUS_LABELS` | const | Status → human-readable label | | | | |
| `SchedulingPermissions` | const | `Actions.Read` / `Actions.Manage` permission names | | | | |

The list surface also exposes a `GET {basePath}/meta` query-metadata endpoint;
fetch it with `getQueryMeta` from [`@granit/query-engine`](../query-engine) (the
React hooks layer wraps both).

## Out of scope / caveats

- **Headless.** No React, no rendering. Query hooks live in
  [`@granit/react-scheduling`](../react-scheduling); the grid, status badges and
  cancel/reschedule dialogs live in
  [`@granit/react-ui-scheduling`](../react-ui-scheduling).
- **Lifecycle is server-owned.** Actions are created and executed by the
  backend (`Granit.Scheduling`) from a typed payload; this package only reads,
  lists, cancels, and reschedules them — there is no client-side "schedule a new
  action" call here.
- **Cancel/reschedule target pending actions.** Both mutate state that the
  server validates: a non-pending action (already `Executed`/`Cancelled`/…)
  yields `409`, an unknown id yields `404`. The functions return `void`; surface
  those statuses from the rejected promise.
- **Optionality follows the contract.** Nullable response fields
  (`correlationId`, `executedAt`, `cancelledBy`, `failureReason`, `modifiedAt`)
  are `T | null` per `contracts/openapi/scheduling.json` — present keys, nullable
  values — not optional `?` properties.
- **Permission checks are UX hints.** `SchedulingPermissions.Actions.Read` /
  `Actions.Manage` gate controls in the UI; the .NET backend re-checks
  authorization on every endpoint and is the only enforcement boundary.

## License

Apache-2.0
