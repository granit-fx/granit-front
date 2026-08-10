# @granit/react-ui-payments

Admin UI feature kit for the Granit **payments** module — the transaction list
and detail (refunds/disputes), the host payment-method configuration panel, the
tenant saved-methods page, and the spec-validated charge/refund dialogs. This is
the **react-ui** layer: it composes the headless `PaymentsProvider` + hooks from
[`@granit/react-payments`](../react-payments) with the foundation UI primitives
from [`@granit/react-ui`](../react-ui) into ready-to-mount pages. It owns no data
fetching of its own — every page calls the upstream hooks; it owns no DTOs — those
live in the core.

The split is three packages over the same .NET `Granit.Payments` backend
(contract: `contracts/openapi/payments.json`):

- [`@granit/payments`](../payments) — framework-agnostic core: DTOs, validation
  constraints, `PaymentsPermissions`, and Axios functions.
- [`@granit/react-payments`](../react-payments) — React Query hooks, provider, and
  the trademark-safe `PaymentMethodIcon` / `ProviderIcon` components.
- `@granit/react-ui-payments` (this package) — admin pages, panels, dialogs, and
  TanStack Table column factories.

Provider-specific satellites are out of scope here — SEPA transfer
([`@granit/react-payments-sepa-transfer`](../react-payments-sepa-transfer)) and SEPA
direct debit
([`@granit/react-payments-sepa-direct-debit`](../react-payments-sepa-direct-debit))
ship their own UI alongside.

## Install

Workspace-internal — consumed via the `@granit/*` Vite/Vitest aliases, not published
for app consumption through a public registry. A consumer must declare these peers:

- `@granit/react-payments` — the headless `PaymentsProvider` + hooks these pages call.
- `@granit/payments` — `paymentsConstraints` (spec-derived form validation) and the
  wire DTOs the components are typed against.
- `@granit/react-ui` — the shadcn/ui foundation primitives (`Dialog`, `Table`,
  `Card`, `Form`, `Badge`, `toast`, …).
- `@granit/react-localization` — `useTranslation` / `useDateFormatter`.
- `@granit/react-validation` — `createConstraintsResolver`, the react-hook-form
  resolver derived from the OpenAPI constraints.
- `@granit/types` — `toEntityId`, branded id + `CurrencyCode` types.
- `@granit/utils` — `cn` class-name helper.
- `@tanstack/react-table` (`^9.0`) — the table model behind the column factories.
- `react-hook-form` (`^7.80`) — the charge/refund dialog forms.
- `react-router` (`^7.18`) — `:id` route param + detail-page links.
- `i18next` (`^26`), `lucide-react` (`^1.21`), `react` (`^19`), `react-dom` (`^19`).

## Quick start

The host app mounts `PaymentsProvider` once (it resolves the Axios client and base
path via `GranitClientProvider`), registers the i18n bundles, then routes to the
pages — they read everything they need from the provider context and the route.

```tsx
import { PaymentsProvider } from '@granit/react-payments';
import {
  TransactionListPage,
  TransactionDetailPage,
  PaymentMethodsPage,
  TenantPaymentMethodsPage,
  paymentsTranslationsEn,
  paymentsTranslationsFr,
} from '@granit/react-ui-payments';
import i18n from 'i18next';
import { Route, Routes } from 'react-router';

// Flat `Payments.*` keys, "translation" namespace (last `true` = deep + overwrite).
i18n.addResourceBundle('en', 'translation', paymentsTranslationsEn, true, true);
i18n.addResourceBundle('fr', 'translation', paymentsTranslationsFr, true, true);

function PaymentsAdmin({ client }: { client: import('axios').AxiosInstance }) {
  return (
    <PaymentsProvider config={{ client, basePath: '/api/v1/payments' }}>
      <Routes>
        <Route path="/payments/transactions" element={<TransactionListPage />} />
        <Route path="/payments/transactions/:id" element={<TransactionDetailPage />} />
        <Route path="/payments/methods" element={<PaymentMethodsPage />} />
        <Route path="/payments/my-methods" element={<TenantPaymentMethodsPage />} />
      </Routes>
    </PaymentsProvider>
  );
}
```

The `TransactionDetailPage` reads the route `:id`, shows the refund/dispute history,
and (when the transaction is `Succeeded`) opens the `RefundDialog`. The dialog's
fields are validated against the OpenAPI-backed `paymentsConstraints` — there is no
hand-written Zod schema:

```tsx
import { RefundDialog } from '@granit/react-ui-payments';

// Spec-validated `amount` + `reason`; `transactionId` is request-only, from props.
<RefundDialog
  open={open}
  onOpenChange={setOpen}
  transactionId={transaction.id}
  maxAmount={transaction.amount}
  currency={transaction.currency}
/>;
```

The lower-level dialogs and column factories are exported too, for apps that compose
their own pages — e.g. `createTransactionColumns({ t })` returns the
`@tanstack/react-table` `DataTableColumnDef[]` used by `TransactionListPage`.

