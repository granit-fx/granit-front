# @granit/react-ui-authentication-api-keys

Admin UI for the **Authentication API keys** module — the api-key list (search,
type/environment filters, include-revoked toggle, revoke + rotate actions), the
spec-validated create form, and the detail page (informations, actions, and
inline scopes editing). Pairs with the headless
`@granit/react-authentication-api-keys` data layer (`useApiKeys` / `useApiKey` /
`useCreateApiKey` / `useRevokeApiKey` / `useRotateApiKey` /
`useUpdateApiKeyScopes`).

## Usage

The host supplies a `GranitClientProvider` (with its Axios client) in the tree;
the pages resolve the client via `useGranitClient()` and forward `{ client }` to
the headless hooks. The host also owns routing and the global `Common.*` i18n
keys.

```tsx
import { GranitClientProvider } from '@granit/react-api-client';
import { ApiKeyListPage } from '@granit/react-ui-authentication-api-keys';

<GranitClientProvider client={api}>
  <ApiKeyListPage />
</GranitClientProvider>;
```

## i18n

Ships flat `ApiKeys.*` keys in the `translation` namespace via
`apiKeysTranslationsEn` / `apiKeysTranslationsFr` (type `ApiKeysTranslations`).
Register them in the host i18n instance with
`addResourceBundle(lng, 'translation', bundle, true, true)`. The global
`Common.*` keys are host-owned and are not shipped here.

## Validation

The create form and the scopes form derive their validation from the OpenAPI
contract via
`createConstraintsResolver(apiKeysConstraints.ApiKeyCreateRequest | ApiKeyUpdateScopesRequest, …)`
(`@granit/react-validation` + `@granit/authentication-api-keys`) — no
hand-written schema.
