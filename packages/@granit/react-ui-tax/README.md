# @granit/react-ui-tax

Admin UI for the **Tax** module — the query-driven tax rates list page (country
code, standard / reduced rate, with a detail card showing super-reduced / parking
rates and effective dates) and the tax ID validation page (spec-driven validation
form plus a VIES-style result card).

Composes the headless [`@granit/react-tax`](../react-tax) (provider + query /
mutation hooks) and the [`@granit/react-query-engine`](../react-query-engine)
query layer with the foundation UI packages (`@granit/react-ui`,
`@granit/react-ui-admin-kit`, `@granit/react-localization`,
`@granit/react-validation`).

## Usage

The host app supplies the data layer and the Axios client. The rates page wraps
its own `QueryProvider` (basePath `/api/v1/tax/rates`); the validate page reads
the `TaxProvider` context from the host tree. Register the i18n bundles:

```tsx
import { TaxProvider } from '@granit/react-tax';
import {
  TaxRatesPage,
  TaxValidatePage,
  taxTranslationsEn,
  taxTranslationsFr,
} from '@granit/react-ui-tax';

i18n.addResourceBundle('en', 'translation', taxTranslationsEn, true, true);
i18n.addResourceBundle('fr', 'translation', taxTranslationsFr, true, true);

<TaxProvider config={{ basePath: '/api/v1/tax' }}>
  {/* route: /tax/rates and /tax/rates/:countryCode */}
  <TaxRatesPage />
  {/* route: /tax/validate */}
  <TaxValidatePage />
</TaxProvider>;
```

`TaxRatesPage` reads `:countryCode` from the route (`useParams`) to render the
detail card and does **not** wrap a data provider beyond its own `QueryProvider`
— the host owns the `TaxProvider` the validate page and detail card resolve.

## Validation

`ValidateTaxForm` validates via `createConstraintsResolver` from
`@granit/react-validation`, fed by the generated `taxConstraints` from
`@granit/tax` (`TaxValidateRequest`: `taxId` and `countryCode` required +
length constraints). The resolver only validates registered fields, so
unconstrained fields pass through. `Validation:Builtin:*` messages are owned by
the host `Granit.Validation` bundle.

## i18n

Flat-key bundles (`Tax.*`) in the `translation` namespace. The host runs i18next
with `keySeparator: false` / `nsSeparator: false`, so `Tax.Rates.Title` is a
single literal exact-match key. The shared `Common.*` and `Operators.*` keys
consumed by the admin-kit smart-filter bar are owned by the host bundle.
