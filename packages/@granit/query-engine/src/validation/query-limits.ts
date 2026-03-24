// ---------------------------------------------------------------------------
// Server-enforced validation limits for QueryRequest parameters
// ---------------------------------------------------------------------------

/** Validation limits enforced by Granit Querying endpoints (422 on violation). */
export const QUERY_LIMITS = {
  PAGE_MIN: 1,
  PAGE_SIZE_MIN: 1,
  PAGE_SIZE_MAX: 500,
  SEARCH_MAX_LENGTH: 500,
  SORT_MAX_LENGTH: 500,
  CURSOR_MAX_LENGTH: 2000,
  GROUP_BY_MAX_LENGTH: 200,
  FILTERS_MAX_COUNT: 50,
  QUICK_FILTERS_MAX_COUNT: 20,
  PRESETS_MAX_ENTRIES: 20,
} as const;
