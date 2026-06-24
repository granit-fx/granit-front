# @granit/react-scheduling

React hooks + provider for the Granit **scheduling** module — listing, inspecting,
cancelling and rescheduling deferred (scheduled) actions. This is the **React hooks
layer**: it wraps the framework-agnostic Axios calls and DTOs from
[`@granit/scheduling`](../scheduling) in TanStack Query hooks behind a shared
`SchedulingProvider` for client / base-path / query-key configuration. It holds no
rendering — grids, badges, and detail pages live one layer up.

The split is three packages over the same .NET `Granit.Scheduling` backend (contract:
`contracts/openapi/scheduling.json`):

- [`@granit/scheduling`](../scheduling) — framework-agnostic core: DTOs
  (`ScheduledActionResponse`, `RescheduleActionRequest`, `ScheduledActionStatus`) +
  Axios functions (`listScheduledActions`, `cancelScheduledAction`, …).
- `@granit/react-scheduling` (this package) — React Query hooks + provider.
- [`@granit/react-ui-scheduling`](../react-ui-scheduling) — admin UI kit: the
  query-driven scheduled-actions grid (status badges, smart filters, per-row
  cancel/reschedule) plus the action detail page with cancel/reschedule dialogs.

A scheduled action is a deferred unit of work the backend executes at `executeAt`. The
list endpoint is a [`@granit/query-engine`](../query-engine) surface (pagination,
filters, sort, presets); mutations are limited to `Pending` actions (cancel, reschedule)
and the backend answers `409` once an action has been processed.

## Install

Workspace-internal — consumed via the `@granit/*` Vite/Vitest aliases, not published for
app consumption through a public registry. A consumer must declare these peers:

- `@granit/scheduling` — core DTOs + Axios calls this layer wraps.
- `@granit/api-client` — supplies the `AxiosInstance` (CSRF, auth, tenant interceptors).
- `@granit/react-api-client` — `useOptionalGranitClient`, the context fallback for the
  Axios client when `config.client` is omitted.
- `@granit/query-engine` (**optional**) — `PagedResult` / `QueryRequest` for the list
  surface.
- `@granit/react-query-engine` (**optional**) — only for the grid wiring consumed by the
  UI kit and the `/testing` `createQueryMetaHandler`.
- `@tanstack/react-query` (`^5`) and `react` (`^19`).
- `msw` (`^2.12`, **optional**) — only for the `@granit/react-scheduling/testing` subpath.

## Quick start

Wire the provider once (it resolves the Axios client, base path, and an optional
query-key prefix), then call the hooks anywhere below it.

```tsx
import { SchedulingProvider, useScheduledActions } from '@granit/react-scheduling';
import { useGranitClient } from '@granit/react-api-client';

function App({ children }: { children: React.ReactNode }) {
  // `client` may be omitted if a <GranitClientProvider> is already mounted.
  return (
    <SchedulingProvider config={{ client: useGranitClient() }}>
      {children}
    </SchedulingProvider>
  );
}

function ScheduledActionsList() {
  // Paginated QueryEngine surface; polls every 15 s by default to track scheduler state.
  const { data, isLoading } = useScheduledActions({ request: { page: 1, pageSize: 20 } });
  if (isLoading) return null;

  return (
    <ul>
      {data?.items.map((action) => (
        <li key={action.id}>
          {action.payloadType} — {action.status} @ {action.executeAt}
        </li>
      ))}
    </ul>
  );
}
```

`useScheduledActions` and `useScheduledAction` poll every 15 seconds by default (pass
`refetchInterval: false` to stop, or a number to override). Mutations only succeed on
`Pending` actions and invalidate the list (and the detail, for reschedule) on success:

```tsx
import {
  useCancelScheduledAction,
  useRescheduleScheduledAction,
} from '@granit/react-scheduling';

function RowActions({ id }: { id: string }) {
  const { mutate: cancel, isPending: cancelling } = useCancelScheduledAction();
  const { mutate: reschedule } = useRescheduleScheduledAction();

  return (
    <>
      <button type="button" disabled={cancelling} onClick={() => cancel(id)}>
        Cancel
      </button>
      <button
        type="button"
        onClick={() => reschedule({ id, request: { newExecuteAt: '2026-04-10T09:00:00Z' } })}
      >
        Reschedule
      </button>
    </>
  );
}
```

## Public API

| Symbol                         | Kind     | Purpose                                                                 |
| ------------------------------ | -------- | ----------------------------------------------------------------------- |
| `SchedulingProvider`           | provider | Supplies client, base path, query-key prefix to all hooks below it      |
| `useSchedulingConfig`          | hook     | Read the resolved config; throws outside a provider                     |
| `useScheduledActions`          | hook     | `GET .../scheduled-actions` — paginated QueryEngine list (15 s poll)    |
| `useScheduledAction`           | hook     | `GET .../scheduled-actions/{id}` — single action (disabled on empty id) |
| `useCancelScheduledAction`     | hook     | `DELETE .../scheduled-actions/{id}` — cancel a pending action           |
| `useRescheduleScheduledAction` | hook     | `PUT .../scheduled-actions/{id}/reschedule` — move execution time       |
| `buildSchedulingQueryKey`      | fn       | Query-key factory honoring the configured `queryKeyPrefix`              |
| `SchedulingConfig`             | type     | Provider input (optional client / basePath / queryKeyPrefix)            |
| `ResolvedSchedulingConfig`     | type     | Provider output with the resolved required client + basePath            |
| `SchedulingProviderProps`      | type     | `{ config, children }`                                                  |
| `SchedulingListOptions`        | type     | `useScheduledActions` options (`request`, `refetchInterval`)            |
| `RescheduleVariables`          | type     | `{ id, request }` mutation variables for reschedule                     |

`./testing` subpath (requires the optional `msw` peer): `createSchedulingHandlers`
(stateful MSW handlers, default base `/api/v1/scheduling` — cancel/reschedule mutate the
in-memory store and enforce the `Pending`-only `409` rule), the
`scheduledActionQueryMetadata` `/meta` fixture, and the `mockScheduledActions` data array.

## Caveats

- **Polling, not push.** Both query hooks refetch every 15 s to approximate live
  scheduler state; there is no SSE/WebSocket transport here. Tune `refetchInterval`
  (number) or disable it (`false`) per surface to control request volume.
- **`Pending`-only mutations.** Cancel and reschedule succeed only while an action is
  `Pending`; once it is `Processing` / `Executed` / `Cancelled` / `Failed` the backend
  returns `409`. Surface that conflict in the UI — the hooks propagate it as a rejected
  mutation.
- **Reschedule returns no body.** `PUT .../reschedule` answers `200` with an empty body
  (matching the backend contract); the hook invalidates the list and the action detail to
  pull the new `executeAt` rather than reading it from the response.

## Out of scope

- **Rendering** — the scheduled-actions grid, status badges, columns, and the detail page
  with its cancel/reschedule dialogs live in
  [`@granit/react-ui-scheduling`](../react-ui-scheduling). This package is headless.
- **DTOs, HTTP transport, status colors/labels, and permissions** — owned by
  [`@granit/scheduling`](../scheduling) (mirror of `Granit.Scheduling`), including
  `SchedulingPermissions` and `SCHEDULING_STATUS_COLORS` / `SCHEDULING_STATUS_LABELS`.
  Hooks here only adapt the Axios calls to React Query.
- **Creating / enqueuing actions** — scheduled actions are produced by backend domain
  modules; this surface only lists, inspects, cancels, and reschedules existing ones.

## License

Apache-2.0
