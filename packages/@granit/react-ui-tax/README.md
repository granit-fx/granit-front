# @granit/react-ui-tax

Admin **UI feature kit** for the Granit **Tax** module — the query-driven tax
rates list page (with a per-country detail card) and the tax ID validation page.
This is the **`react-ui` layer**: it composes ready-to-route page components and
their building blocks; it renders, but holds no data layer of its own.

The split is three packages over the same .NET `Granit.Tax` backend (contract:
[`contracts/openapi/tax.json`](../../../contracts/openapi/tax.json) — routes
`/tax/rates`, `/tax/rates/{countryCode}`, `/tax/ids/validate`):

- [`@granit/tax`](../tax) — framework-agnostic core: DTOs (`TaxRateEntry`,
  `TaxValidateRequest`/`TaxValidateResponse`) + Axios calls + the generated
  `taxConstraints` (spec-driven form validation).
- [`@granit/react-tax`](../react-tax) — React Query hooks + `TaxProvider`
  (`useTaxRates`, `useTaxRateByCountry`, `useValidateTaxId`, …). Headless.
- `@granit/react-ui-tax` (this package) — the admin pages, columns, detail card,
  validation form, result card, and the `Tax.*` i18n bundles.

The Axios client resolves from a `GranitClientProvider` in the host tree via the
host-supplied `TaxProvider` / `QueryProvider`; this package does **not** wrap a
data provider.

## Install

Workspace-internal — consumed via the `@granit/*` Vite/Vitest aliases, not
published for app consumption through a public registry. A consumer must declare
these peers:

- `@granit/react-tax` — `TaxProvider` + the query/mutation hooks the pages call.
- `@granit/tax` — core DTOs + the generated `taxConstraints`.
- `@granit/query-engine` / `@granit/react-query-engine` — the query layer behind
  the rates list (`QueryProvider`, `useQueryEndpoint`, smart filter).
- `@granit/react-ui` — foundation primitives (`Card`, `Form`, `Button`,
  `Spinner`, `Badge`, …).
- `@granit/react-ui-admin-kit` — the smart-filter bar, data table, sort selector.
- `@granit/react-localization` — `useTranslation` / `useDateFormatter`.
- `@granit/react-validation` — `createConstraintsResolver` for the validate form.
- `@granit/utils` — `cn`.
- `@tanstack/react-table` (`^8.21`), `react-hook-form` (`^7.80`),
  `react-router` (`^7.18`), `lucide-react` (`^1.21`).
- `react` / `react-dom` (`^19`).

## Quick start

The host owns the data layer: mount `TaxProvider` (it resolves the Axios client,
base path, and query keys) and register the i18n bundles, then route to the two
pages. `TaxRatesPage` wraps its own `QueryProvider` (basePath `/api/v1/tax/rates`)
for the list; the detail card and validate page resolve the host `TaxProvider`.

```tsx
import { TaxProvider } from '@granit/react-tax';
import {
  TaxRatesPage,
  TaxValidatePage,
  taxTranslationsEn,
  taxTranslationsFr,
} from '@granit/react-ui-tax';
import { Route, Routes } from 'react-router';

i18n.addResourceBundle('en', 'translation', taxTranslationsEn, true, true);
i18n.addResourceBundle('fr', 'translation', taxTranslationsFr, true, true);

function TaxRoutes() {
  return (
    <TaxProvider config={{ basePath: '/api/v1/tax' }}>
      <Routes>
        {/* The same page renders the list and, with :countryCode, the detail card. */}
        <Route path="/tax/rates" element={<TaxRatesPage />} />
        <Route path="/tax/rates/:countryCode" element={<TaxRatesPage />} />
        <Route path="/tax/validate" element={<TaxValidatePage />} />
      </Routes>
    </TaxProvider>
  );
}
```

