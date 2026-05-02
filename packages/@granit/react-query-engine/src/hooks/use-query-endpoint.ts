// ---------------------------------------------------------------------------
// useQueryEndpoint — main data fetching hook (Story #49)
//
// Wraps the shared reducer (`useQueryEndpointReducer`) with a `useQuery` /
// grouped-query call against the host's `<QueryProvider>`. When the tree
// also mounts a `<QueryEndpointStateProvider>`, the hook reads its
// `params` + dispatchers from that shared reducer so toolbar changes
// (SmartFilterBar, SortSelector, preset toggles) propagate to every
// renderer below without prop-drilling.
// ---------------------------------------------------------------------------

import { buildQueryKey, getGrouped, getPage } from '@granit/query-engine';
import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { useMemo } from 'react';

import { useQueryEndpointStateContext } from '../providers/query-endpoint-state-provider.js';
import { useQueryConfig } from '../providers/query-provider.js';

import {
  useQueryEndpointReducer,
  type QueryEndpointDispatchers,
} from './use-query-endpoint-reducer.js';

import type { GroupedResult, PagedResult, QueryRequest } from '@granit/query-engine';
import type { UseQueryResult } from '@tanstack/react-query';

// ---------------------------------------------------------------------------
// Hook options & return type
// ---------------------------------------------------------------------------

export interface UseQueryEndpointOptions {
  /**
   * Initial query parameters. Ignored when the tree mounts a
   * `<QueryEndpointStateProvider>` — the provider's seed wins so toolbar
   * and renderer share a single reducer.
   */
  readonly initialParams?: QueryRequest;
  /** Whether the query is enabled. Defaults to true. */
  readonly enabled?: boolean;
}

export interface UseQueryEndpointReturn<T> extends QueryEndpointDispatchers {
  /** Current query parameters. */
  readonly params: QueryRequest;
  /** Query result for flat (paged) data. */
  readonly query: UseQueryResult<PagedResult<T>>;
  /** Query result for grouped data (when groupBy is set). */
  readonly groupedQuery: UseQueryResult<GroupedResult<T>>;
  /** Whether grouped mode is active. */
  readonly isGrouped: boolean;
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

/**
 * Main hook for querying a data endpoint.
 *
 * Manages query state via `useQueryEndpointReducer` and fetches data via
 * TanStack Query. Uses `placeholderData: keepPreviousData` for smooth
 * pagination transitions.
 *
 * Solo mode (no provider): every call creates its own reducer. Useful
 * for self-contained list pages where the toolbar lives in the same
 * component as the data fetch.
 *
 * Shared mode (with `<QueryEndpointStateProvider>`): the hook reads
 * `params` + dispatchers from the provider's reducer. Multiple components
 * below the provider see the same `params`; each runs `useQuery` with
 * the same query key, so React Query dedupes the actual network call.
 *
 * @example
 * ```tsx
 * const { query, params, setSearch, setPage, toggleSort } = useQueryEndpoint<Patient>();
 *
 * if (query.isLoading) return <Spinner />;
 * const { items, totalCount } = query.data!;
 * ```
 */
export function useQueryEndpoint<T>(options?: UseQueryEndpointOptions): UseQueryEndpointReturn<T> {
  const config = useQueryConfig();
  const enabled = options?.enabled ?? true;

  // Always create a local reducer to satisfy rules-of-hooks. When a
  // QueryEndpointStateProvider is present, the local copy is ignored and
  // the provider's state wins.
  const local = useQueryEndpointReducer(options?.initialParams);
  const shared = useQueryEndpointStateContext();
  const state = shared ?? local;

  const { params } = state;
  const isGrouped = params.groupBy != null;

  // Flat (paged) query
  const pagedQueryKey = useMemo(() => [...buildQueryKey(config, 'list'), params], [config, params]);

  const query = useQuery({
    queryKey: pagedQueryKey,
    queryFn: () => getPage<T>(config.client, config.basePath, params),
    enabled: enabled && !isGrouped,
    placeholderData: keepPreviousData,
  });

  // Grouped query
  const groupedQueryKey = useMemo(
    () => [...buildQueryKey(config, 'grouped'), params],
    [config, params]
  );

  const groupedQuery = useQuery({
    queryKey: groupedQueryKey,
    queryFn: () => getGrouped<T>(config.client, config.basePath, params),
    enabled: enabled && isGrouped,
    placeholderData: keepPreviousData,
  });

  return {
    params,
    query,
    groupedQuery,
    isGrouped,
    setPage: state.setPage,
    setPageSize: state.setPageSize,
    setSearch: state.setSearch,
    setFilters: state.setFilters,
    addFilter: state.addFilter,
    removeFilter: state.removeFilter,
    setSort: state.setSort,
    toggleSort: state.toggleSort,
    setPresets: state.setPresets,
    setQuickFilters: state.setQuickFilters,
    toggleQuickFilter: state.toggleQuickFilter,
    setGroupBy: state.setGroupBy,
    setParams: state.setParams,
    reset: state.reset,
  };
}
