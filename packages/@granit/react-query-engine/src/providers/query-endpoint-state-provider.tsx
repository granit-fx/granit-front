// ---------------------------------------------------------------------------
// QueryEndpointStateProvider — lifts the query-endpoint reducer into a React
// context so a host's chrome (SmartFilterBar, SortSelector, preset toggles)
// and its body (the renderer that paints rows — list / kanban / gallery /
// calendar) can share a single source of truth for filter, sort, search,
// presets, quickFilters, groupBy, page and pageSize.
//
// Without this provider every `useQueryEndpoint()` call creates its own
// reducer; toolbar dispatches and renderer reads happen against
// independent copies and the renderer never reacts. Wrap the screen tree
// with this provider and they sync transparently.
// ---------------------------------------------------------------------------

import { createContext, useContext, type ReactNode } from 'react';

import {
  DEFAULT_QUERY_PARAMS,
  useQueryEndpointReducer,
  type QueryEndpointState,
} from '../hooks/use-query-endpoint-reducer.js';

import type { QueryRequest } from '@granit/query-engine';

const QueryEndpointStateContext = createContext<QueryEndpointState | null>(null);

export interface QueryEndpointStateProviderProps {
  /**
   * Initial parameters seeded into the shared reducer. Defaults to
   * `{ page: 1, pageSize: 20 }`. Rarely needed unless the host wants to
   * pre-fill a search or preset before mount.
   */
  readonly initialParams?: QueryRequest;
  readonly children: ReactNode;
}

/**
 * Owns a shared `useQueryEndpointReducer` and publishes its `params` +
 * dispatchers via context. Components beneath this provider that call
 * `useQueryEndpoint()` (or read params directly via
 * `useQueryEndpointState()`) talk to this single reducer instead of
 * creating their own.
 *
 * Mount once per screen — typically in the page layout that owns both
 * the toolbar (which writes filter / sort / search) and the renderer
 * (which reads them):
 *
 * ```tsx
 * <QueryProvider config={{ basePath: '/api/v1/parties' }}>
 *   <QueryEndpointStateProvider>
 *     <SmartFilterBar />            // dispatches setFilters / setSearch
 *     <SortSelector />              // dispatches toggleSort
 *     <EntityGallery manifest={…} />  // reads filter / sort via params
 *   </QueryEndpointStateProvider>
 * </QueryProvider>
 * ```
 *
 * Backwards compatible — pages that don't wrap with this provider keep
 * the previous local-state behaviour. Adding it later is non-breaking.
 */
export function QueryEndpointStateProvider({
  initialParams,
  children,
}: QueryEndpointStateProviderProps) {
  const state = useQueryEndpointReducer(initialParams);
  return (
    <QueryEndpointStateContext.Provider value={state}>
      {children}
    </QueryEndpointStateContext.Provider>
  );
}

/**
 * Reads the shared query-endpoint state (params + dispatchers) from the
 * nearest `<QueryEndpointStateProvider>`. Returns `null` when no provider
 * is present so callers can decide whether to fall back to local state
 * or to a default.
 *
 * Most callers want `useQueryEndpointState()` instead — that hook returns
 * a guaranteed non-null state (defaulting `params` to the standard
 * `{ page: 1, pageSize: 20 }` outside a provider) and is the right tool
 * for renderers that just need to read params.
 */
export function useQueryEndpointStateContext(): QueryEndpointState | null {
  return useContext(QueryEndpointStateContext);
}

const DEFAULT_STATE: QueryEndpointState = {
  params: DEFAULT_QUERY_PARAMS,
  setPage: noop,
  setPageSize: noop,
  setSearch: noop,
  setFilters: noop,
  addFilter: noop,
  removeFilter: noop,
  setSort: noop,
  toggleSort: noop,
  setPresets: noop,
  setQuickFilters: noop,
  toggleQuickFilter: noop,
  setGroupBy: noop,
  setParams: noop,
  reset: noop,
};

function noop(): void {
  /* no-op fallback when no provider is mounted */
}

/**
 * Returns the current shared query-endpoint state — `params` plus every
 * dispatcher (`setSearch`, `setFilters`, `toggleSort`, …). Outside a
 * `<QueryEndpointStateProvider>` returns a no-op default so renderers
 * that read `params` keep working in embed scenarios where no toolbar
 * is wired up.
 *
 * Renderers like `<EntityGallery />` use this hook to thread the host's
 * filter / sort / search / groupBy into their own data-fetch calls
 * without needing the host to plumb props down by hand.
 */
export function useQueryEndpointState(): QueryEndpointState {
  return useContext(QueryEndpointStateContext) ?? DEFAULT_STATE;
}
