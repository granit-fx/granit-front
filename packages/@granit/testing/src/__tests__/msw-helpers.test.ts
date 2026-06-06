import { describe, expect, it } from 'vitest';

import {
  accepted,
  applyDateFilter,
  applyFilter,
  applyNumberFilter,
  applyStringFilter,
  created,
  groupBy,
  noContent,
  notFound,
  paginate,
  pagedResponse,
  parseFilters,
  parseSort,
  sortItems,
  unprocessableEntity,
} from '../msw-helpers';

// ---------------------------------------------------------------------------
// Response helpers
// ---------------------------------------------------------------------------

describe('pagedResponse', () => {
  it('wraps items in a PagedResult body with default totalCount', async () => {
    const items = [{ id: 1 }, { id: 2 }];
    const res = pagedResponse(items);
    const body = await res.json();
    expect(body).toEqual({ items, totalCount: 2 });
  });

  it('uses provided totalCount', async () => {
    const items = [{ id: 1 }];
    const res = pagedResponse(items, 100);
    const body = await res.json();
    expect(body).toEqual({ items, totalCount: 100 });
  });

  it('returns 200', () => {
    expect(pagedResponse([]).status).toBe(200);
  });
});

describe('created', () => {
  it('returns 201 with JSON body', async () => {
    const data = { id: 'abc', name: 'Test' };
    const res = created(data);
    expect(res.status).toBe(201);
    await expect(res.json()).resolves.toEqual(data);
  });
});

describe('accepted', () => {
  it('returns 202 with no body', () => {
    const res = accepted();
    expect(res.status).toBe(202);
    expect(res.body).toBeNull();
  });
});

describe('noContent', () => {
  it('returns 204 with no body', () => {
    const res = noContent();
    expect(res.status).toBe(204);
    expect(res.body).toBeNull();
  });
});

describe('notFound', () => {
  it('returns 404 with no body', () => {
    const res = notFound();
    expect(res.status).toBe(404);
    expect(res.body).toBeNull();
  });
});

describe('unprocessableEntity', () => {
  it('returns 422 with ProblemDetails body', async () => {
    const res = unprocessableEntity('Invalid input');
    expect(res.status).toBe(422);
    const body = await res.json();
    expect(body).toEqual({ title: 'Unprocessable Entity', status: 422, detail: 'Invalid input' });
  });

  it('allows omitting detail', async () => {
    const res = unprocessableEntity();
    const body = await res.json();
    expect(body).toMatchObject({ title: 'Unprocessable Entity', status: 422 });
  });
});

// ---------------------------------------------------------------------------
// parseFilters
// ---------------------------------------------------------------------------

describe('parseFilters', () => {
  it('parses filter[field.Op]=value entries', () => {
    const url = new URL('http://api.test/?filter[name.Contains]=foo&filter[status.Eq]=active');
    expect(parseFilters(url)).toEqual([
      { field: 'name', operator: 'Contains', value: 'foo' },
      { field: 'status', operator: 'Eq', value: 'active' },
    ]);
  });

  it('returns empty array when no filter params', () => {
    expect(parseFilters(new URL('http://api.test/?page=1'))).toEqual([]);
  });

  it('ignores non-filter params', () => {
    const url = new URL('http://api.test/?sort=name&filter[id.Eq]=1');
    expect(parseFilters(url)).toHaveLength(1);
  });
});

// ---------------------------------------------------------------------------
// parseSort
// ---------------------------------------------------------------------------

describe('parseSort', () => {
  it('parses ascending sort', () => {
    expect(parseSort(new URL('http://api.test/?sort=name'))).toEqual([
      { field: 'name', desc: false },
    ]);
  });

  it('parses descending sort with leading dash', () => {
    expect(parseSort(new URL('http://api.test/?sort=-createdAt'))).toEqual([
      { field: 'createdAt', desc: true },
    ]);
  });

  it('parses multiple sort fields', () => {
    expect(parseSort(new URL('http://api.test/?sort=-createdAt,name'))).toEqual([
      { field: 'createdAt', desc: true },
      { field: 'name', desc: false },
    ]);
  });

  it('returns empty array when no sort param', () => {
    expect(parseSort(new URL('http://api.test/?page=1'))).toEqual([]);
  });
});

