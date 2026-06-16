import { createMockClient, createTestQueryClient } from '@granit/react-testing';
import { toISODateString } from '@granit/types';
import { QueryClientProvider } from '@tanstack/react-query';
import { renderHook } from '@testing-library/react';
import * as React from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import {
  useAssignCategory,
  useCreateCategory,
  useDeleteCategory,
  useMoveCategory,
  useUnassignCategory,
  useUpdateCategory,
} from '../hooks/use-category-mutations';
import { TaxonomyProvider } from '../providers/taxonomy-provider';

import type { AxiosInstance } from '@granit/api-client';
import type { CategoryAssignmentResponse, CategoryResponse } from '@granit/taxonomy';
import type { QueryClient } from '@tanstack/react-query';
import type { ReactNode } from 'react';

const sampleCategory: CategoryResponse = {
  id: 'cat-1',
  tenantId: null,
  scope: 'documents',
  parentId: null,
  path: '/legal',
  name: 'legal',
  depth: 0,
  iconName: null,
  hideOnEntityCard: false,
  hasChildren: true,
  createdAt: toISODateString('2026-05-01T08:00:00Z'),
  modifiedAt: null,
  concurrencyStamp: 'stamp-1',
};

const sampleAssignment: CategoryAssignmentResponse = {
  id: 'ca-1',
  tenantId: null,
  categoryId: 'cat-1',
  targetType: 'Granit.Documents.Domain.Document',
  targetId: 'doc-1',
  assignedAt: toISODateString('2026-05-02T12:00:00Z'),
  assignedByUserId: 'user-1',
};

interface Harness {
  readonly client: AxiosInstance;
  readonly queryClient: QueryClient;
  readonly wrapper: (props: { children: ReactNode }) => React.ReactElement;
}

function createHarness(): Harness {
  const client = createMockClient();
  const queryClient = createTestQueryClient();
  const wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      <TaxonomyProvider config={{ client }}>{children}</TaxonomyProvider>
    </QueryClientProvider>
  );
  return { client, queryClient, wrapper };
}

describe('useCreateCategory', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('POSTs and invalidates the per-scope tree', async () => {
    const { client, queryClient, wrapper } = createHarness();
    vi.mocked(client.post).mockResolvedValue({ data: sampleCategory });
    const invalidate = vi.spyOn(queryClient, 'invalidateQueries');

    const { result } = renderHook(() => useCreateCategory('documents'), { wrapper });
    await result.current.mutateAsync({
      scope: 'documents',
      parentId: null,
      name: 'legal',
      iconName: null,
      hideOnEntityCard: null,
    });

    expect(client.post).toHaveBeenCalledWith('/api/v1/taxonomy/categories', expect.any(Object));
    const keys = invalidate.mock.calls.map((call) => call[0]?.queryKey);
    expect(keys).toEqual([['taxonomy', 'categories', { scope: 'documents' }]]);
  });
});

describe('useUpdateCategory', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('PATCHes and invalidates the scope tree + the renamed node detail', async () => {
    const { client, queryClient, wrapper } = createHarness();
    vi.mocked(client.patch).mockResolvedValue({ data: sampleCategory });
    const invalidate = vi.spyOn(queryClient, 'invalidateQueries');

    const { result } = renderHook(() => useUpdateCategory('documents'), { wrapper });
    await result.current.mutateAsync({
      id: 'cat-1',
      request: { name: 'agreements', iconName: null, hideOnEntityCard: null },
    });

    const keys = invalidate.mock.calls.map((call) => call[0]?.queryKey);
    expect(keys).toEqual([
      ['taxonomy', 'categories', { scope: 'documents' }],
      ['taxonomy', 'category', 'cat-1'],
    ]);
  });
});

