// ---------------------------------------------------------------------------
// Query parameters — mirrors Granit.QueryEngine.QueryRequest (.NET)
// ---------------------------------------------------------------------------

/** Minimal pagination parameters shared across all domain modules. */
export interface PaginationParams {
  /** One-based page number. */
  readonly page?: number;
  /** Items per page. */
  readonly pageSize?: number;
}

/**
 * Filter operators supported by Granit QueryEngine.
 *
 * Operator availability per field type is defined in metadata:
 * - string:   Eq, Contains, StartsWith, EndsWith, In
 * - number:   Eq, Gt, Gte, Lt, Lte, In, Between
 * - date:     Eq, Gt, Gte, Lt, Lte, Between
 * - boolean:  Eq
 * - enum:     Eq, In
 * - guid:     Eq, In
 */
export type FilterOperator =
  | 'Eq'
  | 'Contains'
  | 'StartsWith'
  | 'EndsWith'
  | 'Gt'
  | 'Gte'
  | 'Lt'
  | 'Lte'
  | 'In'
  | 'Between';

/** A single filter entry: field + operator + value(s). */
export interface FilterEntry {
  readonly field: string;
  readonly operator: FilterOperator;
  /** String value for scalar operators, comma-separated for In/Between. */
  readonly value: string;
}

/** Sort direction. Prefix with '-' for descending in query string. */
export type SortDirection = 'asc' | 'desc';

/** A single sort entry. */
export interface SortEntry {
  readonly field: string;
  readonly direction: SortDirection;
}

/**
 * Full query request sent to the backend — mirrors `Granit.QueryEngine.QueryRequest` (.NET).
 *
 * Serialized to query string format:
 * ```
 * ?page=1&pageSize=20&search=text
 *  &filter[field.op]=value
 *  &sort=-createdAt,lastName
 *  &presets[group]=name1,name2
 *  &quickFilters=Name1,Name2
 *  &groupBy=field
 *  &skipTotalCount=true
 * ```
 */
export interface QueryRequest extends PaginationParams {
  /** Opaque cursor for keyset pagination (base64). Mutually exclusive with page. */
  readonly cursor?: string;
  /** Free-text search on global search properties. */
  readonly search?: string;
  /** Active filters. */
  readonly filters?: readonly FilterEntry[];
  /** Sort specification (ordered). */
  readonly sort?: readonly SortEntry[];
  /**
   * Active presets by group name.
   * OR semantics within a group, AND semantics between groups.
   */
  readonly presets?: Readonly<Record<string, readonly string[]>>;
  /**
   * Active quick filter names.
   * Independent toggleable filters with AND semantics.
   */
  readonly quickFilters?: readonly string[];
  /** Property name for grouping. When set, response is GroupedResult. */
  readonly groupBy?: string;
  /**
   * When true, omits the expensive COUNT(*) query.
   * Useful for large datasets with cursor pagination where totalCount is not needed.
   * When set, `PagedResult.totalCount` will be null.
   */
  readonly skipTotalCount?: boolean;
}
