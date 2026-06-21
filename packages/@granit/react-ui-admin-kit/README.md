# @granit/react-ui-admin-kit

Cross-cutting React building blocks for Granit admin apps — the pieces that are
neither bare primitives nor tied to a single domain:

- **Data grid** — `ManualDataTable` (prop-driven, server-paginated).
- **Querying** — `SmartFilterBar`, `QueryControlBar`, `SortSelector`,
  `GroupBySelector`, `ColumnVisibility`, `FilterPresets`, `BulkActions`,
  `DatePeriodPicker`, `QueryEndpointDataTable`, `QueryDataTable` and helpers.
- **Forms** — `FormDialog` (form-in-modal shell).
- **Views** — `ViewSwitcher`.

Composes [`@granit/react-ui`](../react-ui) primitives with
[`@granit/react-query-engine`](../react-query-engine) hooks
(`useSmartFilter`, `useQueryEndpoint`). The consuming app mounts the query /
client providers; these components only render and call the hooks.

Presentational + query wiring only — no domain knowledge. Styled via the
[`@granit/ui-theme`](../ui-theme) token contract.

## Consumption

Source-direct in the Granit monorepo and the showcases (pnpm `link:` + Vite
alias → `src/`). Barrel-only: import everything from the package root.