`TaxRatesPage` reads `:countryCode` from the route (`useParams`) and, when
present, renders `TaxRateDetailCard` above the filtered table; the row-action
button navigates to `/tax/rates/{code}`. `TaxValidatePage` drives
`useValidateTaxId()` and shows a `ValidationResultCard` (VIES-style:
valid/invalid badge, company name/address, source, validation timestamp) on
success.

To embed a building block directly — e.g. a standalone validation form inside
another screen — use the exported pieces:

```tsx
import { ValidateTaxForm, type TaxValidateFormValues } from '@granit/react-ui-tax';
import { useValidateTaxId } from '@granit/react-tax';

function InlineTaxCheck() {
  const validate = useValidateTaxId();
  const onSubmit = (data: TaxValidateFormValues) =>
    validate.mutate({ taxId: data.taxId, countryCode: data.countryCode });

  return <ValidateTaxForm onSubmit={onSubmit} isPending={validate.isPending} />;
}
```

## Validation

`ValidateTaxForm` is **spec-driven**: it builds its resolver with
`createConstraintsResolver` from `@granit/react-validation`, fed by the generated
`taxConstraints.TaxValidateRequest` from `@granit/tax` (`taxId` and `countryCode`
required, plus length constraints derived from `contracts/openapi/tax.json`). The
resolver only validates registered fields, so unconstrained fields pass through.
`Validation:Builtin:*` messages are owned by the host `Granit.Validation` bundle;
field labels resolve via the `Tax.Fields.*` keys (falling back to the raw field
name).

## i18n

Flat-key bundles (`Tax.*`) shipped in the `translation` namespace. The host runs
i18next with `keySeparator: false` / `nsSeparator: false`, so `Tax.Rates.Title`
is a single literal exact-match key. The shared `Common.*` and `Operators.*` keys
consumed by the admin-kit smart-filter bar are owned by the host bundle, not this
package.

## Public API

| Symbol                  | Kind      | Purpose                                                                                      |
| ----------------------- | --------- | -------------------------------------------------------------------------------------------- |
| `TaxRatesPage`          | component | Routed rates list (own `QueryProvider`) + smart filter; `:countryCode` shows the detail card |
| `TaxValidatePage`       | component | Routed tax ID validation page — form + result card via `useValidateTaxId`                    |
| `createTaxRateColumns`  | fn        | TanStack `ColumnDef<TaxRateEntry>[]` factory (`t`, `onViewDetail`)                           |
| `TaxRateDetailCard`     | component | Per-country card: standard/reduced/super-reduced/parking rates + effective dates             |
| `ValidateTaxForm`       | component | Spec-driven validation form (`onSubmit`, `isPending`)                                        |
| `ValidationResultCard`  | component | Renders a `TaxValidateResponse` (badge, company info, source, timestamp)                     |
| `TaxValidateFormValues` | type      | `{ taxId, countryCode }` — the form's value shape                                            |
| `taxTranslationsEn`     | const     | English `Tax.*` i18next resource bundle (flat keys)                                          |
| `taxTranslationsFr`     | const     | French `Tax.*` i18next resource bundle (flat keys)                                           |
| `TaxTranslations`       | type      | Key shape of the resource bundle (`typeof taxTranslationsEn`)                                |

## Out of scope / caveats

- **No data provider.** This package renders only. `TaxProvider` (client, base
  path, query keys) and the Axios client (`GranitClientProvider`) must already be
  mounted in the host tree; `TaxRatesPage` adds a list-scoped `QueryProvider` but
  nothing more.
- **Routing is the host's job.** The pages read `react-router` route params
  and navigate (`/tax/rates/{code}`); mount them under the route paths shown
  above. They do not declare their own routes.
- **DTOs, HTTP, and validation constraints** are owned by
  [`@granit/tax`](../tax) (mirror of `Granit.Tax`); the query/mutation hooks live
  in [`@granit/react-tax`](../react-tax). This package only composes them.
- **i18n bundles are partial.** Only `Tax.*` keys ship here; the host must supply
  the `Common.*` / `Operators.*` keys the admin-kit smart-filter bar reads.

## License

Apache-2.0
