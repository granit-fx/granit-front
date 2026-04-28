import { useOptionalGranitClient } from '@granit/react-api-client';
import { createContext, useContext, useMemo } from 'react';

import { DEFAULT_BASE_PATH } from '../constants.js';

import type { AxiosInstance } from '@granit/api-client';
import type { ReactNode } from 'react';

/** Configuration for the parties provider. */
export interface PartiesConfig {
  readonly client?: AxiosInstance;
  /** Base path for parties endpoints (default: `/api/v1/parties`). */
  readonly basePath?: string;
  readonly queryKeyPrefix?: readonly string[];
}

/**
 * PartiesConfig after the provider has resolved `client` from
 * `config.client` or the nearest `<GranitClientProvider>`.
 */
export interface ResolvedPartiesConfig extends PartiesConfig {
  readonly client: AxiosInstance;
}

export interface PartiesProviderProps {
  readonly config: PartiesConfig;
  readonly children: ReactNode;
}

const PartiesConfigContext = createContext<ResolvedPartiesConfig | null>(null);

/** Provides parties configuration to child components and hooks. */
export function PartiesProvider({ config, children }: Readonly<PartiesProviderProps>) {
  const contextClient = useOptionalGranitClient();
  const value = useMemo<ResolvedPartiesConfig>(() => {
    const client = config.client ?? contextClient;
    if (!client) {
      throw new Error(
        'PartiesProvider requires an Axios client. Provide it via config.client or wrap your app in a <GranitClientProvider>.'
      );
    }
    return {
      ...config,
      basePath: config.basePath ?? DEFAULT_BASE_PATH,
      client,
    };
  }, [config, contextClient]);
  return <PartiesConfigContext value={value}>{children}</PartiesConfigContext>;
}

/** Returns the parties configuration from the nearest `PartiesProvider`. */
export function usePartiesConfig(): ResolvedPartiesConfig {
  const ctx = useContext(PartiesConfigContext);
  if (!ctx) {
    throw new Error('usePartiesConfig must be used within a PartiesProvider');
  }
  return ctx;
}

/** Builds a consistent React Query key for parties operations. */
export function buildPartiesQueryKey(
  config: PartiesConfig,
  ...segments: readonly unknown[]
): readonly unknown[] {
  const prefix = config.queryKeyPrefix ?? ['parties'];
  return [...prefix, ...segments];
}
