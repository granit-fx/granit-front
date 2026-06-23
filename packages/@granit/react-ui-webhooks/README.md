# @granit/react-ui-webhooks

Admin **UI feature kit** for the Granit **Webhooks** module — the subscriptions
list, the create flow (with the one-time signing-secret reveal) and the
per-subscription detail view (lifecycle actions, delivery history, signing-key
rotation, test ping and a live stats dashboard).

This is the **visual** layer: it composes the headless
[`@granit/react-webhooks`](../react-webhooks) (provider + TanStack Query hooks)
and the core DTOs/enums from [`@granit/webhooks`](../webhooks) with the foundation
UI packages ([`@granit/react-ui`](../react-ui),
[`@granit/react-ui-admin-kit`](../react-ui-admin-kit)). It renders three routable
pages plus the badges, tables and dialogs they assemble. It owns no HTTP transport
of its own — every call goes through the `@granit/react-webhooks` hooks.

The split is three packages over the same .NET `Granit.Webhooks` backend
(contract: `contracts/openapi/webhooks.json`):

- [`@granit/webhooks`](../webhooks) — framework-agnostic core: DTOs, the
  `WebhookSubscriptionStatus` / `WebhookSigningKeyStatus` enums, Axios functions
  and `WebhooksPermissions`.
- [`@granit/react-webhooks`](../react-webhooks) — React Query hooks + the
  `WebhooksProvider` (client / base-path / query-key config).
- `@granit/react-ui-webhooks` (this package) — admin pages, tables, badges, the
  signing-key panel and the create/lifecycle dialogs.

## Install

Workspace-internal — consumed via the `@granit/*` Vite/Vitest aliases, not
published for app consumption through a public registry. A consumer must declare
these peers:

- `@granit/react-webhooks` — provider + hooks this kit renders against.
- `@granit/webhooks` — core DTOs and the status enums the badges switch on.
- `@granit/react-ui` — shadcn-style primitives (`Dialog`, `Tabs`, `Table`,
  `Form`, `Card`, `StatusBadge`, …).
- `@granit/react-ui-admin-kit` — `QueryDataTable`, `SmartFilterBar`,
  `SortSelector` and the smart-filter hooks for the grids.
- `@granit/react-query-engine` + `@granit/query-engine` — `QueryProvider` and the
  `QueryConfig` shape that drive the subscription and delivery grids.
- `@granit/react-localization` — `useTranslation` / `useDateFormatter`.
- `@granit/utils` — `cn` class merge. `@granit/logger` — `createLogger`.
- `react` (`^19`), `react-dom` (`^19`) and `react-router-dom` (`^7`) — the pages
  use `Link` / `useParams` / `useNavigate` / `useBeforeUnload`.
- `react-hook-form` (`^7`), `@hookform/resolvers` (`^5`) and `zod` (`^4`) — the
  subscription and deactivation forms.
- `@tanstack/react-table` (`^8`) — `ColumnDef` for the column factories.
- `class-variance-authority` (`^0.7`) — badge variants.
- `lucide-react` (`^1`) — icons.

## Quick start

Register the strings, mount the headless `WebhooksProvider` (from
[`@granit/react-webhooks`](../react-webhooks)) and route the three pages. The list
and delivery grids wrap themselves in their own `QueryProvider`, so no extra query
wiring is needed at the call site.

```tsx
import { WebhooksProvider } from '@granit/react-webhooks';
import { useGranitClient } from '@granit/react-api-client';
import {
  WebhookListPage,
  WebhookCreatePage,
  WebhookDetailPage,
  webhooksTranslationsEn,
  webhooksTranslationsFr,
} from '@granit/react-ui-webhooks';
import { Route, Routes } from 'react-router-dom';
import i18n from 'i18next';

i18n.addResourceBundle('en', 'translation', webhooksTranslationsEn, true, true);
i18n.addResourceBundle('fr', 'translation', webhooksTranslationsFr, true, true);

function WebhooksAdmin() {
  // `client` may be omitted when a <GranitClientProvider> is already mounted.
  return (
    <WebhooksProvider config={{ client: useGranitClient() }}>
      <Routes>
        <Route path="/webhooks" element={<WebhookListPage />} />
        <Route path="/webhooks/new" element={<WebhookCreatePage />} />
        <Route path="/webhooks/:id" element={<WebhookDetailPage />} />
      </Routes>
    </WebhooksProvider>
  );
}
```

The detail page composes the kit's pieces directly — the live stats dashboard,
the lifecycle action bar, the delivery grid and the signing-key panel — so you
rarely need the individual components. They are exported for bespoke layouts:

```tsx
import {
  WebhookDashboard,
  WebhookSigningKeys,
  WebhookStatusBadge,
} from '@granit/react-ui-webhooks';
import { useWebhookStats, useSubscription } from '@granit/react-webhooks';

function MiniHeader({ id }: { id: string }) {
  const { data: stats, isLoading } = useWebhookStats();
  const { data: sub } = useSubscription(id);
  return (
    <>
      {sub && <WebhookStatusBadge status={sub.status} />}
      <WebhookDashboard stats={stats} isLoading={isLoading} />
      {sub && (
        <WebhookSigningKeys subscriptionId={id} signingSecretHint={sub.signingSecretHint} />
      )}
    </>
  );
}
```

## Public API

