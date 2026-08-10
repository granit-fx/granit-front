# @granit/react-ui-multi-tenancy

Admin UI feature kit for the Granit **Multi-Tenancy** module — a query-driven
tenant list (smart filters, sortable columns, export, per-row activate /
deactivate), the tenant create form, and the tenant edit view with a
host-injected activity aside. This is the **react-ui admin layer**: it composes
the headless [`@granit/react-multi-tenancy`](../react-multi-tenancy) (provider +
hooks) with the foundation UI packages and gates every management action with
[`@granit/react-authorization`](../react-authorization) `usePermissions`.

The split is three packages over the same .NET `Granit.MultiTenancy` backend
(contract: `contracts/openapi/multi-tenancy.json`):

- [`@granit/multi-tenancy`](../multi-tenancy) — framework-agnostic core: tenant
  DTOs, the tenant-resolver abstraction, and the spec-derived
  `multiTenancyConstraints` used for form validation.
- [`@granit/react-multi-tenancy`](../react-multi-tenancy) — React Query hooks +
  the `TenantAdminProvider` / `TenantProvider`. No rendering.
- `@granit/react-ui-multi-tenancy` (this package) — the route-level admin pages
  and the smaller building blocks (form, status dialog, column factory) they
  compose. This is the only layer that renders.

The three pages are drop-in route elements: each wraps its own
`TenantAdminProvider config={{}}`, which resolves the Axios client from a
`GranitClientProvider` higher in the tree — no client is baked in. Tenant
listing goes through the `Granit.QueryEngine` endpoint (`PagedResult`) via
[`@granit/react-query-engine`](../react-query-engine), not a bespoke list hook.

## Install

Workspace-internal — consumed via the `@granit/*` Vite/Vitest aliases, not
published for app consumption through a public registry. A consumer must mount
the pages under a `GranitClientProvider` and declare these peers:

- `@granit/multi-tenancy` — core DTOs + `multiTenancyConstraints` (form rules).
- `@granit/react-multi-tenancy` — `TenantAdminProvider` + the tenant admin hooks
  the pages call.
- `@granit/react-authorization` — `usePermissions` for the `MultiTenancy.Tenants.*`
  and `Hostnames.Hostnames.Read` action gates.
- `@granit/query-engine` / `@granit/react-query-engine` — query metadata, the
  smart-filter / sort / group-by hooks, and the `QueryEndpointDataTable`.
- `@granit/react-data-exchange` / `@granit/react-ui-data-exchange` — the export
  provider plus the `ExportButton` / `ExportDialog` surface.
- `@granit/react-ui` / `@granit/react-ui-admin-kit` — shadcn-based primitives and
  the admin layout pieces (`DetailAsideLayout`, `SmartFilterBar`, …).
- `@granit/react-localization` — `useTranslation` / `useDateFormatter`.
- `@granit/react-validation` — `createConstraintsResolver` for the tenant form.
- `@tanstack/react-query` (`^5`), `@tanstack/react-table` (`^9.0`),
  `react` / `react-dom` (`^19`), `react-hook-form` (`^7.80`),
  `react-router` (`^7.18`), and `lucide-react` (`^1.21`).

## Quick start

Register the bundled `Tenants.*` strings, then mount the three pages as route
elements. The activity aside is host-owned and injected per render.

```tsx
import {
  TenantListPage,
  TenantCreatePage,
  TenantEditPage,
  multiTenancyTranslationsEn,
} from '@granit/react-ui-multi-tenancy';
import { Route, Routes } from 'react-router';

i18n.addResourceBundle('en', 'translation', multiTenancyTranslationsEn, true, true);

function TenantAdminRoutes({
  renderTimeline,
}: {
  renderTimeline: (id: string) => React.ReactNode;
}) {
  // Mount under a <GranitClientProvider>; each page wraps its own TenantAdminProvider.
  return (
    <Routes>
      <Route path="/tenants" element={<TenantListPage />} />
      <Route path="/tenants/new" element={<TenantCreatePage />} />
      <Route
        path="/tenants/:id/edit"
        element={<TenantEditPage renderActivityAside={renderTimeline} />}
      />
    </Routes>
  );
}
```

