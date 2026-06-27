// ---------------------------------------------------------------------------
// AI context provider — supplies Axios client and config to all AI hooks.
// ---------------------------------------------------------------------------

import { createConfigProvider } from '@granit/react-api-client';

import { DEFAULT_BASE_PATH, DEFAULT_QUERY_KEY_PREFIX } from '../constants';

import type { AxiosInstance } from '@granit/api-client';
import type { GranitProviderConfig, GranitProviderProps } from '@granit/react-api-client';

/** Configuration for the AI provider. */
export interface AIConfig extends GranitProviderConfig {
  /** Custom React Query key prefix (default: `['ai']`). */
  readonly queryKeyPrefix?: readonly string[];
}

/**
 * {@link AIConfig} after the provider has resolved `client` from
 * `config.client` or the nearest `<GranitClientProvider>` and applied the
 * `basePath` / `queryKeyPrefix` defaults.
 */
export interface ResolvedAIConfig extends AIConfig {
  readonly client: AxiosInstance;
  readonly basePath: string;
  readonly queryKeyPrefix: readonly string[];
}

export type AIProviderProps = GranitProviderProps<AIConfig>;

const { Provider, useConfig } = createConfigProvider<AIConfig, ResolvedAIConfig>({
  name: 'AI',
  defaultBasePath: DEFAULT_BASE_PATH,
  resolve: (base) => ({
    ...base,
    queryKeyPrefix: base.queryKeyPrefix ?? DEFAULT_QUERY_KEY_PREFIX,
  }),
});

/** Provides AI configuration to child components and hooks. */
export const AIProvider = Provider;

/** Returns the AI configuration from the nearest `AIProvider`. */
export const useAIConfig = useConfig;
