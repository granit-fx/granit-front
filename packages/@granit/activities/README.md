# @granit/activities

Cross-entity polymorphic **to-do / activity** SDK — the framework-level
TypeScript counterpart of the .NET `Granit.Activities` module. It exposes the
DTO types, HTTP client and permission catalog needed to drive activities from
any client (React, React Native, a CLI, tests). It holds **no** React, DOM or
Node-only dependency.

An activity is a typed task (`type`) pinned to any host aggregate via the
polymorphic `(entityType, entityId)` pair — the same module backs to-dos on
parties, documents, leads or any other entity. The lifecycle is `Open` →
`Done`/`Cancelled`, with reassign and reschedule transitions in between;
`Overdue` is a computed view (`Open` + past `dueAt`), never a persisted status.

The React layer (provider, React Query hooks, list/calendar/side-panel
components, i18n, notification wiring) lives in
[`@granit/react-activities`](../react-activities).

## Install

Workspace-internal — consumed via the `@granit/*` Vite/Vitest aliases. Declare
these peers:

- `@granit/api-client` — the centralized Axios client (CSRF, auth, tenant).
- `@granit/types` — branded `ISODateString` used on timestamp fields.

## Quick start

```ts
import {
  createActivity,
  listActivities,
  completeActivity,
  getActivitiesCalendar,
  ActivitiesPermissions,
  type CreateActivityRequest,
} from '@granit/activities';
import { toISODateString } from '@granit/types';

// `basePath` is the activities collection root (see `DEFAULT_BASE_PATH` in
// @granit/react-activities). The (entityType, entityId) pair pins the activity
// to any host aggregate, so the same calls work across modules.
const basePath = '/api/v1/activities';

// Create a to-do against a party.
const draft: CreateActivityRequest = {
  entityType: 'Acme.Parties',
  entityId: partyId,
  type: 'follow-up-call',
  assignedToUserId: userId,
  dueAt: toISODateString('2026-07-01T09:00:00Z'),
  description: 'Confirm onboarding documents',
};
const created = await createActivity(client, basePath, draft);

// List open / overdue activities for the current user.
const page = await listActivities(client, basePath, {
  assignedToUserId: userId,
  status: 'OpenOrOverdue',
  page: 1,
  pageSize: 50,
});

// Mark it done — body is empty; the server resolves actor + timestamp.
await completeActivity(client, basePath, created.id, {});

// Cross-entity calendar window (from / to required).
const events = await getActivitiesCalendar(client, basePath, {
  from: toISODateString('2026-07-01T00:00:00Z'),
  to: toISODateString('2026-07-31T00:00:00Z'),
  assignee: 'me',
});

// Permission keys for client-side UX gating (enforcement stays server-side).
ActivitiesPermissions.Activities.ReadOthers; // 'Activities.Activities.ReadOthers'
```

## Public API

### Functions (`api/activities-api`)

Every call takes `(client: AxiosInstance, basePath: string, …)` and returns the
parsed response body.

| Symbol                   | Kind | Purpose                                                  |
| ------------------------ | ---- | -------------------------------------------------------- |
| `listActivities`         | fn   | `GET {basePath}` — paginated, filtered list              |
| `getActivity`            | fn   | `GET {basePath}/{id}` — single activity                  |
| `createActivity`         | fn   | `POST {basePath}` — create a to-do                       |
| `completeActivity`       | fn   | `POST {basePath}/{id}/complete` (empty body)             |
| `cancelActivity`         | fn   | `POST {basePath}/{id}/cancel` (empty body)               |
| `reassignActivity`       | fn   | `PUT {basePath}/{id}/assignee` — change assignee         |
| `rescheduleActivity`     | fn   | `PUT {basePath}/{id}/due-date` — change `dueAt`          |
| `getActivitiesCalendar`  | fn   | `GET {basePath}/calendar` — cross-entity calendar window |

### Permissions

| Symbol                  | Kind  | Purpose                                                |
| ----------------------- | ----- | ------------------------------------------------------ |
| `ActivitiesPermissions` | const | `Activities.Activities.*` permission key catalog       |

Keys: `Read`, `ReadOthers` (list peers' activities), `Manage`, `Reassign`,
`Execute`.

### Types (`types/index`)

| Symbol                         | Kind | Purpose                                                  |
| ------------------------------ | ---- | -------------------------------------------------------- |
| `ActivityResponse`             | type | A single activity (lifecycle + polymorphic host)         |
| `ActivityListResponse`         | type | Paginated `items` + `totalCount` / `page` / `pageSize`   |
| `ActivityListFilter`           | type | Query axes for `listActivities` (all optional)           |
| `ActivityCalendarItemResponse` | type | One calendar event (`start` / `end` / `color`)           |
| `ActivityCalendarFilter`       | type | Calendar query (`from` / `to` required)                  |
| `ActivityCalendarColor`        | type | `'open' \| 'overdue' \| 'done' \| 'cancelled'`           |
| `ActivityStatus`               | type | `'Open' \| 'Done' \| 'Cancelled'` (persisted)            |
| `ActivityStatusFilter`         | type | `'OpenOrOverdue' \| 'Done' \| 'Cancelled'` (wire filter) |
| `CreateActivityRequest`        | type | `createActivity` body                                    |
| `CompleteActivityRequest`      | type | Empty body (`Record<string, never>`)                     |
| `CancelActivityRequest`        | type | Empty body (`Record<string, never>`)                     |
| `ReassignActivityRequest`      | type | `{ newAssigneeUserId }`                                  |
| `RescheduleActivityRequest`    | type | `{ newDueAt }`                                           |

## Out of scope / caveats

- **Status is two distinct axes.** `ActivityStatus` is the persisted value (3
  terminal states). `ActivityStatusFilter` is the wire filter accepted by
  list/calendar; `OpenOrOverdue` folds the computed `Overdue` view back into
  `Open`. There is no `All` value — omit the filter to match every status.
- **Complete / cancel bodies are empty by contract.** The completion /
  cancellation timestamp and actor are resolved server-side (`IClock` +
  `ClaimsPrincipal`) for audit integrity; clients cannot supply them.
- **Authorization is enforced backend-side.** `ActivitiesPermissions` is for UX
  gating only — listing peers' activities requires
  `Activities.Activities.ReadOthers`, and activities pinned to hosts the caller
  cannot read are filtered out server-side. Never treat these keys as a security
  boundary.
- **No React / query-key / config here.** Providers, React Query hooks, UI
  components, i18n bundles and notification wiring live in
  [`@granit/react-activities`](../react-activities). This package is the pure
  data layer.

## License

Apache-2.0
