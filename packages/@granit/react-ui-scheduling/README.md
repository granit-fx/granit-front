# @granit/react-ui-scheduling

Admin UI feature kit for the Granit **Scheduling** module — a query-driven
scheduled-actions list (status badges, smart filters, sortable columns, per-row
cancel / reschedule) plus the action detail view with its cancel-confirmation and
reschedule dialogs.

This is the **react-ui admin feature kit** layer: it renders. It composes the
headless [`@granit/react-scheduling`](../react-scheduling) (provider + query/mutation
hooks) with the foundation UI packages ([`@granit/react-ui`](../react-ui) shadcn
primitives, [`@granit/react-ui-kit`](../react-ui-admin-kit) grid + smart-filter
chrome) and the [`@granit/react-query-engine`](../react-query-engine) discovery
surface, gating management actions through
[`@granit/react-authorization`](../react-authorization) `usePermissions`.

The split is three packages over the same .NET `Granit.Scheduling` backend (contract:
`contracts/openapi/scheduling.json`):

- [`@granit/scheduling`](../scheduling) — framework-agnostic core: DTOs
  (`ScheduledActionResponse`, `RescheduleActionRequest`), Axios calls
  (`listScheduledActions`, `cancelScheduledAction`, …), `SchedulingPermissions`,
  `ScheduledActionStatus`, and `SCHEDULING_STATUS_COLORS`.
- [`@granit/react-scheduling`](../react-scheduling) — React Query hooks +
  `SchedulingProvider`. Headless: no rendering.
- `@granit/react-ui-scheduling` (this package) — the admin pages, columns,
  status badge, and bundled `Scheduling.*` strings.

## Install

Workspace-internal — consumed via the `@granit/*` Vite/Vitest aliases, not published
for app consumption through a public registry. A consumer must declare these peers:

- `@granit/react-scheduling` — provider + cancel/reschedule/detail hooks the pages drive.
- `@granit/scheduling` — `SchedulingPermissions`, `ScheduledActionStatus`,
  `SCHEDULING_STATUS_COLORS`, and the `ScheduledActionResponse` DTO.
- `@granit/react-ui` — shadcn primitives (Card, Dialog, AlertDialog, Badge, …).
- `@granit/react-ui-kit` — `QueryDataTable`, `SmartFilterBar`, `FilterPresets`,
  `SortSelector` and the smart-filter sync helpers.
- `@granit/react-query-engine` + `@granit/query-engine` — the query endpoint, metadata,
  and smart-filter state for the list grid.
- `@granit/react-authorization` — `usePermissions`, gating cancel / reschedule.
- `@granit/react-localization` — `useTranslation`, `useDateFormatter`.
- `@granit/types` — `toEntityId` / `toISODateString` branded helpers.
- `@granit/utils` — `cn` class merge.
- `@tanstack/react-table` (`^8.21`) — column model for the grid.
- `react` / `react-dom` (`^19`), `react-router-dom` (`^7.18`) for list ↔ detail
  navigation, and `lucide-react` (`^1.21`) icons.

The pages resolve the Axios client from a `GranitClientProvider` higher in the tree
(via `@granit/react-api-client`); no client is baked in.

## Quick start

The pages wrap their own `SchedulingProvider` and (for the list) `QueryProvider`, so a
consumer only mounts them under a `GranitClientProvider` and registers the strings.

```tsx
import {
  SchedulingDetailPage,
  SchedulingListPage,
  schedulingTranslationsEn,
} from '@granit/react-ui-scheduling';
import { Route, Routes } from 'react-router-dom';

// Flat `Scheduling.*` keys in the `translation` namespace — register with the
// key/nesting separators disabled so the dotted keys are looked up verbatim.
i18n.addResourceBundle('en', 'translation', schedulingTranslationsEn, true, true);

function SchedulingRoutes() {
  return (
    <Routes>
      <Route path="/scheduling" element={<SchedulingListPage />} />
      <Route path="/scheduling/:id" element={<SchedulingDetailPage />} />
    </Routes>
  );
}
```

`SchedulingListPage` queries `/api/v1/scheduling/scheduled-actions` through the query
engine; `SchedulingDetailPage` reads `:id` from the router and polls the action every
10 s while it is pending. Both surface cancel / reschedule only when
`usePermissions().hasPermission(SchedulingPermissions.Actions.Manage)` is true, and
only for actions in the `Pending` status. To embed scheduling status into a bespoke
grid, reuse the building blocks directly:

```tsx
import {
  SchedulingStatusBadge,
  createSchedulingColumns,
} from '@granit/react-ui-scheduling';
import type { ScheduledActionResponse } from '@granit/scheduling';

const columns = createSchedulingColumns({
  t,
  formatDateTime,
  onCancel: (action: ScheduledActionResponse) => openCancelDialog(action),
  onReschedule: (action) => openRescheduleDialog(action),
  canManage,          // omits the per-row actions column when false
  isMutating,         // disables row actions while a mutation is in flight
});
```

## Public API

| Symbol                     | Kind      | Purpose                                                             |
| -------------------------- | --------- | ------------------------------------------------------------------- |
| `SchedulingListPage`       | component | Self-contained list page: query grid, filters, sort, manage dialogs |
| `SchedulingDetailPage`     | component | Self-contained detail page: fields, cancel/reschedule, 10s poll     |
| `SchedulingStatusBadge`    | component | Maps `ScheduledActionStatus` to a `Badge` color/variant + label     |
| `createSchedulingColumns`  | fn        | Builds `ColumnDef<ScheduledActionResponse>[]` for a TanStack grid   |
| `schedulingTranslationsEn` | const     | English `Scheduling.*` strings (flat dotted keys)                   |
| `schedulingTranslationsFr` | const     | French `Scheduling.*` strings (flat dotted keys)                    |

Both pages are self-wiring — they mount their own `SchedulingProvider` (and the list
its `QueryProvider`), so they need no scheduling-specific context above them, only the
shared `GranitClientProvider`, an i18n instance, and an `AuthorizationProvider`.

## Out of scope / caveats

- **Headless logic lives below.** Provider, query keys, and the
  cancel/reschedule/list/detail hooks are [`@granit/react-scheduling`](../react-scheduling);
  DTOs, Axios calls, permissions, and the status-color map are
  [`@granit/scheduling`](../scheduling). This package only renders them — do not add
  HTTP or query logic here.
- **Permission checks are a UX hint, not a security boundary.** Hiding the cancel /
  reschedule controls behind `SchedulingPermissions.Actions.Manage` only declutters the
  UI; `Granit.Scheduling` re-checks authorization on every endpoint. Never treat a
  hidden control as enforcement.
- **i18n registration is the host's job.** The bundled strings use flat dotted keys
  (`Scheduling.Status.Pending`, …) and must be registered with i18next's key/nesting
  separators disabled, or the dotted lookups will not resolve.
- **No saved views / no create.** The grid is read-plus-manage only: there is no
  create-action flow (actions are scheduled by the backend) and no saved-view surface;
  reschedule and cancel are the only mutations, both limited to `Pending` actions.
- **Datetime input is browser-local.** The reschedule dialog uses a
  `datetime-local` input and wraps the value in `toISODateString` before sending; the
  `min` is clamped to now to block past dates client-side.

## License

Apache-2.0
