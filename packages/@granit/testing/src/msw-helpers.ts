import { HttpResponse } from 'msw';

// Mirrors @granit/query-engine types — defined locally to avoid a circular workspace dependency.
interface PagedResult<T> {
  readonly items: readonly T[];
  readonly totalCount: number | null;
  readonly hasMore?: boolean;
  readonly nextCursor?: string | null;
}

interface GroupEntry<T> {
  readonly field: string;
  readonly value: unknown;
  readonly label: string;
  readonly count: number;
  readonly aggregates?: Readonly<Record<string, unknown>>;
  readonly items?: readonly T[];
}

interface GroupedResult<T> {
  readonly groups: readonly GroupEntry<T>[];
  readonly totalCount: number;
}

// ---------------------------------------------------------------------------
// Response helpers
// ---------------------------------------------------------------------------

/**
 * Build a JSON response wrapping items in a `PagedResult<T>`.
 *
 * @param items  - page of results to return
 * @param totalCount - total across all pages (defaults to `items.length`)
 */
export function pagedResponse<T>(items: readonly T[], totalCount: number = items.length) {
  const body: PagedResult<T> = { items, totalCount };
  return HttpResponse.json(body);
}

/** 204 No Content — typical for successful mutations. */
export function noContent() {
  return new HttpResponse(null, { status: 204 });
}

/** 404 Not Found. */
export function notFound() {
  return new HttpResponse(null, { status: 404 });
}

/** 202 Accepted — for asynchronous operations. */
export function accepted() {
  return new HttpResponse(null, { status: 202 });
}

/** 422 Unprocessable Entity — for validation failures, as a `ProblemDetails` body. */
export function unprocessableEntity(detail?: string) {
  return HttpResponse.json({ title: 'Unprocessable Entity', status: 422, detail }, { status: 422 });
}

// ---------------------------------------------------------------------------
// Query-engine param parsing — mirrors @granit/query-engine serialization
// ---------------------------------------------------------------------------

/** Parsed filter entry from `filter[field.Operator]=value` query params. */
export interface FilterEntry {
  field: string;
  operator: string;
  value: string;
}

/** Parsed sort entry from `sort=field` or `sort=-field` query params. */
export interface SortEntry {
  field: string;
  desc: boolean;
}

const FILTER_REGEX = /^filter\[(.+)\.(\w+)\]$/;

/**
 * Parse `filter[field.Operator]=value` entries from a URL's search params.
 * Mirrors the @granit/query-engine serialization convention.
 */
export function parseFilters(url: URL): FilterEntry[] {
  const filters: FilterEntry[] = [];
  url.searchParams.forEach((value, key) => {
    const match = FILTER_REGEX.exec(key);
    if (match?.[1] && match[2]) {
      filters.push({ field: match[1], operator: match[2], value });
    }
  });
  return filters;
}

/**
 * Parse `sort=field` or `sort=-field,other` entries from a URL's search params.
 * Leading `-` denotes descending order.
 */
export function parseSort(url: URL): SortEntry[] {
  const sortStr = url.searchParams.get('sort');
  if (!sortStr) return [];
  return sortStr.split(',').map((part) => {
    if (part.startsWith('-')) return { field: part.slice(1), desc: true };
    return { field: part, desc: false };
  });
}

// ---------------------------------------------------------------------------
// Filter application helpers
// ---------------------------------------------------------------------------

/**
 * Apply a string filter operator (`Eq`, `Contains`, `StartsWith`) to a value.
 * Comparison is case-insensitive.
 */
export function applyStringFilter(value: string, operator: string, filterValue: string): boolean {
  const v = value.toLowerCase();
  const f = filterValue.toLowerCase();
  switch (operator) {
    case 'Eq':
      return v === f;
    case 'Contains':
      return v.includes(f);
    case 'StartsWith':
      return v.startsWith(f);
    case 'In':
      return filterValue.split(',').some((item) => item.toLowerCase() === v);
    default:
      return true;
  }
}

/**
 * Apply a numeric filter operator (`Eq`, `In`, `Gt`, `Gte`, `Lt`, `Lte`) to a value.
 */
