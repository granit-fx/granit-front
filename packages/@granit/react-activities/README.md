# @granit/react-activities

React bindings for the cross-entity **activities** (polymorphic to-do) module —
provider, React Query hooks, headless components, and a notifications/router
integration over the framework-agnostic [`@granit/activities`](../activities)
core. Backend counterpart: `Granit.Activities`
(`Granit.Activities.Endpoints`, `/api/v1/activities`; contract snapshot at
`contracts/openapi/activities.json`).

This is the **React hooks + providers** layer. The core layer
([`@granit/activities`](../activities)) owns the wire types, the Axios calls
(`listActivities`, `getActivity`, `getActivitiesCalendar`, `createActivity`,
`completeActivity`, `cancelActivity`, `reassignActivity`,
`rescheduleActivity`) and the `ActivitiesPermissions` catalog; this package
adds `<ActivitiesProvider>`, the `useActivit*` query/mutation hooks, headless
components, the `@granit/react-entities` side-panel contribution, and i18n
bundles. There is no `react-ui-activities` admin feature kit — the components
here are headless (minimal HTML + `data-granit-activity-*` markers) and apps
supply their own design-system chrome.

## Install

Workspace-internal — consumed via the `@granit/*` Vite/Vitest aliases, not
published to a public registry for app consumption. Declare these peers (read
from `peerDependencies`):

- `@granit/activities` — core types, API client, permissions (required).
- `@granit/api-client` — supplies the `AxiosInstance` (CSRF, auth, tenant
  interceptors).
- `@granit/react-api-client` — `useOptionalGranitClient`, the fallback source
  for the provider's client.
- `@granit/types` — branded `ISODateString` / `toISODateString`.
- `@tanstack/react-query` (`^5`) and `react` (`^19`).

Optional peers (declared `optional` in `peerDependenciesMeta`):

- `@granit/react-entities` + `@granit/entities` — only for the
  `activitiesSidePanel` `EntityDetail` contribution.
- `@granit/notifications` — only for the notification type guards / router.
- `msw` — only for the `@granit/react-activities/testing` MSW handlers.

## Quick start

```tsx
import {
  ActivitiesProvider,
  ActivityList,
  ActivityDetailPanel,
  useCompleteActivity,
  activitiesTranslationsEn,
} from '@granit/react-activities';

// 1. Wire the provider. `config.client` is optional — when omitted, the
// provider resolves the Axios client from the nearest <GranitClientProvider>.
// basePath defaults to /api/v1/activities; queryKeyPrefix to ['activities'].
function App() {
  return (
    <ActivitiesProvider config={{}}>
      <Inbox />
    </ActivitiesProvider>
  );
}

// 2. Headless list + a mutation. Omitting an action callback hides the
// matching row button — apps gate rendering by their own permission system.
function Inbox() {
  const complete = useCompleteActivity();

  return (
    <ActivityList
      filter={{ status: 'OpenOrOverdue' }}
      onComplete={(a) => complete.mutate({ id: a.id, request: {} })}
      actionLabels={{ complete: activitiesTranslationsEn.Action.Complete }}
    />
  );
}

// 3. A detail panel loads one activity by id; renders nothing until non-empty.
function Detail({ id }: { id: string }) {
  return <ActivityDetailPanel activityId={id} />;
}
```

## Public API

| Symbol                                                | Kind      | Purpose                                             |
| ----------------------------------------------------- | --------- | --------------------------------------------------- |
| `ActivitiesProvider`                                  | provider  | Resolves Axios client, basePath, query-key prefix   |
| `useActivitiesConfig`                                 | hook      | Resolved config from the nearest provider           |
| `buildActivitiesQueryKey`                             | fn        | Query-key factory: `[...prefix, ...segments]`       |
| `ActivitiesConfig`                                    | type      | Raw provider config (client/basePath optional)      |
| `ResolvedActivitiesConfig`                            | type      | Config after client/basePath/prefix resolution      |
| `ActivitiesProviderProps`                             | type      | `<ActivitiesProvider>` props                        |
| `useActivities`                                       | hook      | Paged list (`GET {base}`); filter folded into key   |
| `useActivity`                                         | hook      | One activity (`GET {base}/{id}`); off when id empty |
| `useActivitiesCalendar`                               | hook      | Calendar window (`GET {base}/calendar`); 60s stale  |
| `useCreateActivity`                                   | hook      | Create; invalidates list + calendar                 |
| `useCompleteActivity`                                 | hook      | Complete; invalidates list + calendar + detail(id)  |
| `useCancelActivity`                                   | hook      | Cancel; invalidates list + calendar + detail(id)    |
| `useReassignActivity`                                 | hook      | Reassign (`PUT .../assignee`); same invalidation    |
| `useRescheduleActivity`                               | hook      | Reschedule (`PUT .../due-date`); same invalidation  |
| `ActivityList`                                        | component | Headless paged table; per-row action callbacks      |
| `ActivityDetailPanel`                                 | component | Headless single-activity panel with action buttons  |
| `ActivityCalendar`                                    | component | Headless day/week/month calendar; no drag           |
| `ActivitiesSidePanel`                                 | component | Per-entity panel, filtered `OpenOrOverdue`          |
| `Activity*Props` / `*Labels` / `ActivityCalendarView` | type      | Component prop / label / view shapes                |
| `activitiesSidePanel`                                 | fn        | Factory → `EntitySidePanel` for `Activities` slot   |
| `ActivitiesSidePanelContributionOptions`              | type      | Action wiring for `activitiesSidePanel`             |
| `ActivityNotificationTypes`                           | const     | `Activities.Activity.{Assigned,Reminder,Overdue}`   |
| `ACTIVITY_NOTIFICATION_RELATED_ENTITY_TYPE`           | const     | `relatedEntityType` marker (`'Activity'`)           |
| `isActivityNotification` (+ 3 variant guards)         | fn        | Type guards over `ActivityNotificationLike`         |
| `resolveActivityNotificationAction`                   | fn        | Notification → click-through action                 |
| `ActivityNotificationType` / `*Action` / `*Like`      | type      | Notification union / action / input shape           |
| `activitiesTranslationsEn` / `*Fr`                    | const     | i18next bundles (namespace `'activities'`)          |
| `ActivitiesTranslations`                              | type      | Shape of the translation bundle                     |
| `API_VERSION` / `MODULE` / `DEFAULT_*`                | const     | Module constants (`/api/v1/activities`)             |

