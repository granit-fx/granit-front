# @granit/payments-sepa-transfer

Per-tenant **SEPA bank transfer** beneficiary configuration — the framework-level
TypeScript counterpart of the .NET `Granit.SepaTransfer` module
(`contracts/openapi/sepa-transfer.json`).

This is the framework-agnostic **core** layer: it exposes the DTO types, the two
HTTP functions and the permission catalog needed to read and upsert a tenant's
SEPA-transfer beneficiary from any client — React, React Native, a CLI, tests. It
holds **no** React, DOM or Node-only dependency. The React Query hooks and the
`SepaTransferProvider` (basePath / query-key wiring) live in
[`@granit/react-payments-sepa-transfer`](../react-payments-sepa-transfer). There
is no dedicated `react-ui` admin feature kit for SEPA transfer; the broader
Payments admin pages live in [`@granit/react-ui-payments`](../react-ui-payments).

A SEPA-transfer configuration is a single per-tenant record: a beneficiary name,
IBAN, BIC and the owning company party. On upsert, when a `beneficiaryIban` is
supplied the account is provisioned into the company's `BankAccounts` referential
and stamped onto the configuration; the IBAN is **never echoed back unmasked** —
responses carry `beneficiaryIbanMasked` only. The record is guarded by an
optimistic `concurrencyStamp`.

## Install

Workspace-internal — consumed via the `@granit/*` Vite/Vitest aliases, not
published to a public registry for app consumption. Declare the single peer:

- `@granit/api-client` — supplies the `AxiosInstance` (CSRF, auth, tenant
  interceptors) passed into every call.

## Quick start

```ts
import {
  getSepaTransferConfiguration,
  upsertSepaTransferConfiguration,
  SepaTransferPermissions,
} from '@granit/payments-sepa-transfer';
import type { SepaTransferConfigurationRequest } from '@granit/payments-sepa-transfer';

// `basePath` is the module's collection root; the calls append `/configuration`.
const basePath = '/sepa-transfer';

// 1. Read the current tenant's beneficiary. The backend returns 404 when SEPA
//    transfer has not yet been configured — handle that as "not configured".
const config = await getSepaTransferConfiguration(client, basePath);
// config.beneficiaryIbanMasked → 'BE** **** **** 9999' (never the raw IBAN)

// 2. Create or update it. Supplying `beneficiaryIban` provisions the account
//    into the company's BankAccounts referential and stamps it on the config.
const request: SepaTransferConfigurationRequest = {
  beneficiaryName: 'Acme NV',
  beneficiaryIban: 'BE68539007547034',
  beneficiaryBic: 'GEBABEBB',
  isActive: true,
};
const updated = await upsertSepaTransferConfiguration(client, basePath, request);
// updated.concurrencyStamp → carry into the next upsert for optimistic concurrency

// Gate the admin action on the backend-mirrored permission.
const manage = SepaTransferPermissions.Configuration.Manage; // 'SepaTransfer.Configuration.Manage'
```

## Public API

| Symbol                              | Kind  | Purpose                                                          |
| ----------------------------------- | ----- | ---------------------------------------------------------------- |
| `SepaTransferConfigurationRequest`  | type  | `PUT .../configuration` body (name, IBAN, BIC, party, active)    |
| `SepaTransferConfigurationResponse` | type  | Stored config — IBAN masked, plus `tenantId`, `concurrencyStamp` |
| `getSepaTransferConfiguration`      | fn    | `GET {basePath}/configuration` (404 when unconfigured)           |
| `upsertSepaTransferConfiguration`   | fn    | `PUT {basePath}/configuration` (provisions IBAN on supply)       |
| `SepaTransferPermissions`           | const | Backend-mirrored permission catalog (`Configuration.Manage`)     |

## Caveats

- **IBAN is write-only.** `SepaTransferConfigurationRequest` accepts a raw
  `beneficiaryIban`; the response only ever exposes `beneficiaryIbanMasked`. Do
  not store or display the raw IBAN client-side after submission — re-render from
  the masked response.
- **Optimistic concurrency.** `SepaTransferConfigurationResponse.concurrencyStamp`
  follows the body-field concurrency convention. Echo the last-read stamp back on
  the next upsert; a stale stamp yields a `409` from the backend.
- **404 means "not configured".** `getSepaTransferConfiguration` rejects with a
  `404` before the tenant has set up a beneficiary; treat that as an empty state,
  not an error.
- **Optionality follows the contract.** On the request, IBAN / BIC / name / party
  are optional (absent from the OpenAPI `required` set); on the response they are
  required keys with nullable values (`T | null`). These are independent axes —
  see `contracts/openapi/sepa-transfer.json`.

## License

Apache-2.0
