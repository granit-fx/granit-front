# @granit/react-ui-admin-kit

Cross-cutting React building blocks for Granit admin apps — the pieces that are
neither bare UI primitives nor tied to a single domain: a server-paginated data
grid, a full querying surface (smart filter omnibox, sort / group-by /
column-visibility, presets, bulk actions, date-period picker, paginated tables),
form-in-dialog and detail-aside shells, a top progress bar, a view switcher, and
internationalized URL / phone / timezone inputs.

This is a **`react-ui` admin feature kit**, but a *horizontal* one — it has no
backend counterpart and no single `react-<name>` hooks sibling. It composes
[`@granit/react-ui`](../react-ui) primitives (shadcn/Radix) with the headless
querying hooks from [`@granit/react-query-engine`](../react-query-engine)
(`useSmartFilter`, `useQueryEndpoint`, `useQueryMeta`) and resolves filter
metadata against the [`@granit/query-engine`](../query-engine) DTOs. Components
here only render and call those hooks; the consuming app mounts the query /
client / localization providers. No domain knowledge lives here — domain admin
kits (`@granit/react-ui-parties`, `@granit/react-ui-invoicing`, …) consume these
shells with their own columns and lookups. Styled via the
[`@granit/ui-theme`](../ui-theme) token contract.

## Install

Workspace-internal — consumed via the `@granit/*` Vite/Vitest aliases (source-
direct: `src/`), not installed from a public registry for app consumption. A
consumer must declare these peers (from `package.json`):

- `@granit/react-ui` — the underlying shadcn/Radix primitives every component
  renders (`Table`, `Dialog`, `Command`, `Popover`, `DropdownMenu`, …).
- `@granit/react-query-engine` — the `useSmartFilter` / `useQueryEndpoint` /
  `useQueryMeta` hooks the querying surface binds to.
- `@granit/query-engine` — the metadata + token DTOs (`QueryMetadata`,
  `FilterToken`, `GroupEntry`, `SortEntry`, `DatePeriod`, …).
- `@granit/react-localization` — `useTranslation` / `useTimezone`; every label,
  empty state, and aria-label is translated.
- `@granit/data-lookup` + `@granit/react-data-lookup` — the lookup descriptor /
  options surface backing in-filter lookup suggestions.
- `@granit/react-api-client` and `@granit/utils` — Axios context + `cn`.
- `@tanstack/react-table` (`^8.21`) — the grid engine for `ManualDataTable` /
  `QueryDataTable`.
- `react-hook-form` (`^7.80`) — `FormDialog` wraps a caller-owned form instance.
- `cmdk` (`^1.1`) — the smart-filter and picker omniboxes.
- `libphonenumber-js` (`^1.13`) — `PhoneInput` / `formatPhoneInternational`.
- `lucide-react`, `react` / `react-dom` (`^19`), `react-i18next` (`^17`).

## Quick start

The app owns the providers (React Query, Granit client, i18n); this kit renders
the chrome and binds to the query-engine hooks. A typical list page wires a
`useSmartFilter` + `useQueryEndpoint` pair through `useSmartFilterSync`, then
drops in the bar, control row, and table:

```tsx
import {
  SmartFilterBar,
  QueryControlBar,
  QueryEndpointDataTable,
  useSmartFilterSync,
} from '@granit/react-ui-admin-kit';
import { useSmartFilter, useQueryEndpoint, useQueryMeta } from '@granit/react-query-engine';
import type { ColumnDef } from '@tanstack/react-table';

function PartyList({ columns }: { columns: ColumnDef<Party, unknown>[] }) {
  const meta = useQueryMeta('/api/v1/parties');
  const smartFilter = useSmartFilter({ metadata: meta.data });
  const queryEndpoint = useQueryEndpoint<Party>('/api/v1/parties');

  // Push filters / search / presets / quick-filters into the endpoint and get
  // a bidirectional preset toggle back. Pass a stable `baseFilters` array to
  // scope a child grid to a parent id.
  const { handlePresetToggle } = useSmartFilterSync(smartFilter, queryEndpoint, meta);

  if (!meta.data) return null;
  return (
    <div className="space-y-4">
      <SmartFilterBar smartFilter={smartFilter} />
      <QueryControlBar
        meta={meta.data}
        queryEndpoint={queryEndpoint}
        recordLabel="parties"
        presetState={{ presets: smartFilter.presets, onToggle: handlePresetToggle }}
      />
      <QueryEndpointDataTable queryEndpoint={queryEndpoint} columns={columns} />
    </div>
  );
}
```

For features that own their pagination state directly (no query engine), reach
for `ManualDataTable`; for a create/edit form in a modal, `FormDialog` wraps a
`react-hook-form` instance with shared Cancel/Submit chrome:

```tsx
import { ManualDataTable, FormDialog } from '@granit/react-ui-admin-kit';
import { useForm } from 'react-hook-form';

function EditDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const form = useForm<{ name: string }>();
  return (
    <FormDialog
      open={open}
      onOpenChange={(v) => !v && onClose()}
      form={form}
      onSubmit={async (values) => {
        /* mutation owned by the caller */
      }}
      title="Edit party"
      submitLabel="Save"
    >
      {/* form fields rendered inside the shared <Form>/<form> wrapper */}
    </FormDialog>
  );
}
```

## Public API

