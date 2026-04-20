// ---------------------------------------------------------------------------
// AI context provider — supplies Axios client and config to all AI hooks.
// ---------------------------------------------------------------------------

import { createContext, useContext, useMemo } from 'react';

import { DEFAULT_BASE_PATH } from '../constants.js';

import type { AxiosInstance } from 'axios';
import type { ReactNode } from 'react';

/** Configuration for the AI provider. */
export interface AIConfig {
  /** Axios client with auth and tenant interceptors. */
  readonly client: AxiosInstance;
  /** Base path for AI endpoints (default: `/api/v1/ai`). */
  readonly basePath?: string;
  /** Custom React Query key prefix (default: `['ai']`). */
  readonly queryKeyPrefix?: readonly string[];
}

export interface AIProviderProps {
  readonly config: AIConfig;
  readonly children: ReactNode;
}

const AIConfigContext = createContext<AIConfig | null>(null);

/** Provides AI configuration to child components and hooks. */
export function AIProvider({ config, children }: Readonly<AIProviderProps>) {
  const value = useMemo(
    () => ({
      ...config,
      basePath: config.basePath ?? DEFAULT_BASE_PATH,
    }),
    [config]
  );
  return <AIConfigContext value={value}>{children}</AIConfigContext>;
}

/** Returns the AI configuration from the nearest `AIProvider`. */
export function useAIConfig(): AIConfig {
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
