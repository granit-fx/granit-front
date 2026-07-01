# @granit/react-ui-analytics

shadcn-styled **config forms** for the analytics dashboard widgets — the
KPI / chart / table / pivot config forms plus the shared query-binding editor
controls used by the dashboard composer. This is the **rendering** tier of
[`@granit/react-analytics`](../react-analytics): it composes the headless
package (hooks, unstyled tiles, widget registry, widget metadata + validation)
with the foundation UI package [`@granit/react-ui`](../react-ui).

Extracting these forms keeps `@granit/react-analytics` free of any
`@granit/react-ui` dependency (Option-b strict tiers): the headless package
ships the `useQueryFieldMetadata` hook, the widget catalog and the required-field
validation, while this package owns everything that renders shadcn primitives.

## What it ships

- **Config forms** — `KpiConfigForm`, `ChartConfigForm`, `TableConfigForm`,
  `PivotConfigForm`. Each edits the query binding and the kind-specific fields
  (aggregation, group-by, columns, chart type…) and is shaped as a
  `WidgetConfigForm` for the dashboard editor.
- **`analyticsWidgetConfigFormRegistry`** — the four kinds pre-composed into a
  single registry, ready to drop into
  `composeWidgetConfigFormRegistries(default, analyticsWidgetConfigFormRegistry)`.
- **Shared query-binding controls** — `QueryNameCombobox`, `MetaFieldInput`,
  `MetaMultiFieldInput`, `EnumSelect`, `RequiredMark`. Catalogue-backed comboboxes
  that also accept a typed value, so they degrade to free-text-with-suggestions
  when no `<QueryCatalogProvider>` is present. Reused by the map widget config
  form ([`@granit/react-map`](../react-map)) and any downstream widget that binds
  to a query-engine query.

## Consumers

- [`@granit/react-ui-dashboards`](../react-ui-dashboards) — the dashboard
  composer wires `analyticsWidgetConfigFormRegistry` into the editor.
- [`@granit/react-map`](../react-map) — the map widget config form reuses the
  shared query-binding controls.

## Data wiring

The controls render options; the data comes from the headless
`useQueryFieldMetadata(queryName)` hook in
[`@granit/react-analytics`](../react-analytics), which resolves the query
catalogue and the selected query's column metadata via
[`@granit/react-query-engine`](../react-query-engine). A `<QueryClientProvider>`
is required for those fetches.
