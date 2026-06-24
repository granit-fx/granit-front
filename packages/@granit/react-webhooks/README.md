# @granit/react-webhooks

React hooks + provider for the Granit **webhooks** module — outbound webhook
subscription CRUD, lifecycle transitions, signing-key rotation, test ping, event
discovery, stats and failed-delivery retry. This is the **React hooks layer**: it
wraps the framework-agnostic Axios calls and DTOs from
[`@granit/webhooks`](../webhooks) in TanStack Query hooks, behind a shared
`WebhooksProvider` for client/base-path/query-key configuration. It renders
nothing — pages, forms, and tables live one layer up.

The split is three packages over the same .NET `Granit.Webhooks` backend
(contract: `contracts/openapi/webhooks.json`):

- [`@granit/webhooks`](../webhooks) — framework-agnostic core: DTOs + Axios
  functions (`getSubscription`, `createSubscription`, `rotateSigningKey`, …) and
  `WebhooksPermissions`.
- `@granit/react-webhooks` (this package) — React Query hooks + provider.
- [`@granit/react-ui-webhooks`](../react-ui-webhooks) — admin UI kit: the
  subscriptions list, create flow with the one-time secret reveal, and the
  per-subscription detail view (lifecycle, delivery history, key rotation).

## Install

Workspace-internal — consumed via the `@granit/*` Vite/Vitest aliases, not
published for app consumption through a public registry. A consumer must declare
these peers:

- `@granit/webhooks` — core DTOs + Axios calls this layer wraps.
- `@granit/api-client` — supplies the `AxiosInstance` (CSRF, auth, tenant
  interceptors).
- `@granit/react-api-client` — `useOptionalGranitClient`, the context fallback
  for the Axios client when `config.client` is omitted.
- `@tanstack/react-query` (`^5`) and `react` (`^19`).
- `@granit/query-engine` / `@granit/react-query-engine` (**optional**) — only for
  the subscriptions and `/deliveries` grids and the `./testing` query metadata.
- `msw` (`^2.12`, **optional**) — only for the `@granit/react-webhooks/testing`
  subpath.

## Quick start

Wire the provider once (it resolves the Axios client, base path, and an optional
query-key prefix), then call the hooks anywhere below it. The base path defaults
to `/api/v1/webhooks`; the subscription resource lives at
`${basePath}/subscriptions`, while deliveries, event types, config, and stats sit
directly under `${basePath}`.

```tsx
import { WebhooksProvider, useSubscription, useTestPing } from '@granit/react-webhooks';
import { useGranitClient } from '@granit/react-api-client';

function App({ children }: { children: React.ReactNode }) {
  // `client` may be omitted if a <GranitClientProvider> is already mounted.
  return (
    <WebhooksProvider config={{ client: useGranitClient() }}>
      {children}
    </WebhooksProvider>
  );
}

function WebhookDetail({ id }: { id: string }) {
  const { data: subscription } = useSubscription(id);
  const { mutate: testPing, data: ping } = useTestPing();

  if (!subscription) return null;
  return (
    <section>
      <h2>{subscription.targetUrl}</h2>
      <code>{subscription.signingSecretHint ?? 'no secret'}</code>
      <button type="button" onClick={() => testPing(id)}>
        Send test ping
      </button>
      {ping ? <p>HTTP {ping.httpStatusCode} in {ping.durationMs} ms</p> : null}
    </section>
  );
}
```

Mutations invalidate the relevant query keys on success — `useRotateSigningKey`
returns the new plaintext secret exactly once (store it immediately) and also
refreshes the subscription's `signingSecretHint`. The subscriptions list and the
delivery-attempt history are **query-engine grids**, not hooks here: drive them
with `@granit/react-query-engine` against `${basePath}/subscriptions` and
`${basePath}/deliveries`, then call `useRetryDelivery` to redeliver a failed
attempt (it invalidates `webhooksKeys.deliveries(subscriptionId)`).

```tsx
import {
  useRotateSigningKey,
  useRevokeSigningKey,
  useSigningKeys,
} from '@granit/react-webhooks';

function SigningKeys({ subscriptionId }: { subscriptionId: string }) {
  const { data: keys } = useSigningKeys(subscriptionId);
  const { mutate: rotate } = useRotateSigningKey();
  const { mutate: revoke } = useRevokeSigningKey();

  return (
    <ul>
      {keys?.map((k) => (
        <li key={k.id}>
          {k.status}
          <button type="button" onClick={() => revoke({ subscriptionId, keyId: k.id })}>
            Revoke
          </button>
        </li>
      ))}
      <button type="button" onClick={() => rotate(subscriptionId)}>Rotate</button>
    </ul>
  );
}
```

## Public API

