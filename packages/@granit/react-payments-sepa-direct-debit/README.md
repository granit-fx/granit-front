# @granit/react-payments-sepa-direct-debit

React hooks + provider for the Granit **SEPA Direct Debit** module — mandate
lifecycle (setup → confirm → cancel), single-mandate reads, and per-tenant SEPA
configuration. This is the **React hooks layer**: it wraps the framework-agnostic
Axios calls and wire types from
[`@granit/payments-sepa-direct-debit`](../payments-sepa-direct-debit) in TanStack
Query hooks behind a shared `SepaDirectDebitProvider` for client / base-path /
query-key configuration. It holds no rendering — grids, forms, and pages live one
layer up.

The split is three packages over the same .NET `SepaDirectDebit` backend
(contract: `contracts/openapi/sepa-direct-debit.json`):

- [`@granit/payments-sepa-direct-debit`](../payments-sepa-direct-debit) —
  framework-agnostic core: wire types, the permission catalog, and Axios functions
  (`createMandate`, `confirmMandate`, `getSepaConfiguration`, …).
- `@granit/react-payments-sepa-direct-debit` (this package) — React Query hooks +
  provider.
- [`@granit/react-ui-payments`](../react-ui-payments) — admin UI kit for the
  Payments domain; the SEPA mandate admin grid is driven through
  [`@granit/react-query-engine`](../react-query-engine) under its own
  `QueryProvider`.

There is no dedicated `@granit/react-ui-payments-sepa-direct-debit` package — this
layer is headless.

## Install

Workspace-internal — consumed via the `@granit/*` Vite/Vitest aliases, not
published for app consumption through a public registry. A consumer must declare
these peers:

- `@granit/payments-sepa-direct-debit` — core wire types + Axios calls this layer
  wraps.
- `@granit/api-client` — supplies the `AxiosInstance` (CSRF, auth, tenant
  interceptors).
- `@granit/react-api-client` — `useOptionalGranitClient`, the context fallback for
  the Axios client when `config.client` is omitted.
- `@granit/types` — shared base types (branded `ISODateString` on timestamp
  fields).
- `@tanstack/react-query` (`^5`) and `react` (`^19`).
- `@granit/query-engine` / `@granit/react-query-engine` (**optional**) — only for
  the `./testing` mandate-grid `/meta` fixtures.
- `msw` (`^2.12`, **optional**) — only for the
  `@granit/react-payments-sepa-direct-debit/testing` subpath.

## Quick start

Wire the provider once (it resolves the Axios client, base path, and an optional
query-key prefix), then call the hooks anywhere below it.

```tsx
import {
  SepaDirectDebitProvider,
  useCreateMandate,
} from '@granit/react-payments-sepa-direct-debit';
import { useGranitClient } from '@granit/react-api-client';

function App({ children }: { children: React.ReactNode }) {
  // `client` may be omitted if a <GranitClientProvider> is already mounted.
  return (
    <SepaDirectDebitProvider config={{ client: useGranitClient() }}>
      {children}
    </SepaDirectDebitProvider>
  );
}

function NewMandateButton({ debtorPartyId }: { debtorPartyId: string }) {
  const create = useCreateMandate();

  async function onSubmit(debtorName: string, debtorIban: string) {
    // `MandateSetupResponse` — Pending until the debtor signs.
    const setup = await create.mutateAsync({ debtorPartyId, debtorName, debtorIban });
    // Hosted-provider signature flow: hand off to the redirect when present.
    if (setup.redirectUrl) window.location.href = setup.redirectUrl;
  }

  return (
    <button type="button" onClick={() => onSubmit('Alice Martin', 'BE…')}>
      New mandate
    </button>
  );
}
```

A mandate is created `Pending`; confirm it after the debtor's signature, then read
or cancel it by id:

```tsx
import {
  useMandate,
  useConfirmMandate,
  useCancelMandate,
} from '@granit/react-payments-sepa-direct-debit';

function MandatePanel({ id }: { id: string }) {
  const { data: mandate } = useMandate(id); // query disabled while `id` is empty
  const confirm = useConfirmMandate();
  const cancel = useCancelMandate();

  return (
    <>
      <span>{mandate?.status}</span>
      <button
        type="button"
        onClick={() =>
          confirm.mutateAsync({ id, request: { signedAt: new Date().toISOString() } })
        }
      >
        Activate
      </button>
      <button type="button" onClick={() => cancel.mutateAsync(id)}>
        Cancel
      </button>
    </>
  );
}
```

