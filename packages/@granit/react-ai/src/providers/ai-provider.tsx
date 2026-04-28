// ---------------------------------------------------------------------------
// AI context provider — supplies Axios client and config to all AI hooks.
// ---------------------------------------------------------------------------

import { useOptionalGranitClient } from '@granit/react-api-client';
import { createContext, useContext, useMemo } from 'react';

import { DEFAULT_BASE_PATH } from '../constants.js';

import type { AxiosInstance } from '@granit/api-client';
import type { ReactNode } from 'react';

/** Configuration for the AI provider. */
export interface AIConfig {
  /** Axios client with auth and tenant interceptors. */
  readonly client?: AxiosInstance;
  /** Base path for AI endpoints (default: `/api/v1/ai`). */
  readonly basePath?: string;
  /** Custom React Query key prefix (default: `['ai']`). */
  readonly queryKeyPrefix?: readonly string[];
}

/**
 * AIConfig after the provider has resolved `client` from
 * `config.client` or the nearest `<GranitClientProvider>`.
 */
export interface ResolvedAIConfig extends AIConfig {
  readonly client: AxiosInstance;
}

export interface AIProviderProps {
  readonly config: AIConfig;
  readonly children: ReactNode;
}

const AIConfigContext = createContext<ResolvedAIConfig | null>(null);

/** Provides AI configuration to child components and hooks. */
export function AIProvider({ config, children }: Readonly<AIProviderProps>) {
  const contextClient = useOptionalGranitClient();
  const value = useMemo<ResolvedAIConfig>(() => {
    const client = config.client ?? contextClient;
    if (!client) {
      throw new Error(
        'AIProvider requires an Axios client. Provide it via config.client or wrap your app in a <GranitClientProvider>.'
      );
    }
    return {
      ...config,
      basePath: config.basePath ?? DEFAULT_BASE_PATH,
      client,
    };
  }, [config, contextClient]);
  return <AIConfigContext value={value}>{children}</AIConfigContext>;
}

/** Returns the AI configuration from the nearest `AIProvider`. */
export function useAIConfig(): ResolvedAIConfig {
  const ctx = useContext(AIConfigContext);
  if (!ctx) {
    throw new Error('useAIConfig must be used within an AIProvider');
  }
  return ctx;
}

/** Builds a consistent React Query key for AI operations. */
export function buildAIQueryKey(
  config: AIConfig,
  ...segments: readonly string[]
): readonly unknown[] {
  const prefix = config.queryKeyPrefix ?? ['ai'];
  return [...prefix, ...segments];
}
