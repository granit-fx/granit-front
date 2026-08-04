# @granit/react-ui-authentication-api-keys

Admin **UI feature kit** for the Authentication **API keys** module — the api-key
list (search, type/environment filters, include-revoked toggle, revoke + rotate
actions), the spec-validated create form, and the detail page (informations,
actions, and inline scopes editing). This is the top **react-ui** layer: it ships
the routed pages, dialogs, badges, and forms, composing the headless
[`@granit/react-authentication-api-keys`](../react-authentication-api-keys) data
hooks with the foundation [`@granit/react-ui`](../react-ui) (shadcn/ui) primitives.

The split is three packages over the same .NET `Granit.Authentication.ApiKeys`
backend (contract: `contracts/openapi/api-keys.json`, routes under
`/authentication/api-keys`):

- [`@granit/authentication-api-keys`](../authentication-api-keys) —
  framework-agnostic core: DTOs, Axios calls (`createApiKey`, `listApiKeys`,
  `rotateApiKey`, …), `ApiKeyPermissions`, and the OpenAPI-derived
  `apiKeysConstraints`.
- [`@granit/react-authentication-api-keys`](../react-authentication-api-keys) —
  React Query hooks: `useApiKeys` / `useApiKey` / `useCreateApiKey` /
  `useRevokeApiKey` / `useRotateApiKey` / `useUpdateApiKeyScopes`.
- `@granit/react-ui-authentication-api-keys` (this package) — the admin UI.

This package is presentational glue; it owns no HTTP transport and no query keys.
The Axios client resolves from a `GranitClientProvider` in the host tree (the
pages call `useGranitClient()` and forward `{ client }` to the hooks); the host
supplies routing (`react-router`) and the global `Common.*` i18n keys.

## Install

Workspace-internal — consumed via the `@granit/*` Vite/Vitest aliases, not
published for app consumption through a public registry. A consumer must declare
these peers:

- `@granit/react-authentication-api-keys` — the data hooks these pages drive.
- `@granit/authentication-api-keys` — core DTOs, `apiKeysConstraints`, and the
  `ApiKeyQuickFilters` enum used to build the include-revoked quick filter.
- `@granit/react-api-client` — `useGranitClient`, resolving the Axios client from
  a host `GranitClientProvider`.
- `@granit/react-ui` — shadcn/ui primitives (Table, Dialog, Form, Select, …).
- `@granit/react-validation` — `createConstraintsResolver`, the spec-driven
  react-hook-form resolver for the create and scopes forms.
- `@granit/react-localization` — `useTranslation` / `useDateFormatter`.
- `@granit/query-engine` — `FilterEntry` for the list-page filter expressions.
- `@granit/types` — `toISODateString` for the `expiresAt` field; shared base types.
- `@granit/utils` — `cn` class merge for the badge variants.
- `react` / `react-dom` (`^19`), `react-hook-form` (`^7.80`),
  `react-router` (`^7.18`), `class-variance-authority` (`^0.7`), and
  `lucide-react` (`^1.21`).

## Quick start

Mount a `GranitClientProvider`, register the i18n bundle, and route the three
pages. The pages read the active key id from the router (`useParams`) and
navigate between `/api-keys`, `/api-keys/new`, and `/api-keys/:id` themselves.

```tsx
import { GranitClientProvider } from '@granit/react-api-client';
import {
  ApiKeyListPage,
  ApiKeyCreatePage,
  ApiKeyDetailPage,
  apiKeysTranslationsEn,
} from '@granit/react-ui-authentication-api-keys';
import i18n from 'i18next';
import { Route, Routes } from 'react-router';

// Host owns Common.* keys; this bundle ships only the ApiKeys.* set. Merge it
// into the host's "translation" namespace (deep + overwrite).
i18n.addResourceBundle('en', 'translation', apiKeysTranslationsEn, true, true);

function ApiKeysModule({ client }: { client: AxiosInstance }) {
  return (
    <GranitClientProvider client={client}>
      <Routes>
        <Route path="/api-keys" element={<ApiKeyListPage />} />
        <Route path="/api-keys/new" element={<ApiKeyCreatePage />} />
        <Route path="/api-keys/:id" element={<ApiKeyDetailPage />} />
      </Routes>
    </GranitClientProvider>
  );
}
```

The create and scopes forms derive their validation from the OpenAPI contract via
`createConstraintsResolver(apiKeysConstraints.ApiKeyCreateRequest | …, t)` — there
is no hand-written schema. After a create or rotate, the freshly minted secret is
shown once in `ApiKeySecretDialog` (copy-only, non-dismissible by outside click).

To assemble a bespoke screen, compose the exported sub-components directly:

```tsx
import {
  ApiKeyTable,
  ApiKeyStatusBadge,
  getApiKeyStatus,
} from '@granit/react-ui-authentication-api-keys';
import { useApiKeys } from '@granit/react-authentication-api-keys';
import { useGranitClient } from '@granit/react-api-client';

function MyKeysPanel() {
  const client = useGranitClient();
  const { data } = useApiKeys({ client }, { page: 1, pageSize: 20 });

  return (
    <ApiKeyTable
      items={data?.items ?? []}
      onRevoke={(k) => {
        /* open your revoke dialog */
      }}
      onRotate={(k) => {
        /* open your rotate dialog */
      }}
    />
  );
}
```

