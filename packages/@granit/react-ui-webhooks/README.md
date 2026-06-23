# @granit/react-ui-webhooks

Admin UI for the **Webhooks** module — the subscriptions list, the create flow
(with the one-time signing-secret reveal) and the per-subscription detail view
(lifecycle actions, delivery history, signing-key rotation, test ping and a live
stats dashboard).

The **visual** layer for webhooks: it composes the headless
[`@granit/react-webhooks`](../react-webhooks) (provider + hooks) with the
foundation UI packages ([`@granit/react-ui`](../react-ui),
[`@granit/react-ui-admin-kit`](../react-ui-admin-kit)). The target-URL form keeps
the SSRF / private-IP `zod` validation that gates outbound webhook delivery.

## Usage

```tsx
import {
  WebhookListPage,
  WebhookCreatePage,
  WebhookDetailPage,
  webhooksTranslationsEn,
} from '@granit/react-ui-webhooks';

i18n.addResourceBundle('en', 'translation', webhooksTranslationsEn, true, true);

// Mount under a WebhooksProvider (from @granit/react-webhooks):
<Route path="/webhooks" element={<WebhookListPage />} />
<Route path="/webhooks/new" element={<WebhookCreatePage />} />
<Route path="/webhooks/:id" element={<WebhookDetailPage />} />;
```

## Injection

- **API client** — resolved from a `GranitClientProvider` / `WebhooksProvider`
  higher in the tree (via the `@granit/react-webhooks` hooks). No client baked in.
- **Routing** — the pages use `react-router-dom` (`Link` / `useParams` /
  `useNavigate`); mount them under the host router with the routes above.
- **i18n** — ships its `Webhooks.*` strings (`webhooksTranslationsEn/Fr`); the
  host registers them.
