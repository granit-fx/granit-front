# @granit/react-customer-balance

React hooks + provider for the Granit **customer balance & credits** module —
read a party's per-currency balance, page through its transaction ledger, and
apply admin credits/debits. This is the **React hooks layer**: it wraps the
framework-agnostic Axios calls and DTOs from
[`@granit/customer-balance`](../customer-balance) in TanStack Query hooks behind
a shared `CustomerBalanceProvider` for client / base-path / query-key
configuration. It holds no rendering — pages, tables, and dialogs live one layer
up.

The split is three packages over the same .NET `Customer Balance` backend
(contract: `contracts/openapi/customer-balance.json`):

- [`@granit/customer-balance`](../customer-balance) — framework-agnostic core:
  DTOs, the thin Axios client (`getCustomerBalance`, `addAdminCredit`, …),
  permission constants, and OpenAPI-derived validation constraints.
- `@granit/react-customer-balance` (this package) — React Query hooks + provider.
- [`@granit/react-ui-customer-balance`](../react-ui-customer-balance) — admin UI
  kit: the balance page (currency selector, summary card, paginated transaction
  table) and the credit / debit dialogs.

## Install

Workspace-internal — consumed via the `@granit/*` Vite/Vitest aliases. Unlike the
source-direct default, this package also ships a `tsup` build (`dist/` +
`publishConfig`) for publication through `npm.pkg.github.com`. A consumer must
declare these peers:

- `@granit/customer-balance` — core DTOs + Axios calls this layer wraps.
- `@granit/api-client` — supplies the `AxiosInstance` (CSRF, auth, tenant
  interceptors).
- `@granit/react-api-client` — `useOptionalGranitClient`, the context fallback for
  the Axios client when `config.client` is omitted.
- `@granit/types` — shared base types (`ISODateString`, branded entity ids).
- `@tanstack/react-query` (`^5`) and `react` (`^19`).
- `@granit/query-engine` / `@granit/react-query-engine` (**optional**) —
  `PagedResult` for the transaction list, and the query-metadata test helper used
  by `./testing`.
- `msw` (`^2.12`, **optional**) — only for the `@granit/react-customer-balance/testing`
  subpath.

## Quick start

Wire the provider once (it resolves the Axios client, base path, and an optional
query-key prefix), then call the hooks anywhere below it.

```tsx
import { CustomerBalanceProvider, useCustomerBalance } from '@granit/react-customer-balance';
import { useGranitClient } from '@granit/react-api-client';

function App({ children }: { children: React.ReactNode }) {
  // `client` may be omitted if a <GranitClientProvider> is already mounted.
  return (
    <CustomerBalanceProvider config={{ client: useGranitClient() }}>
      {children}
    </CustomerBalanceProvider>
  );
}

function BalanceCard() {
  // Reads are scoped by ISO 4217 currency; amounts are minor units (integers).
  const { data: balance, isLoading } = useCustomerBalance('EUR');
  if (isLoading || !balance) return null;
  return <span>{balance.balance}</span>;
}
```

The ledger is paginated, and the admin mutations write the refreshed balance back
into the cache on success (`setQueryData`) before invalidating the transaction
queries:

```tsx
import {
  useApplyAdminDebit,
  useAddAdminCredit,
  useBalanceTransactions,
} from '@granit/react-customer-balance';

function AdminLedger() {
  const { data: page } = useBalanceTransactions({ currency: 'EUR', page: 1, pageSize: 25 });
  const credit = useAddAdminCredit();
  const debit = useApplyAdminDebit();

  return (
    <button
      type="button"
      onClick={() =>
        credit.mutate({
          partyId: 'party_01',
          amount: 5000,
          currency: 'EUR',
          source: 'Promotional', // 'Promotional' | 'ManualAdjustment'
          reason: 'Welcome bonus',
          expiresAt: null,
        })
      }
    >
      Add credit ({page?.totalCount ?? 0} ledger entries)
    </button>
  );
}
```

## Public API

| Symbol                          | Kind     | Purpose                                                            |
| ------------------------------- | -------- | ------------------------------------------------------------------ |
| `CustomerBalanceProvider`       | provider | Supplies client, base path, query-key prefix to all hooks below it |
| `useCustomerBalanceConfig`      | hook     | Read the resolved config; throws outside a provider                |
| `useCustomerBalance`            | hook     | `GET .../balance?currency=` — current balance for a currency       |
| `useBalanceTransactions`        | hook     | `GET .../transactions` — paginated ledger (`PagedResult`)          |
| `useAddAdminCredit`             | hook     | `POST .../balance/credit` mutation; writes balance to cache        |
| `useApplyAdminDebit`            | hook     | `POST .../balance/debit` mutation; writes balance to cache         |
| `buildCustomerBalanceQueryKey`  | fn       | Query-key factory honoring the configured `queryKeyPrefix`         |
| `CustomerBalanceConfig`         | type     | Provider input (optional client / basePath / queryKeyPrefix)       |
| `ResolvedCustomerBalanceConfig` | type     | Provider output with the resolved required client + basePath       |
| `CustomerBalanceProviderProps`  | type     | `{ config, children }`                                             |

DTOs (`CustomerBalanceResponse`, `BalanceTransactionResponse`,
`AdminCreditRequest`, `AdminDebitRequest`, `ListBalanceTransactionsParams`) are
re-exported from [`@granit/customer-balance`](../customer-balance); import them
from the core package, not here.

`./testing` subpath (requires the optional `msw` peer): `createCustomerBalanceHandlers`
(stateful MSW handlers whose credit/debit responses mutate the in-memory balance,
default base `/api/v1/customer-balance`), the `sampleBalance` / `sampleTransactions`
fixtures, and the `balanceTransactionQueryMetadata` `/meta` payload for the
transaction grid.

## Caveats

- **Admin mutations are privileged.** Credit and debit endpoints are admin-only
  on the backend; this layer only adapts them to React Query. Gate the UI with
  the permission constants from `@granit/customer-balance`
  (`CustomerBalancePermissions`) and rely on the .NET backend for enforcement —
  client-side checks are a UX hint, never a security boundary.
- **Optimistic concurrency.** `CustomerBalanceResponse.concurrencyStamp` carries
  the optimistic-concurrency token (body-field convention, 409 on conflict — not
  `If-Match`). The mutation hooks refresh the cached balance from each response,
  so the next edit echoes the latest stamp.
- **Currency-scoped cache.** Balances and transaction pages are keyed by
  currency; `useCustomerBalance('EUR')` and `useCustomerBalance('USD')` are
  independent cache entries. A successful credit/debit invalidates _all_
  transaction queries but only sets the balance for the mutated currency.
- **Tenant safety.** The tenant header (`X-Tenant-Id`) is injected by
  `@granit/api-client`; on tenant switch, clear the React Query cache (e.g.
  `useClearQueriesOnTenantChange` from `@granit/react-multi-tenancy`) so a stale
  balance is never shown under the wrong tenant.

## Out of scope

- **Rendering** — the balance page, summary card, transaction table, and
  credit/debit dialogs live in
  [`@granit/react-ui-customer-balance`](../react-ui-customer-balance). This
  package is headless.
- **DTOs, HTTP transport, permissions, and validation constraints** — owned by
  [`@granit/customer-balance`](../customer-balance) (mirror of the `Customer
Balance` backend); hooks here only adapt them to React Query.
- **Authentication** — issuing/refreshing tokens is `@granit/authentication` and
  the BFF; this package consumes the already-authenticated Axios client.

## License

Apache-2.0
