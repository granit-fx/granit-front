# @granit/payments-sepa-direct-debit

SEPA Direct Debit **mandate lifecycle** and **per-tenant SEPA configuration** SDK
— the framework-level TypeScript counterpart of the .NET `SepaDirectDebit` module
(backend contract: `contracts/openapi/sepa-direct-debit.json`).

This is the framework-agnostic **core** layer: it exposes the wire types, the
permission catalog and the Axios-backed API functions needed to drive the mandate
flow (setup → confirm → cancel) and to read/write the tenant's creditor
configuration from any client — React, React Native, a CLI, tests. It holds **no**
React, DOM or Node-only dependency. The React Query hooks + provider live in
[`@granit/react-payments-sepa-direct-debit`](../react-payments-sepa-direct-debit);
the admin grids and pages live in
[`@granit/react-ui-payments`](../react-ui-payments). Sibling domains
([`@granit/payments`](../payments),
[`@granit/payments-sepa-transfer`](../payments-sepa-transfer)) are separate
packages — SEPA Direct Debit is split out because it legally engages the company
and is typically administered by a separate treasury role.

A **mandate** is the debtor's standing authorization to debit their account. It is
created `Pending`, confirmed (`Active`) once the debtor signs, and `Cancelled` on
revocation. Confirmation happens in-house (admin overrides the activation) or via a
hosted provider signature flow; the debtor IBAN is validated server-side and never
echoed back unmasked. Tenant-level settings — Creditor Identifier (SCI), default
scheme, default provider — are carried by the **configuration** resource, where the
SCI is locked once the tenant has mandates.

## Install

Workspace-internal — consumed via the `@granit/*` Vite/Vitest aliases, not published
to a public registry for app consumption. Declare the peer dependencies:

- `@granit/api-client` — supplies the `AxiosInstance` (CSRF, auth, tenant
  interceptors) passed into every call.
- `@granit/types` — supplies the branded `ISODateString` used by the timestamp
  fields.

## Quick start

```ts
import {
  createMandate,
  confirmMandate,
  getMandate,
  getSepaConfiguration,
  upsertSepaConfiguration,
  SepaDirectDebitPermissions,
} from '@granit/payments-sepa-direct-debit';
import { toISODateString } from '@granit/types';

// `basePath` is the SEPA Direct Debit module root. It is combined with the
// per-resource segments (`/mandates`, `/configuration`) by each call.
const basePath = '/api/v1/sepa-direct-debit';

// 1. Configure the tenant once — SCI + default scheme drive every later mandate.
await upsertSepaConfiguration(client, basePath, {
  creditorId: 'BE68ZZZ0123456789',
  defaultScheme: 'Core',
});

// 2. Set up a mandate (Pending). `redirectUrl` is present for hosted signatures.
const setup = await createMandate(client, basePath, {
  debtorPartyId: party.id,
  debtorName: 'Jeanne Dupont',
  debtorIban: 'BE71096123456769',
});

// 3a. Hosted flow → send the debtor to `setup.redirectUrl`; the provider webhook
//     activates the mandate. 3b. In-house flow → confirm by hand (audited).
const mandate =
  setup.redirectUrl === null
    ? await confirmMandate(client, basePath, setup.id, {
        signedAt: toISODateString(new Date()),
      })
    : await getMandate(client, basePath, setup.id);

// mandate.debtorIbanMasked, mandate.concurrencyStamp — IBAN is never unmasked.
const config = await getSepaConfiguration(client, basePath);

// Gate the confirm control on the dedicated permission group.
const confirmPermission = SepaDirectDebitPermissions.Mandates.Confirm;
```

## Public API

