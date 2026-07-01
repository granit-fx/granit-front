import { createConfigProvider } from '@granit/react-api-client';

import { DEFAULT_BASE_PATH } from '../constants';

import type {
  GranitProviderConfig,
  GranitProviderProps,
  ResolvedGranitProviderConfig,
} from '@granit/react-api-client';

/** Configuration for the API keys provider. */
export interface ApiKeysConfig extends GranitProviderConfig {
  /** Custom prefix for all query keys produced by this module. */
  readonly queryKeyPrefix?: readonly string[];
}

export type ResolvedApiKeysConfig = ResolvedGranitProviderConfig<ApiKeysConfig>;

export type ApiKeysProviderProps = GranitProviderProps<ApiKeysConfig>;

const { Provider, useConfig, useOptionalConfig } = createConfigProvider<ApiKeysConfig>({
  name: 'ApiKeys',
  defaultBasePath: DEFAULT_BASE_PATH,
});

/**
 * Provides the Axios `client` and `basePath` to the api-key hooks. The client
 * resolves from `config.client` or the nearest `<GranitClientProvider>`.
 */
export const ApiKeysProvider = Provider;

/** Reads the resolved api-keys config from the nearest `<ApiKeysProvider>`. */
export const useApiKeysConfig = useConfig;

/** Reads the resolved api-keys config, or `null` when outside a provider. */
export const useOptionalApiKeysConfig = useOptionalConfig;
