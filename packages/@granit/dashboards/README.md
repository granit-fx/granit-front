# @granit/dashboards

Framework-agnostic **dashboards** SDK — the TypeScript counterpart of the .NET
`Granit.Dashboards` module (`granit-dotnet/src/Granit.Dashboards`,
endpoints in `Granit.Dashboards.Endpoints`, contract
`contracts/openapi/dashboards.json`).

It holds the declarative model (`DashboardDefinition` + the `WidgetDefinition`
discriminated union, layout / time-window / datasource / entity-alias / action
primitives), the persistence + render wire contracts, the Axios HTTP client, and
the pure bridge that round-trips a persisted dashboard back into the declarative
editor shape. It carries **no** React, DOM or Node-only dependency — only
`@granit/api-client` (Axios) and `@granit/logger`.

A dashboard's lifecycle is: a module ships a `DashboardDefinition` into the
**catalog** → an admin imports it into the tenant's persisted-instance pool →
the instance is edited (widget CRUD), published / archived / restored, and
**rendered** into a per-widget snapshot bundle. The render layer is transport-
aware (pull vs push) and drift-aware (semver comparison against the source
definition).

The React layers live in sibling packages:

- [`@granit/react-dashboards`](../react-dashboards) — React Query hooks,
  query-key factories, the `DashboardsProvider`, and the render / push-stream
  surfaces that delegate to this package's API functions.
- [`@granit/react-dashboard-editor`](../react-dashboard-editor) — headless
  editor primitives (`EditableDashboard`, widget palette, per-kind config
  forms) consuming the `WidgetDefinition` view.
- [`@granit/react-ui-dashboards`](../react-ui-dashboards) — the admin feature
  kit (list / edit / view pages, status & drift badges) composing the two
  above.

## Install

Workspace-internal — consumed via the `@granit/*` Vite/Vitest aliases. Declare
the peers a consumer must provide:

- `@granit/api-client` — the centralized Axios instance (CSRF / auth / tenant
  interceptors) passed into every API function.
- `@granit/logger` — `createLogger`; used by the widget bridge to warn on a
  malformed persisted `configJson` rather than crash the editor.

## Quick start

```ts
import {
  Datasource,
  DEFAULT_DASHBOARD_LAYOUT,
  WIDGET_SIZE,
  listDashboards,
  getDashboard,
  renderDashboard,
  dashboardDetailToDefinition,
  diffDashboardWidgets,
  detectVersionDrift,
  type DashboardDefinition,
} from '@granit/dashboards';
import type { AxiosInstance } from '@granit/api-client';

// `basePath` is the dashboards collection root — mirrors the backend route.
const basePath = '/api/v1/dashboards';

// 1. Declare a dashboard (what a module ships into the catalog).
const definition: DashboardDefinition = {
  name: 'Granit.Invoicing.FinanceOverview',
  category: 'Finance',
  isSystem: true,
  version: '1.2.0',
  layout: DEFAULT_DASHBOARD_LAYOUT,
  widgets: [
    {
      slug: 'Intro',
      type: 'markdown',
      position: 0,
      size: WIDGET_SIZE.FULL_WIDTH_ROW,
      contentLocalizationKey: 'Widget:Granit.Invoicing.FinanceOverview.Intro',
    },
  ],
};

// `Datasource.metric(...)` mirrors the backend's convenience factory — used by
// downstream data-bound widget kinds (`@granit/analytics`, …).
const unpaid = Datasource.metric('Granit.Invoicing.UnpaidInvoiceCountMetric');

async function loadAndRender(client: AxiosInstance) {
  // 2. List the tenant's persisted instances, then read one in full.
  const { items } = await listDashboards(client, basePath, { status: 'Published' });
  const detail = await getDashboard(client, basePath, items[0]!.id);

  // 3. Lift the persisted shape back into the declarative editor view.
  const editable = dashboardDetailToDefinition(detail);

  // 4. Render a snapshot bundle (per-widget envelopes, one per instance).
  const bundle = await renderDashboard(client, basePath, detail.id, {
    periodFrom: '2026-06-01T00:00:00Z',
    periodTo: '2026-07-01T00:00:00Z',
    locale: 'en',
  });

  // 5. Is the persisted instance behind its catalog definition?
  const drift = detectVersionDrift(detail.sourceDefinitionVersion, definition.version);

  // 6. Diff editor state ↔ server → ordered widget CRUD operations.
  const ops = diffDashboardWidgets(detail.widgets, editable.widgets, detail.name);

  return { bundle, drift, ops };
}
```

## Public API

### Declarative model

