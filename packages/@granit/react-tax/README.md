# @granit/react-tax

React hooks + provider for the Granit **tax** module — tax-rate lookup (by
country or as a Query Engine grid) and tax-ID / VAT-number validation. This is
the **React hooks layer**: it wraps the framework-agnostic Axios calls and DTOs
from [`@granit/tax`](../tax) in TanStack Query hooks behind a shared `TaxProvider`
that resolves the Axios client, base path, and query-key prefix. It holds no
rendering — pages, grids, cards, and forms live one layer up.

The split is three packages over the same .NET `Granit.Tax` backend (contract:
`contracts/openapi/tax.json`):

- [`@granit/tax`](../tax) — framework-agnostic core: DTOs + Axios functions
  (`getTaxRateByCountry`, `queryTaxRates`, `getTaxRatesMeta`, `validateTaxId`),
  `TaxPermissions`, and the generated `taxConstraints`.
- `@granit/react-tax` (this package) — React Query hooks + provider.
- [`@granit/react-ui-tax`](../react-ui-tax) — admin UI kit: the tax-rates grid
  page, the tax-ID validation page, and their columns/cards/form components.

## Install

Workspace-internal — consumed via the `@granit/*` Vite/Vitest aliases, not
published for app consumption through a public registry. A consumer must declare
these peers:

- `@granit/tax` — core DTOs + Axios calls this layer wraps.
- `@granit/api-client` — supplies the `AxiosInstance` (CSRF, auth, tenant
  interceptors).
- `@granit/react-api-client` — `useOptionalGranitClient`, the context fallback for
  the Axios client when `config.client` is omitted.
- `@granit/query-engine` (**optional**) — `PagedResult` / `QueryRequest` /
  `QueryMetadata` for the rate-grid surface.
- `@granit/types` — shared base types (`ISODateString`).
- `@tanstack/react-query` (`^5`) and `react` (`^19`).
- `msw` (`^2.12`, **optional**) — only for the `@granit/react-tax/testing`
  subpath.

## Quick start

Wire the provider once (it resolves the Axios client, base path, and an optional
query-key prefix), then call the hooks anywhere below it.

```tsx
import { TaxProvider, useTaxRateByCountry, useValidateTaxId } from '@granit/react-tax';
import { useGranitClient } from '@granit/react-api-client';

function App({ children }: { children: React.ReactNode }) {
  // `client` may be omitted if a <GranitClientProvider> is already mounted.
  return <TaxProvider config={{ client: useGranitClient() }}>{children}</TaxProvider>;
}

function CountryRate({ country }: { country: string }) {
  // Query is disabled while `country` is empty — no request fires.
  const { data, isLoading } = useTaxRateByCountry(country);
  if (isLoading || !data) return null;
  return <span>{data.standardRate}%</span>;
}

function VatCheck() {
  const validate = useValidateTaxId();
  return (
    <button
      type="button"
      onClick={() => validate.mutate({ taxId: 'BE0123456789', countryCode: 'BE' })}
    >
      {validate.data?.isValid ? 'Valid' : 'Check VAT'}
    </button>
  );
}
```

The grid surface pairs the list and metadata hooks; `useTaxRates` accepts a
Query Engine `QueryRequest` (filter / sort / paginate) and `useTaxRatesMeta`
returns the column/filter/preset metadata, cached indefinitely:

```tsx
import { useTaxRates, useTaxRatesMeta } from '@granit/react-tax';

function TaxRatesGrid() {
  const { data: meta } = useTaxRatesMeta();
  const { data, isLoading } = useTaxRates({ page: 1, pageSize: 25 });
  const rows = data?.items ?? [];
  // feed `meta` + `rows` into a @granit/react-query-engine grid…
}
```

## Public API

| Symbol                | Kind     | Purpose                                                            |
| --------------------- | -------- | ------------------------------------------------------------------ |
| `TaxProvider`         | provider | Resolves client / base path / query-key prefix for all hooks below |
| `useTaxConfig`        | hook     | Read the resolved config; throws outside a `TaxProvider`           |
| `buildTaxQueryKey`    | fn       | Query-key factory honoring the configured `queryKeyPrefix`         |
| `useTaxRateByCountry` | hook     | `GET .../rates/{countryCode}` — single rate (disabled when empty)  |
| `useTaxRates`         | hook     | `GET .../rates` — Query Engine `PagedResult<TaxRateEntry>`         |
| `useTaxRatesMeta`     | hook     | `GET .../rates/meta` — grid `QueryMetadata` (cached indefinitely)  |
| `useValidateTaxId`    | hook     | `POST .../ids/validate` mutation → `TaxValidateResponse`           |
| `TaxConfig`           | type     | Provider input (optional client / basePath / queryKeyPrefix)       |
| `TaxProviderProps`    | type     | `{ config, children }`                                             |

The DTO types (`TaxRateEntry`, `TaxRateResponse`, `TaxValidateRequest`,
`TaxValidateResponse`) and the underlying Axios functions are owned by
[`@granit/tax`](../tax); import them from there when you need the shapes directly.

`./testing` subpath (requires the optional `msw` peer): `createTaxHandlers`
(MSW handlers for the rate and validation endpoints, default base
`/api/v1/tax`) plus the `sampleTaxRates` and `sampleValidation` fixtures.

## Caveats

- **Headless.** No rendering lives here. Grid pages, the validation form, rate
  cards, and i18n bundles are in [`@granit/react-ui-tax`](../react-ui-tax); this
  package only adapts the core calls to React Query.
- **Provider is mandatory.** Every hook calls `useTaxConfig()` and throws outside
  a `TaxProvider`. The provider in turn throws if no Axios client can be resolved
  from `config.client` or an ancestor `<GranitClientProvider>`.
- **Cache freshness.** `useTaxRates` / `useTaxRateByCountry` use a 5-minute
  `staleTime`; `useTaxRatesMeta` is `staleTime: Infinity` (metadata is stable
  until reload). Override at the `QueryClient` level if your tenant rotates rates
  more aggressively.
- **VAT validation is a live call.** `useValidateTaxId` is a mutation hitting an
  external source (e.g. VIES via the backend); it is not cached. Treat
  `TaxValidateResponse.isValid` as the authority and surface `companyName` /
  `companyAddress` only when present (all are nullable).

## License

Apache-2.0
