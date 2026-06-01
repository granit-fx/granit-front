import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import {
  parseRelationAggregateParentMarker,
  useInvalidateEntityRelationAggregates,
} from '../hooks/use-invalidate-entity-relation-aggregates';

import type { ReactNode } from 'react';

function makeWrapper() {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  const wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
  return { wrapper, queryClient };
}

describe('parseRelationAggregateParentMarker', () => {
  it('splits {Entity}:{Id} on the first colon', () => {
    expect(parseRelationAggregateParentMarker('Party:p-1')).toEqual({
      entityName: 'Party',
      entityId: 'p-1',
    });
  });

  it('preserves colons inside the id (composite keys)', () => {
    expect(parseRelationAggregateParentMarker('Party:tenant:p-1')).toEqual({
      entityName: 'Party',
      entityId: 'tenant:p-1',
    });
  });

  it('returns null for malformed inputs', () => {
    expect(parseRelationAggregateParentMarker('no-colon')).toBeNull();
    expect(parseRelationAggregateParentMarker(':missing-entity')).toBeNull();
    expect(parseRelationAggregateParentMarker('missing-id:')).toBeNull();
    expect(parseRelationAggregateParentMarker('')).toBeNull();
  });
});

describe('useInvalidateEntityRelationAggregates', () => {
  it('invalidates exactly one prefix query per distinct parent', () => {
    const { wrapper, queryClient } = makeWrapper();
    const spy = vi.spyOn(queryClient, 'invalidateQueries');

    const { result } = renderHook(() => useInvalidateEntityRelationAggregates(), { wrapper });
    result.current(['Party:p-1', 'Party:p-2', 'Party:p-1', 'Party:p-3']);

    const keys = spy.mock.calls.map((call) => call[0]?.queryKey);
    expect(keys).toEqual([
      ['entities', 'relations', 'Party', 'p-1'],
      ['entities', 'relations', 'Party', 'p-2'],
      ['entities', 'relations', 'Party', 'p-3'],
    ]);
  });

  it('mirrors the backend invariant: 100-row bulk touching 5 parents fires 5 invalidations', () => {
    const { wrapper, queryClient } = makeWrapper();
    const spy = vi.spyOn(queryClient, 'invalidateQueries');

    const parents: string[] = [];
    for (let i = 0; i < 100; i += 1) {
      parents.push(`Party:p-${i % 5}`); // 100 markers, 5 distinct
    }

    const { result } = renderHook(() => useInvalidateEntityRelationAggregates(), { wrapper });
    result.current(parents);

    expect(spy).toHaveBeenCalledTimes(5);
  });

  it('accepts pre-parsed structured refs and string markers, mixed', () => {
    const { wrapper, queryClient } = makeWrapper();
    const spy = vi.spyOn(queryClient, 'invalidateQueries');

    const { result } = renderHook(() => useInvalidateEntityRelationAggregates(), { wrapper });
    result.current([
      { entityName: 'Party', entityId: 'p-1' },
      'Party:p-2',
      { entityName: 'Party', entityId: 'p-1' }, // duplicate of the first, dedup'd
    ]);

    expect(spy).toHaveBeenCalledTimes(2);
  });

  it('skips malformed string markers without throwing', () => {
    const { wrapper, queryClient } = makeWrapper();
    const spy = vi.spyOn(queryClient, 'invalidateQueries');

    const { result } = renderHook(() => useInvalidateEntityRelationAggregates(), { wrapper });
    result.current(['Party:p-1', 'no-colon', '', ':bad', 'good:id']);

    expect(spy).toHaveBeenCalledTimes(2);
    expect(spy.mock.calls[0]?.[0]?.queryKey).toEqual(['entities', 'relations', 'Party', 'p-1']);
    expect(spy.mock.calls[1]?.[0]?.queryKey).toEqual(['entities', 'relations', 'good', 'id']);
  });

  it('targets every relations-csv variant for a parent (4-element prefix)', () => {
    const { wrapper, queryClient } = makeWrapper();
    queryClient.setQueryData(['entities', 'relations', 'Party', 'p-1', null], 'all');
    queryClient.setQueryData(['entities', 'relations', 'Party', 'p-1', 'Invoices'], 'invoices');
    queryClient.setQueryData(
      ['entities', 'relations', 'Party', 'p-1', 'Invoices,Payments'],
      'pair'
    );
    // Different parent — must survive
    queryClient.setQueryData(['entities', 'relations', 'Party', 'p-2', null], 'untouched');
    // Different prefix — must survive
    queryClient.setQueryData(['entities', 'manifest', 'Party'], 'manifest-untouched');

    const { result } = renderHook(() => useInvalidateEntityRelationAggregates(), { wrapper });
    result.current(['Party:p-1']);

    // The three p-1 caches should be marked stale (isInvalidated=true).
    const queries = queryClient.getQueryCache().findAll({
      queryKey: ['entities', 'relations', 'Party', 'p-1'],
    });
    expect(queries.length).toBe(3);
    queries.forEach((q) => expect(q.state.isInvalidated).toBe(true));

    // The unrelated caches stay valid.
    expect(
      queryClient
        .getQueryCache()
        .find({ queryKey: ['entities', 'relations', 'Party', 'p-2', null] })?.state.isInvalidated
    ).toBe(false);
    expect(
      queryClient.getQueryCache().find({ queryKey: ['entities', 'manifest', 'Party'] })?.state
        .isInvalidated
    ).toBe(false);
  });
});
