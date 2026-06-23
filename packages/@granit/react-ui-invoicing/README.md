# @granit/react-ui-invoicing

Admin UI for the **Invoicing** module — the invoice list (KPI tiles plus a
query-driven grid with status badges and per-row detail navigation), the
create-invoice dialog, and the invoice detail view (information, amounts, dates,
line items, PDF download) with a host-injected workflow slot.

The **visual** layer for invoicing: it composes the headless
[`@granit/react-invoicing`](../react-invoicing) (provider + hooks) with the
foundation UI packages ([`@granit/react-ui`](../react-ui)) and the analytics KPI
tiles ([`@granit/react-analytics`](../react-analytics)).

## Usage

```tsx
import {
  InvoiceListPage,
  InvoiceDetailPage,
  INVOICE_WORKFLOW_STATES,
  invoicingTranslationsEn,
} from '@granit/react-ui-invoicing';

i18n.addResourceBundle('en', 'translation', invoicingTranslationsEn, true, true);

// Mount under a GranitClientProvider + InvoicingProvider:
<Route path="/invoicing" element={<InvoiceListPage />} />;
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
/>;
```

## Injection

- **API client / data** — the headless `@granit/react-invoicing` hooks
  (`useInvoices`, `useInvoice`, `useCreateInvoice`, `useDownloadInvoicePdf`)
  resolve the Axios client from an `InvoicingProvider` higher in the tree. No
  client is baked in.
- **Workflow panel** — `InvoiceDetailPage` exposes a
  `renderWorkflow?: (invoice: InvoiceResponse) => React.ReactNode` slot. The host
  injects its own `EntityWorkflow` (a host-owned component) and passes the
  exported `INVOICE_WORKFLOW_STATES` to it. The package does not depend on the
  host workflow component.
- **KPI tiles** — the list renders `KpiTile` from `@granit/react-analytics` for
  the unpaid-invoice count and total metrics.
- **Routing** — `react-router-dom` (`useParams` / `useNavigate`) for the
  list-to-detail navigation and the back link.
- **i18n** — ships its `Invoicing.*` strings (`invoicingTranslationsEn/Fr`); the
  host registers them.