Each mutation invalidates this package's `'mandates'` (or `'configuration'`) query
keys on success. The tenant creditor settings are read/written with
`useSepaConfiguration` / `useUpsertSepaConfiguration`.

## Public API

| Symbol                          | Kind     | Purpose                                                            |
| ------------------------------- | -------- | ------------------------------------------------------------------ |
| `SepaDirectDebitProvider`       | provider | Supplies client, base path, query-key prefix to all hooks below it |
| `useSepaDirectDebitConfig`      | hook     | Read the resolved config; throws outside a provider                |
| `buildSepaDirectDebitQueryKey`  | fn       | Query-key factory honoring the configured `queryKeyPrefix`         |
| `useMandate`                    | hook     | `GET .../mandates/{id}` — single mandate; disabled when `id` empty |
| `useCreateMandate`              | hook     | `POST .../mandates` — setup; returns `MandateSetupResponse`        |
| `useConfirmMandate`             | hook     | `POST .../mandates/{id}/confirm` — activate a pending mandate      |
| `useCancelMandate`              | hook     | `POST .../mandates/{id}/cancel` — revoke a mandate                 |
| `useSepaConfiguration`          | hook     | `GET .../configuration` — tenant creditor configuration            |
| `useUpsertSepaConfiguration`    | hook     | `PUT .../configuration` — create/update tenant configuration       |
| `SepaDirectDebitConfig`         | type     | Provider input (optional client / basePath / queryKeyPrefix)       |
| `ResolvedSepaDirectDebitConfig` | type     | Provider output with the resolved required client + basePath       |
| `SepaDirectDebitProviderProps`  | type     | `{ config, children }`                                             |
| `ConfirmMandateArgs`            | type     | `{ id, request }` for the confirm mutation                         |

`./testing` subpath (requires the optional `msw` peer, plus `@granit/query-engine`
and `@granit/react-query-engine` for the grid `/meta`):
`createSepaDirectDebitHandlers` (stateful MSW handlers, default base
`/api/v1/sepa-direct-debit`), `mandateQueryMetadata` (the mandate grid `/meta`
payload), and the `sampleMandates` / `sampleConfiguration` fixtures.

## Caveats

- **Cross-provider grid invalidation.** The mandate admin grid is fetched by
  [`@granit/react-query-engine`](../react-query-engine) under its own
  `QueryProvider` — a different query-key namespace this provider cannot reach. The
  mutation hooks only invalidate this package's `'mandates'` keys; to refresh the
  grid after a mutation, invalidate the query-engine endpoint prefix **without** the
  params object so every cached page flushes, e.g.
  `queryClient.invalidateQueries({ queryKey: [...queryKeyPrefix, 'list'] })` (and
  `'grouped'`).
- **Provider client resolution.** `SepaDirectDebitProvider` resolves its client from
  `config.client` or the nearest `<GranitClientProvider>`; with neither it throws at
  render. `useSepaDirectDebitConfig` likewise throws outside a provider.
- **Masked debtor IBAN.** Mandate responses carry `debtorIbanMasked`, never the full
  IBAN — the unmasked value is validated server-side and never echoed back. Do not
  attempt to reconstruct or display a full IBAN from this field.
- **Optimistic concurrency.** Mandate and configuration responses carry a
  `concurrencyStamp`; pass it back on writes per the framework's body-field
  concurrency convention (the backend returns `409` on a stale stamp).

## Out of scope

- **Rendering** — mandate grids, forms, and pages live in the
  [`@granit/react-ui-payments`](../react-ui-payments) admin kit. This package is
  headless.
- **Wire types, HTTP transport, and the permission catalog** — owned by
  [`@granit/payments-sepa-direct-debit`](../payments-sepa-direct-debit) (mirror of
  the .NET `SepaDirectDebit` module); hooks here only adapt them to React Query.
- **Mandate listing** — the paginated/filterable cross-tenant admin grid is a
  query-engine surface driven by
  [`@granit/react-query-engine`](../react-query-engine), not a hook in this package.
- **Sibling SEPA domains** — credit transfers are
  [`@granit/payments-sepa-transfer`](../payments-sepa-transfer) /
  [`@granit/react-payments-sepa-transfer`](../react-payments-sepa-transfer); the
  generic payments domain is [`@granit/payments`](../payments) /
  [`@granit/react-payments`](../react-payments).

## License

Apache-2.0
