# @granit/bank-accounts

Framework-agnostic **bank account referential** SDK — the TypeScript counterpart
of the .NET `Granit.BankAccounts` module (`granit-dotnet/src/Granit.BankAccounts`).

It exposes the types, HTTP client functions and permission constants needed to
drive the centralized bank account referential from any client — React, React
Native, a CLI, tests. It holds **no** React, DOM or Node-only dependency. The
React layer (provider, query/mutation hooks) lives in
[`@granit/react-bank-accounts`](../react-bank-accounts).

A bank account is registered against a **party**, identified by a scheme-aware
`accountIdentifier` (IBAN or a domestic account number), and carries a lifecycle:
created → optionally **verified** (proof of ownership) → **archived**
(soft-deleted, retained for audit). Two read surfaces coexist: the app-facing
per-party list (`BankAccountResponse`, identifier masked) and the cross-tenant
QueryEngine admin grid (`BankAccount`, raw audited entity).

## Install

Workspace-internal — consumed via the `@granit/*` Vite/Vitest aliases. Declare
these peers:

- `@granit/api-client` — the centralized Axios client (`AxiosInstance`) every
  call takes as its first argument.
- `@granit/query-engine` — `getPage` / `getQueryMeta` plumbing and the
  `PagedResult` / `QueryRequest` / `QueryMetadata` types behind the admin grid.
- `@granit/types` — shared branded scalars (`ISODateString`, `TenantId`).

## Quick start

```ts
import {
  createBankAccount,
  listBankAccountsByParty,
  verifyBankAccount,
  archiveBankAccount,
  BankAccountsPermissions,
} from '@granit/bank-accounts';
import type { AxiosInstance } from '@granit/api-client';

// `basePath` is the referential's collection root.
const basePath = '/api/v1/bank-accounts';

async function example(client: AxiosInstance, partyId: string) {
  // Register an IBAN account. The identifier is encrypted at rest; the response
  // returns it masked (e.g. `**** 7034`) and never in clear.
  const created = await createBankAccount(client, basePath, {
    partyId,
    scheme: 'Iban',
    accountIdentifier: 'BE71096123456769',
    holderName: 'ACME SA',
    countryCode: 'BE',
  });

  // Mark proof of ownership (idempotent). Gated by a dedicated permission.
  await verifyBankAccount(client, basePath, created.id);

  // App-facing per-party list (non-archived, identifier masked).
  const accounts = await listBankAccountsByParty(client, basePath, partyId);

  // Soft-delete: record retained for audit, dropped from the active list.
  await archiveBankAccount(client, basePath, created.id);

  return { accounts, manage: BankAccountsPermissions.Accounts.Manage };
}
```

## Public API

| Symbol                      | Kind  | Purpose                                                          |
| --------------------------- | ----- | ---------------------------------------------------------------- |
| `BankAccountScheme`         | type  | `'Iban' \| 'UsAch' \| 'CaEft' \| 'AuBsb' \| 'InIfsc' \| 'Other'` |
| `BankAccountStatus`         | type  | `'Active' \| 'Archived'` (soft-delete)                           |
| `BankAccountType`           | type  | `'Unknown' \| 'Checking' \| 'Savings'`                           |
| `CreateBankAccountRequest`  | type  | `POST {basePath}` body; scheme-aware identifier/routing rules    |
| `BankAccountResponse`       | type  | CRUD response, `accountIdentifierMasked`, no internal note       |
| `BankAccount`               | type  | QueryEngine grid entity (raw audited, identifier not projected)  |
| `BankAccountPage`           | type  | `PagedResult<BankAccount>` — one grid page                       |
| `BankAccountListParams`     | type  | `QueryRequest` accepted by the grid                              |
| `createBankAccount`         | fn    | `POST {basePath}` — register for a party (`Manage`)              |
| `getBankAccount`            | fn    | `GET {basePath}/{id}` — single, masked (`Read`)                  |
| `listBankAccountsByParty`   | fn    | `GET {basePath}/by-party/{partyId}` — active list (`Read`)       |
| `verifyBankAccount`         | fn    | `POST {basePath}/{id}/verify` — idempotent (`Verify`)            |
| `archiveBankAccount`        | fn    | `DELETE {basePath}/{id}` — soft-delete, idempotent (`Manage`)    |
| `listBankAccounts`          | fn    | `GET {basePath}` — QueryEngine admin grid (`Read`)               |
| `getBankAccountsQueryMeta`  | fn    | `GET {basePath}/meta` — grid columns/filters/presets             |
| `BankAccountsPermissions`   | const | Permission keys (`Read` / `Manage` / `Verify`)                   |

`Verify` is split from `Manage` on purpose: verification is a control step a
payout/treasury operator may hold without the right to create or archive accounts
(ISO 27001 A.9.4 least privilege).

## Security / data-protection caveats

- The `accountIdentifier` (IBAN or domestic number) is **encrypted at rest** and
  **never returned in clear**. CRUD responses expose only
  `BankAccountResponse.accountIdentifierMasked` (e.g. `**** 7034`); the
  QueryEngine projection excludes the encrypted column, so
  `BankAccount.accountIdentifier` is effectively never populated through the
  grid surface.
- `internalNote` is write-only — accepted by `CreateBankAccountRequest`, never
  projected into `BankAccountResponse`.
- Scheme/routing coherence (IBAN forbids a routing code, each domestic scheme
  requires its own) is enforced **server-side**; this SDK does not pre-validate
  it. A bad combination returns `400`.
- Permission constants here are UX hints — the backend re-checks
  `BankAccounts.Accounts.*` on every endpoint. Never treat client-side
  permission checks as an authorization boundary.

## Out of scope

- **React Query hooks, provider and query-key factory** — see
  [`@granit/react-bank-accounts`](../react-bank-accounts).
- **Update / partial edit** — the referential exposes no `PUT`/`PATCH`; a wrong
  account is archived and re-created.
- **Hard delete** — only soft-delete (`Archived`) exists; records are retained
  for audit/regulatory purposes.
- **Identifier decryption / reveal** — no endpoint returns the clear identifier;
  it is masked everywhere.

## License

Apache-2.0
