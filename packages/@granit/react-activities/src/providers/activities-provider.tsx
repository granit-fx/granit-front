import { useOptionalGranitClient } from '@granit/react-api-client';
import { createContext, useContext, useMemo } from 'react';

import { DEFAULT_BASE_PATH, DEFAULT_QUERY_KEY_PREFIX } from '../constants.js';

import type { AxiosInstance } from '@granit/api-client';
import type { ReactNode } from 'react';

/** Configuration for the activities provider. */
export interface ActivitiesConfig {
  readonly client?: AxiosInstance;
  /** Base path for activity endpoints (default: `/api/v1/activities`). */
  readonly basePath?: string;
  readonly queryKeyPrefix?: readonly string[];
}

/**
 * ActivitiesConfig after the provider has resolved `client` from
 * `config.client` or the nearest `<GranitClientProvider>`.
 */
export interface ResolvedActivitiesConfig extends ActivitiesConfig {
  readonly client: AxiosInstance;
  readonly basePath: string;
  readonly queryKeyPrefix: readonly string[];
}

export interface ActivitiesProviderProps {
  readonly config: ActivitiesConfig;
  readonly children: ReactNode;
}

const ActivitiesConfigContext = createContext<ResolvedActivitiesConfig | null>(null);

/** Provides activities configuration to child components and hooks. */
export function ActivitiesProvider({ config, children }: Readonly<ActivitiesProviderProps>) {
  const contextClient = useOptionalGranitClient();
  const value = useMemo<ResolvedActivitiesConfig>(() => {
    const client = config.client ?? contextClient;
    if (!client) {
      throw new Error(
        'ActivitiesProvider requires an Axios client. Provide it via config.client or wrap your app in a <GranitClientProvider>.'
      );
    }
    return {
      ...config,
      client,
      basePath: config.basePath ?? DEFAULT_BASE_PATH,
      queryKeyPrefix: config.queryKeyPrefix ?? [...DEFAULT_QUERY_KEY_PREFIX],
    };
  }, [config, contextClient]);
  return <ActivitiesConfigContext value={value}>{children}</ActivitiesConfigContext>;
}

/** Returns the activities configuration from the nearest `ActivitiesProvider`. */
export function useActivitiesConfig(): ResolvedActivitiesConfig {
  const ctx = useContext(ActivitiesConfigContext);
  if (!ctx) {
    throw new Error('useActivitiesConfig must be used within an ActivitiesProvider');
  }
  return ctx;
}

/** Builds a consistent React Query key for activities operations. */
export function buildActivitiesQueryKey(
  config: ResolvedActivitiesConfig,
  ...segments: readonly unknown[]
): readonly unknown[] {
  return [...config.queryKeyPrefix, ...segments];
}
