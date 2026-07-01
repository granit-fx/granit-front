// @granit/react-ui-authentication-api-keys — admin UI for the Authentication
// API keys module. Composes the headless @granit/react-authentication-api-keys
// (hooks) with the foundation UI packages. The Axios client resolves internally
// from the headless ApiKeysProvider config (the pages no longer forward
// { client } to the hooks); the host supplies routing and i18n. The
// create form and the scopes form derive validation from the OpenAPI-backed
// apiKeysConstraints via createConstraintsResolver (@granit/react-validation).

export { ApiKeyListPage } from './components/api-key-list-page';
export { ApiKeyCreatePage } from './components/api-key-create-page';
export { ApiKeyDetailPage } from './components/api-key-detail-page';

// Sub-components (composable building blocks)
export { ApiKeyTable } from './components/api-key-table';
export { ApiKeyScopesForm } from './components/api-key-scopes-form';
export { ApiKeyTypeBadge } from './components/api-key-type-badge';
export { ApiKeyEnvironmentBadge } from './components/api-key-environment-badge';
export { ApiKeyStatusBadge } from './components/api-key-status-badge';
export { ApiKeyRevokeDialog } from './components/api-key-revoke-dialog';
export { ApiKeyRotateDialog } from './components/api-key-rotate-dialog';
export { ApiKeySecretDialog } from './components/api-key-secret-dialog';
export { getApiKeyStatus } from './components/api-key-status-utils';
export type { ApiKeyStatus } from './components/api-key-status-utils';

// Constants & form value shapes
export {
  API_KEY_TYPES,
  API_KEY_ENVIRONMENTS,
  CACHE_BEHAVIORS,
  DEFAULT_PAGE_SIZE,
} from './constants';
export type {
  ApiKeyCreateFormValues,
  ApiKeyUpdateScopesFormValues,
  ApiKeyEnvironment,
} from './validation';

// i18next resource bundles (flat keys, "translation" ns). Ships only the
// ApiKeys.* keys; the host owns the global Common.* set.
export { apiKeysTranslationsEn, apiKeysTranslationsFr } from './locales/index';
export type { ApiKeysTranslations } from './locales/index';
