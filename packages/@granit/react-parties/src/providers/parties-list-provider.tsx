// ---------------------------------------------------------------------------
// Parties-list query provider — wires the @granit/query-engine endpoint for
// the `MapGranitQuery<Party>()` collection exposed at `GET {basePath}`
// (it ships a `/meta`).
//
// Scoped to `${basePath}` with its own `queryKeyPrefix` so it never collides
// with the duplicates-inbox `<QueryProvider>` (scoped to `${basePath}/duplicates`
// under `['parties', 'duplicates', 'inbox']`). The list grid is driven by
// `usePartiesListQuery` (useQueryEndpoint) under this provider.
// ---------------------------------------------------------------------------

import { QueryProvider } from '@granit/react-query-engine';
import { useMemo } from 'react';

import { usePartiesConfig } from './parties-provider';

import type { QueryConfig } from '@granit/query-engine';
import type { ReactNode } from 'react';

/** Internal key prefix that scopes the parties-list grid cache. */
const LIST_QUERY_KEY_PREFIX = ['parties', 'list'] as const;

export interface PartiesListProviderProps {
  readonly children: ReactNode;
}

/**
 * Provides the parties-list query surface to {@link usePartiesListQuery}. Reads
 * the resolved client + base path from the parent `<PartiesProvider>` and mounts
 * a `<QueryProvider>` scoped to the `/parties` collection.
 *
 * @example
 * ```tsx
 * <PartiesProvider config={{ basePath }}>
 *   <PartiesListProvider>
 *     <PartiesGrid />
 *   </PartiesListProvider>
 * </PartiesProvider>
 * ```
 */
export function PartiesListProvider({ children }: Readonly<PartiesListProviderProps>) {
  const config = usePartiesConfig();
  const basePath = config.basePath!;

  const queryConfig = useMemo<QueryConfig>(
    () => ({
      client: config.client,
      basePath,
      queryKeyPrefix: [...LIST_QUERY_KEY_PREFIX],
    }),
    [config.client, basePath]
  );

  return <QueryProvider config={queryConfig}>{children}</QueryProvider>;
}
