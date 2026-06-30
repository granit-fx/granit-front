// ---------------------------------------------------------------------------
// AI chat context provider — supplies the Axios client and config to all
// conversation hooks. Mirrors the @granit/react-ai provider pattern.
// ---------------------------------------------------------------------------

import { createConfigProvider } from '@granit/react-api-client';
import { useEffect } from 'react';

import { DEFAULT_BASE_PATH, DEFAULT_QUERY_KEY_PREFIX } from '../constants';
import { logger } from '../logger';

import type { AxiosInstance } from '@granit/api-client';
import type { GranitProviderConfig, GranitProviderProps } from '@granit/react-api-client';

const log = logger.child('AIChatProvider');

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

/**
 * Provides chat configuration to child components and hooks. Wraps the generated
 * config provider to emit a single dev-observability init log on mount (config
 * shape only — never any message content).
 */
export function AIChatProvider({ config, children }: AIChatProviderProps) {
  useEffect(() => {
    log.info('Initialized', {
      basePath: config.basePath ?? DEFAULT_BASE_PATH,
      showMessageMetrics: config.showMessageMetrics ?? false,
    });
  }, [config.basePath, config.showMessageMetrics]);

  return <Provider config={config}>{children}</Provider>;
}

/** Returns the chat configuration from the nearest {@link AIChatProvider}. */
export const useAIChatConfig = useConfig;

/**
 * Like {@link useAIChatConfig} but returns `null` outside a provider instead of
 * throwing — for presentational components (e.g. `ConversationThread`) that
 * read an optional flag yet must still render standalone in tests/Storybook.
 */
export const useOptionalAIChatConfig = useOptionalConfig;