describe('useMoveCategory', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('POSTs and invalidates scope tree + ALL category details (subtree breadcrumbs change)', async () => {
    const { client, queryClient, wrapper } = createHarness();
    vi.mocked(client.post).mockResolvedValue({ data: sampleCategory });
    const invalidate = vi.spyOn(queryClient, 'invalidateQueries');

    const { result } = renderHook(() => useMoveCategory('documents'), { wrapper });
    await result.current.mutateAsync({ id: 'cat-1', request: { newParentId: 'cat-9' } });

    expect(client.post).toHaveBeenCalledWith('/api/v1/taxonomy/categories/cat-1/move', {
      newParentId: 'cat-9',
    });
    const keys = invalidate.mock.calls.map((call) => call[0]?.queryKey);
    expect(keys).toEqual([
      ['taxonomy', 'categories', { scope: 'documents' }],
      ['taxonomy', 'category'],
    ]);
  });

  it('propagates 422 errors (cross-scope / cycle) without invalidating', async () => {
    const { client, queryClient, wrapper } = createHarness();
    const error = Object.assign(new Error('cycle'), {
      response: { status: 422, data: { detail: 'cycle' } },
    });
    vi.mocked(client.post).mockRejectedValue(error);
    const invalidate = vi.spyOn(queryClient, 'invalidateQueries');

    const { result } = renderHook(() => useMoveCategory('documents'), { wrapper });
    await expect(
      result.current.mutateAsync({ id: 'cat-1', request: { newParentId: 'cat-1' } })
    ).rejects.toMatchObject({ response: { status: 422 } });

    expect(invalidate).not.toHaveBeenCalled();
  });
});

describe('useDeleteCategory', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('DELETEs and invalidates scope tree + the deleted detail', async () => {
    const { client, queryClient, wrapper } = createHarness();
    vi.mocked(client.delete).mockResolvedValue({ data: undefined });
    const invalidate = vi.spyOn(queryClient, 'invalidateQueries');

    const { result } = renderHook(() => useDeleteCategory('documents'), { wrapper });
    await result.current.mutateAsync('cat-1');

    expect(client.delete).toHaveBeenCalledWith('/api/v1/taxonomy/categories/cat-1');
    const keys = invalidate.mock.calls.map((call) => call[0]?.queryKey);
    expect(keys).toEqual([
      ['taxonomy', 'categories', { scope: 'documents' }],
      ['taxonomy', 'category', 'cat-1'],
    ]);
  });

  it('propagates 422 errors (descendants / active assignments) without invalidating', async () => {
    const { client, queryClient, wrapper } = createHarness();
    const error = Object.assign(new Error('has-descendants'), {
      response: { status: 422, data: { detail: 'has-descendants' } },
    });
    vi.mocked(client.delete).mockRejectedValue(error);
    const invalidate = vi.spyOn(queryClient, 'invalidateQueries');

    const { result } = renderHook(() => useDeleteCategory('documents'), { wrapper });
    await expect(result.current.mutateAsync('cat-1')).rejects.toMatchObject({
      response: { status: 422 },
    });

    expect(invalidate).not.toHaveBeenCalled();
  });
});

describe('useAssignCategory', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('POSTs and invalidates only the impacted target', async () => {
    const { client, queryClient, wrapper } = createHarness();
    vi.mocked(client.post).mockResolvedValue({ data: sampleAssignment });
    const invalidate = vi.spyOn(queryClient, 'invalidateQueries');

    const { result } = renderHook(() => useAssignCategory(), { wrapper });
    await result.current.mutateAsync({
      categoryId: 'cat-1',
      target: { targetType: 'Granit.Documents.Domain.Document', targetId: 'doc-1' },
    });

    expect(client.post).toHaveBeenCalledWith('/api/v1/taxonomy/categories/cat-1/assign', {
      targetType: 'Granit.Documents.Domain.Document',
      targetId: 'doc-1',
    });
    const keys = invalidate.mock.calls.map((call) => call[0]?.queryKey);
    expect(keys).toEqual([
      [
        'taxonomy',
        'category-assignments',
        { targetType: 'Granit.Documents.Domain.Document', targetId: 'doc-1' },
      ],
    ]);
  });
});

describe('useUnassignCategory', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('DELETEs and invalidates only the impacted target', async () => {
    const { client, queryClient, wrapper } = createHarness();
    vi.mocked(client.delete).mockResolvedValue({ data: undefined });
    const invalidate = vi.spyOn(queryClient, 'invalidateQueries');

    const { result } = renderHook(() => useUnassignCategory(), { wrapper });
    await result.current.mutateAsync({
      targetType: 'Granit.Documents.Domain.Document',
      targetId: 'doc-1',
    });

    expect(client.delete).toHaveBeenCalledWith(
      `/api/v1/taxonomy/categories/assign/${encodeURIComponent('Granit.Documents.Domain.Document')}/doc-1`
    );
    const keys = invalidate.mock.calls.map((call) => call[0]?.queryKey);
    expect(keys).toEqual([
      [
        'taxonomy',
        'category-assignments',
        { targetType: 'Granit.Documents.Domain.Document', targetId: 'doc-1' },
      ],
    ]);
  });
});
