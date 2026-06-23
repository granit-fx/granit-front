# @granit/react-ui-subscriptions

Admin UI for the **Subscriptions** module — the plans catalogue (a
query-driven list across every lifecycle status, plus a detail view with price
history, publish / archive / edit and price-version dialogs), the subscriptions
list / detail (create, change-plan, cancel, migrate-price, bulk-migrate) and
per-subscription seat assignment.

The **visual** layer for subscriptions: it composes the headless
[`@granit/react-subscriptions`](../react-subscriptions) (provider + hooks) with
the foundation UI packages ([`@granit/react-ui`](../react-ui),
[`@granit/react-ui-admin-kit`](../react-ui-admin-kit)) and the QueryEngine
([`@granit/react-query-engine`](../react-query-engine)).

## Usage

```tsx
import {
  PlanListPage,
  SubscriptionListPage,
  subscriptionsTranslationsEn,
} from '@granit/react-ui-subscriptions';

i18n.addResourceBundle('en', 'translation', subscriptionsTranslationsEn, true, true);

// Mount under a SubscriptionsProvider (from @granit/react-subscriptions):
<Route path="/subscriptions/plans" element={<PlanListPage />} />;
<Route path="/subscriptions/plans/:id" element={<PlanDetailPage />} />;
<Route path="/subscriptions" element={<SubscriptionListPage />} />;
<Route path="/subscriptions/:id" element={<SubscriptionDetailPage />} />;
```

## Injection

- **API client** — resolved from a `GranitClientProvider` / `SubscriptionsProvider`
  higher in the tree (via the `@granit/react-subscriptions` hooks). No client baked in.
- **Routing** — the pages use `react-router-dom` (`Link` / `useParams` /
  `useNavigate`); mount them under a router.
- **i18n** — ships its `Subscriptions.*` strings
  (`subscriptionsTranslationsEn/Fr`); the host registers them.