## Public API

| Symbol                         | Kind      | Purpose                                                           |
| ------------------------------ | --------- | ----------------------------------------------------------------- |
| `ApiKeyListPage`               | component | Routed list: search, type/env filters, include-revoked, paged     |
| `ApiKeyCreatePage`             | component | Routed create form (spec-validated) + one-time secret reveal      |
| `ApiKeyDetailPage`             | component | Routed detail: info, actions, inline permission/CIDR editing      |
| `ApiKeyTable`                  | component | The list table; `onRevoke` / `onRotate` row-action callbacks      |
| `ApiKeyScopesForm`             | component | Edit `permissions` / `allowedCidrs` (tag inputs, spec-validated)  |
| `ApiKeyTypeBadge`              | component | CVA badge for `ApiKeyType` (Secret/Publishable/Webhook/Ephemeral) |
| `ApiKeyEnvironmentBadge`       | component | CVA badge for the live/test/dev environment                       |
| `ApiKeyStatusBadge`            | component | CVA badge for active/revoked/expired status                       |
| `ApiKeyRevokeDialog`           | component | Confirm-revoke alert dialog (irreversible)                        |
| `ApiKeyRotateDialog`           | component | Confirm-rotate alert dialog (old key revoked immediately)         |
| `ApiKeySecretDialog`           | component | One-time secret reveal: copy-to-clipboard, no outside dismiss     |
| `getApiKeyStatus`              | fn        | Derive `ApiKeyStatus` from `revokedAt` / `expiresAt`              |
| `ApiKeyStatus`                 | type      | `'active' \| 'revoked' \| 'expired'`                              |
| `API_KEY_TYPES`                | const     | `['Secret','Publishable','Webhook','Ephemeral']`                  |
| `API_KEY_ENVIRONMENTS`         | const     | `['live','test','dev']`                                           |
| `CACHE_BEHAVIORS`              | const     | `['Normal','NoCache']`                                            |
| `DEFAULT_PAGE_SIZE`            | const     | List page size (`20`)                                             |
| `ApiKeyCreateFormValues`       | type      | react-hook-form value shape for the create form                   |
| `ApiKeyUpdateScopesFormValues` | type      | react-hook-form value shape for the scopes form                   |
| `ApiKeyEnvironment`            | type      | `(typeof API_KEY_ENVIRONMENTS)[number]`                           |
| `apiKeysTranslationsEn`        | const     | English `ApiKeys.*` i18next bundle (flat keys, `translation` ns)  |
| `apiKeysTranslationsFr`        | const     | French `ApiKeys.*` i18next bundle                                 |
| `ApiKeysTranslations`          | type      | Shape of the translation bundles                                  |

## i18n

Ships flat `ApiKeys.*` keys in the `translation` namespace via
`apiKeysTranslationsEn` / `apiKeysTranslationsFr` (type `ApiKeysTranslations`).
Register them in the host i18n instance with
`addResourceBundle(lng, 'translation', bundle, true, true)`. The global `Common.*`
keys (search placeholder, All/Add/Edit/Save/Cancel/Next/Previous/Details) are
host-owned and are **not** shipped here — without them the table actions and
filters render raw keys.

## Caveats

- **Secret is shown exactly once.** `ApiKeyCreateResponse.rawSecret` /
  `ApiKeyRotateResponse.rawSecret` is server-side never persisted in clear; the
  one-time `ApiKeySecretDialog` is intentionally hard to dismiss (no outside-click
  or Escape close) so an operator does not lose it. The detail page only ever
  shows the masked `prefix…lastFourChars`.
- **Rotation is destructive.** Confirming `ApiKeyRotateDialog` immediately revokes
  the previous secret; in-flight callers using the old key start failing at once.
- **UX gating only.** Hiding actions on revoked keys and gating screens on
  `ApiKeyPermissions` (from the core package) is a UX convenience — every mutation
  is re-authorized on the .NET backend. Never treat a hidden control as an access
  boundary.
- **Validation is spec-derived, not hand-rolled.** The create and scopes forms get
  their rules from `apiKeysConstraints` (generated from `contracts/openapi/api-keys.json`);
  do not duplicate constraints in a local Zod schema — regenerate the contract
  instead.
- **Routing is hard-wired.** The pages navigate to `/api-keys`, `/api-keys/new`,
  and `/api-keys/:id` via `react-router`; mount them under matching routes or
  fork the pages if your app uses a different path scheme.

## Out of scope

- **Data fetching, query keys, and DTOs** — owned by the
  [`@granit/react-authentication-api-keys`](../react-authentication-api-keys) hooks
  and the [`@granit/authentication-api-keys`](../authentication-api-keys) core
  (mirror of `Granit.Authentication.ApiKeys`).
- **Authentication / Axios interceptors** — the client (CSRF, auth, tenant) is
  supplied by the host `GranitClientProvider`; this package never constructs one.
- **The global `Common.*` i18n set** — host-owned; only `ApiKeys.*` ships here.

## License

Apache-2.0
