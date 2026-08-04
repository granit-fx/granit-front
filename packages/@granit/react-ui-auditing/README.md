# @granit/react-ui-auditing

Admin UI for the Granit **Auditing** module — the audit-log list and detail
pages plus their presentational pieces (column factory, category / change-type
badges, entity-change cards). This is the **react-ui admin feature kit**: the
top, presentation-only layer. It composes the headless hooks/providers from
[`@granit/react-auditing`](../react-auditing) with the foundation UI packages
([`@granit/react-ui`](../react-ui),
[`@granit/react-ui-admin-kit`](../react-ui-admin-kit)) into drop-in pages. The
headless package stays free of presentation; this package stays free of
data-fetching wiring.

The split is three packages over the same .NET `Granit.Auditing` backend
(contract: `contracts/openapi/auditing.json`):

- [`@granit/auditing`](../auditing) — framework-agnostic core: DTOs (the
  `AuditEntryResponse` / `AuditEntityChangeResponse` family), the `AuditCategory`
  / `AuditChangeType` enums, and the Axios lookup functions.
- [`@granit/react-auditing`](../react-auditing) — React Query hooks + the
  `AuditLogProvider` (client / base-path configuration). Headless.
- `@granit/react-ui-auditing` (this package) — admin UI kit: routable pages,
  badges, the entity-change card, and the column factory.

## Install

Workspace-internal — consumed via the `@granit/*` Vite/Vitest aliases, not
published for app consumption through a public registry. A consumer must declare
these peers:

- `@granit/react-auditing` — headless provider + hooks the pages mount.
- `@granit/auditing` — core DTOs / enums (`AuditEntryResponse`,
  `AuditCategoryValue`, …) the components are typed against; also re-exported
  here for convenience.
- `@granit/react-ui` — shadcn/ui primitives (`Badge`, `Card`, `Select`,
  `Table`, `Spinner`, `Button`, …).
- `@granit/react-ui-admin-kit` — `ManualDataTable`, the server-paginated grid
  the list page renders into.
- `@granit/react-localization` — `useTranslation` / `useDateFormatter` used by
  every component.
- `@granit/types` — `toEntityId` for the branded `AuditEntry` id parsed from the
  route.
- `@tanstack/react-table` (`^8.21`) — `ColumnDef`, the type `createAuditColumns`
  returns.
- `i18next` (`^26`) — runtime for the shipped resource bundles.
- `lucide-react` (`^1.21`) — page icons.
- `react` / `react-dom` (`^19`) and `react-router` (`^7.18`) — routing and
  the detail links (`useParams`, `Link`).

The Axios client is **not** a peer of this package: the pages resolve it from a
`GranitClientProvider` (`@granit/react-api-client`) in the host tree.

## Quick start

Register the i18n bundle once, then mount the pages in your router under any
prefix you like. Each page wraps itself in an `AuditLogProvider`, so no extra
provider wiring is needed beyond the host's `GranitClientProvider`.

```tsx
import { AuditListPage, AuditDetailPage, auditingTranslationsEn } from '@granit/react-ui-auditing';
import { Route, Routes } from 'react-router';

// Flat keys in the "translation" namespace; the host owns registration.
i18n.addResourceBundle('en', 'translation', auditingTranslationsEn, true, true);

// Route prefix is yours; pass `routeBase` so the detail links resolve.
function AuditingRoutes() {
  return (
    <Routes>
      <Route path="/audit" element={<AuditListPage routeBase="/audit" />} />
      <Route path="/audit/:id" element={<AuditDetailPage routeBase="/audit" />} />
    </Routes>
  );
}
```

Both pages accept an optional `basePath` (defaults to `/api/v1/auditing`) and
`routeBase` (defaults to `/auditing`). The list page renders a category filter
plus a server-paginated `ManualDataTable`; the detail page reads `:id` from the
route, fetches the entry, and renders its metadata grid and entity-change cards.

To compose your own layout instead of the bundled pages, drop down to the
factory and presentational pieces:

