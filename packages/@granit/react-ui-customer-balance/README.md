# @granit/react-ui-customer-balance

Admin UI for the **Granit.CustomerBalance** module — the balance page (currency
selector, summary card, paginated transaction table) and the admin **credit** /
**debit** dialogs.

The **visual** layer for customer balance: it composes the headless
[`@granit/react-customer-balance`](../react-customer-balance) (provider + hooks)
with the foundation UI packages ([`@granit/react-ui`](../react-ui),
[`@granit/react-ui-admin-kit`](../react-ui-admin-kit) `FormDialog`).

## Usage

```tsx
import {
  CustomerBalancePage,
  customerBalanceTranslationsEn,
} from '@granit/react-ui-customer-balance';

i18n.addResourceBundle('en', 'translation', customerBalanceTranslationsEn, true, true);

// Mount under a CustomerBalanceProvider (from @granit/react-customer-balance):
<Route path="/customer-balance" element={<CustomerBalancePage />} />;
```

## Injection

- **API client** — resolved from a `GranitClientProvider` /
  `CustomerBalanceProvider` higher in the tree (via the
  `@granit/react-customer-balance` hooks). No client is baked in.
- **i18n** — ships its `CustomerBalance.*` strings
  (`customerBalanceTranslationsEn/Fr`); the host registers them. `Common.*` keys
  are app-global. `formatCurrency(amount, currency, locale)` is exported for reuse.
