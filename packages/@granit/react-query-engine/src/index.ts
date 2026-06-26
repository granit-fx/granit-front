// Provider
export { QueryProvider, useQueryConfig } from './providers/query-provider';
export type { QueryProviderProps } from './providers/query-provider';
export {
  QueryEndpointStateProvider,
  useQueryEndpointState,
  useQueryEndpointStateContext,
} from './providers/query-endpoint-state-provider';
export type { QueryEndpointStateProviderProps } from './providers/query-endpoint-state-provider';
export {
  QueryCatalogProvider,
  useOptionalQueryCatalogConfig,
} from './providers/query-catalog-provider';
export type {
  QueryCatalogConfig,
  QueryCatalogProviderProps,
  ResolvedQueryCatalogConfig,
} from './providers/query-catalog-provider';

// Pagination primitives
export { useInfiniteScroll } from './hooks/use-infinite-scroll';
export type {
  InfiniteScrollPage,
  UseInfiniteScrollOptions,
  UseInfiniteScrollReturn,
} from './hooks/use-infinite-scroll';
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
export { useQueryCatalog } from './hooks/use-query-catalog';
export { useQueryMeta } from './hooks/use-query-meta';
export { useQueryMetaAt } from './hooks/use-query-meta-at';
export { useSmartFilter } from './hooks/use-smart-filter';
export type { UseSmartFilterOptions, UseSmartFilterReturn } from './hooks/use-smart-filter';

// SmartFilter ↔ data-lookup wiring helpers
export { deriveLookupScope } from './utils/derive-lookup-scope';
