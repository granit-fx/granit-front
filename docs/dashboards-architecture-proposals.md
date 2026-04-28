# Dashboards architecture — proposals from frontend implementation

This document consolidates feedback gathered while scaffolding `@granit/dashboards`,
`@granit/react-dashboards`, `@granit/charts`, `@granit/react-charts`, and after
analyzing ThingsBoard's reference architecture for IoT-grade dashboards.

The goal is to enrich `Granit.Dashboards.Abstractions` (and downstream
`Granit.Analytics`, future `Granit.IoT.Dashboards`) **before stories B2/B3/B4
land**, so the persisted aggregate, endpoints, and the live-streaming surface
all share a coherent model from day one rather than retrofitting.

Proposals are graded by priority:

- 🔴 **P1** — needed before story B2 (persisted Dashboard aggregate)
- 🟠 **P2** — needed before story C (drill-down / streaming widgets)
- 🟡 **P3** — quality-of-life, can land independently

---

## P1.1 — JSON polymorphism discriminator

**Current**: `WidgetDefinition.cs` is `abstract record` with concrete records
inheriting (Markdown / Image / Text / Kpi / Chart / Table / Pivot). No
`[JsonPolymorphic]` attribute is set, so System.Text.Json defaults to
`"$type": "Granit.Dashboards.Widgets.MarkdownWidgetDefinition, Granit.Dashboards.Abstractions"` —
verbose, CLR-coupled, and brittle to renames.

**Proposal**: pin a clean discriminator name and short type IDs.

```csharp
[JsonPolymorphic(TypeDiscriminatorPropertyName = "type")]
[JsonDerivedType(typeof(MarkdownWidgetDefinition), "markdown")]
[JsonDerivedType(typeof(ImageWidgetDefinition), "image")]
[JsonDerivedType(typeof(TextWidgetDefinition), "text")]
public abstract record WidgetDefinition(...);
```

Same pattern for `Granit.Analytics`:

```csharp
[JsonDerivedType(typeof(KpiWidgetDefinition), "kpi")]
[JsonDerivedType(typeof(ChartWidgetDefinition), "chart")]
[JsonDerivedType(typeof(TableWidgetDefinition), "table")]
[JsonDerivedType(typeof(PivotWidgetDefinition), "pivot")]
```

**Frontend impact**: TypeScript discriminated unions on `type` (idiomatic JSON,
maps 1:1). Without this, every consumer has to translate `$type` → enum tag.

---

## P1.2 — Optional `Fit?` on ImageWidgetDefinition

**Current**: `ImageWidgetDefinition` has `Source` + `AltLocalizationKey` but no
display-fit hint. The frontend has to pick a default (`contain` is reasonable
but not always right).

**Proposal**:

```csharp
public sealed record ImageWidgetDefinition(
    string Slug,
    string Source,
    string AltLocalizationKey,
    int Position,
    WidgetSize? Size = null,
    ImageFit Fit = ImageFit.Contain)
    : WidgetDefinition(Slug, Position, Size ?? WidgetSize.MediaTile);

public enum ImageFit
{
    /// <summary>Preserve aspect ratio, letterbox to fit.</summary>
    Contain = 0,
    /// <summary>Fill the cell, crop to maintain aspect.</summary>
    Cover = 1,
    /// <summary>Stretch to fill (rarely correct).</summary>
    Fill = 2,
}
```

**Why**: "logo widget" wants `Contain` (no cropping); "banner photo widget"
wants `Cover` (no whitespace). Two distinct UX intents, not solvable by
preprocessing the asset.

---

## P1.3 — `DashboardTimeWindow` + per-widget override

**Current**: each data widget carries its own period spec via the `MetricRequest`
body or the `QueryDefinition` filter. Eight KPIs sharing "last 30 days" means
duplicating the period eight times. The user can't change the dashboard-wide
range without editing every widget.

**Proposal**: ship a default time window on the definition, propagate via a
runtime `DashboardContext`, allow per-widget override. **Wraps the existing
`PeriodSpec` from A2/A3** (with DAX-style tokens `mtd`/`ytd`/`previous_period`/...)
rather than introducing a parallel time-range model — calendar-aware bounds
matter (MTD ≠ "last 30 days") and we already shipped the right primitive.

```csharp
namespace Granit.Dashboards;

using Granit.Analytics.Metrics;  // PeriodSpec, CompareSpec — existing types

/// <summary>
/// Time window applied to every data-bound widget on a dashboard. The frontend
/// surfaces it as a top-of-dashboard control (e.g. "Last 30 days ▾"); user
/// changes propagate to all widgets that don't carry their own override.
///
/// Wraps the existing <see cref="PeriodSpec"/> (token OR absolute range) so
/// dashboard-level windows align with the metric-level period model already
/// shipped in A2/A3 — no parallel concept on the wire.
/// </summary>
public sealed record DashboardTimeWindow(
    /// <summary>The actual period — token-based (`last_30d`, `mtd`, `ytd`, ...) or absolute range.</summary>
    PeriodSpec Period,
    /// <summary>Refresh semantics: History (frozen, refetch on range change) vs Realtime (sliding window).</summary>
    TimeWindowKind Kind = TimeWindowKind.History,
    /// <summary>Optional comparison window (e.g. previous_period). Same model as MetricRequest.</summary>
    CompareSpec? CompareTo = null,
    /// <summary>Bucket size for time-series aggregation. When null, the widget's data source picks a default.</summary>
    TimeSpan? Aggregation = null)
{
    public static DashboardTimeWindow Last24Hours => new(PeriodSpec.Token("last_24h"));
    public static DashboardTimeWindow Last7Days => new(PeriodSpec.Token("last_7d"));
    public static DashboardTimeWindow Last30Days => new(PeriodSpec.Token("last_30d"));
    public static DashboardTimeWindow Mtd => new(PeriodSpec.Token("mtd"));
    public static DashboardTimeWindow Ytd => new(PeriodSpec.Token("ytd"));
    public static DashboardTimeWindow RealtimeLast5Minutes =>
        new(PeriodSpec.Token("last_5m"), Kind: TimeWindowKind.Realtime);
}

public enum TimeWindowKind
{
    /// <summary>Frozen window — query once per range change.</summary>
    History = 0,
    /// <summary>Sliding window — refreshes continuously, suitable for telemetry.</summary>
    Realtime = 1,
}

public abstract class DashboardDefinition : IDashboardDefinitionDescriptor
{
    // ... existing members
    public virtual DashboardTimeWindow? DefaultTimeWindow => null;
}

public abstract record WidgetDefinition(
    string Slug,
    int Position,
    WidgetSize Size,
    string? RequiredPermission = null,
    /// <summary>
    /// Override the dashboard's time window for this widget specifically.
    /// Useful when (a) the widget is rendered standalone outside a dashboard,
    /// or (b) the widget needs a different range than the rest of the dashboard
    /// (e.g. a "year-to-date" KPI next to "last 30 days" widgets).
    /// </summary>
    DashboardTimeWindow? TimeWindowOverride = null);
```

