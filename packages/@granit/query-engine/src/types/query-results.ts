// ---------------------------------------------------------------------------
// Query results — mirrors Granit.Querying.PagedResult / GroupedResult (.NET)
// ---------------------------------------------------------------------------

/** Paginated query result (offset or cursor). */
export interface PagedResult<T> {
  readonly items: readonly T[];
  readonly totalCount: number | null;
  /** Whether more pages exist beyond the current one. */
  readonly hasMore?: boolean;
  /** Opaque cursor for next page (only for keyset pagination). */
  readonly nextCursor?: string | null;
}

/** Grouped query result (when groupBy is specified). */
export interface GroupedResult<T> {
  readonly groups: readonly GroupEntry<T>[];
  readonly totalCount: number;
}

/** A single group within a GroupedResult. */
export interface GroupEntry<T> {
  /** Property name used for grouping (e.g. "Status"). */
  readonly field: string;
  /** Group key value (e.g. "Active", 42, null). */
  readonly value: unknown;
  /** Display label for the group (localized enum value). */
  readonly label: string;
  /** Number of items in this group. */
  readonly count: number;
  /** Computed aggregates keyed by alias (e.g. { totalAmount: 12345.67 }). */
  readonly aggregates?: Readonly<Record<string, unknown>>;
  /** Items within group (only populated on drill-down / expand). */
  readonly items?: readonly T[];
}
