# @granit/react-payments-sepa-transfer

React hooks + provider for the Granit **SEPA bank transfer** module — read and
upsert the tenant's beneficiary configuration (beneficiary name, IBAN, BIC,
active flag). This is the **React hooks layer**: it wraps the framework-agnostic
Axios calls and DTOs from [`@granit/payments-sepa-transfer`](../payments-sepa-transfer)
in TanStack Query hooks behind a shared `SepaTransferProvider` for
client/base-path/query-key configuration. It holds no rendering — forms and
admin panels live in the host app.

The split is two packages over the same .NET `Granit.SepaTransfer` backend
(contract: `contracts/openapi/sepa-transfer.json`, tag `SEPA Transfer`):

- [`@granit/payments-sepa-transfer`](../payments-sepa-transfer) —
  framework-agnostic core: DTOs, Axios functions
  (`getSepaTransferConfiguration`, `upsertSepaTransferConfiguration`), and the
  `SepaTransferPermissions` map.
- `@granit/react-payments-sepa-transfer` (this package) — React Query hooks +
  provider + MSW testing handlers.

There is no `react-ui` admin feature kit for this module: the sibling
[`@granit/react-ui-payments`](../react-ui-payments) is the admin UI for the
distinct `Payments` module (charges/refunds/methods), not SEPA transfer. The
parallel SEPA direct-debit module lives in
[`@granit/react-payments-sepa-direct-debit`](../react-payments-sepa-direct-debit).

## Install

Workspace-internal — consumed via the `@granit/*` Vite/Vitest aliases, not
published for app consumption through a public registry. A consumer must declare
these peers:

- `@granit/payments-sepa-transfer` — core DTOs + Axios calls this layer wraps.
- `@granit/api-client` — supplies the `AxiosInstance` (CSRF, auth, tenant
  interceptors).
- `@granit/react-api-client` — `useOptionalGranitClient`, the context fallback
  for the Axios client when `config.client` is omitted.
- `@granit/types` — shared base types.
- `@tanstack/react-query` (`^5`) and `react` (`^19`).
- `msw` (`^2.12`, **optional**) — only for the
  `@granit/react-payments-sepa-transfer/testing` subpath.

## Quick start

Wire the provider once (it resolves the Axios client, base path, and an optional
query-key prefix), then call the hooks anywhere below it.

```tsx
import {
  SepaTransferProvider,
  useSepaTransferConfiguration,
  useUpsertSepaTransferConfiguration,
} from '@granit/react-payments-sepa-transfer';
import { useGranitClient } from '@granit/react-api-client';

function App({ children }: { children: React.ReactNode }) {
  // `client` may be omitted if a <GranitClientProvider> is already mounted.
  return (
    <SepaTransferProvider config={{ client: useGranitClient() }}>
      {children}
    </SepaTransferProvider>
  );
}

function BeneficiaryForm() {
  // GET {basePath}/configuration — the response IBAN is masked
  // (`beneficiaryIbanMasked`); the raw IBAN is never echoed back.
  const { data: config, isLoading } = useSepaTransferConfiguration();
  const upsert = useUpsertSepaTransferConfiguration();

  if (isLoading) return null;

  async function save() {
    // PUT {basePath}/configuration — supplying `beneficiaryIban` provisions the
    // account into the company's BankAccounts referential. Invalidates the
    // configuration query on success.
    await upsert.mutateAsync({
      beneficiaryName: 'Acme NV',
      beneficiaryIban: 'BE68539007547034',
      beneficiaryBic: 'GEBABEBB',
      isActive: true,
    });
  }

  return (
    <form onSubmit={(e) => (e.preventDefault(), void save())}>
      {/* render fields from config.beneficiaryName, config.beneficiaryIbanMasked, … */}
      <button type="submit" disabled={upsert.isPending}>Save</button>
    </form>
  );
}
```

`useSepaTransferConfiguration()` resolves to `null`/404 when SEPA transfer has
not yet been configured for the tenant — render the empty form rather than an
error. Both endpoints require the `SepaTransfer.Configuration.Manage` permission
(`SepaTransferPermissions.Configuration.Manage` from the core package); gate the
screen with `@granit/react-authorization` and rely on the backend for
enforcement.

## Public API

| Symbol                                 | Kind     | Purpose                                                             |
| -------------------------------------- | -------- | ------------------------------------------------------------------- |
| `SepaTransferProvider`                 | provider | Supplies client, base path, query-key prefix to all hooks below it  |
| `useSepaTransferConfig`                | hook     | Read the resolved config; throws outside a provider                 |
| `useSepaTransferConfiguration`         | hook     | `GET {basePath}/configuration` — tenant beneficiary config (masked) |
| `useUpsertSepaTransferConfiguration`   | hook     | `PUT {basePath}/configuration` mutation; invalidates the read query |
| `buildSepaTransferQueryKey`            | fn       | Query-key factory honoring the configured `queryKeyPrefix`          |
| `SepaTransferConfig`                   | type     | Provider input (optional client / basePath / queryKeyPrefix)        |
| `ResolvedSepaTransferConfig`           | type     | Provider output with the resolved required client + basePath        |
| `SepaTransferProviderProps`            | type     | `{ config, children }`                                              |

DTOs and the `SepaTransferPermissions` map are re-exported from the core
[`@granit/payments-sepa-transfer`](../payments-sepa-transfer); import them from
there, not this package.

`./testing` subpath (requires the optional `msw` peer): `createSepaTransferHandlers`
(stateful read + upsert MSW handlers, default base `/api/v1/sepa-transfer`) and
the `sampleConfiguration` fixture.

## Caveats

- **The raw IBAN is never returned.** The read and upsert responses carry only
  `beneficiaryIbanMasked` (e.g. `BE** **** **** 9999`); `beneficiaryIban` is
  write-only on the request. Never reconstruct or display the unmasked value,
  and do not persist it client-side.
- **404 means "not configured", not an error.** `useSepaTransferConfiguration`
  surfaces a 404 before the tenant has any configuration; treat it as an empty
  state and let the upsert create the first record.
- **Optimistic concurrency.** `SepaTransferConfigurationResponse` carries a
  `concurrencyStamp`; follow the framework body-field stamp convention on
  read-modify-write, never `If-Match`.
- **Client-side permission checks are a UX hint, not a security boundary.** Gate
  the form with `SepaTransfer.Configuration.Manage`, but the .NET backend
  re-checks the permission on every request — that is the authoritative answer.

## Out of scope

- **Rendering** — this package is headless; beneficiary forms and admin panels
  live in the host app (there is no SEPA-transfer `react-ui` kit).
- **DTOs, HTTP transport, and the permission map** — owned by
  [`@granit/payments-sepa-transfer`](../payments-sepa-transfer) (mirror of
  `Granit.SepaTransfer`); hooks here only adapt them to React Query.
- **SEPA direct debit** and the broader **Payments** module (charges, refunds,
  methods) — separate packages
  ([`@granit/react-payments-sepa-direct-debit`](../react-payments-sepa-direct-debit),
  [`@granit/react-payments`](../react-payments)).

## License

Apache-2.0
