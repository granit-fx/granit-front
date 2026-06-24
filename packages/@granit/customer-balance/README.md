# @granit/customer-balance

Framework-agnostic **customer balance & credits** SDK — the TypeScript
counterpart of the .NET `Customer Balance` backend module
(`contracts/openapi/customer-balance.json`).

It exposes the wire DTOs, the thin Axios HTTP client, the permission constants
and the OpenAPI-derived validation constraints needed to read a party's balance,
page through its ledger, and apply admin credits/debits from any client — React,
React Native, a CLI, tests. It holds **no** React, DOM or Node-only dependency.
The React Query hooks live in
[`@granit/react-customer-balance`](../react-customer-balance) and the admin
feature kit (grids, forms, dialogs) in
[`@granit/react-ui-customer-balance`](../react-ui-customer-balance).

A customer balance is a per-tenant, per-currency credit account. Reads are
scoped by ISO 4217 currency; the ledger is paginated; mutations are admin-only
(promotional / manual-adjustment credits and manual debits) and return the
refreshed balance carrying an optimistic-concurrency stamp.

## Install

Workspace-internal — consumed via the `@granit/*` Vite/Vitest aliases. Declare
these peers:

- `@granit/api-client` — the centralized Axios instance (CSRF, auth, tenant
  interceptors).
- `@granit/query-engine` — `PagedResult<T>` for the transactions list.
- `@granit/types` — the branded `ISODateString` used on timestamp fields.
- `@granit/validation` — `SchemaConstraints`, the type of the generated
  constraints object.

## Quick start

```ts
import {
  getCustomerBalance,
  listBalanceTransactions,
  addAdminCredit,
} from '@granit/customer-balance';
import type { AdminCreditRequest } from '@granit/customer-balance';

// `basePath` is the customer-balance module root. The currency selects the
// per-tenant account; everything is scoped to the active tenant header.
const basePath = '/api/v1/customer-balance';

// 1. Current balance for one currency (zero balance if no account exists yet).
const balance = await getCustomerBalance(client, basePath, 'EUR');

// 2. Page through the ledger.
const page = await listBalanceTransactions(client, basePath, {
  currency: 'EUR',
  page: 1,
  pageSize: 25,
});

// 3. Admin credit — returns the refreshed balance with a fresh concurrency
//    stamp. `expiresAt` is required by the type (use `null` for no expiry).
const request: AdminCreditRequest = {
  partyId,
  amount: 25,
  currency: 'EUR',
  source: 'Promotional',
  reason: 'Welcome credit',
  expiresAt: null,
};
const credited = await addAdminCredit(client, basePath, request);
```

## Public API

| Symbol                          | Kind  | Purpose                                                           |
| ------------------------------- | ----- | ---------------------------------------------------------------- |
| `CustomerBalanceResponse`       | type  | Account state: `balance`, `currency`, `concurrencyStamp`         |
| `BalanceTransactionResponse`    | type  | One ledger entry (type, amount, source, reference, timestamps)   |
| `AdminCreditRequest`            | type  | `POST .../balance/credit` body (`source`, `reason`, `expiresAt`) |
| `AdminDebitRequest`             | type  | `POST .../balance/debit` body (`reason`, optional reference)     |
| `ListBalanceTransactionsParams` | type  | `currency` + `page` / `pageSize` query params                    |
| `getCustomerBalance`            | fn    | `GET {basePath}/balance?currency=` → `CustomerBalanceResponse`   |
| `listBalanceTransactions`       | fn    | `GET {basePath}/transactions` → `PagedResult<…>`                 |
| `addAdminCredit`                | fn    | `POST {basePath}/balance/credit` (admin)                         |
| `applyAdminDebit`               | fn    | `POST {basePath}/balance/debit` (admin)                          |
| `CustomerBalancePermissions`    | const | Keys: `Accounts.Read`, `Transactions.Read`, `Credits.Manage`     |
| `customerBalanceConstraints`    | const | OpenAPI-derived form constraints for credit/debit requests       |

`customerBalanceConstraints` is **generated** from
`contracts/openapi/customer-balance.json` (regenerated on pre-commit). Feed it to
`createConstraintsResolver` from `@granit/react-validation` to drive form
validation; do not hand-edit it.

## Caveats

- **Concurrency stamps, not `If-Match`.** `CustomerBalanceResponse` carries a
  body-field `concurrencyStamp`; echo it back on edits so the backend can return
  `409` on conflict. Never read-modify-write without round-tripping the stamp.
- **Currency is mandatory and account-selecting.** Every read requires a
  3-letter ISO 4217 code; there is no implicit default. A missing account yields
  a zero balance rather than `404`.
- **Mutations are admin tooling.** `addAdminCredit` / `applyAdminDebit` require
  `CustomerBalance.Credits.Manage`. Client-side permission checks are a UX hint
  only — the .NET backend re-checks every call. `amount` is `exclusiveMinimum: 0`
  on both: the debit direction is the operation, not a sign on the value.
- **Out of scope** — no checkout / order-spend integration, no automatic
  expiry sweeping, and no React surface here. Bind these calls to React Query via
  [`@granit/react-customer-balance`](../react-customer-balance).

## License

Apache-2.0
