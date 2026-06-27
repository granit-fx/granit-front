// ---------------------------------------------------------------------------
// AI chat context provider — supplies the Axios client and config to all
// conversation hooks. Mirrors the @granit/react-ai provider pattern.
// ---------------------------------------------------------------------------

import { createConfigProvider } from '@granit/react-api-client';

import { DEFAULT_BASE_PATH, DEFAULT_QUERY_KEY_PREFIX } from '../constants';

import type { AxiosInstance } from '@granit/api-client';
import type { GranitProviderConfig, GranitProviderProps } from '@granit/react-api-client';

/** Configuration for {@link AIChatProvider}. */
export interface AIChatConfig extends GranitProviderConfig {
  /** React Query key prefix (default: `['ai-chat']`). */
  readonly queryKeyPrefix?: readonly string[];
  /**
   * Show per-message timing metrics (time-to-first-token, total, tokens/sec,
   * chunk count) under the latest assistant reply. Off by default — a
   * dev/debug aid the app opts into centrally (e.g. `import.meta.env.DEV`).
   * Rendered by `ConversationThread` from `useChatStream().metrics`.
   */
  readonly showMessageMetrics?: boolean;
}

/** {@link AIChatConfig} after the provider has resolved `client` and defaults. */
export interface ResolvedAIChatConfig extends AIChatConfig {
  readonly client: AxiosInstance;
  readonly basePath: string;
  readonly queryKeyPrefix: readonly string[];
  readonly showMessageMetrics: boolean;
}

export type AIChatProviderProps = GranitProviderProps<AIChatConfig>;

const { Provider, useConfig, useOptionalConfig } = createConfigProvider<
  AIChatConfig,
  ResolvedAIChatConfig
>({
  name: 'AIChat',
  defaultBasePath: DEFAULT_BASE_PATH,
  resolve: (base) => ({
    ...base,
    queryKeyPrefix: base.queryKeyPrefix ?? DEFAULT_QUERY_KEY_PREFIX,
    showMessageMetrics: base.showMessageMetrics ?? false,
  }),
});

/** Provides chat configuration to child components and hooks. */
export const AIChatProvider = Provider;

/** Returns the chat configuration from the nearest {@link AIChatProvider}. */
export const useAIChatConfig = useConfig;

/**
 * Like {@link useAIChatConfig} but returns `null` outside a provider instead of
 * throwing — for presentational components (e.g. `ConversationThread`) that
 * read an optional flag yet must still render standalone in tests/Storybook.
 */
export const useOptionalAIChatConfig = useOptionalConfig;
