# @granit/react-ui-subscriptions

Admin **UI feature kit** for the Granit **Subscriptions** module — the plans
catalogue (a query-driven list across every lifecycle status, plus a detail view
with price history and publish / archive / edit / create-price-version dialogs),
the subscriptions list / detail (create, change-plan, cancel, migrate-price,
bulk-migrate) and per-subscription seat assignment. This is the **rendering**
layer: it composes the headless [`@granit/react-subscriptions`](../react-subscriptions)
(provider + hooks) with the foundation UI packages
([`@granit/react-ui`](../react-ui), [`@granit/react-ui-kit`](../react-ui-admin-kit))
and the QueryEngine ([`@granit/react-query-engine`](../react-query-engine)) for
the discovery grids. It owns no DTOs, HTTP calls, or query keys — those live one
and two layers down.

The split is three packages over the same .NET `Granit.Subscriptions` backend
(contract: `contracts/openapi/subscriptions.json`):

- [`@granit/subscriptions`](../subscriptions) — framework-agnostic core: DTOs +
  Axios functions (`listSubscriptions`, `createPlan`, `assignSeat`, …) and
  `SubscriptionsPermissions`.
- [`@granit/react-subscriptions`](../react-subscriptions) — React Query hooks +
  `SubscriptionsProvider`; headless.
- `@granit/react-ui-subscriptions` (this package) — admin UI kit: the four
  pages, their dialogs and columns, and the i18n bundles.

## Install

Workspace-internal — consumed via the `@granit/*` Vite/Vitest aliases, not
published for app consumption through a public registry. A consumer must declare
these peers:

- `@granit/react-subscriptions` — headless provider + hooks this kit renders.
- `@granit/subscriptions` — core DTOs (`PlanResponse`, `SubscriptionResponse`,
  `SeatResponse`, …) used in column, dialog, and page types.
- `@granit/react-ui` — foundation primitives (`Card`, `Dialog`, `Table`,
  `Badge`, `Button`, `Skeleton`, `Spinner`, `toast`, …).
- `@granit/react-ui-kit` — `QueryEndpointDataTable`, `QueryControlBar`,
  `SmartFilterBar`, and the sort / group-by selectors for the discovery grids.
- `@granit/react-query-engine` — `QueryProvider` / `useQueryEndpoint` /
  `useQueryMeta`, the QueryEngine surface backing the plans and subscriptions
  lists.
- `@granit/query-engine` — `QueryConfig` and the paged query surface types.
- `@granit/react-localization` — `useTranslation` / `useDateFormatter`.
- `@granit/logger` — `createLogger` for the local logger.
- `@granit/types` — `toEntityId` and the branded id types.
- `@tanstack/react-table` (`^8.21`), `lucide-react` (`^1.21`).
- `react-router-dom` (`^7.18`) — pages use `Link` / `useParams` / `useNavigate`.
- `react` and `react-dom` (`^19`).

## Quick start

Register the i18n bundle once, mount the headless `SubscriptionsProvider` (from
[`@granit/react-subscriptions`](../react-subscriptions)) above the host tree, then
route to the pages under a router. The Axios client is resolved from a
`GranitClientProvider` / `SubscriptionsProvider` — no client is baked in.

```tsx
import { SubscriptionsProvider } from '@granit/react-subscriptions';
import {
  PlanListPage,
  PlanDetailPage,
  SubscriptionListPage,
  SubscriptionDetailPage,
  subscriptionsTranslationsEn,
} from '@granit/react-ui-subscriptions';

// Flat keys under the default "translation" namespace; the host owns Common.* keys.
i18n.addResourceBundle('en', 'translation', subscriptionsTranslationsEn, true, true);

function SubscriptionsAdmin() {
  return (
    <SubscriptionsProvider config={{ client: useGranitClient() }}>
      <Routes>
        <Route path="/subscriptions/plans" element={<PlanListPage />} />
        <Route path="/subscriptions/plans/:id" element={<PlanDetailPage />} />
        <Route path="/subscriptions" element={<SubscriptionListPage />} />
        <Route path="/subscriptions/:id" element={<SubscriptionDetailPage />} />
      </Routes>
    </SubscriptionsProvider>
  );
}
```

The list pages wrap their own `QueryProvider` (QueryEngine base paths
`/api/v1/subscriptions/plans` and `.../subscriptions`); the detail pages read the
record by route `:id` through `usePlan` / `useSubscription` and drive every
mutation (publish, archive, edit, create-price-version, change-plan, cancel,
migrate-price, bulk-migrate, assign / revoke seat) from the headless hooks via
in-page dialogs.

## Public API

| Symbol                        | Kind      | Purpose                                                           |
| ----------------------------- | --------- | ----------------------------------------------------------------- |
| `PlanListPage`                | component | QueryEngine grid of plans (all statuses) + create-plan dialog     |
| `PlanDetailPage`              | component | Plan by `:id`: details, price history, publish/archive/edit/price |
| `SubscriptionListPage`        | component | QueryEngine grid of subscriptions + create-subscription dialog    |
| `SubscriptionDetailPage`      | component | Subscription by `:id`: details, seats, change-plan/cancel/migrate |
| `subscriptionsTranslationsEn` | const     | English i18next bundle (flat keys, `translation` ns)              |
| `subscriptionsTranslationsFr` | const     | French i18next bundle (same key set)                              |

The dialogs (publish / archive / edit / create-price-version, create / change-plan
/ cancel / migrate-price / bulk-migrate, assign / revoke seat), the table column
factories, the status badges, and the price-history table are internal to the
pages — they are not part of the barrel. Compose at the page granularity.

## Injection points

- **API client** — resolved from a `GranitClientProvider` /
  `SubscriptionsProvider` higher in the tree (via the
  [`@granit/react-subscriptions`](../react-subscriptions) hooks). No client is
  baked in.
- **Routing** — the pages use `react-router-dom` (`Link` / `useParams` /
  `useNavigate`) and link between the list and detail routes shown above; mount
  them under a router.
- **i18n** — ships its `Subscriptions.*` strings (`subscriptionsTranslationsEn` /
  `subscriptionsTranslationsFr`); the host registers the bundle. `Common.*` keys
  (`SearchPlaceholder`, `Yes`, `No`, `Actions`) are app-global and expected to
  already exist.
- **QueryEngine** — the list pages assume a `MapGranitQuery` surface at the plan
  and subscription base paths (`/meta`, `POST /query`); the host wires it backend
  side.

## Out of scope

- **Hooks, DTOs, HTTP transport** — owned by
  [`@granit/react-subscriptions`](../react-subscriptions) (hooks + provider) and
  [`@granit/subscriptions`](../subscriptions) (DTOs + Axios). This package only
  renders them.
- **Enforcement** — the authoritative permission check is `Granit.Subscriptions`
  on the backend (`SubscriptionsPermissions.Plans.Read`, …). The pages gate
  controls for UX only; client-side checks are a hint, never a security boundary.
- **Billing / invoicing** — collecting payment, dunning, and proration are out of
  this kit; it drives the subscription lifecycle (plan, seats, price migration)
  only.

## License

Apache-2.0