```tsx
import { createAuditColumns, AuditCategoryBadge } from '@granit/react-ui-auditing';
import { useAuditEntries } from '@granit/react-auditing';
import { useDateFormatter, useTranslation } from '@granit/react-localization';

function MyAuditGrid({ routeBase }: { routeBase: string }) {
  const { t } = useTranslation();
  const { formatDateTime } = useDateFormatter();
  const { query } = useAuditEntries();
  const columns = createAuditColumns({ t, formatDateTime, routeBase });
  // feed `columns` + `query.data?.items` into your own table…
}
```

## Public API

| Symbol                     | Kind      | Purpose                                                            |
| -------------------------- | --------- | ------------------------------------------------------------------ |
| `AuditListPage`            | component | Routable list page: category filter + paginated `ManualDataTable`  |
| `AuditDetailPage`          | component | Routable detail page: metadata grid + entity-change cards          |
| `AuditCategoryBadge`       | component | Localized, variant-colored badge for an `AuditCategoryValue`       |
| `AuditChangeTypeBadge`     | component | Localized, variant-colored badge for an `AuditChangeTypeValue`     |
| `AuditEntityChangeCard`    | component | Card listing one entity's property-level original/new values       |
| `createAuditColumns`       | fn        | `ColumnDef[]` factory (timestamp, user, category, count, IP, view) |
| `DEFAULT_AUDIT_BASE_PATH`  | const     | `'/api/v1/auditing'` (default module API mount path)               |
| `DEFAULT_AUDIT_ROUTE_BASE` | const     | `'/auditing'` (default client-side route base)                     |
| `auditingTranslationsEn`   | const     | English `Audit.*` resource bundle (flat keys, `translation` ns)    |
| `auditingTranslationsFr`   | const     | French `Audit.*` resource bundle                                   |
| `AuditListPageProps`       | type      | `{ basePath?, routeBase? }`                                        |
| `AuditDetailPageProps`     | type      | `{ basePath?, routeBase? }`                                        |
| `AuditingTranslations`     | type      | Shape of a resource bundle (`fr` is checked against it)            |
| `AuditEntryResponse`       | type      | Re-export of the core list-row DTO from `@granit/auditing`         |

## Injection

- **API client** — resolved from a `GranitClientProvider`
  (`@granit/react-api-client`) higher in the tree; no client is baked into the
  pages. `basePath` defaults to `/api/v1/auditing` and is overridable per page.
- **Routes** — `routeBase` (default `/auditing`) is threaded into the pages and
  `createAuditColumns`, so the kit never hardcodes an app's route prefix; pass
  the same value to both pages and the detail links resolve.
- **i18n** — the package ships its `Audit.*` strings (`auditingTranslationsEn` /
  `auditingTranslationsFr`); the host registers them. `Common.*` keys
  (`Common.All`, `Common.Back`, `Common.NoResults`, …) are app-global and are
  expected to already exist in the host's bundle.

## Caveats

- **Presentation only — security lives on the backend.** These pages hide and
  format audit data; they do not gate access. Whether the current user may read
  the audit log (and which fields they see) is enforced by `Granit.Auditing`
  server-side via the core `AuditingPermissions`. Gate the route/menu entry with
  `@granit/react-authorization` and never treat client-side rendering as a
  confidentiality boundary — anything the browser receives is reachable from
  DevTools.
- **Audit data is PII-adjacent.** Entries carry `userName`, `ipAddress`,
  `tenantId`, `correlationId`, and per-property original/new values. Do not log
  or persist rendered entries beyond what the UI needs; pseudonymization of a
  user's trail is a backend operation (core `pseudonymizeUserAuditLogs`), not a
  UI concern.
- **Category filter is server-honored.** The list page serializes the category
  selection as a query-engine `filter` (`{ field: 'category', operator: 'Eq' }`),
  so the backend applies it — the table is never client-filtered over a partial
  page.

## Out of scope

- **Data fetching / DTOs / transport** — owned by
  [`@granit/react-auditing`](../react-auditing) (hooks + `AuditLogProvider`) and
  [`@granit/auditing`](../auditing) (Axios calls + DTOs). This package only
  renders what they return.
- **Authorization / route gating** — combine with
  [`@granit/react-authorization`](../react-authorization); the kit assumes the
  caller is already permitted to view the log.
- **The audit-write path** — emitting audit events is a backend concern
  (`Granit.Auditing`); this package is read-only.

## License

Apache-2.0
