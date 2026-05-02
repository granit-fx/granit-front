// ---------------------------------------------------------------------------
// useQueryEndpointReducer — shared state machine for useQueryEndpoint and the
// QueryEndpointStateProvider context. Exposes params + memoised dispatchers
// without touching the network — the actual `useQuery` call lives in
// `useQueryEndpoint` so the reducer can be reused both for solo callers
// (one component fetches + dispatches) and for shared host setups
// (toolbar dispatches, body fetches).
// ---------------------------------------------------------------------------

import { useCallback, useMemo, useReducer } from 'react';

import type { FilterEntry, QueryRequest, SortEntry } from '@granit/query-engine';

// ---------------------------------------------------------------------------
// Reducer
// ---------------------------------------------------------------------------

type QueryAction =
  | { type: 'SET_PAGE'; page: number }
  | { type: 'SET_PAGE_SIZE'; pageSize: number }
  | { type: 'SET_SEARCH'; search: string }
  | { type: 'SET_FILTERS'; filters: readonly FilterEntry[] }
  | { type: 'ADD_FILTER'; filter: FilterEntry }
  | { type: 'REMOVE_FILTER'; field: string; operator?: string }
  | { type: 'SET_SORT'; sort: readonly SortEntry[] }
  | { type: 'TOGGLE_SORT'; field: string }
  | { type: 'SET_PRESETS'; group: string; names: readonly string[] }
  | { type: 'SET_QUICK_FILTERS'; quickFilters: readonly string[] }
  | { type: 'TOGGLE_QUICK_FILTER'; name: string }
  | { type: 'SET_GROUP_BY'; groupBy: string | undefined }
  | { type: 'SET_PARAMS'; params: QueryRequest }
  | { type: 'RESET' };

interface QueryState {
  readonly params: QueryRequest;
  readonly initialParams: QueryRequest;
}

/**
 * Pure reducer managing query state transitions.
 *
 * All filter/search/preset/quick-filter changes reset page to 1 so the user
 * always sees the first page of matching results after changing criteria.
 * Sort and groupBy changes keep the current page (intentional).
 */
function queryReducer(state: QueryState, action: QueryAction): QueryState {
  const { params } = state;

  switch (action.type) {
    case 'SET_PAGE':
      return { ...state, params: { ...params, page: action.page } };

    case 'SET_PAGE_SIZE':
      return { ...state, params: { ...params, pageSize: action.pageSize, page: 1 } };

    case 'SET_SEARCH':
      return { ...state, params: { ...params, search: action.search || undefined, page: 1 } };

    case 'SET_FILTERS':
      return { ...state, params: { ...params, filters: action.filters, page: 1 } };

    /** Upsert: replaces existing filter with same field+operator, otherwise appends. */
    case 'ADD_FILTER': {
      const existing = params.filters ?? [];
      const filtered = existing.filter(
        (f) => !(f.field === action.filter.field && f.operator === action.filter.operator)
      );
      return {
        ...state,
        params: { ...params, filters: [...filtered, action.filter], page: 1 },
      };
    }

    /** Removes by field+operator pair, or all filters for a field if operator is omitted. */
    case 'REMOVE_FILTER': {
      const existing = params.filters ?? [];
      const filtered = existing.filter((f) => {
        if (f.field !== action.field) return true;
        if (action.operator === undefined) return false;
        return f.operator !== action.operator;
      });
      return { ...state, params: { ...params, filters: filtered, page: 1 } };
    }

    case 'SET_SORT':
      return { ...state, params: { ...params, sort: action.sort } };

    /** Three-state toggle: asc → desc → off. */
    case 'TOGGLE_SORT': {
      const current = params.sort ?? [];
      const existing = current.find((s) => s.field === action.field);
      let newSort: readonly SortEntry[];
      if (!existing) {
        newSort = [{ field: action.field, direction: 'asc' }];
      } else if (existing.direction === 'asc') {
        newSort = [{ field: action.field, direction: 'desc' }];
      } else {
        newSort = current.filter((s) => s.field !== action.field);
      }
      return { ...state, params: { ...params, sort: newSort } };
    }

    /** Merges preset names into existing presets map by group key. */
    case 'SET_PRESETS': {
      const presets = { ...params.presets, [action.group]: action.names };
      return { ...state, params: { ...params, presets, page: 1 } };
    }

    case 'SET_QUICK_FILTERS':
      return { ...state, params: { ...params, quickFilters: action.quickFilters, page: 1 } };

    /** Toggles a quick filter on/off by name. */
    case 'TOGGLE_QUICK_FILTER': {
      const current = params.quickFilters ?? [];
      const isActive = current.includes(action.name);
      const quickFilters = isActive
        ? current.filter((n) => n !== action.name)
        : [...current, action.name];
      return { ...state, params: { ...params, quickFilters, page: 1 } };
    }

    case 'SET_GROUP_BY':
      return { ...state, params: { ...params, groupBy: action.groupBy } };

    case 'SET_PARAMS':
      return { ...state, params: action.params };

    case 'RESET':
      return { ...state, params: state.initialParams };
  }
}