**Standalone-rendered widgets**: when a widget is dropped into a non-dashboard
page (e.g. a KPI tile above an invoice list), the frontend uses
`TimeWindowOverride` directly. No `DashboardContext` required.

**Frontend impact**: `<DashboardProvider timeWindow={...}>` propagates via React
context. `useMetric` reads the context (or the prop override), composes the
final `PeriodSpec` for the underlying `MetricRequest` — same shape it already
takes today.

---

## P1.4 — Responsive layouts (per-breakpoint overrides)

**Current**: `DashboardLayout` is a single grid configuration with no
breakpoint awareness.

**Proposal**: `DashboardLayout` carries a base configuration plus optional
per-breakpoint overrides — same model ThingsBoard ships
(`shared/models/dashboard.models.ts:114-142`). Mobile / tablet / desktop
re-arrangements share the widget pool and only override what changes.

```csharp
public sealed record DashboardLayout(
    int Columns,
    int RowHeight,
    /// <summary>
    /// Per-widget size overrides keyed by widget Slug. Empty = use the widget's
    /// default Size from its definition.
    /// </summary>
    IReadOnlyDictionary<string, WidgetSize>? WidgetSizes = null,
    /// <summary>
    /// Optional Slug ordering — when present, overrides the widget's `Position`
    /// for this layout only. Widgets not listed are appended in their declared
    /// Position order.
    /// </summary>
    IReadOnlyList<string>? WidgetOrder = null,
    /// <summary>
    /// Per-breakpoint overrides. Each entry is a partial layout that replaces
    /// the matching fields on the base layout when the viewport hits the
    /// breakpoint. `default` is reserved for the base — no entry needed for it.
    /// </summary>
    IReadOnlyDictionary<DashboardBreakpoint, DashboardLayoutOverride>? Breakpoints = null)
{
    public static DashboardLayout Default => new(12, 80);
}

public enum DashboardBreakpoint { Xs, Sm, Md, Lg, Xl }

public sealed record DashboardLayoutOverride(
    int? Columns = null,
    int? RowHeight = null,
    IReadOnlyDictionary<string, WidgetSize>? WidgetSizes = null,
    IReadOnlyList<string>? WidgetOrder = null,
    /// <summary>Slugs to hide at this breakpoint. The widgets remain in the pool but the layout drops them.</summary>
    IReadOnlySet<string>? HiddenWidgets = null);
```

Combined with auto-flow positioning, a layout = base grid + per-breakpoint
deltas. A typical mobile override expands every KPI tile to full-width and
hides decorative widgets:

```csharp
public override DashboardLayout Layout => DashboardLayout.Default with
{
    Breakpoints = new Dictionary<DashboardBreakpoint, DashboardLayoutOverride>
    {
        [DashboardBreakpoint.Xs] = new(
            Columns: 4,
            WidgetSizes: new Dictionary<string, WidgetSize>
            {
                ["UnpaidCount"] = new(4, 1),    // full row on xs
                ["UnpaidTotal"] = new(4, 1),
            },
            HiddenWidgets: new HashSet<string> { "Banner" }),
    },
};
```

**Why nested overrides instead of separate `MobileLayout`**: a single
`DashboardLayout` payload owning the full responsive ladder reads better in
the JSON dump, makes drift between breakpoints local rather than scattered,
and matches the convention React/Tailwind/Bootstrap users already know. TB
proves this scales to 5+ breakpoints with custom keys.

**Frontend impact**: `<Dashboard>` resolves the active breakpoint via
`useMediaQuery`, merges `Breakpoints[active]` into the base layout, then
renders. The widget pool stays constant; only sizes/order/visibility shift.

### Deferred to v2 — dual-pane container (`main` / `right`)

ThingsBoard splits each state's layout into two parallel columns: a `main`
pane and an optional `right` sidebar pane (`DashboardStateLayouts` at
`shared/models/dashboard.models.ts`). Useful for "always-visible status
sidebar alongside the main content" patterns (alarm panel, device summary).

**Not in v1**: a single grid covers 95% of cases. If a story justifies
the dual-pane shape later, it lands as `Layout` becoming
`{ Main: DashboardLayout, Right?: DashboardLayout }` — the existing `Layout`
field becomes implicitly the `Main` pane, fully backward-compatible.

---

## P1.5 — Action descriptors

