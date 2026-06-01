import { describe, expect, it } from 'vitest';

import { QUERY_LIMITS } from '../validation/query-limits';
import { validateQueryRequest } from '../validation/validate-query-request';

import type { FilterEntry, QueryRequest } from '../types/query-params';

describe('validateQueryRequest', () => {
  it('returns params unchanged when all within limits', () => {
    const params: QueryRequest = { page: 1, pageSize: 20, search: 'hello' };
    expect(validateQueryRequest(params)).toEqual(params);
  });

  it('handles empty params', () => {
    expect(validateQueryRequest({})).toEqual({});
  });

  it('clamps page to minimum 1', () => {
    expect(validateQueryRequest({ page: 0 }).page).toBe(1);
    expect(validateQueryRequest({ page: -5 }).page).toBe(1);
    expect(validateQueryRequest({ page: 1 }).page).toBe(1);
    expect(validateQueryRequest({ page: 100 }).page).toBe(100);
  });

  it('clamps pageSize to [1, 500]', () => {
    expect(validateQueryRequest({ pageSize: 0 }).pageSize).toBe(1);
    expect(validateQueryRequest({ pageSize: -1 }).pageSize).toBe(1);
    expect(validateQueryRequest({ pageSize: 1000 }).pageSize).toBe(500);
    expect(validateQueryRequest({ pageSize: 250 }).pageSize).toBe(250);
  });

  it('truncates search to 500 characters', () => {
    const longSearch = 'a'.repeat(600);
    const result = validateQueryRequest({ search: longSearch });
    expect(result.search).toHaveLength(QUERY_LIMITS.SEARCH_MAX_LENGTH);
  });

  it('truncates cursor to 2000 characters', () => {
    const longCursor = 'x'.repeat(3000);
    const result = validateQueryRequest({ cursor: longCursor });
    expect(result.cursor).toHaveLength(QUERY_LIMITS.CURSOR_MAX_LENGTH);
  });

  it('truncates groupBy to 200 characters', () => {
    const longGroupBy = 'g'.repeat(300);
    const result = validateQueryRequest({ groupBy: longGroupBy });
    expect(result.groupBy).toHaveLength(QUERY_LIMITS.GROUP_BY_MAX_LENGTH);
  });

  it('slices filters to max 50 entries', () => {
    const filters: FilterEntry[] = Array.from({ length: 60 }, (_, i) => ({
      field: `field${i}`,
      operator: 'Eq' as const,
      value: `val${i}`,
    }));
    const result = validateQueryRequest({ filters });
    expect(result.filters).toHaveLength(QUERY_LIMITS.FILTERS_MAX_COUNT);
  });

  it('slices quickFilters to max 20 entries', () => {
    const quickFilters = Array.from({ length: 25 }, (_, i) => `filter${i}`);
    const result = validateQueryRequest({ quickFilters });
    expect(result.quickFilters).toHaveLength(QUERY_LIMITS.QUICK_FILTERS_MAX_COUNT);
  });

  it('slices presets to max 20 entries', () => {
    const presets: Record<string, string[]> = {};
    for (let i = 0; i < 25; i++) {
      presets[`group${i}`] = [`preset${i}`];
    }
    const result = validateQueryRequest({ presets });
    expect(Object.keys(result.presets!)).toHaveLength(QUERY_LIMITS.PRESETS_MAX_ENTRIES);
  });

  it('drops trailing sort entries when serialized length exceeds 500', () => {
    const sort = Array.from({ length: 100 }, (_, i) => ({
      field: `veryLongFieldNameForTesting${i}`,
      direction: 'asc' as const,
    }));
    const result = validateQueryRequest({ sort });
    const serialized = result
      .sort!.map((s) => (s.direction === 'desc' ? `-${s.field}` : s.field))
      .join(',');
    expect(serialized.length).toBeLessThanOrEqual(QUERY_LIMITS.SORT_MAX_LENGTH);
    expect(result.sort!.length).toBeLessThan(sort.length);
  });

  it('keeps sort unchanged when within limit', () => {
    const sort = [
      { field: 'createdAt', direction: 'desc' as const },
      { field: 'name', direction: 'asc' as const },
    ];
    const result = validateQueryRequest({ sort });
    expect(result.sort).toEqual(sort);
  });

  it('removes page when cursor is also set (cursor wins)', () => {
    const result = validateQueryRequest({ page: 3, cursor: 'abc' });
    expect(result.page).toBeUndefined();
    expect(result.cursor).toBe('abc');
  });

  it('preserves page when cursor is not set', () => {
    const result = validateQueryRequest({ page: 5 });
    expect(result.page).toBe(5);
  });

  it('preserves cursor when page is not set', () => {
    const result = validateQueryRequest({ cursor: 'abc' });
    expect(result.cursor).toBe('abc');
    expect(result.page).toBeUndefined();
  });

  it('does not modify arrays within limits', () => {
    const filters: FilterEntry[] = [{ field: 'status', operator: 'Eq', value: 'active' }];
    const result = validateQueryRequest({ filters });
    expect(result.filters).toEqual(filters);
  });
});
