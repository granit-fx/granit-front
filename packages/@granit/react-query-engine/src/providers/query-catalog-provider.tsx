// ---------------------------------------------------------------------------
// QueryCatalogProvider — React context for the query-engine catalogue root
//
// Distinct from QueryProvider (a single query endpoint): this points at the
// query-engine root where `GET /catalog` is mounted, so an editor can list
// every registered query and then load a chosen query's metadata by its
// resolved `basePath`. Optional by design — consumers degrade to free-text
// when no provider is present.
// ---------------------------------------------------------------------------

import { useOptionalGranitClient } from '@granit/react-api-client';
import { createContext, useContext, useMemo } from 'react';

import type { AxiosInstance } from '@granit/api-client';
import type { ReactNode } from 'react';

/** Configuration for the query-engine catalogue surface. */
export interface QueryCatalogConfig {
  /**
   * Axios instance (from @granit/api-client).
   *
   * Optional when a `GranitClientProvider` from `@granit/react-api-client`
   * is present higher in the React tree — the provider resolves it from context.
   */
  readonly client?: AxiosInstance;
  /** Query-engine root path where `/catalog` is mounted (e.g. "/api/v1"). */
  readonly basePath: string;
}

/** Resolved config where client is guaranteed to be set. */
export type ResolvedQueryCatalogConfig = QueryCatalogConfig & { readonly client: AxiosInstance };

const QueryCatalogContext = createContext<ResolvedQueryCatalogConfig | null>(null);

export interface QueryCatalogProviderProps {
  readonly config: QueryCatalogConfig;
  readonly children: ReactNode;
}

/**
 * Provides the query catalogue root to the query-picker hooks below in the tree.
 *
 * When `config.client` is omitted, the provider resolves it from the nearest
 * `GranitClientProvider`. If neither is available, an error is thrown.
 *
 * @example
 * ```tsx
 * <QueryCatalogProvider config={{ basePath: '/api/v1' }}>
 *   <WidgetConfigDrawer … />
 * </QueryCatalogProvider>
 * ```
 */
export function QueryCatalogProvider({ config, children }: Readonly<QueryCatalogProviderProps>) {
  const contextClient = useOptionalGranitClient();

  const value = useMemo<ResolvedQueryCatalogConfig>(() => {
    const client = config.client ?? contextClient;
    if (!client) {
      throw new Error(
        'QueryCatalogProvider requires an Axios client. Provide it via config.client or wrap your app in a <GranitClientProvider>.'
      );
    }
    return { ...config, client };
  }, [config, contextClient]);

  return <QueryCatalogContext value={value}>{children}</QueryCatalogContext>;
}

/**
 * Access the catalogue config from the nearest {@link QueryCatalogProvider}, or
 * `null` when there is none. Lets query pickers degrade to free-text input
 * rather than throw when the editor host has not opted into the catalogue.
 */
export function useOptionalQueryCatalogConfig(): ResolvedQueryCatalogConfig | null {
  return useContext(QueryCatalogContext);
}