| Symbol                          | Kind      | Purpose                                                             |
| ------------------------------- | --------- | ------------------------------------------------------------------- |
| `WebhookListPage`               | component | Route page: subscriptions grid + create button (self-wrapped grid)  |
| `WebhookCreatePage`             | component | Route page: create form + one-time signing-secret reveal dialog     |
| `WebhookDetailPage`             | component | Route page: stats, lifecycle, edit, deliveries and settings tabs    |
| `WebhookDashboard`              | component | Six stat cards from `WebhookSubscriptionStatsResponse`              |
| `WebhookSubscriptionTable`      | component | Query-engine grid of subscriptions (smart filter, sort, paging)     |
| `WebhookSubscriptionForm`       | component | Create/edit form; SSRF-gated target URL + event-type select         |
| `WebhookLifecycleActions`       | component | Activate / suspend / deactivate-with-reason / delete dialogs        |
| `WebhookSigningKeys`            | component | Key table + rotate (one-time reveal) + last-key-safe revoke         |
| `WebhookSecretDisplay`          | component | Masked/revealable secret with copy + `curl` HMAC snippet            |
| `WebhookDeliveryTable`          | component | Query-engine grid of attempts, scoped to one subscription           |
| `WebhookDeliveryActions`        | component | Per-row retry (failures) + view-payload button                      |
| `WebhookPayloadViewer`          | component | Dialog: pretty-printed (or verbatim) delivery payload + copy        |
| `WebhookTestButton`             | component | Send a test ping, render status code + duration                     |
| `WebhookStatusBadge`            | component | Subscription status pill (Active / Suspended / Deactivated)         |
| `WebhookDeliveryStatusBadge`    | component | Delivery pill derived from `isSuccess` + `httpStatusCode`           |
| `WebhookKeyStatusBadge`         | component | Signing-key status pill (Active / Retired / Revoked)                |
| `createSubscriptionColumns`     | fn        | `ColumnDef[]` factory for the subscription grid                     |
| `createDeliveryColumns`         | fn        | `ColumnDef[]` factory for the delivery grid                         |
| `webhookSubscriptionFormSchema` | const     | Zod schema: HTTPS + SSRF/private-IP refinements + event type        |
| `webhookDeactivationSchema`     | const     | Zod schema: required deactivation reason                            |
| `WebhookSubscriptionFormValues` | type      | `z.infer` of the subscription schema                                |
| `WebhookDeactivationFormValues` | type      | `z.infer` of the deactivation schema                                |
| `SUBSCRIPTIONS_QUERY_CONFIG`    | const     | `QueryConfig` for the subscriptions grid                            |
| `buildDeliveriesQueryConfig`    | fn        | `QueryConfig` for one subscription's (flat) delivery grid           |
| `DEFAULT_PAGE_SIZE`             | const     | Default grid page size (`20`)                                       |
| `WEBHOOK_API_BASE`              | const     | `/api/v1/webhooks` base path                                        |
| `WEBHOOK_CONFIG_PATH`           | const     | `/api/v1/webhooks/config`                                           |
| `WEBHOOK_STATS_PATH`            | const     | `/api/v1/webhooks/stats`                                            |
| `webhooksTranslationsEn`        | const     | English `Webhooks.*` resource bundle                                |
| `webhooksTranslationsFr`        | const     | French `Webhooks.*` resource bundle                                 |

## Out of scope / caveats

- **SSRF / private-target gating is UX-only.** `webhookSubscriptionFormSchema`
  rejects non-HTTPS targets, private/loopback IPv4 + IPv6 ranges and
  `.local` / `.internal` / `.localhost` / `.onion` hosts so the form fails fast.
  This is a usability guard, **not** a security boundary — the authoritative
  outbound-target check lives in the `Granit.Webhooks` backend, which must
  re-validate every target on create/update.
- **One-time secret reveal.** `WebhookCreatePage` and `WebhookSigningKeys` show a
  fresh signing secret exactly once, on the create/rotate response; afterwards the
  backend returns only a masked `signingSecretHint`. There is no re-fetch of a
  plaintext secret — losing it means rotating a new key.
- **Last active key cannot be revoked.** `WebhookSigningKeys` hides the revoke
  action for the sole remaining Active key (the backend rejects it anyway) so a
  subscription always retains a valid signing key during rotation.
- **Deliveries are a flat resource.** There is no nested
  `/subscriptions/{id}/deliveries` route; `buildDeliveriesQueryConfig` /
  `WebhookDeliveryTable` scope the shared `/webhooks/deliveries` grid to one
  subscription via a `subscriptionId.Eq` base filter, keyed per subscription so
  retries invalidate the right cache.
- **Payload visibility follows backend config.** Stored request payloads are only
  shown when the module's `storePayload` flag is on (`useWebhookConfig`);
  otherwise the view-payload action and `WebhookPayloadViewer` are suppressed.
- **No testing subpath / no `csp`.** This package ships no `/testing` MSW handlers
  (use the fixtures from [`@granit/react-webhooks`](../react-webhooks)) and writes
  to no DOM script sink, so it exposes no `csp` subpath.
- **Routing, client and i18n are the host's job.** The pages assume a
  `react-router-dom` router and the `/webhooks`, `/webhooks/new`, `/webhooks/:id`
  routes above; the Axios client is resolved from `WebhooksProvider` /
  `GranitClientProvider`; the host registers the `webhooksTranslations{En,Fr}`
  bundles.

## License

Apache-2.0
