// ---------------------------------------------------------------------------
// AI chat context provider — supplies the Axios client and config to all
// conversation hooks. Mirrors the @granit/react-ai provider pattern.
// ---------------------------------------------------------------------------

import { useOptionalGranitClient } from '@granit/react-api-client';
import { createContext, useContext, useMemo } from 'react';

import { DEFAULT_BASE_PATH, DEFAULT_QUERY_KEY_PREFIX } from '../constants';

import type { AxiosInstance } from '@granit/api-client';
import type { ReactNode } from 'react';

/** Configuration for {@link AIChatProvider}. */
export interface AIChatConfig {
  /** Axios client with auth, CSRF, and tenant interceptors. */
  readonly client?: AxiosInstance;
  /** Base path for the conversation endpoints (default: `/api/v1/conversations`). */
  readonly basePath?: string;
  /** React Query key prefix (default: `['ai-chat']`). */
  readonly queryKeyPrefix?: readonly string[];
}

/** {@link AIChatConfig} after the provider has resolved `client` and defaults. */
export interface ResolvedAIChatConfig extends AIChatConfig {
  readonly client: AxiosInstance;
  readonly basePath: string;
  readonly queryKeyPrefix: readonly string[];
}

export interface AIChatProviderProps {
  readonly config: AIChatConfig;
  readonly children: ReactNode;
}

const AIChatConfigContext = createContext<ResolvedAIChatConfig | null>(null);

/** Provides chat configuration to child components and hooks. */
export function AIChatProvider({ config, children }: Readonly<AIChatProviderProps>) {
  const contextClient = useOptionalGranitClient();
  const value = useMemo<ResolvedAIChatConfig>(() => {
    const client = config.client ?? contextClient;
    if (!client) {
      throw new Error(
        'AIChatProvider requires an Axios client. Provide it via config.client or wrap your app in a <GranitClientProvider>.'
      );
    }
    return {
      ...config,
      client,
      basePath: config.basePath ?? DEFAULT_BASE_PATH,
      queryKeyPrefix: config.queryKeyPrefix ?? DEFAULT_QUERY_KEY_PREFIX,
    };
  }, [config, contextClient]);
  return <AIChatConfigContext value={value}>{children}</AIChatConfigContext>;
}

/** Returns the chat configuration from the nearest {@link AIChatProvider}. */
export function useAIChatConfig(): ResolvedAIChatConfig {
  const ctx = useContext(AIChatConfigContext);
  if (!ctx) {
    throw new Error('useAIChatConfig must be used within an AIChatProvider');
  }
  return ctx;
}
