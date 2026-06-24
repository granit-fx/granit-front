# @granit/react-payments

React hooks, a provider, and trademark-safe icon components for the Granit
**payments** module — payment transactions, attached payment methods, checkout
sessions, and platform-level payment-method configuration. This is the **React
hooks layer**: it wraps the framework-agnostic Axios calls and DTOs from
[`@granit/payments`](../payments) in TanStack Query hooks behind a shared
`PaymentsProvider` for client / base-path / query-key configuration. Rendering of
admin tables and panels lives one layer up in
[`@granit/react-ui-payments`](../react-ui-payments).

The split is three packages over the same .NET `Granit.Payments` backend
(contract: `contracts/openapi/payments.json`):

- [`@granit/payments`](../payments) — framework-agnostic core: DTOs, validation
  constraints, `PaymentsPermissions`, and Axios functions (`listPaymentTransactions`,
  `attachPaymentMethod`, `activatePaymentMethod`, …).
- `@granit/react-payments` (this package) — React Query hooks, provider, icons.
- [`@granit/react-ui-payments`](../react-ui-payments) — admin UI kit (panels,
  grids, dialogs).

Provider-specific satellites live alongside: SEPA transfer
([`@granit/payments-sepa-transfer`](../payments-sepa-transfer) /
[`@granit/react-payments-sepa-transfer`](../react-payments-sepa-transfer)) and SEPA
direct debit
([`@granit/payments-sepa-direct-debit`](../payments-sepa-direct-debit) /
[`@granit/react-payments-sepa-direct-debit`](../react-payments-sepa-direct-debit)).

## Install

Workspace-internal — consumed via the `@granit/*` Vite/Vitest aliases, not
published for app consumption through a public registry. A consumer must declare
these peers:

- `@granit/payments` — core DTOs + Axios calls this layer wraps.
- `@granit/api-client` — supplies the `AxiosInstance` (CSRF, auth, tenant
  interceptors).
- `@granit/react-api-client` — `useOptionalGranitClient`, the context fallback for
  the Axios client when `config.client` is omitted.
- `@granit/types` — shared base types.
- `lucide-react` (`^1`) — generic icons backing the badge components.
- `@tanstack/react-query` (`^5`) and `react` (`^19`).
- `@granit/query-engine` + `@granit/react-query-engine` (**optional**) — `PagedResult`
  for the paginated transaction surface.
- `msw` (`^2.12`, **optional**) — only for the `@granit/react-payments/testing`
  subpath.

## Quick start

Wire the provider once (it resolves the Axios client, base path, and an optional
query-key prefix), then call the hooks anywhere below it.

```tsx
import { PaymentsProvider, usePaymentTransactions } from '@granit/react-payments';
import { useGranitClient } from '@granit/react-api-client';

function App({ children }: { children: React.ReactNode }) {
  // `client` may be omitted if a <GranitClientProvider> is already mounted.
  return (
    <PaymentsProvider config={{ client: useGranitClient() }}>
      {children}
    </PaymentsProvider>
  );
}

function TransactionList() {
  const { data, isLoading } = usePaymentTransactions(); // PagedResult<…>
  if (isLoading) return null;
  return (
    <ul>
      {data?.items.map((txn) => (
        <li key={txn.id}>{txn.status}</li>
      ))}
    </ul>
  );
}
```

A checkout flow drives a redirect from a mutation, while a platform-admin screen
toggles methods and renders the trademark-safe badges:

```tsx
import {
  PaymentMethodIcon,
  ProviderIcon,
  useActivatePaymentMethod,
  useCreateCheckoutSession,
  usePaymentMethodConfigurations,
} from '@granit/react-payments';

function Checkout() {
  const checkout = useCreateCheckoutSession();
  async function pay() {
    const session = await checkout.mutateAsync({ /* PaymentCheckoutRequest */ });
    window.location.href = session.url;
  }
  return <button type="button" onClick={pay}>Pay</button>;
}

function MethodMatrix() {
  const { data: providers } = usePaymentMethodConfigurations();
  const activate = useActivatePaymentMethod(); // invalidates config + catalog + available

  return providers?.map((provider) => (
    <section key={provider.providerName}>
      <ProviderIcon providerName={provider.providerName} />
      {provider.methods.map((m) => (
        <button
          key={m.methodType}
          type="button"
          onClick={() => activate.mutate({ providerName: provider.providerName, methodType: m.methodType })}
        >
          <PaymentMethodIcon methodType={m.methodType} category={m.category} />
        </button>
      ))}
    </section>
  ));
}
```

## Public API

