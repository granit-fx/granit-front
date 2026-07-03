import { renderHook } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { useQueryFieldMetadata } from '../use-query-field-metadata';

// Mutable column list driving the mocked query metadata.
const state = vi.hoisted(() => ({ columns: [] as { name: string; type: string }[] }));

vi.mock('@granit/react-query-engine', () => ({
  useQueryCatalog: () => ({ data: [{ name: 'Q', basePath: '/api/v1/q' }] }),
  useQueryMetaAt: () => ({
    data: { columns: state.columns, groupByFields: [], sortableFields: [] },
  }),
}));

describe('useQueryFieldMetadata — geographyColumnOptions', () => {
  it('offers only NetTopologySuite geometry columns', () => {
    state.columns = [
      { name: 'Location', type: 'Point' },
      { name: 'Region', type: 'Polygon' },
      { name: 'Name', type: 'String' },
      { name: 'Count', type: 'Int32' },
    ];
    const { result } = renderHook(() => useQueryFieldMetadata('Q'));
    expect(result.current.geographyColumnOptions.map((o) => o.name)).toEqual([
      'Location',
      'Region',
    ]);
  });

  it('falls back to every column when none are geometry', () => {
    state.columns = [
      { name: 'Name', type: 'String' },
      { name: 'Count', type: 'Int32' },
    ];
    const { result } = renderHook(() => useQueryFieldMetadata('Q'));
    expect(result.current.geographyColumnOptions.map((o) => o.name)).toEqual(['Name', 'Count']);
  });
});
