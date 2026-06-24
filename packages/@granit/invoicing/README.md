# @granit/invoicing

Invoice-lifecycle SDK — the framework-level TypeScript counterpart of the .NET
`Granit.Invoicing` module (`granit-business/src/Granit.Invoicing`, contract
`contracts/openapi/invoicing.json`).

This is the framework-agnostic **core** layer: it exposes the DTOs, branded ids,
permission constants, OpenAPI-derived validation constraints and the Axios HTTP
functions needed to drive invoices and credit notes from any client — React,
React Native, a CLI, tests. It holds **no** React, DOM or Node-only dependency;
every call takes an injected `AxiosInstance` plus a `basePath`. The React Query
hooks/providers layer lives in [`@granit/react-invoicing`](../react-invoicing);
the admin feature kit (Query Engine grid, detail view, lifecycle actions) lives
in [`@granit/react-ui-invoicing`](../react-ui-invoicing).

An invoice is a workflow-driven document: it is **created** as a `Draft`,
**finalized** to `Open` (assigning the issue date and due date), and then settles
to `Paid`, `Cancelled` or `Uncollectible`. The grid surface (`queryInvoices`,
`getInvoiceMeta`) is delegated to [`@granit/query-engine`](../query-engine); the
generic transition surface (`listInvoiceTransitions`, `executeInvoiceTransition`)
is delegated to [`@granit/workflow`](../workflow), while the named lifecycle
commands (`finalizeInvoice`, `cancelInvoice`, `markInvoiceUncollectible`) wrap the
explicit endpoints that carry their own request bodies.

## Install

Workspace-internal — consumed via the `@granit/*` Vite/Vitest aliases, not
published to a public registry for app consumption. Declare the peers a consumer
must provide:

- `@granit/api-client` — supplies the `AxiosInstance` (CSRF, auth, tenant
  interceptors) passed into every call.
- `@granit/query-engine` — `getPage` / `getQueryMeta` and the `QueryRequest` /
  `PagedResult` / `QueryMetadata` types behind the invoice grid.
- `@granit/workflow` — the generic state-machine transition client and its
  `WorkflowStatus` / `WorkflowTransitionRequest` / `WorkflowTransitionResult`
  types.
- `@granit/types` — `EntityId` (branded `InvoiceId`) and `ISODateString`.
- `@granit/validation` — `SchemaConstraints`, the shape behind
  `invoicingConstraints` (resolved in the UI via `@granit/react-validation`).

## Quick start

```ts
import {
  createInvoice,
  finalizeInvoice,
  queryInvoices,
  downloadInvoicePdf,
  InvoicingPermissions,
} from '@granit/invoicing';
import type { InvoiceCreateRequest } from '@granit/invoicing';
import { toISODateString } from '@granit/types';

// `basePath` is the invoicing collection root; each call appends `/invoices`.
const basePath = '/api/v1/invoicing';

// 1. Create a Draft invoice.
const draftBody: InvoiceCreateRequest = {
  partyId,
  documentType: 'Invoice',
  currency: 'EUR',
  collectionMethod: 'SendInvoice',
  billingReason: 'Manual',
  parentInvoiceId: null,
  creditNoteReason: null,
  periodStart: null,
  periodEnd: null,
};
const draft = await createInvoice(client, basePath, draftBody);

// 2. Finalize it (Draft → Open) — issue date is mandatory, due date optional.
const open = await finalizeInvoice(client, basePath, draft.id, {
  issuedAt: toISODateString(new Date()),
  dueAt: null,
});

// 3. Page the grid (Query Engine filters/sorts) and stream a PDF.
const page = await queryInvoices(client, basePath, { pageSize: 50 });
const pdf = await downloadInvoicePdf(client, basePath, open.id); // Blob

// Permission strings to gate UI controls (enforcement is server-side).
InvoicingPermissions.Invoices.Finalize; // 'Invoicing.Invoices.Finalize'
```

## Public API

| Symbol | Kind | Purpose |
| --- | --- | --- |
| `InvoiceId` | type | Branded `EntityId<'Invoice'>` |
| `InvoiceDocumentType` | type | `'Invoice' \| 'CreditNote'` |
| `InvoiceStatus` | type | `Draft \| Open \| Paid \| Cancelled \| Uncollectible` |
| `CollectionMethod` | type | `'ChargeAutomatically' \| 'SendInvoice'` |
| `InvoiceSourceType` | type | `Subscription \| Usage \| OneShot \| Credit` |
| `BillingReason` | type | Why the invoice was raised (subscription cycle / manual) |
| `InvoiceResponse` | type | Full invoice payload (totals, dates, line items) |
| `InvoiceLineItemResponse` | type | One line of an invoice (qty, unit price, tax) |
| `InvoiceCreateRequest` | type | `POST .../invoices` body |
| `FinalizeInvoiceRequest` | type | `POST .../{id}/finalize` body (`issuedAt`, `dueAt`) |
| `CancelInvoiceRequest` | type | `POST .../{id}/cancel` body (optional `reason`) |
| `MarkInvoiceUncollectibleRequest` | type | `POST .../{id}/mark-uncollectible` body (optional `reason`) |
| `createInvoice` | fn | `POST {basePath}/invoices` |
| `getInvoiceById` | fn | `GET {basePath}/invoices/{id}` |
| `queryInvoices` | fn | `GET {basePath}/invoices` (Query Engine page) |
| `getInvoiceMeta` | fn | `GET {basePath}/invoices/meta` (columns, filters, presets) |
| `finalizeInvoice` | fn | `POST {basePath}/invoices/{id}/finalize` (Draft → Open) |
| `cancelInvoice` | fn | `POST {basePath}/invoices/{id}/cancel` |
| `markInvoiceUncollectible` | fn | `POST {basePath}/invoices/{id}/mark-uncollectible` |
| `downloadInvoicePdf` | fn | `GET {basePath}/invoices/{id}/pdf` → `Blob` |
| `listInvoiceTransitions` | fn | `GET {basePath}/invoices/transitions` (workflow) |
| `executeInvoiceTransition` | fn | `POST {basePath}/invoices/transitions` (workflow) |
| `InvoicingPermissions` | const | Permission-string registry (`Invoices`, `CreditNotes`) |
| `invoicingConstraints` | const | OpenAPI-derived validation constraints (generated) |

## Out of scope / caveats

- **`invoicingConstraints` is generated.** It is emitted from
  `contracts/openapi/invoicing.json` by `scripts/generate-front-constraints.mjs`
  and regenerated on pre-commit — never hand-edit it. Resolve it into a form
  validator with `createConstraintsResolver` from `@granit/react-validation`.
- **No client-side enforcement.** `InvoicingPermissions` strings exist to hide or
  disable controls; every endpoint re-checks authorization on the .NET backend.
  Treat a granted permission as a UX hint, not a security boundary.
- **Two transition surfaces, one state machine.** The named commands
  (`finalizeInvoice`, `cancelInvoice`, `markInvoiceUncollectible`) carry their own
  bodies (issue/due dates, audit reasons persisted on the transition record); the
  generic `executeInvoiceTransition` / `listInvoiceTransitions` pair drives any
  remaining transition through the shared `@granit/workflow` engine. Prefer the
  named command when one exists.
- **Ids are strings on the wire.** `InvoiceId` is the branded id type for callers
  that want nominal typing, but the HTTP functions accept a plain `id: string`;
  the brand is not enforced at the API boundary.
- **PDF is a `Blob`.** `downloadInvoicePdf` returns the raw `Blob` (the call sets
  `responseType: 'blob'`); object-URL creation, naming and revocation are the
  caller's responsibility.

## License

Apache-2.0
