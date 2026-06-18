// Provider
export { QueryProvider, useQueryConfig } from './providers/query-provider';
export type { QueryProviderProps } from './providers/query-provider';
export {
  QueryEndpointStateProvider,
  useQueryEndpointState,
  useQueryEndpointStateContext,
} from './providers/query-endpoint-state-provider';
export type { QueryEndpointStateProviderProps } from './providers/query-endpoint-state-provider';

// Pagination primitives
export { useInfiniteScroll } from './hooks/use-infinite-scroll';
export type {
  InfiniteScrollPage,
  UseInfiniteScrollOptions,
  UseInfiniteScrollReturn,
} from './hooks/use-infinite-scroll';
export { usePagination } from './hooks/use-pagination';
export type {
  PaginationPage,
  UsePaginationOptions,
  UsePaginationReturn,
} from './hooks/use-pagination';
export { usePagedInfiniteQuery } from './hooks/use-paged-infinite-query';
export type {
  InfinitePageResult,
  UsePagedInfiniteQueryOptions,
  UsePagedInfiniteQueryReturn,
} from './hooks/use-paged-infinite-query';

// Hooks
export { useQueryEndpoint } from './hooks/use-query-endpoint';
export type { UseQueryEndpointOptions, UseQueryEndpointReturn } from './hooks/use-query-endpoint';
export { DEFAULT_QUERY_PARAMS, useQueryEndpointReducer } from './hooks/use-query-endpoint-reducer';
export type {
  QueryEndpointDispatchers,
  QueryEndpointState,
} from './hooks/use-query-endpoint-reducer';
export { useQueryMeta } from './hooks/use-query-meta';
export { useSmartFilter } from './hooks/use-smart-filter';
export type { UseSmartFilterOptions, UseSmartFilterReturn } from './hooks/use-smart-filter';

// SmartFilter ↔ data-lookup wiring helpers
export { deriveLookupScope } from './utils/derive-lookup-scope';
