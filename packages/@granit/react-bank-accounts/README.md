# @granit/react-bank-accounts

React bindings for the bank account referential — the hooks/provider layer over
the framework-agnostic [`@granit/bank-accounts`](../bank-accounts) core, itself
the TypeScript counterpart of the .NET `Granit.BankAccounts` module
(`granit-business/src/Granit.BankAccounts`, contract:
`contracts/openapi/bank-accounts.json`).

This package holds the React Query layer: a `BankAccountsProvider` that resolves
the Axios client + base path once, query/mutation hooks over the core's HTTP
functions, and a stable query-key factory so the cache invalidates coherently.
There is **no** `react-ui-bank-accounts` admin feature kit — admin grids are
assembled by apps from `@granit/react-query-engine` and the QueryEngine `/meta`
fixtures shipped under [`./testing`](#testing). The split is two packages: core
([`@granit/bank-accounts`](../bank-accounts)) ↔ React hooks (this package).

## Install

Workspace-internal — consumed via the `@granit/*` Vite/Vitest aliases, not
published to a public registry for app consumption. Declare these peers:

- `@granit/bank-accounts` — the core SDK whose HTTP functions the hooks call.
- `@granit/api-client` — supplies the `AxiosInstance` (CSRF, auth, tenant
  interceptors).
- `@granit/react-api-client` — the provider reads the ambient client from
  `<GranitClientProvider>` via `useOptionalGranitClient`.
- `@granit/types` — shared branded scalars (`EntityId`, `TenantId`).
- `@tanstack/react-query` (`^5`) and `react` (`^19`).

Optional peers (only for `@granit/react-bank-accounts/testing`):
`@granit/query-engine`, `@granit/react-query-engine`, and `msw` (`^2.12`).

## Quick start

Wrap the subtree once, then call the hooks. The provider resolves `client` from
`config.client` or the nearest `<GranitClientProvider>`, and defaults `basePath`
to `/api/v1/bank-accounts`.

```tsx
import { GranitClientProvider } from '@granit/react-api-client';
import {
  BankAccountsProvider,
  useBankAccountsByParty,
  useCreateBankAccount,
  useVerifyBankAccount,
} from '@granit/react-bank-accounts';

function App({ client }) {
  return (
    <GranitClientProvider client={client}>
      <BankAccountsProvider config={{}}>
        <PartyAccounts partyId="pty_001" />
      </BankAccountsProvider>
    </GranitClientProvider>
  );
}

function PartyAccounts({ partyId }: { partyId: string }) {
  // Active accounts only; identifier comes back masked (e.g. `**** 7034`).
  const { data: accounts } = useBankAccountsByParty(partyId);
  const create = useCreateBankAccount();
  const verify = useVerifyBankAccount();

  async function register() {
    const created = await create.mutateAsync({
      partyId,
      scheme: 'Iban',
      accountIdentifier: 'BE71096123456769',
      holderName: 'ACME SA',
      countryCode: 'BE',
    });
    await verify.mutateAsync(created.id); // proof of ownership, idempotent
  }

  return (
    <ul>
      {accounts?.map((a) => (
        <li key={a.id}>
          {a.holderName} — {a.accountIdentifierMasked}
        </li>
      ))}
    </ul>
  );
}
```

Mutations invalidate the whole `bank-accounts` key prefix on success, so the
per-party list and any open detail query refetch automatically.

## Public API

| Symbol                       | Kind     | Purpose                                                              |
| ---------------------------- | -------- | -------------------------------------------------------------------- |
| `BankAccountsProvider`       | provider | Resolves `client` (config or `<GranitClientProvider>`) + `basePath`  |
| `useBankAccountsConfig`      | hook     | Reads the resolved config from the nearest provider                  |
| `buildBankAccountsQueryKey`  | fn       | Query-key factory; prefix defaults to `['bank-accounts']`            |
| `useBankAccount`             | hook     | `GET {basePath}/{id}` - single, masked; disabled when `id` empty     |
| `useBankAccountsByParty`     | hook     | `GET {basePath}/by-party/{partyId}` - active list; disabled if empty |
| `useCreateBankAccount`       | hook     | `POST {basePath}` - register for a party; invalidates on success     |
| `useVerifyBankAccount`       | hook     | `POST {basePath}/{id}/verify` - idempotent; invalidates on success   |
| `useArchiveBankAccount`      | hook     | `DELETE {basePath}/{id}` - soft-delete; invalidates on success       |
| `BankAccountsConfig`         | type     | Provider input: optional `client`, `basePath`, `queryKeyPrefix`      |
| `ResolvedBankAccountsConfig` | type     | `BankAccountsConfig` with `client` + `basePath` guaranteed present   |
| `BankAccountsProviderProps`  | type     | `{ config, children }`                                               |

Domain types (`BankAccountResponse`, `CreateBankAccountRequest`,
`BankAccountScheme`, …) and the raw HTTP functions are **not** re-exported here;
import them from the core [`@granit/bank-accounts`](../bank-accounts).

### Testing

`@granit/react-bank-accounts/testing` ships in-memory fixtures and stateful MSW
handlers (optional peers: `@granit/query-engine`, `@granit/react-query-engine`,
`msw`):

| Symbol                       | Kind  | Purpose                                                          |
| ---------------------------- | ----- | ---------------------------------------------------------------- |
| `createBankAccountsHandlers` | fn    | Stateful MSW handlers (create/verify/archive persist in memory)  |
| `sampleBankAccounts`         | const | `BankAccountResponse[]` seed for the masked per-party surface    |
| `sampleBankAccountEntities`  | const | `BankAccount[]` seed for the QueryEngine admin grid              |
| `bankAccountQueryMetadata`   | const | `QueryMetadata` for the grid (`GET {basePath}/meta`)             |

```ts
import { setupServer } from 'msw/node';
import { createBankAccountsHandlers } from '@granit/react-bank-accounts/testing';

const server = setupServer(...createBankAccountsHandlers());
```

## Caveats

- **Client-side gating is a UX hint, not a boundary.** The backend re-checks
  `BankAccounts.Accounts.*` on every endpoint. Use the core
  `BankAccountsPermissions` constants only to hide controls; never treat them as
  authorization.
- **Identifier is masked, never clear.** Hooks return the core
  `BankAccountResponse` whose `accountIdentifierMasked` is the only identifier
  surface; the clear IBAN/account number is encrypted at rest server-side and is
  never returned. Do not log or render the `accountIdentifier` you sent in a
  create request beyond what the masked field exposes.
- **Coarse invalidation.** Every mutation invalidates the entire
  `buildBankAccountsQueryKey(config)` prefix rather than a targeted key — simple
  and correct for the current surface, but it refetches all active bank-account
  queries.
- **Server-side validation only.** Scheme/routing coherence (IBAN forbids a
  routing code, each domestic scheme requires its own) is enforced by the
  backend; a bad combination surfaces as a `400` from the mutation, not a
  client-side guard.
- **Multi-tenant cache hygiene.** The tenant header (`X-Tenant-Id`) is injected
  by `@granit/api-client`; on tenant switch, clear the React Query cache (e.g.
  `useClearQueriesOnTenantChange` from `@granit/react-multi-tenancy`) so masked
  account data does not leak across tenants.

## Out of scope

- **Domain types / raw HTTP functions / permission constants** — see the core
  [`@granit/bank-accounts`](../bank-accounts).
- **Admin grid hook** — there is no QueryEngine list hook here; compose
  `@granit/react-query-engine` against `GET {basePath}` (`/meta` metadata and
  fixtures provided under [`./testing`](#testing)).
- **Update / partial edit, hard delete, identifier reveal** — none exist; these
  are referential-wide limitations documented in the core package.

## License

Apache-2.0
