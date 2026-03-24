// ---------------------------------------------------------------------------
// QueryProvider — React context for a single query endpoint
// ---------------------------------------------------------------------------

import { createContext, useContext, useMemo } from 'react';

import type { QueryConfig } from '@granit/query-engine';
import type { ReactNode } from 'react';

const QueryConfigContext = createContext<QueryConfig | null>(null);

export interface QueryProviderProps {
  readonly config: QueryConfig;
  readonly children: ReactNode;
}

/**
 * Provides query configuration to all querying hooks below in the tree.
 *
 * @example
 * ```tsx
 * <QueryProvider config={{ client: api, basePath: '/api/v1/patients' }}>
 *   <PatientList />
 * </QueryProvider>
 * ```
 */
export function QueryProvider({ config, children }: Readonly<QueryProviderProps>) {
  const value = useMemo(() => config, [config]);
  return <QueryConfigContext value={value}>{children}</QueryConfigContext>;
}

/**
 * Access the QueryConfig from the nearest QueryProvider.
 *
 * @throws Error if used outside a QueryProvider.
 */
export function useQueryConfig(): QueryConfig {
  const ctx = useContext(QueryConfigContext);
  if (!ctx) {
    throw new Error('useQueryConfig must be used within a QueryProvider');
  }
  return ctx;
}