A `@granit/react-activities/testing` subpath ships `mockActivities`,
`mockActivityCalendarItems`, and `createActivitiesHandlers(baseUrl?)` — stateful
MSW handlers mirroring `Granit.Activities.Endpoints` so writes are reflected by
subsequent reads.

## i18n

Components ship English defaults baked in and accept `labels` / `actionLabels`
props for overrides — apps wire `t()` results from the catalogs. The components
never call `useTranslation` themselves, which keeps them testable without an
i18next bootstrap and lets apps own when/how i18n mounts.

```tsx
import {
  ActivityList,
  activitiesTranslationsEn,
  activitiesTranslationsFr,
} from '@granit/react-activities';
import { useTranslation } from 'react-i18next';

// At app boot
i18n.addResourceBundle('en', 'activities', activitiesTranslationsEn);
i18n.addResourceBundle('fr', 'activities', activitiesTranslationsFr);

// In a component
const { t } = useTranslation('activities');

<ActivityList
  actionLabels={{
    complete: t('Action.Complete'),
    cancel: t('Action.Cancel'),
    reassign: t('Action.Reassign'),
    reschedule: t('Action.Reschedule'),
  }}
  onComplete={/* … */}
/>;
```

## EntityDetail contribution

`activitiesSidePanel({ … })` produces the `EntitySidePanel` renderer for
`SidePanelKind === 'Activities'`. Because the `EntitySidePanel` signature only
carries `(entityName, entityId)`, action wiring must come from this opt-in
factory rather than per-render props. Merge it into the
`EntityComponentCatalog.sidePanels` map; the entity manifest's
`EntityDetailSidePanelManifest` (`kind: 'Activities'`) is what makes the slot
appear.

## Conventions

- All HTTP calls route through `@granit/api-client`'s Axios instance (CSRF /
  auth / tenant headers inherited).
- Verb naming mirrors the .NET backend: `get*` / `list*` (never `fetch*`).
- Cache-key namespacing: `['activities', 'list' | 'detail' | 'calendar', …]` so
  mutations only invalidate the layers they affect (`invalidateActivity` hits
  every `list` and `calendar` query plus the impacted `detail(id)`).

## Permission gating

Each component action callback is optional. Omit a callback to hide the matching
button — apps gate rendering by their own permission system using the core
catalog (`ActivitiesPermissions.Activities.{Read,ReadOthers,Manage,Reassign,Execute}`).
This is a UX hint only: the server still enforces authorization on every
endpoint. Anything the browser receives is reachable from DevTools, so never
fetch data the current user is not allowed to see and then hide it client-side.

## Out of scope / caveats

- **Headless by design.** Components emit minimal HTML + `data-granit-activity-*`
  markers; visual chrome (drawers, sheets, design-system buttons) is the
  consuming app's responsibility. There is no `react-ui-activities` kit.
- **Calendar color is server-supplied.** `ActivityCalendar` exposes the
  server-derived bucket (`'open' | 'overdue' | 'done' | 'cancelled'`) verbatim
  as `data-activity-color` and never recomputes it client-side; the item title
  is server-composed too.
- **Overdue is derived, not persisted.** The backend ships three lifecycle
  states (`Open` / `Done` / `Cancelled`); "overdue" is an `Open` activity past
  its due date, computed downstream — never a stored status.
- **Drag-to-reschedule is out of scope.** Apps wire pointer/drag against
  `useRescheduleActivity` with their own primitives.
- **The framework ships no create dialog.** `ActivitiesSidePanel`'s `onCreate`
  CTA only fires a callback with `{ entityName, entityId }`; apps own the create
  form/flow.
- **Notification labels/bodies are not owned here.**
  `resolveActivityNotificationAction` owns only the navigation contract; the
  backend serializes the displayed text via the standard localization pipeline.

## License

Apache-2.0
