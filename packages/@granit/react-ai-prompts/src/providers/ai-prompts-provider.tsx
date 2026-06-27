// ---------------------------------------------------------------------------
// AI prompts context provider — supplies the Axios client and config to all
// catalogue hooks. Mirrors the @granit/react-ai-chat provider pattern.
// ---------------------------------------------------------------------------

import { createConfigProvider } from '@granit/react-api-client';

import { DEFAULT_BASE_PATH, DEFAULT_QUERY_KEY_PREFIX } from '../constants';

import type { AxiosInstance } from '@granit/api-client';
import type { GranitProviderConfig, GranitProviderProps } from '@granit/react-api-client';

/** Configuration for {@link AIPromptsProvider}. */
export interface AIPromptsConfig extends GranitProviderConfig {
  /** React Query key prefix (default: `['ai-prompts']`). */
  readonly queryKeyPrefix?: readonly string[];
}

/** {@link AIPromptsConfig} after the provider has resolved `client` and defaults. */
export interface ResolvedAIPromptsConfig extends AIPromptsConfig {
  readonly client: AxiosInstance;
  readonly basePath: string;
  readonly queryKeyPrefix: readonly string[];
}

export type AIPromptsProviderProps = GranitProviderProps<AIPromptsConfig>;

const { Provider, useConfig } = createConfigProvider<AIPromptsConfig, ResolvedAIPromptsConfig>({
  name: 'AIPrompts',
  defaultBasePath: DEFAULT_BASE_PATH,
  resolve: (base) => ({
    ...base,
    queryKeyPrefix: base.queryKeyPrefix ?? DEFAULT_QUERY_KEY_PREFIX,
  }),
});

/** Provides catalogue configuration to child components and hooks. */
export const AIPromptsProvider = Provider;

/** Returns the catalogue configuration from the nearest `AIPromptsProvider`. */
export const useAIPromptsConfig = useConfig;
