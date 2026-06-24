# @granit/react-ui-invoicing

Admin UI for the **Invoicing** module — the invoice list (KPI tiles plus a
query-driven grid with status badges and per-row detail navigation), the
create-invoice dialog, and the invoice detail view (information, amounts, dates,
line items, PDF download) with a host-injected workflow slot.

This is the **`react-ui` admin feature kit**: the visual layer that composes the
headless [`@granit/react-invoicing`](../react-invoicing) (provider + hooks) with
the foundation UI primitives ([`@granit/react-ui`](../react-ui)) and analytics
KPI tiles ([`@granit/react-analytics`](../react-analytics)). It renders pages and
components but owns no Axios calls or query keys — those live one layer down.

The split is three packages over the same .NET `Granit.Invoicing` backend
(contract: `contracts/openapi/invoicing.json`):

- [`@granit/invoicing`](../invoicing) — framework-agnostic core: DTOs, Axios
  functions (`queryInvoices`, `getInvoiceById`, `createInvoice`,
  `downloadInvoicePdf`, …), `InvoicingPermissions`, and the spec-driven
  `invoicingConstraints`.
- [`@granit/react-invoicing`](../react-invoicing) — React Query hooks +
  `InvoicingProvider` (`useInvoices`, `useInvoice`, `useCreateInvoice`,
  `useDownloadInvoicePdf`, …).
- `@granit/react-ui-invoicing` (this package) — the admin pages, components,
  columns, and i18n bundles.

## Install

Workspace-internal — consumed via the `@granit/*` Vite/Vitest aliases, not
published for app consumption through a public registry. A consumer must declare
these peers (see `package.json`):

- `@granit/react-invoicing` — the headless provider + hooks this kit renders.
- `@granit/invoicing` — core DTOs, `InvoiceResponse`/`InvoiceId` types, and
  `invoicingConstraints` driving the create form.
- `@granit/react-ui` — foundation primitives (`Table`, `Dialog`, `Form`,
  `Card`, `Badge`, `toast`, …).
- `@granit/react-analytics` + `@granit/analytics` + `@granit/dashboards` —
  the `KpiTile` and its `KpiWidgetDefinition` / `Datasource` wiring.
- `@granit/react-localization` — `useTranslation` / `useDateFormatter`.
- `@granit/react-validation` — `createConstraintsResolver` for the form.
- `@granit/types`, `@granit/utils`, `@granit/logger` — shared base types, `cn`,
  and `createLogger`.
- `@tanstack/react-table` (`^8.21`) — the list grid.
- `react-hook-form` (`^7.80`) — the create-invoice form.
- `react-router-dom` (`^7.18`) — list-to-detail navigation and the back link.
- `lucide-react` (`^1.21`), `react` (`^19`), `react-dom` (`^19`).

## Quick start

Register the i18n bundles, then mount the pages under a `GranitClientProvider`
and an `InvoicingProvider` (from `@granit/react-invoicing`) inside a
`react-router-dom` tree. The detail page exposes a `renderWorkflow` slot so the
host injects its own workflow panel.

```tsx
import {
  InvoiceListPage,
  InvoiceDetailPage,
  INVOICE_WORKFLOW_STATES,
  invoicingTranslationsEn,
  invoicingTranslationsFr,
} from '@granit/react-ui-invoicing';
import { InvoicingProvider } from '@granit/react-invoicing';
import { Route, Routes } from 'react-router-dom';

i18n.addResourceBundle('en', 'translation', invoicingTranslationsEn, true, true);
i18n.addResourceBundle('fr', 'translation', invoicingTranslationsFr, true, true);

function InvoicingRoutes() {
  // <GranitClientProvider> higher in the tree supplies the Axios client;
  // InvoicingProvider may take an explicit `client` or fall back to it.
  return (
    <InvoicingProvider config={{}}>
      <Routes>
        <Route path="/invoicing" element={<InvoiceListPage />} />
        <Route
          path="/invoicing/:id"
          element={
            <InvoiceDetailPage
              renderWorkflow={(invoice) => (
                <EntityWorkflow
                  entityType="Invoice"
                  entityId={invoice.id}
                  currentState={invoice.status}
                  states={INVOICE_WORKFLOW_STATES}
                />
              )}
            />
          }
        />
      </Routes>
    </InvoicingProvider>
  );
}
```

