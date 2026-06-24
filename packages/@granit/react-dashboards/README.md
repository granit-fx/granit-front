# @granit/react-dashboards

React renderer + data layer for the Granit **dashboards** module — the React
counterpart of the .NET `Granit.Dashboards` backend (HTTP surface in
`Granit.Dashboards.Endpoints`, contract `contracts/openapi/dashboards.json`).

This is the **React hooks + components layer**. It wraps the framework-agnostic
Axios calls and DTOs from [`@granit/dashboards`](../dashboards) in TanStack Query
hooks behind a `DashboardsProvider`, and ships the rendering machinery: a grid
layout component (`Dashboard`), a read-mode bundle renderer (`RenderedDashboard`),
a widget-renderer registry, the declarative widget-action dispatcher, plus
view / filter / entity-alias context. It holds no admin chrome — the catalog
list, the per-dashboard composer, and lifecycle dialogs live one layer up.

The split is four packages over the same `Granit.Dashboards` backend:

- [`@granit/dashboards`](../dashboards) — framework-agnostic core: DTOs +
  Axios functions (`renderDashboard`, `listDashboards`, `importDashboard`, …),
  the `WidgetDefinition` discriminated union, and layout primitives.
- `@granit/react-dashboards` (this package) — React Query hooks + providers +
  the renderer/registry components.
- [`@granit/react-dashboard-editor`](../react-dashboard-editor) — headless
  drag-and-drop reorderable widget grid (dnd-kit) for the composer.
- [`@granit/react-ui-dashboards`](../react-ui-dashboards) — admin UI kit:
  catalog/list, composer page, status/drift badges, lifecycle dialogs.

Two render paths sit side by side. The **definition path** (`Dashboard`)
renders a `DashboardDefinition` client-side, dispatching each `WidgetDefinition`
by its lowercase `type`. The **bundle path** (`RenderedDashboard`) fetches a
server-computed render bundle (`POST /dashboards/{id}/render`) and dispatches
each `DashboardRenderedWidget` snapshot by its PascalCase `widgetType`. The two
registries (`WidgetRegistry` vs `SnapshotWidgetRegistry`) mirror each other so
downstream packages (`@granit/react-analytics`, app-specific) register kinds on
both sides.

## Install

Workspace-internal — consumed via the `@granit/*` Vite/Vitest aliases, not
published for app consumption through a public registry. A consumer must declare
these peers:

- `@granit/dashboards` — core DTOs + Axios calls this layer wraps.
- `@granit/api-client` — supplies the `AxiosInstance` (CSRF, auth, tenant
  interceptors) and `HttpError` (drives the 4xx no-retry policy).
- `@granit/react-api-client` — `useOptionalGranitClient`, the context fallback
  for the Axios client when `config.client` is omitted.
- `@granit/utils` — `assertSafeUrl`, used by the default `Navigate` /
  `OpenDashboard` action handlers to reject unsafe URLs before navigation.
- `@granit/logger` — `createLogger` for the SSE stream's diagnostics.
- `@tanstack/react-query` (`^5`) and `react` (`^19`).
- `react-i18next` (`^17`) — widget titles, view labels, and filter labels
  resolve through `useTranslation()`.
- `msw` (`^2.12`, **optional**) — only for the `@granit/react-dashboards/testing`
  subpath.

## Quick start

Wire `DashboardsProvider` once (it resolves the Axios client, base path, and an
optional query-key prefix), plus a `WidgetRegistryProvider` so the renderer can
dispatch widget types. Then render a `DashboardDefinition` with `<Dashboard>`:

```tsx
import {
  DashboardsProvider,
  Dashboard,
  WidgetRegistryProvider,
  WidgetActionProvider,
  defaultWidgetRegistry,
} from '@granit/react-dashboards';
import { useGranitClient } from '@granit/react-api-client';
import type { DashboardDefinition } from '@granit/dashboards';

function DashboardScreen({ definition }: { definition: DashboardDefinition }) {
  // `client` may be omitted if a <GranitClientProvider> is already mounted.
  return (
    <DashboardsProvider config={{ client: useGranitClient() }}>
      <WidgetRegistryProvider registries={[defaultWidgetRegistry /* , analytics… */]}>
        <WidgetActionProvider>
          <Dashboard definition={definition} />
        </WidgetActionProvider>
      </WidgetRegistryProvider>
    </DashboardsProvider>
  );
}
```

For a **persisted** dashboard, use the bundle path: `<RenderedDashboard>` fetches
the server-computed snapshot bundle and (when any widget declares
`transport: 'Push'`) subscribes to the SSE stream, surgically merging live
snapshots into the per-widget cache. It dispatches through the **snapshot**
registry:

