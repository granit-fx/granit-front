# @granit/react-ui-customer-balance

Admin **UI feature kit** for the **Granit.CustomerBalance** module — the balance
page (currency selector, summary card, paginated transaction table) and the admin
**credit** / **debit** dialogs. This is the top **react-ui** layer: it renders the
feature by composing the headless hooks/provider from
[`@granit/react-customer-balance`](../react-customer-balance) with the foundation UI
packages ([`@granit/react-ui`](../react-ui) primitives and the
[`@granit/react-ui-kit`](../react-ui-admin-kit) `FormDialog`). It owns no HTTP
transport and no React Query wiring — those live one layer down.

The split is three packages over the same .NET `Granit.CustomerBalance` backend
(contract: `contracts/openapi/customer-balance.json`):

- [`@granit/customer-balance`](../customer-balance) — framework-agnostic core: DTOs,
  Axios functions (`getCustomerBalance`, `addAdminCredit`, …), validation
  `customerBalanceConstraints`, and `CustomerBalancePermissions`.
- [`@granit/react-customer-balance`](../react-customer-balance) — React Query hooks
  (`useCustomerBalance`, `useBalanceTransactions`, `useAddAdminCredit`,
  `useApplyAdminDebit`) + `CustomerBalanceProvider`.
- `@granit/react-ui-customer-balance` (this package) — the admin page, summary card,
  transaction-column factory, and credit/debit `FormDialog`s.

## Install

Workspace-internal — consumed via the `@granit/*` Vite/Vitest aliases, not published
for app consumption through a public registry. A consumer must declare these peers:

- `@granit/react-customer-balance` — the headless hooks/provider this kit renders.
- `@granit/customer-balance` — core DTOs (`AdminCreditRequest`, …) and the
  `customerBalanceConstraints` that drive the dialog form validation.
- `@granit/react-ui` — the shadcn-style primitives (`Card`, `Table`, `Select`,
  `Input`, `FormField`, `toast`, …).
- `@granit/react-ui-kit` — the `FormDialog` shell used by both dialogs.
- `@granit/react-localization` — `useTranslation` and `useDateFormatter`.
- `@granit/react-validation` — `createConstraintsResolver` bridging the core
  constraints to react-hook-form.
- `@granit/types` — `CurrencyCode` and `toISODateString`.
- `@granit/utils` — `cn` class-name helper.
- `@tanstack/react-table` (`^8.21`) — drives the transaction table.
- `react-hook-form` (`^7.80`) — form state for the dialogs.
- `lucide-react` (`^1.21`) — the page-header icons.
- `react` / `react-dom` (`^19`).

## Quick start

Register the i18n bundle, then mount `CustomerBalancePage` under a
`CustomerBalanceProvider` (from `@granit/react-customer-balance`), which resolves the
Axios client from a `GranitClientProvider` higher in the tree. No client is baked in.

```tsx
import { CustomerBalanceProvider } from '@granit/react-customer-balance';
import {
  CustomerBalancePage,
  customerBalanceTranslationsEn,
} from '@granit/react-ui-customer-balance';
import { useGranitClient } from '@granit/react-api-client';

// Flat keys in the "translation" namespace; `Common.*` keys are app-global.
i18n.addResourceBundle('en', 'translation', customerBalanceTranslationsEn, true, true);

function CustomerBalanceRoute() {
  return (
    <CustomerBalanceProvider config={{ client: useGranitClient() }}>
      <CustomerBalancePage />
    </CustomerBalanceProvider>
  );
}
```

The dialogs and table can also be composed directly when the full page is not wanted —
for example a custom layout reusing the summary card and column factory:

```tsx
import { useReactTable, getCoreRowModel } from '@tanstack/react-table';
import { useCustomerBalance, useBalanceTransactions } from '@granit/react-customer-balance';
import { useTranslation, useDateFormatter } from '@granit/react-localization';
import {
  BalanceSummaryCard,
  createTransactionColumns,
} from '@granit/react-ui-customer-balance';

function MiniBalance() {
  const { t, i18n } = useTranslation();
  const { formatDateTime } = useDateFormatter();
  const balance = useCustomerBalance('EUR');
  const tx = useBalanceTransactions({ currency: 'EUR', page: 1, pageSize: 25 });

  const columns = createTransactionColumns({ t, formatDateTime, locale: i18n.language });
  const table = useReactTable({
    data: tx.data?.items ?? [],
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  return balance.data ? <BalanceSummaryCard balance={balance.data} /> : null;
}
```

