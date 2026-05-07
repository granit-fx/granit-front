import { useOptionalGranitClient } from '@granit/react-api-client';
import { createContext, useContext, useMemo } from 'react';

import { DEFAULT_BASE_PATH, DEFAULT_QUERY_KEY_PREFIX } from '../constants.js';

import type { AxiosInstance } from '@granit/api-client';
import type { ReactNode } from 'react';

/** Configuration for the taxonomy provider. */
export interface TaxonomyConfig {
  readonly client?: AxiosInstance;
  /** Base path for taxonomy endpoints (default: `/api/v1/taxonomy`). */
  readonly basePath?: string;
  readonly queryKeyPrefix?: readonly string[];
}

/**
 * TaxonomyConfig after the provider has resolved `client` from
 * `config.client` or the nearest `<GranitClientProvider>`.
 */
export interface ResolvedTaxonomyConfig extends TaxonomyConfig {
  readonly client: AxiosInstance;
  readonly basePath: string;
  readonly queryKeyPrefix: readonly string[];
}

export interface TaxonomyProviderProps {
  readonly config: TaxonomyConfig;
  readonly children: ReactNode;
}

const TaxonomyConfigContext = createContext<ResolvedTaxonomyConfig | null>(null);

/** Provides taxonomy configuration to child components and hooks. */
export function TaxonomyProvider({ config, children }: Readonly<TaxonomyProviderProps>) {
  const contextClient = useOptionalGranitClient();
  const value = useMemo<ResolvedTaxonomyConfig>(() => {
    const client = config.client ?? contextClient;
    if (!client) {
      throw new Error(
        'TaxonomyProvider requires an Axios client. Provide it via config.client or wrap your app in a <GranitClientProvider>.'
      );
    }
    return {
      ...config,
      client,
      basePath: config.basePath ?? DEFAULT_BASE_PATH,
      queryKeyPrefix: config.queryKeyPrefix ?? [...DEFAULT_QUERY_KEY_PREFIX],
    };
  }, [config, contextClient]);
  return <TaxonomyConfigContext value={value}>{children}</TaxonomyConfigContext>;
}

/** Returns the taxonomy configuration from the nearest `TaxonomyProvider`. */
export function useTaxonomyConfig(): ResolvedTaxonomyConfig {
  const ctx = useContext(TaxonomyConfigContext);
  if (!ctx) {
    throw new Error('useTaxonomyConfig must be used within a TaxonomyProvider');
  }
  return ctx;
}

/** Builds a consistent React Query key for taxonomy operations. */
export function buildTaxonomyQueryKey(
  config: ResolvedTaxonomyConfig,
  ...segments: readonly unknown[]
): readonly unknown[] {
  return [...config.queryKeyPrefix, ...segments];
}