```tsx
import {
  DashboardsProvider,
  RenderedDashboard,
  SnapshotWidgetRegistryProvider,
  defaultSnapshotWidgetRegistry,
  useDashboardDetail,
} from '@granit/react-dashboards';

function DashboardView({ id }: { id: string }) {
  const { data: detail } = useDashboardDetail(id);
  return (
    <SnapshotWidgetRegistryProvider registries={[defaultSnapshotWidgetRegistry]}>
      <RenderedDashboard
        dashboardId={id}
        columns={detail?.layoutColumns}
        rowHeight={detail?.layoutRowHeight}
      />
    </SnapshotWidgetRegistryProvider>
  );
}
```

The lifecycle hooks drive the admin surface. The catalog lists *available
definitions*, the list lists *imported instances* (addressed by Guid), and the
lifecycle is publish/archive/restore — there is **no DELETE**:

```tsx
import {
  useDashboardCatalog,
  useDashboardList,
  useImportDashboard,
  usePublishDashboard,
  useArchiveDashboard,
} from '@granit/react-dashboards';

function CatalogPanel() {
  const { data: catalog } = useDashboardCatalog();
  const { data: instances } = useDashboardList({ status: 'Published' });
  const importMut = useImportDashboard();
  const publish = usePublishDashboard();

  // Imports start in `Draft`; publish to surface them in the catalog.
  const onImport = (definitionName: string) =>
    importMut.mutate(definitionName, {
      onSuccess: (created) => publish.mutate(created.id),
    });

  return /* render `catalog` + `instances`, wire `onImport` / archive … */ null;
}
```

## Public API

Provider + config:

| Symbol                     | Kind     | Purpose                                                         |
| -------------------------- | -------- | --------------------------------------------------------------- |
| `DashboardsProvider`       | provider | Supplies client, base path, query-key prefix to all hooks below |
| `useDashboardsConfig`      | hook     | Read the resolved config; throws outside the provider           |
| `DashboardsConfig`         | type     | Provider input (optional client / basePath / queryKeyPrefix)    |
| `ResolvedDashboardsConfig` | type     | Resolved config with required client + basePath                 |
| `DashboardsProviderProps`  | type     | `{ config, children }`                                          |

Render hooks (bundle path — `POST /dashboards/{id}/render`):

| Symbol                      | Kind | Purpose                                                             |
| --------------------------- | ---- | ------------------------------------------------------------------- |
| `useDashboardRender`        | hook | Fetch the render bundle; splits it into per-widget cache entries    |
| `useDashboardWidget`        | hook | Passive reader of one widget's per-widget cache entry (no fetch)    |
| `useWidgetRender`           | hook | `POST /widgets/{kind}/render` — single-widget render (catalog/edit) |
| `dashboardRenderQueryKey`   | fn   | Query-key factory for the bundle entry                              |
| `dashboardWidgetQueryKey`   | fn   | Query-key factory for a per-widget entry                            |
| `widgetRenderQueryKey`      | fn   | Query-key factory for a single-widget render                        |
| `UseDashboardRenderOptions` | type | `{ enabled?, refetchInterval? }`                                    |
| `UseWidgetRenderOptions`    | type | `{ enabled?, refetchInterval? }`                                    |
| `WidgetRenderContext`       | type | Period / locale / filter context for `useWidgetRender`              |
| `WidgetRenderKind`          | type | `'kpi' \| 'chart' \| 'table' \| 'pivot' \| 'map'`                   |

Push transport (SSE — `GET /dashboards/{id}/stream`):

| Symbol                      | Kind | Purpose                                                            |
| --------------------------- | ---- | ------------------------------------------------------------------ |
| `usePushedDashboard`        | hook | `useDashboardRender` + SSE; merges snapshots into per-widget cache |
| `useDashboardStream`        | hook | Low-level `EventSource` subscription; no cache writes              |
| `DashboardStreamSnapshot`   | type | Wire shape of an `event: snapshot` frame                           |
| `UseDashboardStreamOptions` | type | `{ enabled?, onSnapshot?, onResumeFailed?, onError? }`             |

Lifecycle / CRUD hooks (`Granit.Dashboards.Endpoints`):

