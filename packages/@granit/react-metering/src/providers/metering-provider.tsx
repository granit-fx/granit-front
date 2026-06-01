import { useOptionalGranitClient } from '@granit/react-api-client';
import { createContext, useContext, useMemo } from 'react';

import { DEFAULT_BASE_PATH } from '../constants';

import type { AxiosInstance } from '@granit/api-client';
import type { ReactNode } from 'react';

/** Configuration for the metering provider. */
export interface MeteringConfig {
  readonly client?: AxiosInstance;
  /** Base path for metering endpoints (default: `/api/v1/metering`). */
  readonly basePath?: string;
  readonly queryKeyPrefix?: readonly string[];
}

/**
 * MeteringConfig after the provider has resolved `client` from
 * `config.client` or the nearest `<GranitClientProvider>`.
 */
export interface ResolvedMeteringConfig extends MeteringConfig {
  readonly client: AxiosInstance;
}

export interface MeteringProviderProps {
  readonly config: MeteringConfig;
  readonly children: ReactNode;
}

const MeteringConfigContext = createContext<ResolvedMeteringConfig | null>(null);

/** Provides metering configuration to child components and hooks. */
export function MeteringProvider({ config, children }: Readonly<MeteringProviderProps>) {
  const contextClient = useOptionalGranitClient();
  const value = useMemo<ResolvedMeteringConfig>(() => {
    const client = config.client ?? contextClient;
    if (!client) {
      throw new Error(
        'MeteringProvider requires an Axios client. Provide it via config.client or wrap your app in a <GranitClientProvider>.'
      );
    }
    return {
      ...config,
      basePath: config.basePath ?? DEFAULT_BASE_PATH,
      client,
    };
  }, [config, contextClient]);
  return <MeteringConfigContext value={value}>{children}</MeteringConfigContext>;
}

/** Returns the metering configuration from the nearest `MeteringProvider`. */
export function useMeteringConfig(): ResolvedMeteringConfig {
  const ctx = useContext(MeteringConfigContext);
  if (!ctx) {
    throw new Error('useMeteringConfig must be used within a MeteringProvider');
  }
  return ctx;
}

/** Builds a consistent React Query key for metering operations. */
export function buildMeteringQueryKey(
  config: MeteringConfig,
  ...segments: readonly string[]
): readonly unknown[] {
  const prefix = config.queryKeyPrefix ?? ['metering'];
  return [...prefix, ...segments];
}