| Symbol                      | Kind     | Purpose                                                                   |
| --------------------------- | -------- | ------------------------------------------------------------------------- |
| `WebhooksProvider`          | provider | Supplies client, base path, query-key prefix to all hooks below it        |
| `useWebhooksConfig`         | hook     | Read the resolved config; throws outside a provider                       |
| `useSubscription`           | hook     | `GET .../subscriptions/{id}` — single subscription (disabled when empty)  |
| `useCreateSubscription`     | hook     | `POST .../subscriptions` — returns the one-time signing secret            |
| `useUpdateSubscription`     | hook     | `PUT .../subscriptions/{id}` — edit target URL / event type               |
| `useDeleteSubscription`     | hook     | `DELETE .../subscriptions/{id}`                                           |
| `useActivateSubscription`   | hook     | `POST .../subscriptions/{id}/activate` — resume a suspended subscription  |
| `useSuspendSubscription`    | hook     | `POST .../subscriptions/{id}/suspend`                                     |
| `useDeactivateSubscription` | hook     | `POST .../subscriptions/{id}/deactivate` (terminal, with reason)          |
| `useTestPing`               | hook     | `POST .../subscriptions/{id}/test-ping` — synchronous reachability probe  |
| `useSigningKeys`            | hook     | `GET .../subscriptions/{id}/keys` — Active / Retired / Revoked keys       |
| `useRotateSigningKey`       | hook     | `POST .../subscriptions/{id}/keys` — new key, plaintext secret once       |
| `useRevokeSigningKey`       | hook     | `DELETE .../subscriptions/{id}/keys/{keyId}` — last Active key protected  |
| `useRetryDelivery`          | hook     | `POST .../deliveries/{deliveryId}/retry` — re-enqueue a failed attempt    |
| `useEventTypes`             | hook     | `GET .../event-types` — registered event catalog (`staleTime: Infinity`)  |
| `useWebhookConfig`          | hook     | `GET .../config` — module config (`staleTime: Infinity`)                  |
| `useWebhookStats`           | hook     | `GET .../stats` — aggregated subscription/delivery stats                  |
| `webhooksKeys`              | const    | Query-key factory (`all`, `subscription`, `signingKeys`, `deliveries`, …) |
| `WebhooksConfig`            | type     | Provider input (optional client / basePath / queryKeyPrefix)              |
| `ResolvedWebhooksConfig`    | type     | Provider output with the resolved required client + basePath              |
| `WebhooksProviderProps`     | type     | `{ config, children }`                                                    |

DTOs (`WebhookSubscriptionResponse`, `WebhookSigningKeyResponse`,
`WebhookSubscriptionCreateRequest`, …) and the `WebhookSubscriptionStatus` /
`WebhookSigningKeyStatus` enums are re-exported from
[`@granit/webhooks`](../webhooks); import them from there, not from this package.

`./testing` subpath (requires the optional `msw` peer):
`createWebhooksHandlers` (stateful MSW handlers, default base `/api/v1/webhooks`,
covering subscriptions CRUD + lifecycle, signing keys, deliveries, retry, test
ping, config, stats and event types) plus the `webhookSubscriptionQueryMetadata`
and `webhookDeliveryQueryMetadata` `/meta` payloads and the `mockWebhookConfig`,
`mockWebhookSubscriptions`, `mockWebhookSigningKeys`,
`mockWebhookDeliveryAttempts`, and `mockWebhookStats` fixtures.

## Caveats

- **Signing secret shown once.** `useCreateSubscription` and
  `useRotateSigningKey` return the plaintext secret a single time; thereafter the
  subscription exposes only a masked `signingSecretHint`. Persist it on receipt —
  the backend never replays it. Do not log it.
- **Subscription/delivery lists are query-engine grids.** This package has no
  list hook; the subscriptions table and the per-subscription delivery history
  are driven through `@granit/react-query-engine` against
  `${basePath}/subscriptions` and `${basePath}/deliveries` (scope deliveries with
  `filter[subscriptionId.Eq]=…`). `webhooksKeys.deliveries(subscriptionId)`
  matches the grid's key so `useRetryDelivery` can invalidate it.
- **Last Active key is protected.** `useRevokeSigningKey` fails on the only
  remaining Active key — rotate first, then revoke the retired one.
- **Lifecycle is state-guarded server-side.** Activate requires a *Suspended*
  subscription, suspend requires an *Active* one, and deactivation is terminal;
  invalid transitions return `409` from the backend.
- **SSRF / private-IP validation is a UI concern.** The target-URL guard that
  gates outbound delivery lives in
  [`@granit/react-ui-webhooks`](../react-ui-webhooks); these hooks transmit
  whatever URL they are given.

## Out of scope

- **Rendering** — subscription pages, the create flow, and the detail view live
  in [`@granit/react-ui-webhooks`](../react-ui-webhooks). This package is
  headless.
- **DTOs, HTTP transport, and permissions** — owned by
  [`@granit/webhooks`](../webhooks) (mirror of `Granit.Webhooks`, including
  `WebhooksPermissions`); hooks here only adapt the calls to React Query.
- **Authentication and tenant headers** — issued by `@granit/api-client` on the
  injected Axios client; this package consumes the already-authenticated client.

## License

Apache-2.0
