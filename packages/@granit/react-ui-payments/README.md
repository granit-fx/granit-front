# @granit/react-ui-payments

Admin UI for the **Payments** module — the transaction list and detail
(refunds/disputes), the host payment-method configuration panel, the tenant
saved-methods page, and the spec-validated charge/refund dialogs. Pairs with the
headless `@granit/react-payments` data layer (`PaymentsProvider` and its hooks).

## Usage

The host app supplies the `PaymentsProvider` (with its API client and base path);
the pages here only consume the hooks.

```tsx
import { PaymentsProvider } from '@granit/react-payments';
import { TransactionListPage } from '@granit/react-ui-payments';

<PaymentsProvider config={{ client, basePath: '/api/v1/payments' }}>
  <TransactionListPage />
</PaymentsProvider>;
```

### Pages

- `TransactionListPage` — paginated transactions with a charge action.
- `TransactionDetailPage` — single transaction with refund/dispute history and a
  refund action (reads the route `:id`).
- `PaymentMethodsPage` — host-level provider/method activation panel.
- `TenantPaymentMethodsPage` — tenant saved payment methods (attach/detach).

## i18n

Ships flat `Payments.*` keys in the `translation` namespace via
`paymentsTranslationsEn` / `paymentsTranslationsFr`. Register them in the host
i18n instance with `addResourceBundle(lng, 'translation', bundle, true, true)`.
The shared `Common.*` keys live with the host app, not here.

## Validation

The charge and refund dialogs derive their validation from the OpenAPI contract
via `createConstraintsResolver(paymentsConstraints.PaymentChargeRequest |
PaymentRefundRequest, …)` (`@granit/react-validation` + `@granit/payments`) — no
hand-written schema.