| Symbol                       | Kind  | Purpose                                                            |
| ---------------------------- | ----- | ------------------------------------------------------------------ |
| `MandateStatus`              | type  | `Pending \| Active \| Suspended \| Cancelled \| Failed \| Expired` |
| `SddScheme`                  | type  | `Core` (consumers) \| `B2B` (businesses)                           |
| `ConsentSource`              | type  | How consent was captured (`AdminConfirm`, `ProviderWebhook`, …)    |
| `CollectionStatus`           | type  | Settlement status of one collection (`Submitted`, `Succeeded`, …)  |
| `CreateMandateRequest`       | type  | `POST {basePath}/mandates` body (debtor, IBAN, scheme override)    |
| `ConfirmMandateRequest`      | type  | `POST .../confirm` body (`signedAt`, optional document reference)  |
| `MandateSetupResponse`       | type  | `createMandate` result (id, reference, status, hosted redirect)    |
| `MandateResponse`            | type  | A mandate with the debtor IBAN masked + `concurrencyStamp`         |
| `SepaConfigurationRequest`   | type  | `PUT .../configuration` body (SCI, default scheme/provider)        |
| `SepaConfigurationResponse`  | type  | Tenant config with the creditor IBAN masked                        |
| `ConsentEvidence`            | type  | Verifiable consent captured at activation (source, masked IP, …)   |
| `DirectDebitPayment`         | type  | One collection (debit) executed against a mandate                  |
| `Mandate`                    | type  | Admin-grid row: consent evidence + collection history (richer)     |
| `createMandate`              | fn    | `POST {basePath}/mandates` → `MandateSetupResponse` (201)          |
| `getMandate`                 | fn    | `GET {basePath}/mandates/{id}` → masked `MandateResponse`          |
| `confirmMandate`             | fn    | `POST .../mandates/{id}/confirm` → activate a pending mandate      |
| `cancelMandate`              | fn    | `POST .../mandates/{id}/cancel` → revoke a mandate                 |
| `getSepaConfiguration`       | fn    | `GET {basePath}/configuration` (404 when unconfigured)             |
| `upsertSepaConfiguration`    | fn    | `PUT {basePath}/configuration` (create or update)                  |
| `SepaDirectDebitPermissions` | const | Permission catalog mirroring the backend (Mandates, Configuration) |

`Mandate` is the query-engine grid projection (every field optional); the other
response interfaces are the single-resource read/write shapes returned by the API
functions above.

## Caveats

- **IBANs are masked on read.** `MandateResponse.debtorIbanMasked` and
  `SepaConfigurationResponse.creditorIbanMasked` are the only forms the API returns;
  the full IBAN is write-only (request bodies) and validated server-side. Never
  reconstruct, log, or display an unmasked IBAN.
- **SCI is locked after first mandate.** Changing `creditorId` in
  `upsertSepaConfiguration` once the tenant has mandates returns `409` — it requires
  a SEPA mandate migration, not an in-place edit.
- **`createMandate` needs an active configuration.** It returns `409` when the
  tenant has no active SEPA configuration; call `upsertSepaConfiguration` first.
- **Provider-backed confirmation is privileged.** Confirming a provider-backed
  mandate by hand requires `SepaDirectDebit.Mandates.ConfirmOverride` (such mandates
  normally activate via the provider's verified flow); the backend returns `403`
  otherwise. `cancelMandate` returns `409` on a mandate already in a terminal status.
- **Optimistic concurrency.** `concurrencyStamp` follows the framework's
  body-field convention — round-trip it on edits; the backend returns `409` on a
  stale stamp (never an `If-Match` header).
- **Permissions are a UX hint, not enforcement.** `SepaDirectDebitPermissions`
  helps apps hide controls; the .NET backend re-checks authorization on every
  endpoint. SEPA Direct Debit is a distinct permission group from `Payments` because
  it legally engages the company.

## Out of scope

- **React Query hooks, provider, query keys** —
  [`@granit/react-payments-sepa-direct-debit`](../react-payments-sepa-direct-debit).
- **Admin grids, mandate / configuration pages** —
  [`@granit/react-ui-payments`](../react-ui-payments).
- **Collection scheduling / submission** — the API surface here is mandate
  lifecycle + configuration; `DirectDebitPayment` rows are read-only history exposed
  on the admin `Mandate` projection, not created from this package.
- **SEPA Credit Transfer** — separate domain,
  [`@granit/payments-sepa-transfer`](../payments-sepa-transfer).

## License

Apache-2.0
