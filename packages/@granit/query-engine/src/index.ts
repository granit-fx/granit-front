// ---------------------------------------------------------------------------
// @granit/query-engine — public API (framework-agnostic)
// ---------------------------------------------------------------------------

// Types
export type {
  ColumnDefinition,
  CreateSavedViewRequest,
  DateFilterMeta,
  DatePeriod,
  FilterEntry,
  FilterGroupMeta,
  FilterOperator,
  FilterSuggestion,
  PaginationParams,
  FilterSuggestionValue,
  FilterToken,
  FilterTokenType,
  FilterableField,
  GroupByField,
  GroupEntry,
  GroupedResult,
  PagedResult,
  PaginationMeta,
  PresetMeta,
  QueryMetadata,
  QueryRequest,
  QuickFilterMeta,
  SavedViewSummary,
  SmartFilterPhase,
  SortDirection,
  SortEntry,
  SortableField,
  UpdateSavedViewRequest,
} from './types/index.js';

// Config
export { buildQueryKey } from './config.js';
export type { QueryConfig } from './config.js';

// Utils
export {
  BOOLEAN_OPERATORS,
  DATE_OPERATORS,
  ENUM_OPERATORS,
  NUMBER_OPERATORS,
  OPERATOR_LABELS,
  STRING_OPERATORS,
  inferOperators,
} from './utils/filter-operators.js';

// Validation
export { QUERY_LIMITS } from './validation/query-limits.js';
export { validateQueryRequest } from './validation/validate-query-request.js';

// API
export { fetchGrouped, fetchPage, fetchQueryMeta } from './api/query-api.js';
export { parseQueryRequest, serializeQueryRequest } from './api/query-param-serializer.js';
export {
  createSavedView,
  deleteSavedView,
  fetchSavedViews,
  setDefaultSavedView,
  updateSavedView,
} from './api/saved-views-api.js';