**Current**: widgets are pure render targets. Click behavior is implicit (a KPI
clicks open... what? The frontend doesn't know).

**Proposal**: declarative actions. No code injection — only descriptors that
the frontend dispatches to known handlers.

```csharp
public abstract record WidgetDefinition(
    string Slug,
    int Position,
    WidgetSize Size,
    string? RequiredPermission = null,
    DashboardTimeWindow? TimeWindowOverride = null,
    IReadOnlyList<WidgetAction>? Actions = null);

public sealed record WidgetAction(
    WidgetActionTrigger Trigger,
    WidgetActionKind Kind,
    /// <summary>
    /// Target identifier — interpretation depends on Kind:
    /// - Navigate: a frontend route ("/invoicing?status=unpaid")
    /// - OpenDashboardState: a `state` name on the same dashboard
    /// - OpenDashboard: a `Dashboard.Name`
    /// - ExportData: an `ExportDefinition.Name`
    /// </summary>
    string Target,
    /// <summary>
    /// Static parameters merged with the dynamic data row at dispatch time
    /// (e.g. params="customerId={row.customerId}" + static={status:"unpaid"}).
    /// </summary>
    IReadOnlyDictionary<string, string>? Params = null);

public enum WidgetActionTrigger
{
    /// <summary>Clicking the widget body or KPI value.</summary>
    Click = 0,
    /// <summary>Clicking a row inside a Table/Pivot widget.</summary>
    RowClick = 1,
    /// <summary>Clicking a series segment inside a Chart widget.</summary>
    SeriesClick = 2,
    /// <summary>Clicking a legend item.</summary>
    LegendClick = 3,
}

public enum WidgetActionKind
{
    /// <summary>Frontend route navigation (preserves dashboard context if possible).</summary>
    Navigate = 0,
    /// <summary>Switch to another `state` of the current dashboard (see P2.1 below).</summary>
    OpenDashboardState = 1,
    /// <summary>Navigate to another full dashboard.</summary>
    OpenDashboard = 2,
    /// <summary>Trigger an export via `Granit.DataExchange`.</summary>
    ExportData = 3,
    /// <summary>Open a side drawer with the row's full detail (table widgets).</summary>
    OpenDetail = 4,
}
```

---

## P2.1 — Views (intra-dashboard navigation)

**Naming note**: the original draft called this concept `DashboardState`. It
collides with `DashboardStatus` (Draft/Published/Archived) already shipped in
B2 — two semantically distinct concepts sharing "Status/State" guarantees
autocomplete confusion. Renamed to **`DashboardView`** throughout. The
URL pattern, transitions, and runtime behavior are unchanged.

**Goal**: a dashboard becomes a **navigable container** with multiple internal
views, sharing TimeWindow / aliases / breadcrumb context. ThingsBoard's killer
feature for IoT drill-down (their "states", but the renaming avoids the
status-vs-state ambiguity in our codebase).

**Proposal**:

```csharp
public abstract class DashboardDefinition : IDashboardDefinitionDescriptor
{
    /// <summary>
    /// Named views — separate widget arrangements within the same dashboard.
    /// Default view is the entry point. Transitions are triggered by widget
    /// actions (Kind = OpenDashboardView).
    /// </summary>
    public virtual IReadOnlyList<DashboardView>? Views => null;

    /// <summary>
    /// When `Views` is non-null, this is the entry-point view name.
    /// When `Views` is null, the dashboard is single-view and the
    /// `Widgets` collection is the implicit "default" view.
    /// </summary>
    public virtual string? DefaultView => null;
}

public sealed record DashboardView(
    /// <summary>
    /// View identifier, unique within the dashboard. Lowercase, dot-separated
    /// (e.g. "list", "detail", "history.heatmap"). Used in URLs.
    /// </summary>
    string Name,
    /// <summary>Widgets shipped by this view, in declared order.</summary>
    IReadOnlyList<WidgetDefinition> Widgets,
    /// <summary>
    /// Layout override for this view. When null, falls back to the dashboard's
    /// `Layout` (with all its breakpoint overrides). The override may itself
    /// declare breakpoints — they merge per the standard cascade.
    /// </summary>
    DashboardLayout? Layout = null,
    /// <summary>
    /// Localization key for the view's display label, used in breadcrumbs.
    /// Defaults to "Dashboard:{DashboardName}.View.{ViewName}".
    /// </summary>
    string? DisplayNameLocalizationKey = null);
```

The corresponding action kind (P1.5) becomes `OpenDashboardView`; routing
artefacts read `DashboardViewRouter`, `DashboardViewParams`, etc.

**URL convention**: `/dashboards/{Name}/view/{viewName}` with optional
parameters propagated via query string (entity IDs, time window override).
_See P2.1.1 below for the param encoding — we rejected TB's base64 array._

**Frontend impact**: `<DashboardViewRouter>` component manages the active
view, propagates entity-alias resolution and TimeWindow into the view's
widgets via the same `DashboardContext` provider.

**Migration note for module-shipped definitions without views**: the existing
`DashboardDefinition.Widgets` becomes the implicit default view — backward
compatible. Most dashboards stay single-view; views are opt-in for drill-down.

### P2.1.1 — Param encoding for view navigation

ThingsBoard encodes the navigation stack as `?state=<base64-encoded-array>`
(`shared/models/dashboard.models.ts` + `default-state-controller.component.ts:207`).
That choice is opaque to URL inspection, breaks at length limits, and doesn't
survive being shared in chat / docs.

**We reject base64-encoded stacks**. Use plain query string with named
parameters and a single `view` selector:

```text
/dashboards/Granit.Iot.FleetOverview/view/detail?entityId=device-abc-123&since=2026-04-01
```

The view router maintains the breadcrumb stack in memory (back-button history
via `history.state`), not in the URL. URL stays inspectable, shareable, and
short. If a story justifies multi-level back navigation across deep links,
that's a per-app router concern, not a framework requirement.

---

## P2.2 — Datasource abstraction

**Goal**: decouple a widget from how its data arrives. Current
`KpiWidgetDefinition.MetricName: string` ties a KPI to the metric source
specifically; can't bind a KPI to a query aggregate or to an IoT telemetry
average.

**Proposal**:

```csharp
[JsonPolymorphic(TypeDiscriminatorPropertyName = "kind")]
[JsonDerivedType(typeof(MetricDatasource), "metric")]
[JsonDerivedType(typeof(QueryAggregateDatasource), "query-aggregate")]
[JsonDerivedType(typeof(TelemetryDatasource), "iot-telemetry")]
public abstract record Datasource;

public sealed record MetricDatasource(string MetricName) : Datasource;

public sealed record QueryAggregateDatasource(
    string QueryName,
    AggregateFunction Aggregation,
    string? Field) : Datasource;

public sealed record TelemetryDatasource(
    /// <summary>Entity alias name (see P2.3) — resolves to a device id at render time.</summary>
    string EntityAlias,
    /// <summary>Telemetry key (e.g. "temperature", "pressure", "rpm").</summary>
    string TelemetryKey,
    /// <summary>Aggregation applied over the dashboard's time window.</summary>
    TelemetryAggregation Aggregation = TelemetryAggregation.Last) : Datasource;

public enum TelemetryAggregation { Last, Avg, Sum, Min, Max, Count }
```

Then widgets switch from a typed-name field to a `Datasource`:

```csharp
public sealed record KpiWidgetDefinition(
    string Slug,
    Datasource Datasource,    // was: string MetricName
    int Position,
    WidgetSize? Size = null,
    string? RequiredPermission = null,
    DashboardTimeWindow? TimeWindowOverride = null,
    IReadOnlyList<WidgetAction>? Actions = null)
    : WidgetDefinition(...);
```

**Why**: a "Daily Active Users" KPI tile can be backed by a metric
(`MetricDatasource`) on the analytics dashboard, AND by a query aggregate
(`QueryAggregateDatasource`) on an ad-hoc admin page — same widget, different
source. IoT gauges naturally bind via `TelemetryDatasource`.

**Tradeoff**: more verbose at definition site. Mitigated by static factories:

```csharp
new KpiWidgetDefinition("UnpaidCount",
    Datasource.Metric("Granit.Invoicing.UnpaidInvoiceCountMetric"),
    Position: 1);
```

### Per-DataKey formatting (color / units / decimals)

ThingsBoard attaches color, units, and decimal precision to **each `DataKey`**
(one per series), not to the widget as a whole. This is genuinely better than
our current sketch: a chart with multiple series can color each independently,
a KPI with a comparison can format reference and current value differently,
units travel with the data instead of being baked into the chart config.

```csharp
public abstract record Datasource;

public sealed record QueryAggregateDatasource(
    string QueryName,
    AggregateFunction Aggregation,
    string? Field,
    /// <summary>
    /// Per-series presentation hints. When the chart has multiple series,
    /// each entry's `Key` matches a series identifier (e.g. group-by value).
    /// </summary>
    IReadOnlyList<DataKeyFormat>? KeyFormats = null) : Datasource;

public sealed record DataKeyFormat(
    /// <summary>Series identifier — matches the GroupBy value or the Field name.</summary>
    string Key,
    /// <summary>Localization key for the display label (legend, tooltip).</summary>
    string? LabelLocalizationKey = null,
    /// <summary>Hex color override. Falls back to the theme palette by series index.</summary>
    string? Color = null,
    /// <summary>Unit suffix (e.g. "°C", "kWh", "€"). Resolved via i18n if prefixed `Unit:`.</summary>
    string? Unit = null,
    /// <summary>Decimal places for numeric formatting. Falls back to the widget config or 2.</summary>
    int? Decimals = null);
```

**Why on the datasource and not the widget**: the same chart widget can be
reused with different data shapes. A "Revenue by Region" chart and a
"Revenue by Product" chart are the same `ChartWidgetDefinition` with
different datasources — colors and units belong to the data binding, not
the visual.

**Frontend impact**: chart primitives (`<LineChart>`, `<BarChart>`) read
`KeyFormats` from the resolved datasource and apply them as series-level
overrides on top of the active theme palette. KPI tile reads them for
its own value + comparison formatting.

---

## P2.3 — Entity aliases (parameterized dashboards)

**Goal**: render the same dashboard for different entities (devices, customers,
products) without duplicating the definition.

**Proposal**:

```csharp
public abstract class DashboardDefinition : IDashboardDefinitionDescriptor
{
    /// <summary>
    /// Aliases declared by this dashboard. Each alias gets resolved to a
    /// concrete entity (or set of entities) at render time, by an
    /// `EntityAliasResolver` registered for its kind.
    /// </summary>
    public virtual IReadOnlyList<EntityAlias>? Aliases => null;
}

public sealed record EntityAlias(
    /// <summary>Alias identifier referenced from datasources (e.g. "currentDevice").</summary>
    string Name,
    /// <summary>What kind of entity this alias points to.</summary>
    string EntityType,                 // "Device", "Customer", "Invoice", ...
    EntityAliasResolver Resolver);

[JsonPolymorphic(TypeDiscriminatorPropertyName = "kind")]
[JsonDerivedType(typeof(RouteParamResolver), "route-param")]
[JsonDerivedType(typeof(StateEntityResolver), "state-entity")]
[JsonDerivedType(typeof(TenantContextResolver), "tenant-context")]
[JsonDerivedType(typeof(UserSelectionResolver), "user-selection")]
[JsonDerivedType(typeof(StaticEntityResolver), "static")]
public abstract record EntityAliasResolver;

/// <summary>Pulls the entity id from a URL/route parameter.</summary>
public sealed record RouteParamResolver(string ParamName) : EntityAliasResolver;

/// <summary>
/// Pulls the entity id from the current dashboard state's parameters — the
/// bridge between the URL state stack (P2.1) and aliases. When a row click
/// in a list state pushes a new state onto the stack with `entityId` in
/// `StateParams`, the alias re-resolves automatically and downstream widgets
/// re-fetch with the new entity. ThingsBoard's killer drill-down feature.
/// </summary>
public sealed record StateEntityResolver(
    /// <summary>Slot name in `StateParams` carrying the entity id.</summary>
    string ParamName = "entityId") : EntityAliasResolver;

/// <summary>Resolves to the current authenticated tenant — single entity.</summary>
public sealed record TenantContextResolver() : EntityAliasResolver;

/// <summary>Renders a picker; user selects one (or many) entities at runtime.</summary>
public sealed record UserSelectionResolver(
    /// <summary>Granit.DataLookup name backing the picker.</summary>
    string LookupName,
    bool MultiSelect = false) : EntityAliasResolver;

/// <summary>Hardcoded entity (mostly for testing or "global" widgets).</summary>
public sealed record StaticEntityResolver(string EntityId) : EntityAliasResolver;
```

**Why 4 resolver kinds instead of TB's 15**: TB has separate
`assetSearchQuery`, `deviceSearchQuery`, `edgeSearchQuery`,
`entityViewSearchQuery` that all do the same traversal with a different
entity-type filter. The `*Type` resolvers collapse into parameters to
`UserSelectionResolver` (a lookup typed against an entity type). 4 resolvers
cover every applicational use case currently on the roadmap.

**Deferred — `RelationGraphResolver`**: TB's "find all sensors related to the
current device" pattern requires an entity-relation graph that doesn't yet
exist in Granit. Building it is a project of its own (a new
`Granit.EntityRelations` aggregate plus traversal in `Granit.QueryEngine`)
and should land via a dedicated ADR if a concrete IoT story justifies it.
For now, the same outcome can be approximated by a `UserSelectionResolver`
backed by a lookup that returns the related entities — explicit but
adequate.

**Datasource integration**: `TelemetryDatasource.EntityAlias` (and any other
entity-bound datasource) references `EntityAlias.Name`. The runtime substitutes
the resolved id when fetching data.

**Frontend impact**: `<DashboardProvider>` resolves aliases up-front (route
params synchronously, lookups via `useLookup`), exposes a resolver function
through context. Widget renderers call `useEntityAlias("currentDevice")` to
get the resolved id when assembling their data fetch.

---

## P2.4 — SSE subscription for `realtime` widgets

**Goal**: replace polling with push for widgets whose data is `RefreshHint.Realtime`.

**Decision**: **SSE** as the transport, with a server-side abstraction
(`IMetricStreamProducer`) that lets the implementation evolve without leaking
to widget renderers. Two endpoints — per-metric (simple) and per-dashboard
(multiplexed, the production path).

### Server-side abstraction — one producer per subscription

```csharp
namespace Granit.Analytics.Subscriptions;

/// <summary>
/// Produces a stream of `MetricResponse` envelopes for a single subscription
/// (one metric + one set of params). One producer instance per subscription —
/// the dashboard endpoint multiplexes N producers internally, the per-metric
/// endpoint creates one. This is the right granularity: a producer's job is
/// "watch this metric with these inputs and emit when the value changes",
/// nothing more.
///
/// The default implementation polls the underlying `MetricEvaluator` on a
/// timer keyed by the metric's `RefreshHint`; future implementations may
/// push from a hot source (event bus, database notification triggers, IoT
/// telemetry pipeline) without changing the consumer surface.
/// </summary>
public interface IMetricStreamProducer
{
    IAsyncEnumerable<MetricResponse> Subscribe(
        MetricSubscriptionRequest request,
        CancellationToken cancellationToken);
}

public sealed record MetricSubscriptionRequest(
    string MetricName,
    DashboardTimeWindow TimeWindow,
    /// <summary>
    /// Owning tenant id. Pinned explicitly on the request rather than read
    /// from an ambient `ICurrentTenant` so the producer keying never collapses
    /// cross-tenant — two tenants subscribing to the same metric with the same
    /// params get distinct producer instances. This is non-negotiable for
    /// multi-tenant isolation; the runtime asserts it on the way in.
    /// </summary>
    string TenantId,
    /// <summary>Resolved entity alias values (see P2.3) — server uses these to scope the underlying query.</summary>
    IReadOnlyDictionary<string, string>? ResolvedAliases = null);
```

**Producer scoping** — a producer is created per subscription, not per
dashboard. Two consequences:

- Standalone widgets (KPI tile above a non-dashboard page) reuse the same
  producer abstraction with no special-casing.
- Identical subscription requests across users / dashboards can share a
  single producer instance (DI scoping concern handled separately) — natural
  fan-in caching at the source rather than per-endpoint.

The endpoints are thin SSE adapters that consume one or more producers; the
multiplexing is HTTP-layer orchestration, not a separate abstraction.

### Two endpoints

```text
GET /analytics/metrics/{name}/stream
    ?window=last_5m&entity=device-123
    → single MetricResponse stream, simplest case

GET /analytics/dashboards/{name}/stream
    ?widgets=w1,w2,w3&window=last_5m&entity=device-123
    → multiplexed stream, fans out internally to N producers,
      tags each event with the originating widget slug
```

**Per-metric stream** — the simple path. Used when a widget renders standalone
(KPI tile above an invoice list, no parent dashboard). One subscription, one
connection, one envelope shape.

**Per-dashboard multiplexed stream** — the production path. The frontend opens
**one** SSE connection per dashboard regardless of how many real-time widgets
the dashboard contains. Server fans out internally to the relevant
`IMetricStreamProducer` instances; events are tagged with the originating
widget slug and routed to the correct subscriber on the client.

This solves the "10 widgets × 50 reconnects on alias change" problem honestly
— there's exactly one reconnect on param change, not N.

### Wire format — initial snapshot + incremental deltas

Two event types per stream:

- `metric-snapshot` — emitted once at subscription time (or after reconnect)
  carrying the full current `MetricResponse`. The frontend renders this as
  the initial state before any deltas arrive.
- `metric-update` — emitted on subsequent value changes carrying the new
  `MetricResponse`. `sequence` is monotonic so consumers can detect gaps.

This `data` (initial) + `update` (incremental) split mirrors ThingsBoard's
`DataUpdateMsg<T>` shape (`telemetry.models.ts:440`). Without it, late
subscribers either render empty until the next change or have to call the
one-shot endpoint separately to bootstrap — both annoying.

Per-metric stream — `Last-Event-ID` resumes from the last seen sequence.

```text
id: 0
event: metric-snapshot
data: {"name":"...","snapshot":{...},"sequence":0,"emittedAt":"...","refreshHint":"realtime"}

id: 42
event: metric-update
data: {"name":"...","snapshot":{...},"sequence":42,"emittedAt":"...","refreshHint":"realtime"}

event: heartbeat
data: {}
```

Per-dashboard multiplexed stream — same two event types, with a routing
wrapper that identifies the widget on the dashboard:

```text
id: 0
event: metric-snapshot
data: {"widgetSlug":"UnpaidCount","metric":{"name":"...","snapshot":{...},"sequence":0,"emittedAt":"...","refreshHint":"realtime"}}

id: 42
event: metric-update
data: {"widgetSlug":"UnpaidCount","metric":{"name":"...","snapshot":{...},"sequence":42,"emittedAt":"...","refreshHint":"realtime"}}
```

The server retains a short replay buffer per producer so reconnecting clients
with `Last-Event-ID` don't miss state.

**Buffer sizing — bounded both in time and count**:

```csharp
public sealed record SseReplayBufferOptions(
    /// <summary>Time window kept in the replay buffer. Default 30 seconds.</summary>
    TimeSpan Window = default,
    /// <summary>
    /// Hard cap on envelope count per producer. Drops the oldest when exceeded
    /// even if they're still inside the time window — protects against
    /// runaway high-churn producers (e.g. a misbehaving IoT device pushing 1
    /// kHz updates). Default 100.
    /// </summary>
    int MaxEnvelopes = 100);
```

Both are configurable per producer (so a "rapid IoT telemetry" producer can
opt for a smaller window + larger count, while a "billing snapshot" producer
keeps a wider window) with a hard global cap to prevent memory blow-up under
adversarial conditions.

### Param-change semantics

When the user changes the dashboard's `TimeWindow` or an alias resolves to a
new entity, the frontend:

1. Closes the current `EventSource`
2. Opens a new one with the updated query string

For per-dashboard streams, this is **one** reconnect that re-establishes all
widget subscriptions atomically. The TCP connection itself is reused via HTTP
keep-alive; only the SSE stream is dropped and re-opened. Latency is bounded
by one HTTP request RTT.

### Frontend integration

`useMetric` switches transparently based on `refreshHint` and the surrounding
dashboard context:

```typescript
const { data } = useMetric('Granit.Invoicing.UnpaidInvoiceCountMetric', request);
// - refreshHint=static    → fetched once, cached forever
// - refreshHint=dynamic   → polled every 60s
// - refreshHint=realtime, no DashboardContext  → per-metric SSE
// - refreshHint=realtime, inside <DashboardProvider>  → joins the dashboard's
//                                                      multiplexed SSE stream
```

The hook self-discriminates — no `<MetricSubscriptionProvider transport={...}>`
wrapping, no transport context propagation. Widget renderers know nothing
about the wire.

### Why SSE, why not SignalR

| Criterion                  | **SSE** ✅ chosen                                                                  | **SignalR** considered, rejected                   |
| -------------------------- | ---------------------------------------------------------------------------------- | -------------------------------------------------- |
| Throughput per connection  | Higher — no WebSocket framing, no multiplex bookkeeping                            | Lower for sustained one-way pushes                 |
| Frontend dep weight        | 0 KB (native `EventSource`)                                                        | ~30 KB gz (`@microsoft/signalr`)                   |
| Proxy / firewall traversal | Plain HTTP/1.1 GET — works everywhere                                              | Needs WebSocket upgrade (or long-polling fallback) |
| Reconnect / resume         | Native via `Last-Event-ID` + server replay buffer                                  | Built-in but heavier                               |
| Multiplexing               | Per-dashboard endpoint (see above)                                                 | Native via hub channels                            |
| Granit infra alignment     | Reuses `Granit.Notifications.SSE` (already shipped)                                | Would parallel the existing path                   |
| Observability              | Each subscription is an HTTP request → standard tracing, CDN logs, gateway metrics | Opaque hub frames                                  |
| Implementation surface     | Two endpoints fronting one producer interface                                      | A hub + invocation methods + lifecycle             |

### Will SSE be sufficient? — honest assessment

**Yes, for the roadmap we can see.** The multiplexing concern (one reconnect
per param change instead of N) is solved by the per-dashboard endpoint without
moving to WebSockets. The remaining SignalR-only superpower is **bidirectional
command-and-control**, and that's a separate concern by design — see below.

**Where SSE genuinely loses to SignalR**:

- **Bidirectional command surface** ("send a command to device X, await ack on
  the same channel"): SSE is server→client only. We solve commands with a
  regular POST + correlation id, _not_ by carrying them on the subscription
  channel. Conflating "subscribe to live data" with "command-and-control"
  is precisely what makes SignalR architectures hard to audit later.
- **Multi-user collaborative editing** (admin pushes a widget change to all
  connected viewers): SSE can do this via a separate broadcast endpoint. If
  we ever ship collaborative dashboards (no concrete story), we add it then.

**Where SSE is fine but worth flagging**:

- **HTTP/1.1 deployments** are limited to ~6 concurrent streams per origin.
  Mitigated by the per-dashboard multiplexed endpoint (one connection per
  dashboard). HTTP/2 lifts this to 100+ streams transparently — modern infra.
- **Server-side resource cost**: each SSE stream is a long-lived task. With
  per-dashboard multiplexing, this is N dashboards × M users instead of
  N widgets × M users. Manageable up to thousands of concurrent connections
  per Kestrel instance.

### What about future transport needs?

If a concrete story justifies a different transport — collaborative editing,
true bidirectional IoT command surfaces — it lands as a **parallel
mechanism**, not a refactor of the subscription path. The
`IMetricStreamProducer` server-side abstraction makes this safe: a SignalR
hub or WebSocket endpoint becomes another consumer of the same producer
interface, the `MetricResponse` envelope is locked, and widget renderers
don't notice.

What we explicitly **do not** ship:

- A frontend `<MetricSubscriptionProvider transport={...}>` context.
- Multiple frontend transport packages (`@granit/react-analytics-subscriptions-sse`
  vs `@granit/react-analytics-subscriptions-signalr`).
- Per-host transport DI on the frontend.

The abstraction lives where it matters (server-side producer interface);
the frontend stays simple.

---

## P2.5 — Dashboard-level filters (toolbar-exposed)

**Goal**: ship reusable, dashboard-scoped filter sets — separate from the
per-datasource filters that widgets carry internally. ThingsBoard distinguishes
the two and exposes some filters to the toolbar via `editable: true` so end
users can refine the entire dashboard at runtime
(`shared/models/query/query.models.ts:400`).

**Use cases**:

- Finance dashboard: a single "Customer = X" filter that all 12 widgets
  respect (unpaid invoices, revenue, payments, etc.).
- IoT dashboard: a "Site = Plant 3" filter narrowing every device-bound
  widget to one location.
- Audit dashboard: a "Severity ≥ Warning" filter trimming noise across
  every audit-event widget.

**Proposal**:

```csharp
public abstract class DashboardDefinition : IDashboardDefinitionDescriptor
{
    /// <summary>
    /// Filters declared by this dashboard. Each filter is referenced by name
    /// from any datasource; toolbar-exposed filters become user-editable
    /// controls at the top of the dashboard.
    /// </summary>
    public virtual IReadOnlyList<DashboardFilter>? Filters => null;
}

public sealed record DashboardFilter(
    /// <summary>Filter identifier referenced from datasources (e.g. "currentCustomer").</summary>
    string Name,
    /// <summary>Localization key for the toolbar label when `Editable = true`.</summary>
    string LabelLocalizationKey,
    /// <summary>Filter clauses combined by `Operation`.</summary>
    IReadOnlyList<DashboardFilterClause> Clauses,
    DashboardFilterOperation Operation = DashboardFilterOperation.And,
    /// <summary>
    /// When true, the filter is rendered as a toolbar control so end users
    /// can change its value at runtime. The widget renders the appropriate
    /// input (date picker, lookup, text, etc.) based on the clause shape.
    /// </summary>
    bool Editable = false);

public sealed record DashboardFilterClause(
    /// <summary>Field path (e.g. "customer.id", "issuedAt", "status").</summary>
    string Field,
    DashboardFilterOperator Op,
    /// <summary>Static value or `${var}` expression resolved against StateParams / aliases.</summary>
    object? Value);

public enum DashboardFilterOperator { Eq, Ne, Gt, Gte, Lt, Lte, In, Contains, StartsWith }
public enum DashboardFilterOperation { And, Or }
```

**Datasource integration**: `QueryAggregateDatasource` and `TelemetryDatasource`
gain an optional `DashboardFilters: IReadOnlyList<string>?` field listing the
filter names to apply. The runtime AND-merges those with whatever the widget
itself declares.

**Frontend impact**: the dashboard renderer surfaces `Editable = true` filters
as a toolbar above the grid. Each control's value lives in `DashboardContext`;
changes invalidate the affected widget queries (same key composition includes
filter values). Non-editable filters are applied silently — useful for
"current user", "current tenant" scoping.

**Why this and not just key-filters per datasource**: dashboard filters are
shared across widgets, get UI representation, and propagate consistently. A
per-datasource filter is widget-local — fine for "this chart only ever shows
unpaid invoices", but breaks down for "this whole dashboard is now scoped to
March 2026".

---

## P2.6 — Editable persisted dashboards via react-grid-layout

**Goal**: ship the ThingsBoard-grade UX for arranging widgets — drag,
resize, per-breakpoint layouts, persistence — without forcing the bundle
weight onto every dashboard view.

### Three layers, one mental model

| Layer                                                        | Source                                                    | Layout strategy                                                                  | Lib                 |
| ------------------------------------------------------------ | --------------------------------------------------------- | -------------------------------------------------------------------------------- | ------------------- |
| **Definition** (catalogue, module-shipped)                   | `DashboardDefinition`                                     | Auto-flow CSS grid (`grid-auto-flow: dense`) over `position: int` + `WidgetSize` | none                |
| **Persisted read-only** (story B2 — imported, end-user view) | `Dashboard` aggregate, explicit `WidgetInstance.Position` | CSS grid with explicit `grid-row`/`grid-column` per widget                       | none                |
| **Persisted edit** (admin mode — drag/resize)                | Same `Dashboard` aggregate, in edit mode                  | `react-grid-layout` (`<ResponsiveReactGridLayout>`)                              | `react-grid-layout` |

The user-facing components match the layer:

- `<Dashboard definition={...}>` — already shipped. Auto-flow only.
- `<Dashboard instance={...} mode="readonly">` — new. CSS grid with explicit positions.
- `<DashboardEditor instance={...}>` — new. `React.lazy()` over `react-grid-layout`,
  loaded only when the admin enters edit mode.

### Backend additions (B2 follow-up, NOT blocking the merge)

```csharp
namespace Granit.Dashboards;

public sealed record WidgetInstancePosition(int X, int Y, int Width, int Height);

public class WidgetInstance
{
    // ... existing inlined config (B2)

    /// <summary>Default placement on the standard (desktop) breakpoint.</summary>
    public WidgetInstancePosition Position { get; set; }

    /// <summary>
    /// Per-breakpoint position overrides keyed by `DashboardBreakpoint`.
    /// Empty / null = use the default `Position`.
    /// </summary>
    public IReadOnlyDictionary<DashboardBreakpoint, WidgetInstancePosition>? PositionOverrides { get; set; }
}
```

When the admin imports a `DashboardDefinition`, the framework computes initial
positions by walking the definition's auto-flow (`position: int` + `size`),
populates `WidgetInstance.Position`, and lets the admin drag/resize from there.

### Frontend — bundle isolation strategy

`@granit/react-dashboards` ships **read-only rendering** with zero new deps:

```tsx
// Internal to <Dashboard instance>
function PersistedDashboard({ instance }: { instance: PersistedDashboard }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: ..., gridAutoRows: ... }}>
      {instance.widgets.map((w) => (
        <div
          key={w.slug}
          style={{
            gridColumn: `${w.position.x + 1} / span ${w.position.width}`,
            gridRow: `${w.position.y + 1} / span ${w.position.height}`,
          }}
        >
          <WidgetRenderer widget={w.definition} />
        </div>
      ))}
    </div>
  );
}
```

The editor lives behind a lazy boundary in the same package:

```tsx
const DashboardEditor = React.lazy(() => import('./DashboardEditor.js'));

export function Dashboard({ instance, mode }: DashboardProps) {
  if (mode !== 'edit') return <PersistedDashboard instance={instance} />;
  return (
    <Suspense fallback={<DashboardEditorSkeleton />}>
      <DashboardEditor instance={instance} />
    </Suspense>
  );
}
```

**Bundle math** — `react-grid-layout` (~30 KB gz) + `react-resizable` (~3 KB gz)
load only when an admin clicks "Edit dashboard". End-user views stay light.

### `react-grid-layout` configuration mapping

```tsx
import { Responsive, WidthProvider } from 'react-grid-layout';

const ResponsiveGridLayout = WidthProvider(Responsive);

<ResponsiveGridLayout
  className="dashboard-editor"
  layouts={layoutsByBreakpoint} // { lg: WidgetLayout[], md: ..., sm: ..., xs: ... }
  breakpoints={{ lg: 1200, md: 996, sm: 768, xs: 480, xxs: 0 }}
  cols={{ lg: 12, md: 10, sm: 6, xs: 4, xxs: 2 }}
  rowHeight={instance.layout.rowHeight}
  draggableHandle=".widget-drag-handle" // explicit handle prevents accidental drags
  isDraggable={true}
  isResizable={true}
  onLayoutChange={(_, all) => persistLayouts(all)}
>
  {instance.widgets.map((w) => (
    <div key={w.slug} data-grid={dataGridFromInstance(w)}>
      <WidgetRenderer widget={w.definition} />
    </div>
  ))}
</ResponsiveGridLayout>;
```

The `WidgetLayout[]` shape r-g-l consumes maps 1:1 onto our
`WidgetInstancePosition` + breakpoint key — no impedance mismatch.

### What `react-grid-layout` covers vs leaves to us

| ThingsBoard UX                    | r-g-l native?                                                     |
| --------------------------------- | ----------------------------------------------------------------- |
| Drag widgets                      | ✅                                                                |
| Resize from corners               | ✅                                                                |
| Per-breakpoint layouts            | ✅ (`Responsive` wrapper)                                         |
| Static (non-editable) widgets     | ✅ (`static: true` per layout entry)                              |
| Persistence                       | ✅ (`onLayoutChange` callback — we wire it to a backend mutation) |
| Multiple states / dashboard views | ❌ — handled by P2.1 routing layer                                |
| Widget actions / drill-down       | ❌ — handled by P1.5                                              |

### Risks logged

- **a11y** — drag-and-drop has weak keyboard / screen-reader support. The
  editor mode is admin-only; if WCAG 2.2 AA matters for end users, the
  read-only `<Dashboard instance>` (CSS grid only) is fully accessible
  already, and the editor stays gated behind a permission flag.
- **Performance > 50 widgets per state** — r-g-l can sluggish under heavy
  loads. Validate via prototype if/when a real IoT dashboard exceeds 50
  widgets per active state. Alternative: virtualize the off-screen widgets
  (manual, not r-g-l-native).
- **Maintenance posture** — r-g-l is mature (10 k+ stars, MIT) but commits
  are modest. We accept that risk; the alternative (dnd-kit + custom layout
  engine) is multi-week effort with marginal benefit.

### Story phasing

| Step                                                                    | Where                                               |
| ----------------------------------------------------------------------- | --------------------------------------------------- |
| Add `WidgetInstance.Position` + `PositionOverrides` to B2 aggregate     | granit-dotnet, follow-up to #1453                   |
| Computation of initial positions from auto-flow on import               | granit-dotnet (story B4 #1385 — import endpoint)    |
| `<Dashboard instance mode="readonly">` CSS grid renderer                | `@granit/react-dashboards`, no new deps             |
| `<DashboardEditor>` lazy boundary + `react-grid-layout` integration     | `@granit/react-dashboards`, dep added (lazy-loaded) |
| `onLayoutChange` → backend mutation via `useUpdateDashboardLayout` hook | `@granit/react-dashboards`                          |
| Admin-only edit toggle UI (button + permission gate)                    | consuming app (showcase first)                      |

---

## P3.1 — `Dashboard:{Name}.Description` localization key

**Current**: `DashboardDefinition` has no description. The catalog UI
(import dialog) shows only the localized title.

**Proposal**: document the convention in `IDashboardDefinitionDescriptor`:

```csharp
public interface IDashboardDefinitionDescriptor
{
    // ... existing members

    /// <summary>
    /// The descriptor exposes only the wire identifier; user-facing strings are
    /// resolved from localization:
    ///
    ///   <c>Dashboard:{Name}</c>             — title (required)
    ///   <c>Dashboard:{Name}.Description</c> — secondary description (optional)
    ///   <c>Widget:{DashboardName}.{Slug}</c> — widget content (per widget convention)
    ///
    /// Modules ship the keys for their default cultures; tenants override them
    /// via `Granit.Localization.Overrides`.
    /// </summary>
}
```

No code change — just contractual clarity so consumers don't reinvent the convention.

---

## P3.2 — Per-instance config overrides (layer over B2)

**Context**: ThingsBoard widgets have rich per-instance overrides — title,
color, units, thresholds, decimals. We don't need them on the **definition**
(module-shipped, fixed) but the **persisted Dashboard** aggregate should
accept them.

**Status update**: B2 (#1453) ships `WidgetInstance` with the data-binding
fields inlined directly (`MetricName`, `ConfigJson`, etc.). That's correct
for "values pinned at import time". This proposal layers a separate
`Overrides: WidgetInstanceConfig?` field for **runtime user customization**
(admin renames a widget, recolors a series, adjusts decimals). The two are
distinct concerns — pinned import-time values vs editable user overrides.

**Sketch** (follow-up over B2, not blocking the merge):

```csharp
namespace Granit.Dashboards;  // in Granit.Dashboards (impl), not Abstractions

public sealed class DashboardWidgetInstance
{
    public Guid Id { get; set; }
    public string DefinitionWidgetSlug { get; set; }    // links back to the WidgetDefinition.Slug
    public WidgetInstanceConfig? Overrides { get; set; }
}

public sealed record WidgetInstanceConfig(
    string? TitleOverrideLocalizationKey = null,
    string? ColorOverride = null,                // hex
    string? UnitOverride = null,
    int? DecimalsOverride = null,
    IReadOnlyList<WidgetThreshold>? Thresholds = null);

public sealed record WidgetThreshold(
    decimal Value,
    string Color,
    /// <summary>"&gt;=" | "&lt;=" | "==" — applied left-to-right.</summary>
    string Operator);
```

The persisted aggregate carries instance config; the definition stays minimal.

---

## P3.3 — `${variable}` substitution syntax (no JS)

**Goal**: parameterise widget titles, action params, filter values, and
similar strings using a tiny declarative substitution syntax. ThingsBoard
uses `${variableName}` regex-driven replacement throughout
(`core/utils.ts:39, 456, 470`). It's a useful pattern — but they pair it
with full JS evaluation in other places, which we explicitly reject.

**Proposal**: ship `${variable}` and only `${variable}`. No code, no `eval`,
no expression evaluator. A small hardened resolver matches `\${([^}]+)}` and
substitutes against a typed context.

**Substitution context** (composition order — later wins):

1. **State parameters** — `${entityId}`, `${entityName}` from the active
   `StateParams` (P2.1).
2. **Resolved aliases** — `${alias.currentDevice}` from `EntityAlias` resolution.
3. **Time window** — `${timeWindow.from}`, `${timeWindow.to}`,
   `${timeWindow.span}`.
4. **Row data** (in row-click action contexts) — `${row.customerId}`,
   `${row.amount}`.
5. **Series / data-key data** (in series-click action contexts) —
   `${series.name}`, `${series.value}`.

**Where it applies**:

- `WidgetAction.Params` values → resolved at dispatch time against the
  triggering row / series.
- `DashboardFilterClause.Value` → resolved against state params + aliases at
  query-build time.
- Widget title overrides on persisted instances (story B2) → resolved against
  state params + aliases at render time.

**Implementation** (server-side):

```csharp
public interface IVariableSubstituter
{
    string Substitute(string template, IReadOnlyDictionary<string, object?> context);
}

// Default implementation — pure regex, no scripting.
//   "Customer ${entityName} — invoices unpaid"
//   + { entityName = "Acme Corp" }
//   = "Customer Acme Corp — invoices unpaid"
//
// Unknown variables: replaced with empty string AND surfaced as a structured
// log warning. We never throw — broken templates degrade visibly but don't
// break the dashboard.
```

**What we explicitly reject**: any expression syntax beyond simple variable
lookup. No `${1+1}`, no `${entity.name | uppercase}`, no `${if status...}`.
If a widget needs computed values, the computation lives in the data pipeline
(metric definition, query) — not in a template literal.

---

## Anti-patterns explicitly NOT inherited from ThingsBoard

| TB feature                                          | Why not                                                             |
| --------------------------------------------------- | ------------------------------------------------------------------- |
| **Inline JS hooks** in widget config                | XSS, untestable, untyped. Declarative descriptors only.             |
| **Schemaless `settings: {}` blob**                  | Drift guaranteed. Strongly-typed records per widget variant.        |
| **Marketplace / dynamically loaded widget bundles** | Module-shipped only — auditable supply chain.                       |
| **WebSocket bidirectional for everything**          | `RefreshHint` discriminates. Only `realtime` gets a push transport. |
| **Mandatory state machine**                         | Optional via `States?` — single-state dashboards stay simple.       |

---

## Phasing summary

B0 / B1 / B2 are already shipped or in review on `granit-dotnet`. The
phasing below maps to the actual story IDs rather than abstract milestones.

| Real story                           | Proposals                                                                                                                                                        | When                                                                                                                                                                  |
| ------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Pre-merge fix on B2 #1453**        | **P1.1 JsonPolymorphic**                                                                                                                                         | **Urgent — must land before B2 merges**. The default `$type` shape is CLR-coupled and would persist into every imported dashboard JSON.                               |
| **B1.5 follow-up** (after B2 merges) | P1.2 ImageFit + P1.3 TimeWindow (PeriodSpec-aligned) + P1.4 Responsive layouts + P3.1 description doc + P3.3 `${var}` substituter                                | Frontend can refactor `@granit/dashboards` types and ship `<DashboardProvider>` against the existing model right now; the additions land progressively.               |
| **B3 #1384 (per-kind validators)**   | P1.5 Actions + P3.2 WidgetInstance overrides                                                                                                                     | Originally scoped to validators; widen to actions + the runtime override layer over B2's inlined config.                                                              |
| **B4 #1385**                         | P2.1 Views (renamed from `DashboardState`) + P2.5 Dashboard filters                                                                                              | Already a busy story — may need to split filters out into B4.5 if it grows.                                                                                           |
| **B5 (frontend-led)**                | P2.3 EntityAliases (4 resolver kinds, no RelationGraph) + P2.2 Datasource migration                                                                              | Datasource migration is a breaking change to KpiWidgetDefinition (drop `MetricName` shorthand, replace with `Datasource`). Front + back coordinated.                  |
| **B6+ — dedicated ticket**           | P2.4 SSE subscriptions (per-metric + per-dashboard multiplexed, snapshot+update events, tenant-pinned producer keying, bounded replay buffer)                    | New ticket separate from #1387. Endpoint design is a project of its own.                                                                                              |
| **B6+ — dedicated ticket**           | P2.6 `WidgetInstance.Position` (X, Y, W, H) + per-breakpoint `PositionOverrides` on B2 aggregate; auto-flow → explicit position computation on import (B4 #1385) | `<Dashboard instance mode="readonly">` CSS-grid renderer (zero new deps); `<DashboardEditor>` lazy boundary loading `react-grid-layout` (~33 KB gz only on edit mode) |

Frontend work that can proceed **immediately** (no backend dependency): the
type alignment to current shipped `Granit.Dashboards.Abstractions`
(`Slug`/`Position`/`Size`/`RequiredPermission`/localization keys/`IsSystem`/
`Version`/full `DashboardCategory` enum, drop layout-items, drop description),
plus the `<Dashboard>` auto-flow grid and i18n-resolving widget renderers.
The proposed extensions slot in cleanly as backend ships them.

P1 items unblock the frontend refactor immediately. P2/P3 can land progressively
without breaking the wire format if discriminated unions are pinned now.

---

## Frontend status (for awareness)

These TypeScript packages were scaffolded in `granit-front`, all uncommitted
(awaiting alignment with the items above):

- `@granit/dashboards` — types mirroring `Granit.Dashboards.Abstractions`
- `@granit/react-dashboards` — Dashboard renderer, registry, framework widgets
- `@granit/charts` — Apache ECharts theme builder + locale-aware formatters
- `@granit/react-charts` — typed `<LineChart>`, `<BarChart>`, `<PieChart>`,
  `<SparklineChart>` + escape hatch `<Chart>`, ECharts modular imports

Once the P1 items land in `Granit.Dashboards.Abstractions` and we settle on
the JsonPolymorphic discriminators, the frontend refactor is ~1h of mechanical
type updates.