| Symbol                                                                 | Kind | Purpose                                                           |
| ---------------------------------------------------------------------- | ---- | ----------------------------------------------------------------- |
| `useDashboardCatalog`                                                  | hook | `GET /dashboards/catalog` — available definition descriptors      |
| `useDashboardList`                                                     | hook | `GET /dashboards/` — paged persisted instances (filter by status) |
| `useDashboardDetail`                                                   | hook | `GET /dashboards/{id}` — full payload + ordered widget pool       |
| `useImportDashboard`                                                   | hook | `POST /dashboards/from-definition/{name}` — import as `Draft`     |
| `usePublishDashboard`                                                  | hook | `POST /dashboards/{id}/publish`                                   |
| `useArchiveDashboard`                                                  | hook | `POST /dashboards/{id}/archive` (replaces DELETE)                 |
| `useRestoreDashboard`                                                  | hook | `POST /dashboards/{id}/restore`                                   |
| `useResyncDashboard`                                                   | hook | `POST /dashboards/{id}/resync` — replay the source definition     |
| `useUpdateDashboardMetadata`                                           | hook | `PUT /dashboards/{id}` — name + grid layout only                  |
| `useAddWidget`                                                         | hook | `POST /dashboards/{id}/widgets`                                   |
| `useUpdateWidget`                                                      | hook | `PUT /dashboards/{id}/widgets/{widgetId}` — layout/title/config   |
| `useRemoveWidget`                                                      | hook | `DELETE /dashboards/{id}/widgets/{widgetId}`                      |
| `dashboard*QueryKey`                                                   | fn   | Catalog / list / detail query-key factories                       |
| `UseDashboardListParams`                                               | type | `{ status?, page?, pageSize? }`                                   |
| `Add/Update/RemoveWidgetVariables`, `UpdateDashboardMetadataVariables` | type | Mutation variables                                                |

Layout + dispatch components:

| Symbol                   | Kind      | Purpose                                                         |
| ------------------------ | --------- | --------------------------------------------------------------- |
| `Dashboard`              | component | Renders a `DashboardDefinition` as a CSS grid (definition path) |
| `RenderedDashboard`      | component | Read-mode bundle renderer (snapshot path), push-aware           |
| `RenderedWidget`         | component | Snapshot dispatcher: status fallbacks + registry lookup         |
| `WidgetRenderer`         | component | Definition dispatcher: registry lookup by `widget.type`         |
| `WidgetCard`             | component | Visual frame (title row + body), shadcn-Card aesthetic          |
| `DashboardViewSwitcher`  | component | Tabs-style view switcher (controlled or context-driven)         |
| `DashboardFilterToolbar` | component | Text-input toolbar for editable filters                         |

Context providers + their hooks:

| Symbol                                               | Kind          | Purpose                                             |
| ---------------------------------------------------- | ------------- | --------------------------------------------------- |
| `DashboardContextProvider` / `useDashboardContext`   | provider/hook | Dashboard identity + active time window             |
| `useDashboardTimeWindowState`                        | hook          | `[timeWindow, setTimeWindow]` state for the toolbar |
| `DashboardViewProvider` / `useDashboardView`         | provider/hook | Active view name + setter                           |
| `DashboardFilterProvider` / `useDashboardFilters`    | provider/hook | Live filter values keyed by filter name             |
| `DashboardAliasProvider` / `useDashboardAliases`     | provider/hook | Resolved entity-alias map                           |
| `WidgetActionProvider` / `useWidgetActionDispatcher` | provider/hook | Declarative widget-action dispatch                  |
| `useStableWidgetActionDispatcher`                    | hook          | Memoised dispatcher with a stable reference         |

Registries:

| Symbol                                                                                   | Kind          | Purpose                                             |
| ---------------------------------------------------------------------------------------- | ------------- | --------------------------------------------------- |
| `WidgetRegistryProvider` / `useWidgetRegistry`                                           | provider/hook | Active definition-side `WidgetRegistry`             |
| `SnapshotWidgetRegistryProvider` / `useSnapshotWidgetRegistry`                           | provider/hook | Active snapshot-side `SnapshotWidgetRegistry`       |
| `defaultWidgetRegistry`                                                                  | const         | Framework defaults: `markdown` / `image` / `text`   |
| `defaultSnapshotWidgetRegistry`                                                          | const         | Snapshot defaults: `Markdown` / `Image` / `Text`    |
| `composeRegistries` / `composeSnapshotRegistries`                                        | fn            | Layer registries (last wins per key); frozen result |
| `WidgetRegistry`, `WidgetRendererFn`, `SnapshotWidgetRegistry`, `SnapshotWidgetRenderer` | type          | Registry + renderer signatures                      |

Built-in widgets (exported for composition / overriding):

| Symbol                                                                  | Kind      | Purpose                                  |
| ----------------------------------------------------------------------- | --------- | ---------------------------------------- |
| `MarkdownWidget` / `ImageWidget` / `TextWidget`                         | component | Definition-side static-content renderers |
| `MarkdownSnapshotWidget` / `ImageSnapshotWidget` / `TextSnapshotWidget` | component | Snapshot-side mirrors                    |

Pure helpers + small hooks:

| Symbol                                                                                                                                                                                                                                      | Kind       | Purpose                                                       |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------- | ------------------------------------------------------------- |
| `resolveActiveView`                                                                                                                                                                                                                         | fn         | Pick the active view's widgets + layout (fallback chain)      |
| `applyLayoutOverride` / `resolveEffectiveLayout`                                                                                                                                                                                            | fn         | Compose breakpoint overrides over the base layout             |
| `resolveDashboardAliases` / `resolveEntityAlias` / `resolveEntityAliasResolver`                                                                                                                                                             | fn         | Resolve entity aliases against a context                      |
| `substituteAliases` / `substituteAliasesInRecord`                                                                                                                                                                                           | fn         | Expand `${alias}` placeholders in strings                     |
| `mergeFilterValuesIntoRequest`                                                                                                                                                                                                              | fn         | Fold live filter values into a render request                 |
| `expandActionParams` / `expandActionPlaceholders` / `expandActionTargetAndParams`                                                                                                                                                           | fn         | Expand `${row.x}` / `${alias}` in action params               |
| `defaultWidgetActionHandlers` / `composeWidgetActionHandlers`                                                                                                                                                                               | const/fn   | Per-kind action handlers + composition                        |
| `useEffectiveTimeWindow`                                                                                                                                                                                                                    | hook       | Resolve a widget's time window (override → context → default) |
| `useWidgetTriggerHandler`                                                                                                                                                                                                                   | hook       | `onClick`-style dispatcher for a widget's `Click` actions     |
| `useDashboardBreakpoint` / `DASHBOARD_BREAKPOINT_MIN_WIDTH`                                                                                                                                                                                 | hook/const | SSR-safe active breakpoint + thresholds                       |
| `ActiveDashboardView`, `EffectiveDashboardLayout`, `AliasResolutionContext`, `DashboardFilterValues`, `DashboardAliasValues`, `WidgetActionDispatcher`, `WidgetActionHandler`, `WidgetActionHandlerRegistry`, `WidgetActionDispatchContext` | type       | Helper / context shapes                                       |

`./testing` subpath (requires the optional `msw` peer): `createDashboardsHandlers`
(stateful MSW handlers, default base `/api/v1/dashboards`, paired `/widgets`
base) plus the `createDashboardsStore` factory, the `CATALOG`,
`SAMPLE_FINANCE_BUNDLE` / `SAMPLE_WELCOME_BUNDLE`, `SYNTHETIC_ENVELOPES`,
`nextSyntheticKpi` fixtures, and the `StoredDashboard` type.

## Out of scope / caveats

- **Markdown is rendered verbatim, not as HTML.** `MarkdownWidget` ships a
  dependency-free `<pre>`-style fallback (whitespace preserved). It does **not**
  pull `react-markdown` and never sets `innerHTML`, so widget content cannot
  inject markup. Full Markdown rendering is opt-in via a downstream renderer
  registered on the registry — that renderer owns its own sanitisation.
- **Action URLs are validated before navigation.** The default `Navigate` /
  `OpenDashboard` handlers run `assertSafeUrl` (`@granit/utils`) on the resolved
  target before `location.assign`, rejecting `javascript:` / protocol-relative
  URLs sourced from widget config — defense in depth against compromised
  dashboard data. Apps that override these handlers (e.g. wiring React Router)
  own the equivalent check.
- **`ExportData` / `OpenDetail` emit DOM events, not UI.** The defaults dispatch
  `granit:dashboard:export` / `granit:dashboard:open-detail` `CustomEvent`s;
  the host wires the actual export pipeline / detail drawer.
- **Permission gating is a UX hint, not a boundary.** Widget envelopes carry a
  `requiredPermission`; hiding a widget client-side does not stop the underlying
  API call. The `Granit.Dashboards` backend re-checks authorization on every
  endpoint and filters cross-tenant rows server-side.
- **Reason / title strings on the wire are i18n keys.** `RenderedWidget`
  surfaces `reasonLocalizationKey` and `titleLocalizationKey` verbatim; the host
  app's `react-i18next` bundle owns the localized message mapping.
- **`useDashboardWidget` never fetches.** It is a passive reader of the
  per-widget cache entries `useDashboardRender` / `usePushedDashboard` populate;
  mount one of those for the data to exist.
- **No client-side delete.** Dashboards are archived/restored, never deleted —
  there is no DELETE endpoint and no hook for one.
- **Rendering chrome lives upstream.** The catalog list, the composer editor,
  and lifecycle dialogs are [`@granit/react-ui-dashboards`](../react-ui-dashboards)
  (built on the headless [`@granit/react-dashboard-editor`](../react-dashboard-editor));
  DTOs + HTTP transport are [`@granit/dashboards`](../dashboards).

## License

Apache-2.0