The list page seeds an active-only preset and 20-row pages, wires the
`@granit/react-ui-admin-kit` smart-filter / sort / group-by bar to the query
metadata, and renders the action menu only for the permissions the user holds
(`Create` shows the header button, `Update` the edit item, `Manage` the
activate/deactivate item). The edit page exposes the activity slot:

```tsx
<TenantEditPage
  // Host owns the feed — e.g. an EntityTimeline wired to its auth context and
  // @-mention picker. When omitted, the aside is empty.
  renderActivityAside={(tenantId) => <EntityTimeline subjectId={tenantId} />}
  activityAsideTitle="Recent activity"
/>
```

For finer-grained composition (a custom page shell), the building blocks are
exported directly: `TenantForm` (discriminated `create` / `edit` modes,
auto-slugged identifier, spec-driven validation), `TenantStatusDialog` (the
confirm gate for activate / deactivate), and `createTenantColumns` (the
TanStack Table `DataTableColumnDef[]` factory, permission-aware).

## Public API

| Symbol                       | Kind      | Purpose                                                                           |
| ---------------------------- | --------- | --------------------------------------------------------------------------------- |
| `TenantListPage`             | component | Query-driven list: smart filters, sort/group-by, export, status toggle            |
| `TenantCreatePage`           | component | Create form page; submits via `useCreateTenant`, navigates to the list            |
| `TenantEditPage`             | component | Edit form + status actions + host-injected activity aside                         |
| `TenantEditPageProps`        | type      | `{ renderActivityAside?, activityAsideTitle? }`                                   |
| `TenantForm`                 | component | Create/edit form; auto-slug identifier, `multiTenancyConstraints` rules           |
| `TenantStatusDialog`         | component | Activate / deactivate confirmation `AlertDialog`                                  |
| `createTenantColumns`        | fn        | TanStack Table `DataTableColumnDef[]` factory, gated by `canUpdate` / `canManage` |
| `CreateTenantFormValues`     | type      | `{ name, identifier, contactEmail, jurisdiction }` form shape                     |
| `EditTenantFormValues`       | type      | `{ name, contactEmail, jurisdiction }` (identifier is read-only)                  |
| `TenantQueryItem`            | type      | Row shape returned by the query-engine tenant endpoint (camelCase)                |
| `multiTenancyTranslationsEn` | const     | English `Tenants.*` resource bundle                                               |
| `multiTenancyTranslationsFr` | const     | French `Tenants.*` resource bundle                                                |

## Out of scope / caveats

- **Permission checks are a UX hint, not a security boundary.** The pages hide
  controls and skip mutations the user cannot use; the `Granit.MultiTenancy`
  backend re-checks `MultiTenancy.Tenants.*` on every endpoint. See the
  [`@granit/react-authorization`](../react-authorization) security model.
- **Identifier is immutable.** The create form auto-slugs the identifier from
  the name (until the user edits it) and validates it; the edit form renders it
  read-only — `EditTenantFormValues` has no `identifier` field and the .NET
  contract rejects changes.
- **Optimistic concurrency via body field.** The edit page reads
  `tenant.concurrencyStamp` from the detail query and forwards it on
  `useUpdateTenant`; a stale stamp yields `409`. The stamp is never an
  `If-Match` header.
- **Hooks, DTOs and transport are upstream.** Tenant mutations / detail
  (`useCreateTenant`, `useUpdateTenant`, `useActivateTenant`,
  `useDeactivateTenant`, `useTenantDetail`) and the `TenantAdminProvider` live
  in [`@granit/react-multi-tenancy`](../react-multi-tenancy); the wire DTOs and
  `multiTenancyConstraints` live in [`@granit/multi-tenancy`](../multi-tenancy).
  This package only renders.
- **The activity aside is not provided.** `TenantEditPage` exposes
  `renderActivityAside` so the host can inject its own timeline (wired to its
  auth context and `@`-mention picker); the package never depends on an app's
  auth feature or timeline component. The aside is empty when the prop is
  omitted.
- **Custom-domains link is conditional.** The edit header surfaces a link to the
  Hostnames admin only when the user holds `Hostnames.Hostnames.Read`; routing
  to that screen is the host app's responsibility.
- **i18n registration is the host's job.** This package ships the `Tenants.*`
  bundles but does not register them; the host adds them to its i18next
  instance.

## License

Apache-2.0
