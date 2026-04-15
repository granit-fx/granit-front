import { useMemo } from 'react';

import { ExportProvider } from '../export/providers/export-provider.js';
import { ImportProvider } from '../import/providers/import-provider.js';

import type { ExportConfig } from '../export/providers/export-provider.js';
import type { ImportConfig } from '../import/providers/import-provider.js';
import type { AxiosInstance } from 'axios';
import type { ReactNode } from 'react';

/**
 * Shared configuration for both export and import providers.
 *
 * When {@link queryKeyPrefix} is supplied it is auto-suffixed with `'export'`
 * and `'import'` for the respective child provider so query keys never collide.
 * When omitted, each provider falls back to its own default prefix.
 */
export interface DataExchangeConfig {
  /**
   * Axios instance shared by export and import operations.
   *
   * Optional when a `GranitClientProvider` is present higher in the tree —
   * child providers resolve it from context.
   */
  readonly client?: AxiosInstance;
  /** Base path for data-exchange endpoints (default: `/api/v1/data-exchange`). */
  readonly basePath?: string;
  /** Optional prefix for React Query keys — suffixed with `'export'`/`'import'` automatically. */
  readonly queryKeyPrefix?: readonly string[];
}

export interface DataExchangeProviderProps {
  /** Configuration — optional when all defaults are acceptable. */
  readonly config?: DataExchangeConfig;
  readonly children: ReactNode;
}

const EMPTY_CONFIG: DataExchangeConfig = {};

/**
 * Convenience wrapper that configures both {@link ExportProvider} and
 * {@link ImportProvider} from a single shared configuration.
 *
 * When all config fields use their defaults (client from `GranitClientProvider`,
 * default basePath, no custom query key prefix), config can be omitted entirely.
 *
 * @example
 * ```tsx
 * <DataExchangeProvider>
 *   <Content />
 * </DataExchangeProvider>
 * ```
 */
export function DataExchangeProvider({ config = EMPTY_CONFIG, children }: Readonly<DataExchangeProviderProps>) {
  const exportConfig = useMemo<ExportConfig>(
    () => ({
      client: config.client,
      basePath: config.basePath,
      ...(config.queryKeyPrefix
        ? { queryKeyPrefix: [...config.queryKeyPrefix, 'export'] }
        : {}),
    }),
    [config]
  );

  const importConfig = useMemo<ImportConfig>(
    () => ({
      client: config.client,
      basePath: config.basePath,
      ...(config.queryKeyPrefix
        ? { queryKeyPrefix: [...config.queryKeyPrefix, 'import'] }
        : {}),
    }),
    [config]
  );

  return (
    <ExportProvider config={exportConfig}>
      <ImportProvider config={importConfig}>{children}</ImportProvider>
    </ExportProvider>
  );
}
