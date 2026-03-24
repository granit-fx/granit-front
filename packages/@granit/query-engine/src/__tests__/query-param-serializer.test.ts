import { describe, expect, it } from 'vitest';

import { parseQueryRequest, serializeQueryRequest } from '../api/query-param-serializer.js';

import type { QueryRequest } from '../types/query-params.js';

describe('serializeQueryRequest', () => {
  it('serializes empty params to empty string', () => {
    expect(serializeQueryRequest({})).toBe('');
  });

  it('serializes page and pageSize', () => {
    const result = serializeQueryRequest({ page: 2, pageSize: 50 });
    expect(result).toContain('page=2');
    expect(result).toContain('pageSize=50');
  });

  it('serializes search', () => {
    const result = serializeQueryRequest({ search: 'Dupont' });
    expect(result).toContain('search=Dupont');
  });

  it('serializes cursor', () => {
    const result = serializeQueryRequest({ cursor: 'abc123' });
    expect(result).toContain('cursor=abc123');
  });

  it('serializes filters with field.operator syntax', () => {
    const result = serializeQueryRequest({
      filters: [
        { field: 'status', operator: 'Eq', value: 'active' },
        { field: 'age', operator: 'Gte', value: '18' },
      ],
    });
    const params = new URLSearchParams(result);
    expect(params.get('filter[status.Eq]')).toBe('active');
    expect(params.get('filter[age.Gte]')).toBe('18');
  });

  it('serializes sort with descending prefix', () => {
    const result = serializeQueryRequest({
      sort: [
        { field: 'createdAt', direction: 'desc' },
        { field: 'lastName', direction: 'asc' },
      ],
    });
    expect(result).toContain('sort=-createdAt%2ClastName');
  });

  it('serializes presets by group', () => {
    const result = serializeQueryRequest({
      presets: { status: ['Active', 'Pending'] },
    });
    const params = new URLSearchParams(result);
    expect(params.get('presets[status]')).toBe('Active,Pending');
  });

  it('skips empty preset groups', () => {
    const result = serializeQueryRequest({
      presets: { status: [] },
    });
    expect(result).not.toContain('presets');
  });

  it('serializes quickFilters as comma-separated', () => {
    const result = serializeQueryRequest({
      quickFilters: ['MyItems', 'Unread'],
    });
    expect(result).toContain('quickFilters=MyItems%2CUnread');
  });

  it('serializes groupBy', () => {
    const result = serializeQueryRequest({ groupBy: 'status' });
    expect(result).toContain('groupBy=status');
  });

  it('serializes skipTotalCount when true', () => {
    const result = serializeQueryRequest({ skipTotalCount: true });
    expect(result).toContain('skipTotalCount=true');
  });

  it('omits skipTotalCount when false or undefined', () => {
    expect(serializeQueryRequest({ skipTotalCount: false })).not.toContain('skipTotalCount');
    expect(serializeQueryRequest({})).not.toContain('skipTotalCount');
  });

  it('clamps page=0 to page=1 via validation', () => {
    const result = serializeQueryRequest({ page: 0 });
    const params = new URLSearchParams(result);
    expect(params.get('page')).toBe('1');
  });

  it('clamps pageSize=1000 to pageSize=500 via validation', () => {
    const result = serializeQueryRequest({ pageSize: 1000 });
    const params = new URLSearchParams(result);
    expect(params.get('pageSize')).toBe('500');
  });

  it('excludes page when both page and cursor are set (cursor wins)', () => {
    const result = serializeQueryRequest({ page: 3, cursor: 'abc123' });
    const params = new URLSearchParams(result);
    expect(params.get('cursor')).toBe('abc123');
    expect(params.has('page')).toBe(false);
  });

  it('serializes a full query', () => {
    const params: QueryRequest = {
      page: 1,
      pageSize: 20,
      search: 'test',
      filters: [{ field: 'name', operator: 'Contains', value: 'John' }],
      sort: [{ field: 'createdAt', direction: 'desc' }],
      presets: { category: ['Electronics'] },
      quickFilters: ['MyItems'],
      groupBy: 'status',
    };
    const result = serializeQueryRequest(params);
    const urlParams = new URLSearchParams(result);
    expect(urlParams.get('page')).toBe('1');
    expect(urlParams.get('pageSize')).toBe('20');
    expect(urlParams.get('search')).toBe('test');
    expect(urlParams.get('filter[name.Contains]')).toBe('John');
    expect(urlParams.get('sort')).toBe('-createdAt');
    expect(urlParams.get('presets[category]')).toBe('Electronics');
    expect(urlParams.get('quickFilters')).toBe('MyItems');
    expect(urlParams.get('groupBy')).toBe('status');
  });
});

