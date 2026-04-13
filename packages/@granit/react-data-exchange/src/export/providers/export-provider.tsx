import { createContext, useContext, useMemo } from 'react';

import { DEFAULT_BASE_PATH } from '../../constants.js';

import type { AxiosInstance } from 'axios';
import type { ReactNode } from 'react';

/**
 * Configuration for the export provider.
 */
export interface ExportConfig {
  /** Axios instance used for API calls. */
  readonly client: AxiosInstance;
  /** Base path for export metadata endpoints (default: `/api/v1/data-exchange`). */
  readonly basePath?: string;
  /** Optional prefix for React Query keys. */
  readonly queryKeyPrefix?: readonly string[];
}

export interface ExportProviderProps {
  readonly config: ExportConfig;
  readonly children: ReactNode;
}

const ExportConfigContext = createContext<ExportConfig | null>(null);

/**
 * Provides export configuration to child components and hooks.
 */
export function ExportProvider({ config, children }: Readonly<ExportProviderProps>) {
  const value = useMemo<ExportConfig>(
    () => ({
      ...config,
      basePath: config.basePath ?? DEFAULT_BASE_PATH,
    }),
    [config]
  );
  return <ExportConfigContext value={value}>{children}</ExportConfigContext>;
}

/** Resolved config where basePath is always set. */
export type ResolvedExportConfig = ExportConfig & { readonly basePath: string };

/**
 * Returns the export configuration from the nearest `ExportProvider`.
 * Throws if used outside a provider.
 */
export function useExportConfig(): ResolvedExportConfig {
  const ctx = useContext(ExportConfigContext);
  if (!ctx) {
    throw new Error('useExportConfig must be used within an ExportProvider');
  }
  return ctx as ResolvedExportConfig;
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
