import { createMockClient, createTestQueryClient } from '@granit/react-testing';
import { toISODateString } from '@granit/types';
import { QueryClientProvider } from '@tanstack/react-query';
import { renderHook } from '@testing-library/react';
import * as React from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import {
  useAssignTag,
  useCreateTag,
  useDeleteTag,
  useUnassignTag,
  useUpdateTag,
} from '../hooks/use-tag-mutations';
import { TaxonomyProvider } from '../providers/taxonomy-provider';

import type { AxiosInstance } from '@granit/api-client';
import type { TagAssignmentResponse, TagResponse } from '@granit/taxonomy';
import type { QueryClient } from '@tanstack/react-query';
import type { ReactNode } from 'react';

const sampleTag: TagResponse = {
  id: 'tag-1',
  tenantId: null,
  scope: 'documents',
  name: 'Urgent',
  color: '#FF0000',
  hideOnEntityCard: false,
  createdAt: toISODateString('2026-05-01T08:00:00Z'),
  modifiedAt: toISODateString('2026-05-01T08:00:00Z'),
  concurrencyStamp: 'stamp-1',
};

const sampleAssignment: TagAssignmentResponse = {
  id: 'ta-1',
  tenantId: null,
  tagId: 'tag-1',
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

describe('useCreateTag', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('POSTs and invalidates the per-scope tags cache', async () => {
    const { client, queryClient, wrapper } = createHarness();
    vi.mocked(client.post).mockResolvedValue({ data: sampleTag });
    const invalidate = vi.spyOn(queryClient, 'invalidateQueries');

    const { result } = renderHook(() => useCreateTag('documents'), { wrapper });
    await result.current.mutateAsync({
      scope: 'documents',
      name: 'Urgent',
      color: '#FF0000',
      hideOnEntityCard: false,
    });

    expect(client.post).toHaveBeenCalledWith('/api/v1/taxonomy/tags', expect.any(Object));
    const keys = invalidate.mock.calls.map((call) => call[0]?.queryKey);
    expect(keys).toEqual([['taxonomy', 'tags', { scope: 'documents' }]]);
  });
});

describe('useUpdateTag', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('PATCHes and invalidates per-scope tags + every tag-assignments cache', async () => {
    const { client, queryClient, wrapper } = createHarness();
    vi.mocked(client.patch).mockResolvedValue({ data: { ...sampleTag, color: '#0000FF' } });
    const invalidate = vi.spyOn(queryClient, 'invalidateQueries');

    const { result } = renderHook(() => useUpdateTag('documents'), { wrapper });
    await result.current.mutateAsync({
      id: 'tag-1',
      request: {
        concurrencyStamp: 'stamp-1',
        name: null,
        color: '#0000FF',
        hideOnEntityCard: null,
      },
    });

    expect(client.patch).toHaveBeenCalledWith('/api/v1/taxonomy/tags/tag-1', expect.any(Object));
    const keys = invalidate.mock.calls.map((call) => call[0]?.queryKey);
    expect(keys).toEqual([
      ['taxonomy', 'tags', { scope: 'documents' }],
      ['taxonomy', 'tag-assignments'],
    ]);
  });
});

describe('useDeleteTag', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('DELETEs and invalidates per-scope tags + every tag-assignments cache', async () => {
    const { client, queryClient, wrapper } = createHarness();
    vi.mocked(client.delete).mockResolvedValue({ data: undefined });
    const invalidate = vi.spyOn(queryClient, 'invalidateQueries');

    const { result } = renderHook(() => useDeleteTag('documents'), { wrapper });
    await result.current.mutateAsync('tag-1');

    expect(client.delete).toHaveBeenCalledWith('/api/v1/taxonomy/tags/tag-1');
    const keys = invalidate.mock.calls.map((call) => call[0]?.queryKey);
    expect(keys).toEqual([
      ['taxonomy', 'tags', { scope: 'documents' }],
      ['taxonomy', 'tag-assignments'],
    ]);
  });
});

describe('useAssignTag', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('POSTs and invalidates only the impacted target chip strip', async () => {
    const { client, queryClient, wrapper } = createHarness();
    vi.mocked(client.post).mockResolvedValue({ data: sampleAssignment });
    const invalidate = vi.spyOn(queryClient, 'invalidateQueries');

    const { result } = renderHook(() => useAssignTag(), { wrapper });
    await result.current.mutateAsync({
      tagId: 'tag-1',
      target: { targetType: 'Granit.Documents.Domain.Document', targetId: 'doc-1' },
    });

    expect(client.post).toHaveBeenCalledWith('/api/v1/taxonomy/tags/tag-1/assign', {
      targetType: 'Granit.Documents.Domain.Document',
      targetId: 'doc-1',
    });
    const keys = invalidate.mock.calls.map((call) => call[0]?.queryKey);
    expect(keys).toEqual([
      [
        'taxonomy',
        'tag-assignments',
        { targetType: 'Granit.Documents.Domain.Document', targetId: 'doc-1' },
      ],
    ]);
  });
});

describe('useUnassignTag', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('DELETEs and invalidates only the impacted target chip strip', async () => {
    const { client, queryClient, wrapper } = createHarness();
    vi.mocked(client.delete).mockResolvedValue({ data: undefined });
    const invalidate = vi.spyOn(queryClient, 'invalidateQueries');

    const { result } = renderHook(() => useUnassignTag(), { wrapper });
    await result.current.mutateAsync({
      tagId: 'tag-1',
      target: { targetType: 'Granit.Documents.Domain.Document', targetId: 'doc-1' },
    });

    expect(client.delete).toHaveBeenCalledWith(
      `/api/v1/taxonomy/tags/tag-1/assign/${encodeURIComponent('Granit.Documents.Domain.Document')}/doc-1`
    );
    const keys = invalidate.mock.calls.map((call) => call[0]?.queryKey);
    expect(keys).toEqual([
      [
        'taxonomy',
        'tag-assignments',
        { targetType: 'Granit.Documents.Domain.Document', targetId: 'doc-1' },
      ],
    ]);
  });
});

describe('error propagation', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('useUpdateTag surfaces 409 conflicts to callers without invalidating', async () => {
    const { client, queryClient, wrapper } = createHarness();
    const error = Object.assign(new Error('conflict'), { response: { status: 409 } });
    vi.mocked(client.patch).mockRejectedValue(error);
    const invalidate = vi.spyOn(queryClient, 'invalidateQueries');

    const { result } = renderHook(() => useUpdateTag('documents'), { wrapper });
    await expect(
      result.current.mutateAsync({
        id: 'tag-1',
        request: {
          concurrencyStamp: 'stamp-1',
          name: 'Urgent',
          color: null,
          hideOnEntityCard: null,
        },
      })
    ).rejects.toMatchObject({ response: { status: 409 } });

    expect(invalidate).not.toHaveBeenCalled();
  });
});
