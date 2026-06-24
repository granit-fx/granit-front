# @granit/tax

Tax ID validation and rate lookup SDK — the framework-level TypeScript
counterpart of the .NET `Granit.Tax` module (contract:
`contracts/openapi/tax.json`).

This is the framework-agnostic **core** layer: it exposes the DTOs, the Axios
HTTP functions, the permission strings and the OpenAPI-derived validation
constraints needed to drive tax-ID verification and VAT-rate lookup from any
client — React, React Native, a CLI, tests. It holds **no** React, DOM or
Node-only dependency. The React hooks/provider layer lives in
[`@granit/react-tax`](../react-tax); the admin feature kit (query-driven rates
list, detail card, validation page) lives in
[`@granit/react-ui-tax`](../react-ui-tax).

Two surfaces sit over the same backend: **validation** submits a tax
identification number (EU VAT, UK VAT, US EIN, …) for online verification and
returns the resolving company identity, and **rates** is a Query-Engine
collection of VAT rates per country with a single-country detail lookup.

## Install

Workspace-internal — consumed via the `@granit/*` Vite/Vitest aliases, not
published to a public registry for app consumption. Declare these peers:

- `@granit/api-client` — supplies the `AxiosInstance` (CSRF, auth, tenant
  interceptors) passed into every call.
- `@granit/query-engine` — `PagedResult` / `QueryRequest` / `QueryMetadata` plus
  the `getPage` / `getQueryMeta` runtime backing the rates discovery surface.
- `@granit/types` — the branded `ISODateString` used on timestamp fields.
- `@granit/validation` — `SchemaConstraints`, the shape of the generated
  `taxConstraints`.

## Quick start

`basePath` is the tax module's collection root (`/api/v1/tax`); it is the only
configuration the calls need.

```ts
import {
  validateTaxId,
  queryTaxRates,
  getTaxRatesMeta,
  getTaxRateByCountry,
  TaxPermissions,
  taxConstraints,
} from '@granit/tax';

const basePath = '/api/v1/tax';

// 1. Validate a VAT number online (POST {basePath}/ids/validate). `source`
//    names the resolving provider (e.g. VIES for the EU); when `isValid` is
//    false the company identity fields come back null.
const check = await validateTaxId(client, basePath, {
  taxId: 'BE0123456789',
  countryCode: 'BE',
});
if (check.isValid) {
  // check.companyName / check.companyAddress / check.validatedAt
}

// 2. Query VAT rates with filtering / sorting / pagination (GET {basePath}/rates).
const page = await queryTaxRates(client, basePath, { pageSize: 50 });
const meta = await getTaxRatesMeta(client, basePath); // columns/filters/sorts

// 3. Single-country detail (GET {basePath}/rates/{countryCode}).
const be = await getTaxRateByCountry(client, basePath, 'BE');
be.standardRate; // e.g. 21

// Permission strings for UX gating (enforcement is server-side, see caveats).
TaxPermissions.Validations.Execute; // 'Tax.Validations.Execute'

// `taxConstraints.TaxValidateRequest` feeds createConstraintsResolver in the
// React layer to build the form validator from the OpenAPI contract.
taxConstraints.TaxValidateRequest.countryCode.maxLength; // 2
```

## Public API

| Symbol                | Kind  | Purpose                                                         |
| --------------------- | ----- | --------------------------------------------------------------- |
| `TaxValidateRequest`  | type  | `POST .../ids/validate` body (`taxId`, `countryCode`)           |
| `TaxValidateResponse` | type  | Validation result + resolved company identity (`source`)        |
| `TaxRateEntry`        | type  | One VAT-rate row in the `GET .../rates` query surface           |
| `TaxRateResponse`     | type  | Full per-country VAT rate detail (standard/reduced/parking)     |
| `validateTaxId`       | fn    | `POST {basePath}/ids/validate` — online tax-ID verification     |
| `queryTaxRates`       | fn    | `GET {basePath}/rates` — paginated/filterable rates surface     |
| `getTaxRatesMeta`     | fn    | `GET {basePath}/rates/meta` — query metadata for the rates grid |
| `getTaxRateByCountry` | fn    | `GET {basePath}/rates/{countryCode}` — single-country detail    |
| `TaxPermissions`      | const | Permission strings (`Tax.Rates.*`, `Tax.Validations.*`)         |
| `taxConstraints`      | const | OpenAPI-derived field constraints (generated, do not edit)      |

## Caveats

- **`taxConstraints` is generated, not hand-written.** It is produced by
  `scripts/generate-front-constraints.mjs` from `contracts/openapi/tax.json`
  (the single source of truth) and regenerated on pre-commit. Never edit
  `src/constraints.ts` by hand; change the contract and regenerate.
- **Validation provider is server-configured.** Online verification routes to a
  provider per jurisdiction (VIES for the EU, Stripe elsewhere) and results are
  cached server-side per the configured TTL; `TaxValidateResponse.source` names
  the provider that answered. A non-`isValid` response still returns `200` —
  `companyName` / `companyAddress` / `requestIdentifier` / `validatedAt` are
  nullable and arrive as `null` when identity could not be resolved.
- **Optionality follows the contract, not nullability.** `TaxRateEntry` carries
  the optional rate fields as `?: number | null` (the query row may omit them),
  whereas `TaxRateResponse` always returns the keys with explicit `null` for
  rate brackets a country does not levy.
- **Permission strings are UX hints, not enforcement.** `TaxPermissions` mirrors
  the backend `Granit.Tax` permissions for hiding controls; the .NET endpoints
  re-check authorization on every call. Never treat a client-side check as a
  security boundary.

## Out of scope

- **React bindings** — `TaxProvider` and the Query hooks live in
  [`@granit/react-tax`](../react-tax); this package is headless.
- **Rendering** — the rates list page, detail card and validation page live in
  [`@granit/react-ui-tax`](../react-ui-tax).
- **Tax calculation / invoicing** — this package validates IDs and looks up
  rates; it does not compute line-item tax or post to ledgers.

## License

Apache-2.0
