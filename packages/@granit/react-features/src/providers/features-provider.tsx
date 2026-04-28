import { useOptionalGranitClient } from '@granit/react-api-client';
import { createContext, useContext, useMemo } from 'react';

import { DEFAULT_BASE_PATH } from '../constants.js';

import type { AxiosInstance } from '@granit/api-client';
import type { ReactNode } from 'react';

/** Configuration for the features provider. */
export interface FeaturesConfig {
  readonly client?: AxiosInstance;
  /** Base path for features endpoints (default: `/api/v1/features`). */
  readonly basePath?: string;
  readonly queryKeyPrefix?: readonly string[];
}

/**
 * FeaturesConfig after the provider has resolved `client` from
 * `config.client` or the nearest `<GranitClientProvider>`.
 */
export interface ResolvedFeaturesConfig extends FeaturesConfig {
  readonly client: AxiosInstance;
}

export interface FeaturesProviderProps {
  readonly config: FeaturesConfig;
  readonly children: ReactNode;
}

const FeaturesConfigContext = createContext<ResolvedFeaturesConfig | null>(null);

/** Provides features configuration to child components and hooks. */
export function FeaturesProvider({ config, children }: Readonly<FeaturesProviderProps>) {
  const contextClient = useOptionalGranitClient();
  const value = useMemo<ResolvedFeaturesConfig>(() => {
    const client = config.client ?? contextClient;
    if (!client) {
      throw new Error(
        'FeaturesProvider requires an Axios client. Provide it via config.client or wrap your app in a <GranitClientProvider>.'
      );
    }
    return {
      ...config,
      basePath: config.basePath ?? DEFAULT_BASE_PATH,
      client,
    };
  }, [config, contextClient]);
  return <FeaturesConfigContext value={value}>{children}</FeaturesConfigContext>;
}

/** Returns the features configuration from the nearest `FeaturesProvider`. */
export function useFeaturesConfig(): ResolvedFeaturesConfig {
  const ctx = useContext(FeaturesConfigContext);
  if (!ctx) {
    throw new Error('useFeaturesConfig must be used within a FeaturesProvider');
  }
  return ctx;
}

/** Builds a consistent React Query key for features operations. */
export function buildFeaturesQueryKey(
  config: FeaturesConfig,
  ...segments: readonly string[]
): readonly unknown[] {
  const prefix = config.queryKeyPrefix ?? ['features'];
  return [...prefix, ...segments];
}
