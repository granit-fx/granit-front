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
  QueryCatalogEntryResponse,
  QueryMetadata,
  QueryRequest,
  QuickFilterMeta,
  SavedViewSummary,
  SmartFilterPhase,
  SortDirection,
  SortEntry,
  SortableField,
  UpdateSavedViewRequest,
} from './types/index';

// Config
export { buildQueryKey } from './config';
export type { QueryConfig, ResolvedQueryConfig } from './config';

// Utils
export {
  BOOLEAN_OPERATORS,
  DATE_OPERATORS,
  ENUM_OPERATORS,
  NUMBER_OPERATORS,
  OPERATOR_LABELS,
  STRING_OPERATORS,
  inferOperators,
} from './utils/filter-operators';

// Validation
export { QUERY_LIMITS } from './validation/query-limits';
export { validateQueryRequest } from './validation/validate-query-request';

// API
export { getGrouped, getPage, getQueryCatalog, getQueryMeta } from './api/query-api';
export { parseQueryRequest, serializeQueryRequest } from './api/query-param-serializer';
export {
  createSavedView,
  deleteSavedView,
  listSavedViews,
  setDefaultSavedView,
  updateSavedView,
} from './api/saved-views-api';
