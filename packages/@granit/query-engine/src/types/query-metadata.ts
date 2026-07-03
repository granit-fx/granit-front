// ---------------------------------------------------------------------------
// Query metadata — mirrors Granit.QueryEngine.Meta.QueryMetadata (.NET)
// Returned by GET {basePath}/meta
// ---------------------------------------------------------------------------

import type { FilterOperator } from './query-params';
import type { LookupDescriptor } from '@granit/data-lookup';

/** Column definition for display in data tables. */
export interface ColumnDefinition {
  readonly name: string;
  readonly label: string;
  /** CLR type name (String, Int32, DateTime, etc.). */
  readonly type: string;
  /** Display order (0-based). */
  readonly order: number;
  readonly isSortable: boolean;
  readonly isFilterable: boolean;
  /** Default visibility. */
  readonly isVisible: boolean;
  /** Display format (e.g. "dd/MM/yyyy"). */
  readonly format?: string;
  /**
   * Semantic cell kind, driving renderer selection ahead of the manifest
   * `component` join and the CLR `type` fallback. Wire values are the .NET
   * `ValueKind` enum member names verbatim (PascalCase, via
   * `JsonStringEnumConverter`): `Count`, `Number`, `Currency`, `Percentage`,
   * `Bytes`, `Duration`, `Date`, `DateTime`, `Time`, `RelativeTime`, `Url`,
   * `Email`, `Phone`, `Boolean`, `Enum`, `Color`, `Image`, `Json`, `Markdown`,
   * `Tags`, `Rating`, `Identifier`. Optional — absent columns keep the legacy
   * CLR/component behaviour. Mirrors `Granit.QueryEngine.Meta.ColumnDefinition`.
   */
  readonly valueKind?: string;
  /**
   * ISO 4217 code for a `Currency` column, fixed at design time (e.g. `"EUR"`).
   * Takes precedence over {@link currencyCodeField}.
   */
  readonly currencyCode?: string;
  /**
   * Name of a sibling column holding the ISO 4217 code per row (multi-currency
   * entities). Consulted only when {@link currencyCode} is absent; the code is
   * read from `row[currencyCodeField]` on each row.
   */
  readonly currencyCodeField?: string;
}

/** Filterable field with its allowed operators (inferred from type). */
export interface FilterableField {
  readonly name: string;
  /** CLR type name. */
  readonly type: string;
  /** Operators available for this field (whitelist). */
  readonly operators: readonly FilterOperator[];
  /** Known values for enum-like fields (shown as suggestions in enterValue phase). */
  readonly enumValues?: readonly string[];
  /**
   * Optional descriptor pointing to a Granit.DataLookup source. When set, the
   * SmartFilterBar routes the "enter value" phase to a server-backed typeahead
   * picker (`<LookupPicker>` from `@granit/react-data-lookup`) instead of a
   * free-text input.
   */
  readonly lookup?: LookupDescriptor;
}

/** Sortable field declaration. */
export interface SortableField {
  readonly name: string;
}

/**
 * Preset filter group.
 *
 * OR semantics within the group (one preset selected at a time).
 * AND semantics between groups.
 */
export interface FilterGroupMeta {
  readonly name: string;
  readonly label: string;
  readonly presets: readonly PresetMeta[];
}

/** Individual preset within a filter group. */
export interface PresetMeta {
  readonly name: string;
  readonly label: string;
  readonly isDefault: boolean;
}

/**
 * Quick filter — independent toggleable predicate filter.
 *
 * AND semantics between active quick filters.
 * Default quick filters are applied when none are explicitly specified.
 */
export interface QuickFilterMeta {
  readonly name: string;
  readonly label: string;
  readonly isDefault: boolean;
}

/** Date filter configuration for period-based filtering. */
export interface DateFilterMeta {
  readonly name: string;
  readonly defaultPeriod: DatePeriod;
  readonly availablePeriods: readonly DatePeriod[];
}

/** Predefined date periods for DatePeriodPicker. */
export type DatePeriod =
  'Today' | 'ThisWeek' | 'ThisMonth' | 'LastMonth' | 'ThisQuarter' | 'ThisYear' | 'Custom';

/** Field available for group-by operations. */
export interface GroupByField {
  readonly name: string;
  /** CLR type name. */
  readonly type: string;
}

/** Pagination capabilities and defaults. */
export interface PaginationMeta {
  readonly defaultPageSize: number;
  readonly maxPageSize: number;
  /** Maximum number of items for export streaming. */
  readonly maxStreamSize: number;
  readonly supportsCursor: boolean;
}

/**
 * Full query metadata returned by GET {basePath}/meta.
 *
 * Describes all available columns, filters, presets, quick filters,
 * date filters, sort/group capabilities, and pagination defaults.
 */
export interface QueryMetadata {
  readonly columns: readonly ColumnDefinition[];
  readonly filterableFields: readonly FilterableField[];
  readonly sortableFields: readonly SortableField[];
  readonly presetFilterGroups: readonly FilterGroupMeta[];
  readonly quickFilters: readonly QuickFilterMeta[];
  readonly dateFilters: readonly DateFilterMeta[];
  readonly groupByFields: readonly GroupByField[];
  readonly pagination: PaginationMeta;
  readonly defaultSort?: string;
}
