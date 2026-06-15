// ---------------------------------------------------------------------------
// AI prompts context provider — supplies the Axios client and config to all
// catalogue hooks. Mirrors the @granit/react-ai-chat provider pattern.
// ---------------------------------------------------------------------------

import { useOptionalGranitClient } from '@granit/react-api-client';
import { createContext, useContext, useMemo } from 'react';

import { DEFAULT_BASE_PATH, DEFAULT_QUERY_KEY_PREFIX } from '../constants';

import type { AxiosInstance } from '@granit/api-client';
import type { ReactNode } from 'react';

/** Configuration for {@link AIPromptsProvider}. */
export interface AIPromptsConfig {
  /** Axios client with auth, CSRF, and tenant interceptors. */
  readonly client?: AxiosInstance;
  /** Base path for the catalogue endpoints (default: `/api/v1/prompts`). */
  readonly basePath?: string;
  /** React Query key prefix (default: `['ai-prompts']`). */
  readonly queryKeyPrefix?: readonly string[];
}

/** {@link AIPromptsConfig} after the provider has resolved `client` and defaults. */
export interface ResolvedAIPromptsConfig extends AIPromptsConfig {
  readonly client: AxiosInstance;
  readonly basePath: string;
  readonly queryKeyPrefix: readonly string[];
}

export interface AIPromptsProviderProps {
  readonly config: AIPromptsConfig;
  readonly children: ReactNode;
}

const AIPromptsConfigContext = createContext<ResolvedAIPromptsConfig | null>(null);

/** Provides catalogue configuration to child components and hooks. */
export function AIPromptsProvider({ config, children }: Readonly<AIPromptsProviderProps>) {
  const contextClient = useOptionalGranitClient();
  const value = useMemo<ResolvedAIPromptsConfig>(() => {
    const client = config.client ?? contextClient;
    if (!client) {
      throw new Error(
        'AIPromptsProvider requires an Axios client. Provide it via config.client or wrap your app in a <GranitClientProvider>.'
      );
    }
    return {
      ...config,
      client,
      basePath: config.basePath ?? DEFAULT_BASE_PATH,
      queryKeyPrefix: config.queryKeyPrefix ?? DEFAULT_QUERY_KEY_PREFIX,
    };
  }, [config, contextClient]);
  return <AIPromptsConfigContext value={value}>{children}</AIPromptsConfigContext>;
}

/** Returns the catalogue configuration from the nearest {@link AIPromptsProvider}. */
export function useAIPromptsConfig(): ResolvedAIPromptsConfig {
  const ctx = useContext(AIPromptsConfigContext);
  if (!ctx) {
    throw new Error('useAIPromptsConfig must be used within an AIPromptsProvider');
  }
  return ctx;
}
