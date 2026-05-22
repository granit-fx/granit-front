import { useOptionalGranitClient } from '@granit/react-api-client';
import { createContext, useContext, useMemo } from 'react';

import { DEFAULT_BASE_PATH } from '../constants.js';

import type { AxiosInstance } from '@granit/api-client';
import type { ReactNode } from 'react';

export interface PresenceConfig {
  /** Axios client. Falls back to the nearest `<GranitClientProvider>`. */
  readonly client?: AxiosInstance;
  /**
   * Base path the API functions are called with. Defaults to `/api/v1`.
   * The module segment (`presence`) is appended internally.
   */
  readonly basePath?: string;
  /** Prefix for query keys — useful to namespace caches in multi-tenant apps. */
  readonly queryKeyPrefix?: readonly string[];
}

export interface ResolvedPresenceConfig extends PresenceConfig {
  readonly client: AxiosInstance;
  readonly basePath: string;
  readonly queryKeyPrefix: readonly string[];
}

const DEFAULT_KEY_PREFIX = ['presence'] as const;

const PresenceContext = createContext<ResolvedPresenceConfig | null>(null);

export interface PresenceProviderProps {
  readonly config?: PresenceConfig;
  readonly children: ReactNode;
}

export function usePresenceConfig(): ResolvedPresenceConfig {
  const config = useContext(PresenceContext);
  if (!config) {
    throw new Error('usePresenceConfig must be used within a <PresenceProvider>');
  }
  return config;
}

export function buildPresenceQueryKey(
  config: ResolvedPresenceConfig,
  ...segments: readonly unknown[]
): readonly unknown[] {
  return [...config.queryKeyPrefix, ...segments];
}

export function PresenceProvider({ config, children }: Readonly<PresenceProviderProps>) {
  const contextClient = useOptionalGranitClient();
  const value = useMemo<ResolvedPresenceConfig>(() => {
    const client = config?.client ?? contextClient;
    if (!client) {
      throw new Error(
        'PresenceProvider requires an Axios client. Provide it via config.client or wrap your app in a <GranitClientProvider>.'
      );
    }
    return {
      ...config,
      client,
      basePath: config?.basePath ?? DEFAULT_BASE_PATH,
      queryKeyPrefix: config?.queryKeyPrefix ?? DEFAULT_KEY_PREFIX,
    };
  }, [config, contextClient]);

  return <PresenceContext value={value}>{children}</PresenceContext>;
}
