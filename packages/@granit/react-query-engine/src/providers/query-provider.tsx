// ---------------------------------------------------------------------------
// QueryProvider — React context for a single query endpoint
// ---------------------------------------------------------------------------

import { useOptionalGranitClient } from '@granit/react-api-client';
import { createContext, useContext, useMemo } from 'react';

import type { QueryConfig, ResolvedQueryConfig } from '@granit/query-engine';
import type { ReactNode } from 'react';

const QueryConfigContext = createContext<ResolvedQueryConfig | null>(null);

export interface QueryProviderProps {
  readonly config: QueryConfig;
  readonly children: ReactNode;
}

/**
 * Provides query configuration to all querying hooks below in the tree.
 *
 * When `config.client` is omitted, the provider resolves it from the nearest
 * `GranitClientProvider`. If neither is available, an error is thrown.
 *
 * @example
 * ```tsx
 * <QueryProvider config={{ basePath: '/api/v1/patients' }}>
 *   <PatientList />
 * </QueryProvider>
 * ```
 */
export function QueryProvider({ config, children }: Readonly<QueryProviderProps>) {
  const contextClient = useOptionalGranitClient();

  const value = useMemo<ResolvedQueryConfig>(() => {
    const client = config.client ?? contextClient;
    if (!client) {
      throw new Error(
        'QueryProvider requires an Axios client. Provide it via config.client or wrap your app in a <GranitClientProvider>.'
      );
    }
    return { ...config, client };
  }, [config, contextClient]);

  return <QueryConfigContext value={value}>{children}</QueryConfigContext>;
}

/**
 * Access the QueryConfig from the nearest QueryProvider.
 *
 * @throws Error if used outside a QueryProvider.
 */
export function useQueryConfig(): ResolvedQueryConfig {
  const ctx = useContext(QueryConfigContext);
  if (!ctx) {
    throw new Error('useQueryConfig must be used within a QueryProvider');
  }
  return ctx;
}
