// ---------------------------------------------------------------------------
// Re-export from @granit/react-query-engine for backward compatibility.
// New code should import directly from @granit/react-query-engine.
// ---------------------------------------------------------------------------

export {
  useInfiniteScroll as usePaginatedFetch,
  type InfiniteScrollPage as PaginatedPage,
  type UseInfiniteScrollOptions as UsePaginatedFetchOptions,
  type UseInfiniteScrollReturn as UsePaginatedFetchReturn,
} from '@granit/react-query-engine';
