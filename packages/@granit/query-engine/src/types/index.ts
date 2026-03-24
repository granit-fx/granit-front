// ---------------------------------------------------------------------------
// Types barrel — public type API for @granit/query-engine
// ---------------------------------------------------------------------------

export type {
  FilterEntry,
  FilterOperator,
  PaginationParams,
  QueryRequest,
  SortDirection,
  SortEntry,
} from './query-params.js';

export type {
  ColumnDefinition,
  DateFilterMeta,
  DatePeriod,
  FilterGroupMeta,
  FilterableField,
  GroupByField,
  PaginationMeta,
  PresetMeta,
  QueryMetadata,
  QuickFilterMeta,
  SortableField,
} from './query-metadata.js';

export type { GroupEntry, GroupedResult, PagedResult } from './query-results.js';

export type {
  CreateSavedViewRequest,
  SavedViewSummary,
  UpdateSavedViewRequest,
} from './saved-views.js';

export type {
  FilterSuggestion,
  FilterSuggestionValue,
  FilterToken,
  FilterTokenType,
  SmartFilterPhase,
} from './smart-filter.js';