## Public API

| Symbol                          | Kind      | Purpose                                                          |
| ------------------------------- | --------- | ---------------------------------------------------------------- |
| `CustomerBalancePage`           | component | Full admin page: currency selector, summary, table, credit/debit |
| `BalanceSummaryCard`            | component | Balance + currency + last-updated card for the current balance   |
| `AddCreditDialog`               | component | `FormDialog` issuing an admin credit (`useAddAdminCredit`)       |
| `ApplyDebitDialog`              | component | Destructive `FormDialog` applying a debit (`useApplyAdminDebit`) |
| `createTransactionColumns`      | fn        | `@tanstack/react-table` `ColumnDef[]` factory for the table      |
| `formatCurrency`                | fn        | Minor-unit amount → locale-aware ISO-4217 currency string        |
| `customerBalanceTranslationsEn` | const     | English i18next bundle (`CustomerBalance.*`, flat keys)          |
| `customerBalanceTranslationsFr` | const     | French i18next bundle (`CustomerBalance.*`, flat keys)           |
| `CustomerBalanceTranslations`   | type      | Shape of the bundle (`typeof customerBalanceTranslationsEn`)     |

### Component props

- `BalanceSummaryCard` — `{ balance: CustomerBalanceResponse }`.
- `AddCreditDialog` / `ApplyDebitDialog` —
  `{ open: boolean; onOpenChange: (open: boolean) => void; defaultCurrency?: string }`
  (`defaultCurrency` falls back to `'EUR'`).
- `createTransactionColumns` —
  `{ t; formatDateTime: (d: string | Date) => string; locale: string }`; `t` is the
  exact `useTranslation().t` to avoid i18next version skew across the workspace.

## Amounts and currency

Amounts cross the wire in **minor units** (e.g. cents). `formatCurrency(amount,
currency, locale)` divides by 100 and renders via `Intl.NumberFormat` with
`style: 'currency'`; the currency code is data-driven (from the API), while `locale`
must track the active UI language so grouping/separators match (`1 234,56 €` vs
`€1,234.56`). The transaction table's amount column formats the same way and prefixes
credits with `+`. The page's currency `Select` is gated to `EUR / USD / GBP / CHF`.

## i18n

- Ships its own `CustomerBalance.*` strings as flat keys in the `translation`
  namespace (`customerBalanceTranslationsEn` / `Fr`); the host app registers them with
  `i18n.addResourceBundle`. `Common.*` keys (pagination, cancel, no-results) are
  expected to be app-global and are **not** shipped here.
- Dialog field labels feed the `{PropertyName}` placeholder of the shared
  `Validation:Builtin:*` messages, which are owned by the backend `Granit.Validation`
  package (namespace `Validation`) and loaded by the host via the Localization API —
  this package never redefines those keys.

## Out of scope / caveats

- **Client-side gating is a UX hint, not a security boundary.** This kit renders the
  credit/debit controls; granting them is the host's job — gate the route/buttons with
  `CustomerBalancePermissions` (from [`@granit/customer-balance`](../customer-balance))
  via the authorization hooks, and rely on the .NET backend to enforce every mutation.
- **No HTTP transport or React Query wiring** — owned by
  [`@granit/react-customer-balance`](../react-customer-balance); DTOs, Axios calls,
  validation constraints, and permissions live in
  [`@granit/customer-balance`](../customer-balance). This package only renders them.
- **No client resolution** — `CustomerBalancePage` reads the Axios client through the
  surrounding `CustomerBalanceProvider` / `GranitClientProvider`; nothing is baked in.
- **Mutations route errors globally.** The dialogs call `mutate` (not `mutateAsync`)
  so failures surface through the global `MutationCache.onError` toast; only the
  success toast and dialog close are handled locally.

## License

Apache-2.0
