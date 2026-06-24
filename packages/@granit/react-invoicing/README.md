# @granit/react-invoicing

React hooks + provider for the Granit **invoicing** module — invoice querying,
PDF download, creation, and the Draft → Open → Paid / Cancelled / Uncollectible
lifecycle. This is the **React hooks layer**: it wraps the framework-agnostic
Axios calls and DTOs from [`@granit/invoicing`](../invoicing) in TanStack Query
hooks with a shared `InvoicingProvider` for client / base-path / query-key
configuration. It holds no rendering — list pages, dialogs, and status badges
live one layer up.

The split is three packages over the same .NET `Granit.Invoicing` backend
(contract: `contracts/openapi/invoicing.json`):

- [`@granit/invoicing`](../invoicing) — framework-agnostic core: DTOs +
  Axios functions (`queryInvoices`, `finalizeInvoice`, …), `InvoicingPermissions`,
  and openapi-derived `invoicingConstraints`.
- `@granit/react-invoicing` (this package) — React Query hooks + provider.
- [`@granit/react-ui-invoicing`](../react-ui-invoicing) — admin UI kit:
  invoice list / detail pages, create dialog, PDF-download button, status badge,
  and grid column factory.

Invoices are a Query Engine resource (paginated, filterable list + `/meta`) and a
workflow aggregate: lifecycle moves are exposed both as semantic mutations
(`useFinalizeInvoice`, `useCancelInvoice`, `useMarkInvoiceUncollectible`) and as
the generic state-machine pair (`useListInvoiceTransitions` /
`useExecuteInvoiceTransition`) backed by [`@granit/workflow`](../workflow).

## Install

Workspace-internal — consumed via the `@granit/*` Vite/Vitest aliases, not
published for app consumption through a public registry. A consumer must declare
these peers:

- `@granit/invoicing` — core DTOs + Axios calls this layer wraps.
- `@granit/api-client` — supplies the `AxiosInstance` (CSRF, auth, tenant
  interceptors).
- `@granit/react-api-client` — `useOptionalGranitClient`, the context fallback for
  the Axios client when `config.client` is omitted.
- `@granit/types` — shared base types (branded entity ids).
- `@granit/query-engine` (**optional**) — `PagedResult` / `QueryRequest` /
  `QueryMetadata` for the invoice list + `/meta` surfaces.
- `@granit/react-query-engine` (**optional**) — only for the `./testing` subpath's
  query-meta handler.
- `@granit/workflow` (**optional**) — `WorkflowStatus` / `WorkflowTransitionRequest`
  / `WorkflowTransitionResult` for the transition hooks.
- `@tanstack/react-query` (`^5`) and `react` (`^19`).
- `msw` (`^2.12`, **optional**) — only for the `@granit/react-invoicing/testing`
  subpath.

## Quick start

Wire the provider once (it resolves the Axios client, base path, and an optional
query-key prefix), then call the hooks anywhere below it.

```tsx
import { InvoicingProvider, useInvoices } from '@granit/react-invoicing';
import { useGranitClient } from '@granit/react-api-client';

function App({ children }: { children: React.ReactNode }) {
  // `client` may be omitted if a <GranitClientProvider> is already mounted.
  return (
    <InvoicingProvider config={{ client: useGranitClient() }}>
      {children}
    </InvoicingProvider>
  );
}

function InvoiceList() {
  // Query Engine surface — pass filters / sort / paging via the request arg.
  const { data, isLoading } = useInvoices({ pageSize: 25, sort: '-issuedAt' });
  if (isLoading) return null;
  return (
    <ul>
      {(data?.items ?? []).map((inv) => (
        <li key={inv.id}>
          {inv.invoiceNumber} — {inv.status} — {inv.total} {inv.currency}
        </li>
      ))}
    </ul>
  );
}
```

The lifecycle is driven by semantic mutations; each invalidates the invoice
queries on success. Draft → Open is `useFinalizeInvoice`, Open → Uncollectible is
`useMarkInvoiceUncollectible`, and Open / Uncollectible → Cancelled is
`useCancelInvoice`:

