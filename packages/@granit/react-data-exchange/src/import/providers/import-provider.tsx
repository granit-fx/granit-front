import { useOptionalGranitClient } from '@granit/react-api-client';
import { createContext, useContext, useMemo } from 'react';

import { DEFAULT_BASE_PATH } from '../../constants.js';

import type { AxiosInstance } from '@granit/api-client';
import type { ReactNode } from 'react';

/**
 * Configuration for the import provider.
 */
export interface ImportConfig {
  /**
   * Axios instance used for API calls.
   *
   * Optional when a `GranitClientProvider` is present higher in the tree.
   */
  readonly client?: AxiosInstance;
  /** Base path for import endpoints (default: `/api/v1/data-exchange`). */
  readonly basePath?: string;
  /** Optional prefix for React Query keys. */
  readonly queryKeyPrefix?: readonly string[];
}

export interface ImportProviderProps {
  /** Configuration — optional when all defaults are acceptable. */
  readonly config?: ImportConfig;
  readonly children: ReactNode;
}

const EMPTY_CONFIG: ImportConfig = {};
const ImportConfigContext = createContext<ResolvedImportConfig | null>(null);

/**
 * Provides import configuration to child components and hooks.
 */
export function ImportProvider({ config = EMPTY_CONFIG, children }: Readonly<ImportProviderProps>) {
  const contextClient = useOptionalGranitClient();

  const value = useMemo<ResolvedImportConfig>(() => {
    const client = config.client ?? contextClient;
    if (!client) {
      throw new Error(
        'ImportProvider requires an Axios client. Provide it via config.client or wrap your app in a <GranitClientProvider>.'
      );
    }
    return {
      ...config,
      client,
      basePath: config.basePath ?? DEFAULT_BASE_PATH,
    };
  }, [config, contextClient]);

  return <ImportConfigContext value={value}>{children}</ImportConfigContext>;
}

/** Resolved config where client and basePath are always set. */
export type ResolvedImportConfig = ImportConfig & {
  readonly client: AxiosInstance;
  readonly basePath: string;
};

/**
 * Returns the import configuration from the nearest `ImportProvider`.
 * Throws if used outside a provider.
 */
export function useImportConfig(): ResolvedImportConfig {
  const ctx = useContext(ImportConfigContext);
  if (!ctx) {
    throw new Error('useImportConfig must be used within an ImportProvider');
  }
  return ctx;
}

/**
 * Builds a consistent React Query key for import operations.
 */
export function buildImportQueryKey(
  config: ImportConfig,
  ...segments: readonly string[]
): readonly unknown[] {
  const prefix = config.queryKeyPrefix ?? ['data-exchange', 'import'];
  return [...prefix, ...segments];
}