All exports come through the single barrel (`@granit/react-ui-admin-kit`);
import everything from the package root. Each component type alias
(`*Props`) is re-exported alongside its component.

| Symbol                     | Kind      | Purpose                                                                  |
| -------------------------- | --------- | ------------------------------------------------------------------------ |
| `ManualDataTable`          | component | Server-paginated TanStack table driven by `page`/`pageSize` props        |
| `QueryDataTable`           | component | Filter/sort/group-aware table with skeletons + collapsible groups        |
| `QueryEndpointDataTable`   | component | Thin wrapper unwrapping `useQueryEndpoint` grouped/paged branching       |
| `QueryControlBar`          | component | Top row: presets + sort + group-by selectors + total-count label         |
| `SmartFilterBar`           | component | cmdk omnibox: facet tokens, field/operator/value/lookup suggestions      |
| `SortSelector`             | component | Dropdown to pick a sort field and cycle asc → desc → unsorted            |
| `GroupBySelector`          | component | Dropdown to pick a group-by field (or clear grouping)                    |
| `GroupByRows`              | component | Expand/collapse group rows with lazy drill-down via `onExpand`           |
| `ColumnVisibility`         | component | Checkbox dropdown toggling visible columns                               |
| `FilterPresets`            | component | Odoo-style preset toggle button rows (OR within group, AND between)      |
| `BulkActions`              | component | Selection toolbar with batch action buttons (hidden when empty)          |
| `DatePeriodPicker`         | component | Period dropdown (Today / ThisWeek / … / Custom) from `DateFilterMeta`    |
| `FacetBadge`               | component | One filter token rendered as a removable badge                           |
| `SuggestionList`           | component | cmdk suggestion list for fields / operators / presets / quick filters    |
| `LookupSuggestionList`     | component | In-filter lookup options list (single or `In`-multi select)              |
| `SortableHeader`           | component | Clickable table header showing sort direction                            |
| `TablePagination`          | component | Page nav + page-size selector for `QueryDataTable`                       |
| `EmptyState`               | component | Standard "no results" cell content                                       |
| `FormDialog`               | component | Form-in-modal shell over a caller-owned `react-hook-form` instance       |
| `DetailAsideLayout`        | component | Two-pane detail surface: inline aside on `lg+`, Sheet below              |
| `DetailAsideMobileTrigger` | component | Optional named entry point opening the mobile aside Sheet                |
| `TopProgressBar`           | component | nProgress-style top bar tracking fetches/mutations/route suspense        |
| `RouteSuspenseSignal`      | component | Mount inside a Suspense fallback to feed `TopProgressBar`                |
| `ViewSwitcher`             | component | List/Kanban toggle (`ViewMode`)                                          |
| `TimezonePicker`           | component | IANA timezone combobox (grouped by region, GMT offsets, clearable)       |
| `UrlInput`                 | component | Protocol-select + path input, joins/splits a single URL string           |
| `PhoneInput`               | component | Country-select + national input emitting E.164 (`libphonenumber-js`)     |
| `useSmartFilterSync`       | hook      | Sync `useSmartFilter` state into a `useQueryEndpoint` + preset toggle    |
| `useOperatorLabels`        | hook      | Translated operator labels (`Eq`, `Contains`, `Between`, …)              |
| `formatPhoneInternational` | fn        | E.164 → spaced international display string (read-side only)             |
| `ViewMode`                 | type      | `'list' \| 'kanban'`                                                     |

## Out of scope / caveats

- **Headless querying logic lives elsewhere.** Filter-state machines, token
  parsing, query-key factories, and endpoint dispatchers belong to
  [`@granit/react-query-engine`](../react-query-engine) and
  [`@granit/query-engine`](../query-engine). This package only renders them; do
  not re-implement filter state here.
- **No domain knowledge, no backend counterpart.** There is no
  `contracts/openapi/*` spec behind this kit — it is a presentation layer.
  Columns, lookups, mutations, and routes are supplied by the consuming feature
  (a domain `react-ui-<module>` package).
- **`useSmartFilterSync` `baseFilters` must be stable.** Always-applied filters
  (e.g. scoping a child grid to a parent id) are prepended on every sync — pass
  a memoized array or you will thrash the query.
- **`PhoneInput` stores E.164, displays national.** The emitted `onChange` value
  is the canonical E.164 wire string (`+32479123456`); the visible field shows
  the national form. Use `formatPhoneInternational` for read-side rendering of
  stored values; it falls back to the raw input when parsing fails so display
  never breaks. Default country is `BE`.
- **`UrlInput` normalizes `'' ↔ null`.** React-Hook-Form's `''` default and a
  cleared `null` are treated interchangeably so the protocol dropdown choice
  survives the round-trip; an empty path emits `null`.
- **`TimezonePicker` degrades gracefully.** It uses `Intl.supportedValuesOf` and
  `Intl.DateTimeFormat` for the zone list / offsets, falling back to a small safe
  set when unavailable, and defaults once to the user's resolved timezone
  (`useTimezone`) without re-defaulting after an explicit clear.
- **`DetailAsideLayout` mounts the aside once per breakpoint.** It renders the
  inline panel on `lg+` and the Sheet below via a matched media query, so aside
  providers (e.g. a timeline/SSE provider) never double-mount; the desktop
  collapse state persists in `localStorage`.

## License

Apache-2.0
