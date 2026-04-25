import { createContext, useContext, useMemo } from 'react';

import { DEFAULT_BASE_PATH } from '../constants.js';

import type { AxiosInstance } from 'axios';
import type { ReactNode } from 'react';

/** Configuration for the catalog provider. */
export interface CatalogConfig {
  readonly client: AxiosInstance;
  /** Base path for catalog endpoints (default: `/api/v1/catalog`). */
  readonly basePath?: string;
  readonly queryKeyPrefix?: readonly string[];
}

export interface CatalogProviderProps {
  readonly config: CatalogConfig;
  readonly children: ReactNode;
}

const CatalogConfigContext = createContext<CatalogConfig | null>(null);

/** Provides catalog configuration to child components and hooks. */
export function CatalogProvider({ config, children }: Readonly<CatalogProviderProps>) {
  const value = useMemo(
    () => ({
      ...config,
      basePath: config.basePath ?? DEFAULT_BASE_PATH,
    }),
    [config]
  );
  return <CatalogConfigContext value={value}>{children}</CatalogConfigContext>;
}

/** Returns the catalog configuration from the nearest `CatalogProvider`. */
export function useCatalogConfig(): CatalogConfig {
  const ctx = useContext(CatalogConfigContext);
  if (!ctx) {
    throw new Error('useCatalogConfig must be used within a CatalogProvider');
  }
  return ctx;
}

/** Builds a consistent React Query key for catalog operations. */
export function buildCatalogQueryKey(
  config: CatalogConfig,
  ...segments: readonly string[]
): readonly unknown[] {
  const prefix = config.queryKeyPrefix ?? ['catalog'];
  return [...prefix, ...segments];
}