export function applyNumberFilter(value: number, operator: string, filterValue: string): boolean {
  const f = Number(filterValue);
  switch (operator) {
    case 'Eq':
      return value === f;
    case 'In':
      return filterValue.split(',').map(Number).includes(value);
    case 'Gt':
      return value > f;
    case 'Gte':
      return value >= f;
    case 'Lt':
      return value < f;
    case 'Lte':
      return value <= f;
    default:
      return true;
  }
}

/**
 * Apply a date filter operator (`Gte`, `Lte`, `Between`) to an ISO date string.
 */
export function applyDateFilter(value: string, operator: string, filterValue: string): boolean {
  const d = new Date(value).getTime();
  switch (operator) {
    case 'Gte':
      return d >= new Date(filterValue).getTime();
    case 'Lte':
      return d <= new Date(filterValue).getTime();
    case 'Between': {
      const parts = filterValue.split(',');
      const from = parts[0] ?? '';
      const to = parts[1] ?? '';
      return d >= new Date(from).getTime() && d <= new Date(to).getTime();
    }
    default:
      return true;
  }
}

/**
 * Apply a single {@link FilterEntry} against a record (generic object).
 * Dispatches to the appropriate typed filter based on the runtime value type.
 */
export function applyFilter(record: Record<string, unknown>, f: FilterEntry): boolean {
  const fieldValue = record[f.field];
  if (typeof fieldValue === 'number') {
    return applyNumberFilter(fieldValue, f.operator, f.value);
  }
  return applyStringFilter(fieldValue != null ? String(fieldValue) : '', f.operator, f.value);
}

// ---------------------------------------------------------------------------
// Sorting / pagination helpers
// ---------------------------------------------------------------------------

/**
 * Sort an array of records in-place according to an array of {@link SortEntry}.
 * Falls back to `defaultSort` (prefix `-` for descending) when no explicit sort is given.
 *
 * @returns The same array (mutated).
 */
export function sortItems<T extends Record<string, unknown>>(
  items: T[],
  sortEntries: SortEntry[],
  defaultSort?: string
): T[] {
  const firstSort = sortEntries[0];
  if (firstSort) {
    const { field, desc } = firstSort;
    items.sort((a, b) => {
      const aVal = a[field];
      const bVal = b[field];
      let cmp: number;
      if (typeof aVal === 'number' && typeof bVal === 'number') {
        cmp = aVal - bVal;
      } else {
        cmp = (aVal != null ? String(aVal) : '').localeCompare(bVal != null ? String(bVal) : '');
      }
      return desc ? -cmp : cmp;
    });
  } else if (defaultSort) {
    const desc = defaultSort.startsWith('-');
    const field = desc ? defaultSort.slice(1) : defaultSort;
    items.sort((a, b) => {
      const aVal = a[field];
      const bVal = b[field];
      let cmp: number;
      if (typeof aVal === 'number' && typeof bVal === 'number') {
        cmp = aVal - bVal;
      } else {
        cmp = (aVal != null ? String(aVal) : '').localeCompare(bVal != null ? String(bVal) : '');
      }
      return desc ? -cmp : cmp;
    });
  }
  return items;
}

/**
 * Slice `items` according to `page` / `pageSize` query params (1-based page).
 * Returns a `{ items, totalCount }` compatible with `PagedResult<T>`.
 */
export function paginate<T>(items: T[], url: URL): { items: T[]; totalCount: number } {
  const page = Number(url.searchParams.get('page') ?? '1');
  const pageSize = Number(url.searchParams.get('pageSize') ?? '20');
  const start = (page - 1) * pageSize;
  return {
    items: items.slice(start, start + pageSize),
    totalCount: items.length,
  };
}

/**
 * Group `items` by the value of `field` and return a `GroupedResult<T>`.
 * `labelFn` maps the raw group key to a display label (defaults to the raw key).
 */
export function groupBy<T extends Record<string, unknown>>(
  items: T[],
  field: string,
  labelFn: (key: string) => string = (k) => k
): GroupedResult<T> {
  const map = new Map<string, T[]>();
  for (const item of items) {
    const key = item[field] != null ? String(item[field]) : '';
    if (!map.has(key)) map.set(key, []);
    map.get(key)!.push(item);
  }
  return {
    groups: Array.from(map.entries()).map(([value, groupItems]) => ({
      field,
      value,
      label: labelFn(value),
      count: groupItems.length,
      items: groupItems,
    })),
    totalCount: items.length,
  };
}