| Symbol | Kind | Purpose |
| --- | --- | --- |
| `DashboardDefinition` | type | Top-level declarative catalog entry shipped by a module |
| `WidgetDefinition` | type | Open union: `FrameworkWidgetDefinition \| WidgetDefinitionBase` |
| `WidgetDefinitionBase` | type | Common base every widget shares (`slug` / `type` / `position` / …) |
| `FrameworkWidgetDefinition` | type | Closed union of built-in kinds (markdown / image / text) |
| `MarkdownWidgetDefinition` · `ImageWidgetDefinition` · `TextWidgetDefinition` | type | Built-in presentation widgets; `ImageFit` / `TextWidgetStyle` enums |
| `DashboardLayout` · `DashboardLayoutOverride` · `DashboardBreakpoint` | type | Responsive grid (base + per-breakpoint overrides) |
| `WidgetSize` | type | Widget width / height in grid cells |
| `DashboardTimeWindow` · `DashboardPeriod` · `TimeWindowKind` | type | Dashboard-wide time window (token or absolute range) |
| `DashboardView` · `DashboardCategory` | type | Multi-view arrangements (P2.1); catalog grouping |
| `DashboardFilter` · `DashboardFilterClause` · `DashboardFilterOperation` · `DashboardFilterOperator` | type | Dashboard-scoped toolbar / silent filters (P2.5) |
| `EntityAlias` · `EntityAliasResolver` (+ 5 resolver variants) | type | Named entity bindings resolved at render time (P2.3) |
| `Datasource` (+ `MetricDatasource` / `QueryAggregateDatasource` / `TelemetryDatasource`) | type | Abstract widget data binding (P2.2) |
| `AggregateFunction` · `TelemetryAggregation` · `DataKeyFormat` | type | Aggregation kinds + per-series presentation hints |
| `WidgetAction` · `WidgetActionKind` · `WidgetActionTrigger` | type | Declarative click-handler descriptors (no code injection, P1.5) |
| `RefreshHint` | type | Pull / push transport hint (`Static` / `Dynamic` / `Realtime`) |
| `DASHBOARD_TIME_WINDOW` | const | Conventional time-window presets (`Last30Days`, `Mtd`, …) |
| `DEFAULT_DASHBOARD_LAYOUT` · `WIDGET_SIZE` | const | 12-column / 80 px default layout; conventional widget sizes |
| `Datasource` | const | Factory namespace (`Datasource.metric()` / `.queryAggregate()` / `.telemetry()`) |
| `isMetricDatasource` · `isQueryAggregateDatasource` · `isTelemetryDatasource` | fn | Narrow a `Datasource` to its variant |
| `is{RouteParam,ViewEntity,TenantContext,UserSelection,StaticEntity}Resolver` | fn | Narrow an `EntityAliasResolver` to its variant |

### Persistence DTOs + HTTP API

| Symbol | Kind | Purpose |
| --- | --- | --- |
| `DashboardSummaryResponse` · `DashboardDetailResponse` | type | List-row and full-detail wire shapes (`status` / widget pool) |
| `DashboardCatalogEntryResponse` | type | A single catalog entry (an importable definition) |
| `WidgetInstanceResponse` | type | Persisted widget (id-keyed, `configJson` blob) |
| `AddWidgetRequest` · `UpdateWidgetRequest` · `DashboardMetadataUpdateRequest` | type | CRUD request bodies |
| `DashboardImportResponse` · `DashboardResyncResponse` | type | Import / re-sync results |
| `DashboardStatus` · `PagedResponse<T>` | type | Lifecycle state (`Draft`/`Published`/`Archived`); paged envelope |
| `DashboardCatalogParams` · `DashboardListParams` · `DashboardsRequestOptions` | type | Query params; per-call `{ signal }` cancellation options |
| `WidgetRenderBody<T>` · `WidgetRenderContextPayload` · `WidgetRenderKind` | type | Per-widget render endpoint inputs |
| `getDashboardCatalog` | fn | `GET {basePath}/catalog?category=` |
| `listDashboards` | fn | `GET {basePath}?status=&page=&pageSize=` |
| `getDashboard` | fn | `GET {basePath}/{id}` |
| `importDashboard` | fn | `POST {basePath}/from-definition/{name}` |
| `updateDashboardMetadata` | fn | `PUT {basePath}/{id}` (name + grid layout) |
| `publishDashboard` · `archiveDashboard` · `restoreDashboard` | fn | `POST {basePath}/{id}/{publish,archive,restore}` |
| `resyncDashboard` | fn | `POST {basePath}/{id}/resync` (replay source definition) |
| `createWidget` · `updateWidget` · `deleteWidget` | fn | Widget-pool CRUD under `{basePath}/{id}/widgets` |
| `renderDashboard` | fn | `POST {basePath}/{id}/render` (snapshot bundle) |
| `renderWidget` | fn | `POST {widgetsBasePath}/{kind}/render` (per-widget; separate root) |

### Rendering wire contracts