Compose the leaf components directly when you need a custom layout — e.g.
`createInvoiceColumns` for your own `@tanstack/react-table` grid, or
`InvoiceStatusBadge` / `InvoiceLineItems` inside a bespoke detail screen.

## Public API

| Symbol                    | Kind      | Purpose                                                             |
| ------------------------- | --------- | ------------------------------------------------------------------- |
| `InvoiceListPage`         | component | KPI tiles + query grid; opens create dialog, routes to detail       |
| `InvoiceDetailPage`       | component | Detail view (info, amounts, dates, line items, PDF) + workflow slot |
| `CreateInvoiceDialog`     | component | `react-hook-form` create dialog, spec-validated via constraints     |
| `DownloadPdfButton`       | component | Fetches the invoice PDF blob and triggers a browser download        |
| `InvoiceLineItems`        | component | Line-item table (description, qty, unit price, amount, tax)         |
| `InvoiceStatusBadge`      | component | Status pill with per-state color variants (Draft/Open/Paid/...)     |
| `createInvoiceColumns`    | fn        | Builds the list `ColumnDef[]` (i18n/date/locale/callback injected)  |
| `INVOICE_WORKFLOW_STATES` | const     | Ordered tuple of invoice states for the host workflow panel         |
| `invoicingTranslationsEn` | const     | English `Invoicing.*` i18n resource bundle                          |
| `invoicingTranslationsFr` | const     | French `Invoicing.*` i18n resource bundle                           |

## Injection points

- **API client / data** — the headless `@granit/react-invoicing` hooks
  (`useInvoices`, `useInvoice`, `useCreateInvoice`, `useDownloadInvoicePdf`)
  resolve the Axios client from an `InvoicingProvider` (its `config.client` or
  the nearest `<GranitClientProvider>`). No client is baked into this package.
- **Workflow panel** — `InvoiceDetailPage` exposes
  `renderWorkflow?: (invoice: InvoiceResponse) => React.ReactNode`. The host
  injects its own `EntityWorkflow` (a host concern) and passes the exported
  `INVOICE_WORKFLOW_STATES`; this package does not depend on a workflow component.
- **KPI tiles** — the list renders `KpiTile` from `@granit/react-analytics`
  bound to the `Granit.Invoicing.UnpaidInvoiceCountMetric` and
  `…UnpaidInvoiceTotalMetric` metric datasources.
- **Routing** — `react-router-dom` (`useParams` / `useNavigate`) drives the
  list-to-detail navigation and the back link.
- **i18n** — ships its `Invoicing.*` strings (`invoicingTranslationsEn/Fr`); the
  host registers them and provides the `Common.*` keys used by the dialog.

## Out of scope / caveats

- **No data transport or query keys** — DTOs and Axios calls are
  [`@granit/invoicing`](../invoicing); hooks, query keys, and the provider are
  [`@granit/react-invoicing`](../react-invoicing). This kit only renders them.
- **Workflow transitions are not owned here** — the detail page renders whatever
  the host injects through `renderWorkflow`; the package neither mutates state
  nor enforces the `INVOICE_WORKFLOW_STATES` ordering.
- **Permission gating is the caller's job** — these components do not check
  `InvoicingPermissions`; gate routes/controls with `@granit/react-authorization`
  and rely on the .NET backend to enforce every call (the browser is hostile).
- **PDF download** uses `URL.createObjectURL` + a synthetic anchor click; it does
  not write to a DOM script sink, so no `<pkg>/csp` Trusted-Types subpath is
  required.

## License

Apache-2.0