// ---------------------------------------------------------------------------
// Default initial params
// ---------------------------------------------------------------------------

export const DEFAULT_QUERY_PARAMS: QueryRequest = { page: 1, pageSize: 20 };

// ---------------------------------------------------------------------------
// Dispatcher surface (returned alongside `params`)
// ---------------------------------------------------------------------------

export interface QueryEndpointDispatchers {
  readonly setPage: (page: number) => void;
  readonly setPageSize: (pageSize: number) => void;
  readonly setSearch: (search: string) => void;
  readonly setFilters: (filters: readonly FilterEntry[]) => void;
  readonly addFilter: (filter: FilterEntry) => void;
  readonly removeFilter: (field: string, operator?: string) => void;
  readonly setSort: (sort: readonly SortEntry[]) => void;
  readonly toggleSort: (field: string) => void;
  readonly setPresets: (group: string, names: readonly string[]) => void;
  readonly setQuickFilters: (quickFilters: readonly string[]) => void;
  readonly toggleQuickFilter: (name: string) => void;
  readonly setGroupBy: (groupBy: string | undefined) => void;
  readonly setParams: (params: QueryRequest) => void;
  readonly reset: () => void;
}

export interface QueryEndpointState extends QueryEndpointDispatchers {
  readonly params: QueryRequest;
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

/**
 * Owns the mutable `params` of a query endpoint plus all the dispatchers
 * that mutate it. Used internally by `useQueryEndpoint` (solo mode) and
 * by `<QueryEndpointStateProvider>` (shared mode); rarely needed by app
 * code directly. Pure state — no network.
 */
export function useQueryEndpointReducer(initialParams?: QueryRequest): QueryEndpointState {
  const seed = initialParams ?? DEFAULT_QUERY_PARAMS;
  const [state, dispatch] = useReducer(queryReducer, { params: seed, initialParams: seed });

  const setPage = useCallback((page: number) => dispatch({ type: 'SET_PAGE', page }), []);
  const setPageSize = useCallback(
    (pageSize: number) => dispatch({ type: 'SET_PAGE_SIZE', pageSize }),
    []
  );
  const setSearch = useCallback((search: string) => dispatch({ type: 'SET_SEARCH', search }), []);
  const setFilters = useCallback(
    (filters: readonly FilterEntry[]) => dispatch({ type: 'SET_FILTERS', filters }),
    []
  );
  const addFilter = useCallback(
    (filter: FilterEntry) => dispatch({ type: 'ADD_FILTER', filter }),
    []
  );
  const removeFilter = useCallback(
    (field: string, operator?: string) => dispatch({ type: 'REMOVE_FILTER', field, operator }),
    []
  );
  const setSort = useCallback(
    (sort: readonly SortEntry[]) => dispatch({ type: 'SET_SORT', sort }),
    []
  );
  const toggleSort = useCallback((field: string) => dispatch({ type: 'TOGGLE_SORT', field }), []);
  const setPresets = useCallback(
    (group: string, names: readonly string[]) => dispatch({ type: 'SET_PRESETS', group, names }),
    []
  );
  const setQuickFilters = useCallback(
    (quickFilters: readonly string[]) => dispatch({ type: 'SET_QUICK_FILTERS', quickFilters }),
    []
  );
  const toggleQuickFilter = useCallback(
    (name: string) => dispatch({ type: 'TOGGLE_QUICK_FILTER', name }),
    []
  );
  const setGroupBy = useCallback(
    (groupBy: string | undefined) => dispatch({ type: 'SET_GROUP_BY', groupBy }),
    []
  );
  const setParams = useCallback(
    (p: QueryRequest) => dispatch({ type: 'SET_PARAMS', params: p }),
    []
  );
  const reset = useCallback(() => dispatch({ type: 'RESET' }), []);

  return useMemo(
    () => ({
      params: state.params,
      setPage,
      setPageSize,
      setSearch,
      setFilters,
      addFilter,
      removeFilter,
      setSort,
      toggleSort,
      setPresets,
      setQuickFilters,
      toggleQuickFilter,
      setGroupBy,
      setParams,
      reset,
    }),
    [
      state.params,
      setPage,
      setPageSize,
      setSearch,
      setFilters,
      addFilter,
      removeFilter,
      setSort,
      toggleSort,
      setPresets,
      setQuickFilters,
      toggleQuickFilter,
      setGroupBy,
      setParams,
      reset,
    ]
  );
}