| Symbol                           | Kind      | Purpose                                                                          |
| -------------------------------- | --------- | -------------------------------------------------------------------------------- |
| `PaymentsProvider`               | provider  | Resolves client / base path / query-key prefix for all hooks below it            |
| `usePaymentsConfig`              | hook      | Read the resolved config; throws outside a provider                              |
| `buildPaymentsQueryKey`          | fn        | Query-key factory honoring the configured `queryKeyPrefix` (default `payments`)  |
| `usePaymentTransactions`         | hook      | `GET .../transactions` — `PagedResult` of transactions                           |
| `usePaymentTransaction`          | hook      | `GET .../transactions/{id}` — single transaction (disabled when `id` empty)      |
| `useInitiatePaymentCharge`       | hook      | `POST .../charge` mutation; invalidates transactions on success                  |
| `useRequestPaymentRefund`        | hook      | `POST .../refund` mutation; invalidates transactions on success                  |
| `useCreateCheckoutSession`       | hook      | `POST .../checkout` mutation → session with redirect `url`                       |
| `usePaymentMethods`              | hook      | `GET .../methods` — attached payment methods                                     |
| `useAvailablePaymentMethods`     | hook      | Available methods, optionally filtered by `PaymentAvailabilityContext`           |
| `useAttachPaymentMethod`         | hook      | `POST .../methods` mutation; invalidates methods on success                      |
| `useDetachPaymentMethod`         | hook      | `DELETE .../methods/{id}` mutation; invalidates methods on success               |
| `usePaymentMethodConfigurations` | hook      | Platform-level method configurations grouped by provider (host admin)            |
| `useActivatePaymentMethod`       | hook      | Activate a platform method (idempotent); invalidates config/available/catalog    |
| `useDeactivatePaymentMethod`     | hook      | Deactivate a platform method (idempotent); same invalidations                    |
| `useResyncPaymentMethod`         | hook      | Re-fetch provider catalog + overwrite capability snapshot; refresh badges        |
| `useProviderCatalog`             | hook      | Live catalog advertised by a provider (disabled when name empty)                 |
| `PaymentMethodIcon`              | component | Trademark-safe colored badge for a method (`methodType` + `category`)            |
| `ProviderIcon`                   | component | Trademark-safe colored badge for a provider (`providerName`)                     |
| `resolveMethodIconStyle`         | fn        | `(methodType, category) → MethodIconStyle` — the badge style registry            |
| `PaymentsConfig`                 | type      | Provider input (optional `client` / `basePath` / `queryKeyPrefix`)               |
| `PaymentsProviderProps`          | type      | `{ config, children }`                                                           |
| `MethodIconStyle`                | type      | `{ icon, bg, fg }` resolved badge style                                          |
| `PaymentMethodIconProps`         | type      | Props for `PaymentMethodIcon` (incl. `customIcon` brand override)                |
| `ProviderIconProps`              | type      | Props for `ProviderIcon` (incl. `customIcon` brand override)                     |

`./testing` subpath (requires the optional `msw` peer): `createPaymentsHandlers`
and `createPaymentsConfigurationHandlers` (MSW handlers, default base
`/api/v1/payments`), the `paymentTransactionQueryMetadata` and `mockPaymentProviders`
fixtures, plus the `sampleTransactions`, `samplePaymentMethods`,
`sampleAvailableMethods`, `sampleRefunds`, and `sampleDisputes` mock data.

## Caveats

- **Trademark safety.** `PaymentMethodIcon` and `ProviderIcon` render a generic
  Lucide glyph on a brand-adjacent background color — they intentionally do **not**
  reproduce protected brand logos. Apps that have obtained provider brand licenses
  (Bancontact, iDEAL, PayPal, …) can pass the official SVG via the `customIcon`
  prop, which replaces the generated badge.
- **Category coupling.** `category` (and the index space of
  `resolveMethodIconStyle`) is the backend `PaymentMethodCategory` enum (0–7); its
  order must stay in lockstep with
  `Granit.Payments.Domain.PaymentMethodCategory`. Out-of-range categories fall back
  to the `card` style.
- **Client-side gating is a UX hint, not a security boundary.** Use
  `PaymentsPermissions` (from [`@granit/payments`](../payments)) to hide controls,
  but every payment endpoint is enforced server-side by `Granit.Payments` — never
  treat a hidden button as authorization.
- **Filter caches.** `useAvailablePaymentMethods` folds the serialized
  `PaymentAvailabilityContext` into its query key, so distinct country / currency /
  amount combinations keep independent caches and never cross-contaminate.

## Out of scope

- **Rendering** — admin panels, grids, and dialogs live in
  [`@granit/react-ui-payments`](../react-ui-payments). This package is headless
  apart from the two icon badges.
- **DTOs, HTTP transport, permissions, validation constraints** — owned by
  [`@granit/payments`](../payments) (mirror of `Granit.Payments`); hooks here only
  adapt those calls to React Query.
- **Provider-specific flows** (SEPA transfer / direct debit) — handled by the SEPA
  satellite packages listed above.

## License

Apache-2.0