```tsx
import {
  useFinalizeInvoice,
  useCancelInvoice,
  useDownloadInvoicePdf,
} from '@granit/react-invoicing';

function InvoiceActions({ id }: { id: string }) {
  const finalize = useFinalizeInvoice();
  const cancel = useCancelInvoice();
  const downloadPdf = useDownloadInvoicePdf();

  return (
    <>
      <button
        type="button"
        onClick={() =>
          finalize.mutate({ id, request: { issuedAt: '2026-06-24', dueAt: '2026-07-24' } })
        }
      >
        Finalize
      </button>
      <button type="button" onClick={() => cancel.mutate({ id })}>
        Cancel
      </button>
      <button
        type="button"
        onClick={async () => {
          const blob = await downloadPdf.mutateAsync(id); // Blob, for browser download
          window.open(URL.createObjectURL(blob));
        }}
      >
        PDF
      </button>
    </>
  );
}
```

`useInvoice(id)` self-disables on an empty `id`; `useInvoiceMeta()` is cached for
the session (`staleTime: Infinity`). For status-driven UIs that prefer the generic
workflow contract over the semantic mutations, `useListInvoiceTransitions(status)`
returns the available moves and `useExecuteInvoiceTransition()` performs one.

## Public API

| Symbol | Kind | Purpose |
| --- | --- | --- |
| `InvoicingProvider` | provider | Supplies client, base path, query-key prefix to all hooks below it |
| `useInvoicingConfig` | hook | Read the resolved config; throws outside a provider |
| `buildInvoicingQueryKey` | fn | Query-key factory honoring the configured `queryKeyPrefix` |
| `useInvoices` | hook | `GET .../invoices` — paginated/filterable `PagedResult` list |
| `useInvoice` | hook | `GET .../invoices/{id}` — single invoice; disabled on empty `id` |
| `useInvoiceMeta` | hook | `GET .../invoices/meta` — query metadata (cols/filters/presets) |
| `useDownloadInvoicePdf` | hook | `GET .../invoices/{id}/pdf` mutation → `Blob` |
| `useCreateInvoice` | hook | `POST .../invoices` mutation; invalidates invoice queries |
| `useFinalizeInvoice` | hook | `POST .../invoices/{id}/finalize` (Draft → Open) |
| `useCancelInvoice` | hook | `POST .../invoices/{id}/cancel` (Open / Uncollectible → Cancelled) |
| `useMarkInvoiceUncollectible` | hook | `POST .../invoices/{id}/mark-uncollectible` (Open → Uncollectible) |
| `useListInvoiceTransitions` | hook | `GET .../invoices/transitions` — allowed moves for a status |
| `useExecuteInvoiceTransition` | hook | `POST .../invoices/transitions` — generic state-machine move |
| `InvoicingConfig` | type | Provider input (optional client / basePath / queryKeyPrefix) |
| `InvoicingProviderProps` | type | `{ config, children }` |
| `InvoiceTransitionVariables` | type | `{ id, request? }` variables for the semantic transition mutations |

`./testing` subpath (requires the optional `msw` peer): `createInvoicingHandlers`
(stateful MSW handlers, default base `/api/v1/invoicing` — POST appends to the
in-memory list, lifecycle handlers enforce status preconditions with `409`),
`invoiceQueryMetadata`, and the `sampleInvoices` / `sampleInvoiceLineItems`
fixtures.

## Out of scope / caveats

- **Rendering** — invoice list / detail pages, the create dialog, the PDF-download
  button, the status badge, and the grid column factory live in
  [`@granit/react-ui-invoicing`](../react-ui-invoicing). This package is headless.
- **DTOs, HTTP transport, permissions, validation constraints** — owned by
  [`@granit/invoicing`](../invoicing) (mirror of `Granit.Invoicing`); hooks here
  only adapt them to React Query. Import `InvoicingPermissions`,
  `invoicingConstraints`, and the `Invoice*` types from the core package.
- **Client-side permission checks are a UX hint, not a security boundary.** Gate
  invoice mutations with `@granit/react-authorization` against
  `InvoicingPermissions`, but the `Granit.Invoicing` backend re-checks
  authorization and enforces every lifecycle transition (a 409 is returned when a
  status precondition is not met).
- **PDF download returns a `Blob`** — this layer does not trigger the browser
  download; the consumer owns `URL.createObjectURL` / anchor-click and revocation.
- **No payment / dunning surface** — recording payments, refunds, and reminders
  are not part of this package's API.

## License

Apache-2.0