| Symbol | Kind | Purpose |
| --- | --- | --- |
| `DashboardRenderRequest` · `DashboardRenderResponse` · `DashboardRenderPeriod` | type | `POST .../render` request / response / echoed period |
| `DashboardRenderedWidget` | type | One widget's slot in the render bundle |
| `WidgetSnapshotEnvelope` · `WidgetSnapshotEnvelopeOf<K, S>` | type | Per-widget envelope; generic narrowing helper for downstream kinds |
| `WidgetSnapshotStatus` · `WidgetTransport` · `DashboardDriftStatus` | type | Runtime outcome; effective transport; bundle-level drift status |
| `MarkdownWidgetSnapshot` · `ImageWidgetSnapshot` · `TextWidgetSnapshot` | type | Built-in per-kind snapshot payloads |
| `MarkdownSnapshotEnvelope` · `ImageSnapshotEnvelope` · `TextSnapshotEnvelope` | type | Narrowed envelopes for the built-in kinds |
| `isMarkdownSnapshotEnvelope` · `isImageSnapshotEnvelope` · `isTextSnapshotEnvelope` | fn | Narrow a heterogeneous envelope to a built-in kind |

### Bridge + drift helpers

| Symbol | Kind | Purpose |
| --- | --- | --- |
| `dashboardDetailToDefinition` · `widgetInstanceToDefinition` | fn | Persistence → declarative (editor) shape |
| `widgetDefinitionToAddRequest` · `widgetDefinitionToUpdateRequest` | fn | Declarative → CRUD request bodies |
| `diffDashboardWidgets` | fn | Editor ↔ server widget pools → ordered CRUD ops (`DashboardWidgetDiff`) |
| `extractSlugFromTitleKey` | fn | Recover a widget slug from its `titleLocalizationKey` |
| `STRUCTURAL_WIDGET_FIELDS` | const | Fields kept outside `configJson` (sync custom serializers) |
| `detectVersionDrift` | fn | Semver-compare persisted vs catalog version → `DashboardVersionDrift` |
| `parseDurationToMs` · `formatDurationFromMs` | fn | `System.TimeSpan` ISO string ↔ milliseconds |

## Out of scope / caveats

- **No React.** Hooks, query-key factories and the provider live in
  [`@granit/react-dashboards`](../react-dashboards); editor components in
  [`@granit/react-dashboard-editor`](../react-dashboard-editor); admin pages in
  [`@granit/react-ui-dashboards`](../react-ui-dashboards). This package is the
  framework-agnostic contract underneath all three.

- **`WidgetDefinition` is open by design.** Only `markdown` / `image` / `text`
  are built in (`FrameworkWidgetDefinition`). Data-bound kinds (`kpi`, `chart`,
  `table`, `pivot`, `map`) are shipped by downstream packages
  (`@granit/analytics`, `@granit/iot`, …) that `extends WidgetDefinitionBase` and
  feed through the generic alias. The fallback is `WidgetDefinitionBase`
  directly, **not** `WidgetDefinitionBase & Record<string, unknown>` — a typed
  interface does not structurally satisfy an index signature, which would reject
  every concrete extension.

- **Snapshots are pre-serialised, not resolved.** Every snapshot carries a
  `contentLocalizationKey` (or alt-text key), never resolved text — the renderer
  never resolves i18n keys server-side, so the same envelope is cacheable across
  user locales. The frontend is the only translation point. The
  `WidgetSnapshotEnvelope.snapshot` field is typed `unknown` at the boundary;
  narrow it via the per-kind type guards (or the downstream
  `WidgetSnapshotEnvelopeOf<…>` alias) after dispatching on `widgetType`.

- **`sequence` is int64 on the wire.** JSON may represent large values as
  strings, so `sequence` is `number | string` — always coerce with `Number()`
  before comparing.

- **`WidgetActions` are descriptors, not code.** Each action is a typed
  `(trigger, kind, target, params)` tuple the frontend dispatches to a known
  handler — no code injection, no expression evaluation. Param values may
  reference variables substituted at dispatch time; the wire contract carries
  only strings.

- **TimeSpan parsing is local.** `aggregation` (a `DashboardTimeWindow` bucket
  size) arrives as the verbatim `System.Text.Json` `TimeSpan` string
  (`"00:01:00"`, `"1.00:00:00.500"`); there is no automatic ms conversion —
  parse on read with `parseDurationToMs` (kept dependency-free, capped at ms).

- **Drift is surfaced, not auto-applied.** Module upgrades never retro-edit
  imported dashboards. `detectVersionDrift` and `DashboardRenderResponse.driftStatus`
  flag a `'behind'` instance; the admin opts into a re-sync via `resyncDashboard`.
  An `'ahead'` instance is reported for visibility only — re-syncing would
  downgrade it.

- **Permission gating is a UX hint, not enforcement.** `requiredPermission` on a
  widget / instance is echoed for defensive UI hides only; the .NET backend
  re-checks authorization on every endpoint. Never rely on a client-side hide to
  protect data.

## License

Apache-2.0