describe('parseQueryRequest', () => {
  it('parses empty string', () => {
    const result = parseQueryRequest('');
    expect(result).toEqual({});
  });

  it('parses page and pageSize', () => {
    const result = parseQueryRequest('page=2&pageSize=50');
    expect(result.page).toBe(2);
    expect(result.pageSize).toBe(50);
  });

  it('parses search', () => {
    const result = parseQueryRequest('search=Dupont');
    expect(result.search).toBe('Dupont');
  });

  it('parses cursor', () => {
    const result = parseQueryRequest('cursor=abc123');
    expect(result.cursor).toBe('abc123');
  });

  it('parses filters', () => {
    const result = parseQueryRequest('filter[status.Eq]=active&filter[age.Gte]=18');
    expect(result.filters).toEqual([
      { field: 'status', operator: 'Eq', value: 'active' },
      { field: 'age', operator: 'Gte', value: '18' },
    ]);
  });

  it('parses sort with descending prefix', () => {
    const result = parseQueryRequest('sort=-createdAt,lastName');
    expect(result.sort).toEqual([
      { field: 'createdAt', direction: 'desc' },
      { field: 'lastName', direction: 'asc' },
    ]);
  });

  it('parses presets', () => {
    const result = parseQueryRequest('presets[status]=Active,Pending');
    expect(result.presets).toEqual({ status: ['Active', 'Pending'] });
  });

  it('parses quickFilters', () => {
    const result = parseQueryRequest('quickFilters=MyItems,Unread');
    expect(result.quickFilters).toEqual(['MyItems', 'Unread']);
  });

  it('parses groupBy', () => {
    const result = parseQueryRequest('groupBy=status');
    expect(result.groupBy).toBe('status');
  });

  it('parses skipTotalCount', () => {
    const result = parseQueryRequest('skipTotalCount=true');
    expect(result.skipTotalCount).toBe(true);
  });

  it('ignores skipTotalCount when not true', () => {
    const result = parseQueryRequest('skipTotalCount=false');
    expect(result.skipTotalCount).toBeUndefined();
  });

  it('round-trips a full query', () => {
    const original: QueryRequest = {
      page: 1,
      pageSize: 20,
      search: 'test',
      filters: [{ field: 'name', operator: 'Contains', value: 'John' }],
      sort: [{ field: 'createdAt', direction: 'desc' }],
      presets: { category: ['Electronics'] },
      quickFilters: ['MyItems'],
      groupBy: 'status',
    };
    const serialized = serializeQueryRequest(original);
    const parsed = parseQueryRequest(serialized);
    expect(parsed.page).toBe(original.page);
    expect(parsed.pageSize).toBe(original.pageSize);
    expect(parsed.search).toBe(original.search);
    expect(parsed.filters).toEqual(original.filters);
    expect(parsed.sort).toEqual(original.sort);
    expect(parsed.presets).toEqual(original.presets);
    expect(parsed.quickFilters).toEqual(original.quickFilters);
    expect(parsed.groupBy).toBe(original.groupBy);
  });
});
