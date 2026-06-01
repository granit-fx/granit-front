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
} from './query-params';

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
} from './query-metadata';

export type { GroupEntry, GroupedResult, PagedResult } from './query-results';

export type {
  CreateSavedViewRequest,
  SavedViewSummary,
  UpdateSavedViewRequest,
} from './saved-views';

export type {
  FilterSuggestion,
  FilterSuggestionValue,
  FilterToken,
  FilterTokenType,
  SmartFilterPhase,
} from './smart-filter';
