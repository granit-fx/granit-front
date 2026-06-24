# @granit/payments

Payment-processing SDK — charges, refunds, hosted checkout, saved payment methods
and host-level provider configuration. The framework-level TypeScript counterpart of
the .NET `Granit.Payments` module, mirrored from `contracts/openapi/payments.json`
(routes rooted at `/payments`).

This is the framework-agnostic **core** layer: it exposes the wire types, the HTTP
client functions and the spec-derived validation constraints needed to drive payments
from any client — React, React Native, a CLI, tests. It holds **no** React, DOM or
Node-only dependency; every call takes an `AxiosInstance` and a `basePath`. The React
hooks/providers layer lives in [`@granit/react-payments`](../react-payments) and the
admin feature kit in [`@granit/react-ui-payments`](../react-ui-payments). SEPA-specific
flows (transfer beneficiaries, direct-debit mandates) live in the dedicated siblings
[`@granit/payments-sepa-transfer`](../payments-sepa-transfer) and
[`@granit/payments-sepa-direct-debit`](../payments-sepa-direct-debit).

The module spans three concerns: the **tenant** flow (initiate a charge, request a
refund, open a checkout session, list its own transactions and saved methods), the
**catalog** flow (which methods are available for a given country/currency/amount), and
the **host configuration** flow (activate/deactivate and resync the provider-advertised
methods the platform offers).

## Install

Workspace-internal — consumed via the `@granit/*` Vite/Vitest aliases, not published to
a public registry for app consumption. Declare the peers:

- `@granit/api-client` — supplies the `AxiosInstance` (CSRF, auth, tenant interceptors)
  passed into every call.
- `@granit/query-engine` — `PagedResult<T>` envelope for the transaction list reads.
- `@granit/types` — branded `ISODateString` used on timestamp fields.
- `@granit/validation` — `SchemaConstraints` shape backing `paymentsConstraints`.

## Quick start

```ts
import {
  initiatePaymentCharge,
  createCheckoutSession,
  getAvailablePaymentMethods,
  requestPaymentRefund,
  listPaymentTransactions,
  PaymentsPermissions,
} from '@granit/payments';

// `basePath` is the module root; routes are appended (e.g. `${basePath}/charge`).
const basePath = '/payments';

// 1. Surface the methods available for this checkout context. Each axis is
//    independently optional; omitted axes are treated as wildcard by the backend.
const methods = await getAvailablePaymentMethods(client, basePath, {
  country: 'BE',
  currency: 'EUR',
  amount: 4500, // minor units
});

// 2a. Direct charge against an invoice — 202 Accepted, no body (async dispatch).
await initiatePaymentCharge(client, basePath, {
  invoiceId,
  amount: 4500,
  currency: 'EUR',
  methodType: methods[0]!.methodType,
  providerName: null, // let the backend route to the default provider
});

// 2b. …or hand off to a hosted checkout and redirect.
const session = await createCheckoutSession(client, basePath, {
  transactionId,
  amount: 4500,
  currency: 'EUR',
  methodType: 'card',
  successUrl: 'https://app.example/checkout/ok',
  cancelUrl: 'https://app.example/checkout/cancel',
  providerName: null,
});
window.location.assign(session.url);

// 3. Refund (also 202 Accepted, fire-and-forget).
await requestPaymentRefund(client, basePath, {
  transactionId,
  amount: 4500,
  reason: 'Customer cancellation',
});

// 4. The tenant's own transactions (paged envelope).
const page = await listPaymentTransactions(client, basePath);
page.items.forEach((tx) => console.log(tx.status));

// Permission keys for client-side UX gating (enforcement is server-side).
PaymentsPermissions.Charges.Execute; // 'Payments.Charges.Execute'
```

## Public API

