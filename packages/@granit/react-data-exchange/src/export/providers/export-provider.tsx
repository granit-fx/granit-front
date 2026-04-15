import { createContext, useContext, useMemo } from 'react';

import { useOptionalGranitClient } from '@granit/react-api-client';

import { DEFAULT_BASE_PATH } from '../../constants.js';

import type { AxiosInstance } from 'axios';
import type { ReactNode } from 'react';

/**
 * Configuration for the export provider.
 */
export interface ExportConfig {
  /**
   * Axios instance used for API calls.
   *
   * Optional when a `GranitClientProvider` is present higher in the tree.
   */
  readonly client?: AxiosInstance;
  /** Base path for export metadata endpoints (default: `/api/v1/data-exchange`). */
  readonly basePath?: string;
  /** Optional prefix for React Query keys. */
  readonly queryKeyPrefix?: readonly string[];
}

export interface ExportProviderProps {
  /** Configuration — optional when all defaults are acceptable. */
  readonly config?: ExportConfig;
  readonly children: ReactNode;
}

const EMPTY_CONFIG: ExportConfig = {};
const ExportConfigContext = createContext<ResolvedExportConfig | null>(null);

/**
 * Provides export configuration to child components and hooks.
 */
export function ExportProvider({ config = EMPTY_CONFIG, children }: Readonly<ExportProviderProps>) {
  const contextClient = useOptionalGranitClient();

  const value = useMemo<ResolvedExportConfig>(() => {
    const client = config.client ?? contextClient;
    if (!client) {
      throw new Error(
        'ExportProvider requires an Axios client. Provide it via config.client or wrap your app in a <GranitClientProvider>.'
      );
    }
    return {
      ...config,
      client,
      basePath: config.basePath ?? DEFAULT_BASE_PATH,
    };
  }, [config, contextClient]);

  return <ExportConfigContext value={value}>{children}</ExportConfigContext>;
}

/** Resolved config where client and basePath are always set. */
export type ResolvedExportConfig = ExportConfig & {
  readonly client: AxiosInstance;
  readonly basePath: string;
};

/**
 * Returns the export configuration from the nearest `ExportProvider`.
 * Throws if used outside a provider.
 */
export function useExportConfig(): ResolvedExportConfig {
  const ctx = useContext(ExportConfigContext);
  if (!ctx) {
    throw new Error('useExportConfig must be used within an ExportProvider');
  }
  return ctx;
}

/**
 * Builds a consistent React Query key for export operations.
 */
export function buildExportQueryKey(
  config: ExportConfig,
  ...segments: readonly string[]
): readonly unknown[] {
  const prefix = config.queryKeyPrefix ?? ['data-exchange', 'metadata'];
  return [...prefix, ...segments];
}