## Public API

| Symbol                        | Kind      | Purpose                                                       |
| ----------------------------- | --------- | ------------------------------------------------------------- |
| `TransactionListPage`         | component | Paginated transactions table + charge action                  |
| `TransactionDetailPage`       | component | One transaction (route `:id`) with refund/dispute history     |
| `PaymentMethodsPage`          | component | Host-level provider/method activation panel                   |
| `TenantPaymentMethodsPage`    | component | Tenant saved methods grid (attach/detach)                     |
| `ChargeDialog`                | component | Spec-validated charge form (`PaymentChargeRequest`)           |
| `RefundDialog`                | component | Spec-validated refund form (`PaymentRefundRequest`)           |
| `AttachMethodDialog`          | component | Pick + attach an available method to the tenant               |
| `DetachMethodDialog`          | component | Confirm-and-detach a saved method (`AlertDialog`)             |
| `PaymentConfigurationSection` | component | One card per provider; toggle/resync each method              |
| `PaymentMethodCard`           | component | A single saved method with a detach menu                      |
| `TransactionStatusBadge`      | component | `PaymentStatus` to colored badge                              |
| `CapabilityBadges`            | component | Country/currency/sequence/amount-bound chips                  |
| `PendingSnapshotBadge`        | component | Flags an activation predating capability snapshotting         |
| `createTransactionColumns`    | fn        | TanStack `DataTableColumnDef[]` for the transaction list      |
| `createRefundColumns`         | fn        | TanStack `DataTableColumnDef[]` for the refund history table  |
| `createDisputeColumns`        | fn        | TanStack `DataTableColumnDef[]` for the dispute history table |
| `createPaymentHistoryColumns` | fn        | Shared id/status/amount/reason/date column factory            |
| `categoryIndex`               | fn        | `PaymentMethodCategory` to `PaymentMethodIcon` index          |
| `methodTypeCategory`          | fn        | Free-form `type` to best-effort `PaymentMethodCategory`       |
| `methodTypeCategoryIndex`     | fn        | Convenience: method `type` to `PaymentMethodIcon` index       |
| `paymentsTranslationsEn`      | const     | English flat `Payments.*` i18next bundle                      |
| `paymentsTranslationsFr`      | const     | French flat `Payments.*` i18next bundle                       |
| `PaymentsTranslations`        | type      | `typeof paymentsTranslationsEn` — the bundle key shape        |

## i18n

Ships flat `Payments.*` keys in the `translation` namespace via
`paymentsTranslationsEn` / `paymentsTranslationsFr` (dotted PascalCase keys, with
`keySeparator` / `nsSeparator` disabled to match the host showcase fixtures).
Register them on the host i18n instance with
`addResourceBundle(lng, 'translation', bundle, true, true)`. The shared `Common.*`
keys (`Cancel`, `Loading`, `Back`, `NoResults`, `Actions`) are referenced by these
pages but are **owned by the host app**, not this package — wire them yourself.

## Validation

The `ChargeDialog` and `RefundDialog` derive their react-hook-form validation from
the OpenAPI contract via
`createConstraintsResolver(paymentsConstraints.PaymentChargeRequest, t, …)` and
`paymentsConstraints.PaymentRefundRequest` respectively
([`@granit/react-validation`](../react-validation) +
[`@granit/payments`](../payments)) — no hand-written schema. Field labels resolve to
`Payments.Fields.*` keys via field-name capitalisation; request-only fields
(`transactionId` on refund) come from props, not the form.

## Caveats

- **Amounts are minor units.** Every component treats `amount` as integer minor
  units (cents) and divides by 100 for display via `Intl.NumberFormat`. Pass minor
  units into the dialogs (`maxAmount`, the charge `amount` field).
- **Host vs. tenant pages are different audiences.** `PaymentMethodsPage` /
  `PaymentConfigurationSection` are the **platform operator** activating which
  methods the SaaS offers; `TenantPaymentMethodsPage` is a **tenant** managing its
  own saved methods. They render from different endpoints — don't conflate them.
- **Live catalog, not a DB snapshot.** `PaymentConfigurationSection` reads the live
  provider catalog (per-provider `useProviderCatalog`), so inactive methods and
  newly-advertised ones (a BNPL option a provider just added) surface without a
  Granit release. `PendingSnapshotBadge` flags activations predating capability
  snapshotting; a Resync captures one.
- **Mutation errors are surfaced globally.** The dialogs and toggles only toast on
  success; API errors are expected to be surfaced by the host's global
  `MutationCache.onError` toast, not handled per-call here.
- **UX gating, not enforcement.** Hiding a control (e.g. the refund button only when
  `status === 'Succeeded'`) is a UX hint. Authorization is enforced by the .NET
  `Granit.Payments` backend on every endpoint — never treat these client-side
  conditions as a security boundary.

## License

Apache-2.0
