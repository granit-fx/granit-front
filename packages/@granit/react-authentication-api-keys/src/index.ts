// Provider
export {
  ApiKeysProvider,
  useApiKeysConfig,
  useOptionalApiKeysConfig,
} from './providers/api-keys-provider';
export type {
  ApiKeysConfig,
  ApiKeysProviderProps,
  ResolvedApiKeysConfig,
} from './providers/api-keys-provider';

// Hooks — queries
export { useApiKeys, useApiKeysQueryMeta } from './hooks/use-api-keys';
export type { ApiKeyHookOptions, ApiKeyQueryOptions, UseApiKeysParams } from './hooks/use-api-keys';
export { buildApiKeyQueryKey } from './hooks/query-keys';
export { useApiKey } from './hooks/use-api-key';

// Hooks — mutations
export {
  useCreateApiKey,
  useRevokeApiKey,
  useRotateApiKey,
  useUpdateApiKeyScopes,
} from './hooks/use-api-key-mutations';
export type { UpdateApiKeyScopesVariables } from './hooks/use-api-key-mutations';