| Symbol | Kind | Purpose |
| --- | --- | --- |
| `PaymentStatus` | type | `Created \| RequiresAction \| Processing \| Succeeded \| Failed \| Canceled` |
| `RefundStatus` | type | `Pending \| Succeeded \| Failed` |
| `DisputeStatus` | type | `Open \| Won \| Lost \| Closed` |
| `PaymentMethodCategory` | type | Card / BankRedirect / Wallet / BNPL … grouping for a method |
| `PaymentMethodSequenceTypeName` | type | `oneoff \| first \| recurring` transaction sequence |
| `PaymentChargeRequest` | type | `POST {basePath}/charge` body |
| `PaymentRefundRequest` | type | `POST {basePath}/refund` body |
| `PaymentCheckoutRequest` | type | `POST {basePath}/checkout` body |
| `PaymentAttachMethodRequest` | type | `POST {basePath}/methods` body (provider token) |
| `PaymentAvailabilityContext` | type | Optional country/currency/amount/sequence filter for availability |
| `PaymentTransactionResponse` | type | A transaction with nested `refunds` and `disputes` |
| `PaymentRefundResponse` | type | A refund line on a transaction |
| `PaymentDisputeResponse` | type | A dispute line on a transaction |
| `PaymentCheckoutSessionResponse` | type | Hosted-checkout `{ url, sessionId, expiresAt }` |
| `PaymentMethodResponse` | type | A saved/attached payment method |
| `PaymentAvailableMethodResponse` | type | An available method + its `capability` (nullable on legacy records) |
| `PaymentMethodCapabilityResponse` | type | Provider capability — country/currency/sequence/amount bounds |
| `PaymentMethodAmountBoundResponse` | type | Per-currency `{ min, max }` bounds (each side nullable) |
| `PaymentMethodConfigurationItemResponse` | type | One provider-declared method + activation state (host config) |
| `PaymentProviderConfigurationResponse` | type | All methods of one provider, with activation state |
| `PaymentCatalogMethod` | type | A live-catalog method (capability always present + `hasSnapshot`) |
| `PaymentProviderCatalogResponse` | type | Live provider catalog for one provider |
| `PaymentsPermissions` | const | Permission-key catalog (`Payments.*`) for UX gating |
| `paymentsConstraints` | const | Spec-derived validation constraints (per request DTO) |
| `listPaymentTransactions` | fn | `GET {basePath}/transactions/mine` (paged, tenant-scoped) |
| `getPaymentTransaction` | fn | `GET {basePath}/transactions/{id}` |
| `initiatePaymentCharge` | fn | `POST {basePath}/charge` → 202, no body |
| `requestPaymentRefund` | fn | `POST {basePath}/refund` → 202, no body |
| `createCheckoutSession` | fn | `POST {basePath}/checkout` → redirect URL |
| `listPaymentMethods` | fn | `GET {basePath}/methods/mine` (tenant-scoped) |
| `getAvailablePaymentMethods` | fn | `GET {basePath}/methods/available` (context-filtered) |
| `attachPaymentMethod` | fn | `POST {basePath}/methods` |
| `detachPaymentMethod` | fn | `DELETE {basePath}/methods/{id}` |
| `listPaymentMethodConfigurations` | fn | `GET {basePath}/configuration` (host admin) |
| `activatePaymentMethod` | fn | `POST {basePath}/configuration/{provider}/{method}/activate` |
| `deactivatePaymentMethod` | fn | `POST {basePath}/configuration/{provider}/{method}/deactivate` |
| `getPaymentProviderCatalog` | fn | `GET {basePath}/configuration/catalog?providerName=` |
| `resyncPaymentMethodConfiguration` | fn | `POST {basePath}/configuration/{provider}/{method}/resync` |

## Out of scope / caveats

- **Async commands.** `initiatePaymentCharge` and `requestPaymentRefund` return `202
  Accepted` with no body — the charge/refund is dispatched, not completed. Poll the
  transaction (`getPaymentTransaction`) or react to a status webhook for the terminal
  outcome; do not treat a resolved promise as success.
- **`mine` vs. admin grids.** `listPaymentTransactions` / `listPaymentMethods` hit the
  tenant-scoped `…/mine` routes. Cross-tenant admin grids with filtering use the
  QueryEngine endpoints on `${basePath}/transactions` and `${basePath}/methods` — wired
  via [`@granit/react-payments`](../react-payments), not these calls.
- **Nullable capability.** `capability` / `capabilitySnapshot` are `null` on legacy
  records activated before capability snapshotting landed; runtime filtering treats
  `null` as wildcard. An **empty** set on a capability axis also means wildcard
  ("Global" / "All currencies"), not "none" — render accordingly.
- **Backend owns availability defaults.** When `amount` is provided the backend defaults
  `sequenceType` to `"oneoff"`; the SDK intentionally does not re-apply that default
  client-side, and only sends the axes you define on `PaymentAvailabilityContext`.
- **No client-side card data.** `attachPaymentMethod` carries a provider `token`, never
  raw PAN/CVV — tokenization happens in the provider SDK (PCI-DSS scope reduction). Do
  not route cardholder data through these functions.
- **Permissions are a UX hint.** `PaymentsPermissions` keys gate controls client-side;
  every charge/refund/configuration call is authoritatively re-checked by
  `Granit.Payments` on the .NET backend. Never treat a granted key as an authorization
  guarantee.
- **No React/SEPA here.** Hooks, providers, query-key factories and MSW fixtures live in
  [`@granit/react-payments`](../react-payments); admin screens in
  [`@granit/react-ui-payments`](../react-ui-payments); SEPA mandate/beneficiary flows in
  the SEPA siblings.

## License

Apache-2.0