// ---------------------------------------------------------------------------
// applyStringFilter
// ---------------------------------------------------------------------------

describe('applyStringFilter', () => {
  it('Eq is case-insensitive', () => {
    expect(applyStringFilter('Hello', 'Eq', 'hello')).toBe(true);
    expect(applyStringFilter('Hello', 'Eq', 'world')).toBe(false);
  });

  it('Contains', () => {
    expect(applyStringFilter('foobar', 'Contains', 'OOB')).toBe(true);
    expect(applyStringFilter('foobar', 'Contains', 'xyz')).toBe(false);
  });

  it('StartsWith', () => {
    expect(applyStringFilter('foobar', 'StartsWith', 'foo')).toBe(true);
    expect(applyStringFilter('foobar', 'StartsWith', 'bar')).toBe(false);
  });

  it('EndsWith', () => {
    expect(applyStringFilter('foobar', 'EndsWith', 'bar')).toBe(true);
    expect(applyStringFilter('foobar', 'EndsWith', 'foo')).toBe(false);
  });

  it('In matches comma-separated values (trimmed)', () => {
    expect(applyStringFilter('active', 'In', 'active, pending, archived')).toBe(true);
    expect(applyStringFilter('deleted', 'In', 'active,pending')).toBe(false);
  });

  it('unknown operator returns true', () => {
    expect(applyStringFilter('any', 'Unknown', 'x')).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// applyNumberFilter
// ---------------------------------------------------------------------------

describe('applyNumberFilter', () => {
  it('Eq', () => {
    expect(applyNumberFilter(5, 'Eq', '5')).toBe(true);
    expect(applyNumberFilter(5, 'Eq', '6')).toBe(false);
  });

  it('In', () => {
    expect(applyNumberFilter(3, 'In', '1,2,3')).toBe(true);
    expect(applyNumberFilter(4, 'In', '1,2,3')).toBe(false);
  });

  it('Gt / Gte / Lt / Lte', () => {
    expect(applyNumberFilter(5, 'Gt', '4')).toBe(true);
    expect(applyNumberFilter(5, 'Gt', '5')).toBe(false);
    expect(applyNumberFilter(5, 'Gte', '5')).toBe(true);
    expect(applyNumberFilter(5, 'Lt', '6')).toBe(true);
    expect(applyNumberFilter(5, 'Lte', '5')).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// applyDateFilter
// ---------------------------------------------------------------------------

describe('applyDateFilter', () => {
  const d = '2024-06-15T00:00:00Z';

  it('Gte', () => {
    expect(applyDateFilter(d, 'Gte', '2024-01-01')).toBe(true);
    expect(applyDateFilter(d, 'Gte', '2025-01-01')).toBe(false);
  });

  it('Lte', () => {
    expect(applyDateFilter(d, 'Lte', '2025-01-01')).toBe(true);
    expect(applyDateFilter(d, 'Lte', '2023-01-01')).toBe(false);
  });

  it('Between', () => {
    expect(applyDateFilter(d, 'Between', '2024-01-01,2024-12-31')).toBe(true);
    expect(applyDateFilter(d, 'Between', '2025-01-01,2025-12-31')).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// applyFilter (dispatch)
// ---------------------------------------------------------------------------

describe('applyFilter', () => {
  it('dispatches to number filter for numeric fields', () => {
    const record = { count: 5 };
    expect(applyFilter(record, { field: 'count', operator: 'Gt', value: '3' })).toBe(true);
  });

  it('dispatches to date filter for ISO 8601 strings', () => {
    const record = { createdAt: '2024-06-01T00:00:00Z' };
    expect(applyFilter(record, { field: 'createdAt', operator: 'Gte', value: '2024-01-01' })).toBe(
      true
    );
  });

  it('dispatches to string filter for plain strings', () => {
    const record = { name: 'Alice' };
    expect(applyFilter(record, { field: 'name', operator: 'Eq', value: 'alice' })).toBe(true);
  });

  it('treats null/undefined fields as empty string for string filter', () => {
    const record: Record<string, unknown> = { name: null };
    expect(applyFilter(record, { field: 'name', operator: 'Eq', value: '' })).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// sortItems
// ---------------------------------------------------------------------------

describe('sortItems', () => {
  const items = [{ name: 'Charlie' }, { name: 'Alice' }, { name: 'Bob' }];

  it('sorts ascending by sort entry', () => {
    const result = sortItems([...items], [{ field: 'name', desc: false }]);
    expect(result.map((i) => i.name)).toEqual(['Alice', 'Bob', 'Charlie']);
  });

  it('sorts descending by sort entry', () => {
    const result = sortItems([...items], [{ field: 'name', desc: true }]);
    expect(result.map((i) => i.name)).toEqual(['Charlie', 'Bob', 'Alice']);
  });

  it('falls back to defaultSort', () => {
    const result = sortItems([...items], [], 'name');
    expect(result.map((i) => i.name)).toEqual(['Alice', 'Bob', 'Charlie']);
  });

  it('falls back to descending defaultSort with dash prefix', () => {
    const result = sortItems([...items], [], '-name');
    expect(result.map((i) => i.name)).toEqual(['Charlie', 'Bob', 'Alice']);
  });

  it('returns items unchanged when no sort entries and no defaultSort', () => {
    const original = [{ name: 'Charlie' }, { name: 'Alice' }];
    const result = sortItems([...original], []);
    expect(result.map((i) => i.name)).toEqual(['Charlie', 'Alice']);
  });

  it('does not mutate the original array', () => {
    const original = [...items];
    sortItems(original, [{ field: 'name', desc: false }]);
    expect(original.map((i) => i.name)).toEqual(['Charlie', 'Alice', 'Bob']);
  });
});

// ---------------------------------------------------------------------------
// paginate
// ---------------------------------------------------------------------------

describe('paginate', () => {
  const items = Array.from({ length: 10 }, (_, i) => ({ id: i + 1 }));

  it('returns first page', () => {
    const result = paginate(items, new URL('http://api.test/?page=1&pageSize=3'));
    expect(result.items).toHaveLength(3);
    expect(result.items[0]).toEqual({ id: 1 });
    expect(result.totalCount).toBe(10);
  });

  it('returns second page', () => {
    const result = paginate(items, new URL('http://api.test/?page=2&pageSize=3'));
    expect(result.items[0]).toEqual({ id: 4 });
    expect(result.items).toHaveLength(3);
  });

  it('defaults to page=1 pageSize=20', () => {
    const result = paginate(items, new URL('http://api.test/'));
    expect(result.items).toHaveLength(10);
  });
});

// ---------------------------------------------------------------------------
// groupBy
// ---------------------------------------------------------------------------

describe('groupBy', () => {
  const items = [
    { status: 'active', name: 'A' },
    { status: 'inactive', name: 'B' },
    { status: 'active', name: 'C' },
  ];

  it('groups items by field', () => {
    const result = groupBy(items, 'status');
    expect(result.totalCount).toBe(3);
    const activeGroup = result.groups.find((g) => g.value === 'active');
    expect(activeGroup?.count).toBe(2);
    expect(activeGroup?.items).toHaveLength(2);
  });

  it('applies labelFn to group keys', () => {
    const result = groupBy(items, 'status', (k) => k.toUpperCase());
    expect(result.groups.find((g) => g.value === 'active')?.label).toBe('ACTIVE');
  });

  it('handles null/undefined field values as empty string key', () => {
    const mixed = [{ status: null }, { status: 'active' }] as unknown as typeof items;
    const result = groupBy(mixed, 'status');
    expect(result.groups.some((g) => g.value === '')).toBe(true);
  });
});
