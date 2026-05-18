import { useOptionalGranitClient } from '@granit/react-api-client';
import { createContext, useContext, useMemo } from 'react';

import { DEFAULT_BASE_PATH } from '../constants.js';

import type { AxiosInstance } from '@granit/api-client';
import type { ReactNode } from 'react';

/** Configuration for the catalog provider. */
export interface CatalogConfig {
  readonly client?: AxiosInstance;
  /** Base path prefix (default: `/api/v1/catalog`). */
  readonly basePath: string;
  readonly queryKeyPrefix?: readonly string[];
}

/**
 * CatalogConfig after the provider has resolved `client` from
 * `config.client` or the nearest `<GranitClientProvider>`.
 */
export interface ResolvedCatalogConfig extends CatalogConfig {
  readonly client: AxiosInstance;
}

/** Props accepted by {@link CatalogProvider}. `basePath` is optional — the default is applied by the provider. */
export interface CatalogProviderProps {
  readonly config: Omit<CatalogConfig, 'basePath'> & Partial<Pick<CatalogConfig, 'basePath'>>;
  readonly children: ReactNode;
}

const CatalogConfigContext = createContext<ResolvedCatalogConfig | null>(null);

const DEFAULT_QUERY_KEY_PREFIX = ['catalog'] as const;

/** Provides catalog configuration to child components and hooks. */
export function CatalogProvider({ config, children }: Readonly<CatalogProviderProps>) {
  const contextClient = useOptionalGranitClient();
  const value = useMemo(() => {
    const client = config.client ?? contextClient;
    if (!client) {
      throw new Error(
        'CatalogProvider requires an Axios client. Provide it via config.client or wrap your app in a <GranitClientProvider>.'
      );
    }
    return {
      ...config,
      basePath: config.basePath ?? DEFAULT_BASE_PATH,
      client,
    };
  }, [config, contextClient]);
  return <CatalogConfigContext value={value}>{children}</CatalogConfigContext>;
}

/** Returns the catalog configuration from the nearest `CatalogProvider`. */
export function useCatalogConfig(): ResolvedCatalogConfig {
  const ctx = useContext(CatalogConfigContext);
  if (!ctx) {
    throw new Error('useCatalogConfig must be used within a CatalogProvider');
  }
  return ctx;
}

/** Builds a consistent React Query key for catalog operations. */
export function buildCatalogQueryKey(
  config: CatalogConfig,
  ...segments: readonly unknown[]
): readonly unknown[] {
  const prefix = config.queryKeyPrefix ?? DEFAULT_QUERY_KEY_PREFIX;
  return [...prefix, ...segments];
}

export { DEFAULT_QUERY_KEY_PREFIX };
