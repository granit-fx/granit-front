import { createMockClient, createTestQueryClient } from '@granit/react-testing';
import { QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { useTaxonomySearch } from '../hooks/use-taxonomy-search';
import { TaxonomyProvider } from '../providers/taxonomy-provider';

import type { AxiosInstance } from '@granit/api-client';
import type { TaxonomySearchResultGroup } from '@granit/taxonomy';
import type { ReactNode } from 'react';

const sampleGroup: TaxonomySearchResultGroup = {
  targetType: 'Granit.Documents.Domain.Document',
  items: [
    {
      targetType: 'Granit.Documents.Domain.Document',
      targetId: 'doc-1',
      label: 'Q1 contract',
      snippet: '…tagged Urgent…',
      matchedTagIds: ['tag-1'],
      matchedCategoryId: null,
    },
  ],
};

function createWrapper(client: AxiosInstance) {
  return function Wrapper({ children }: { children: ReactNode }) {
    const queryClient = createTestQueryClient();
    return (
      <QueryClientProvider client={queryClient}>
        <TaxonomyProvider config={{ client }}>{children}</TaxonomyProvider>
      </QueryClientProvider>
    );
  };
}

describe('useTaxonomySearch', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('GETs /search and adapts a legacy bare-array response into the result shape', async () => {
    const client = createMockClient();
    vi.mocked(client.get).mockResolvedValue({ data: [sampleGroup] });

    const { result } = renderHook(() => useTaxonomySearch({ q: 'urgent' }), {
      wrapper: createWrapper(client),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(client.get).toHaveBeenCalledWith('/api/v1/taxonomy/search', {
      params: { q: 'urgent' },
    });
    expect(result.current.data).toEqual({
      groups: [sampleGroup],
      totalCount: 1,
      skip: null,
      take: null,
    });
  });

  it('resolves hit labels from matched tag names and surfaces pagination', async () => {
    const client = createMockClient();
    vi.mocked(client.get).mockResolvedValue({
      data: {
        tags: [
          { id: 'tag-1', name: 'Urgent', color: '#FF0000', scope: 'documents' },
          { id: 'tag-2', name: 'Legal', color: '#00FF00', scope: 'documents' },
        ],
        hits: {
          'Granit.Documents.Domain.Document': [{ targetId: 'doc-1', tagIds: ['tag-1', 'tag-2'] }],
        },
        totalCount: 1,
        skip: 0,
        take: 20,
      },
    });

    const { result } = renderHook(() => useTaxonomySearch({ q: 'urgent', skip: 0, take: 20 }), {
      wrapper: createWrapper(client),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(client.get).toHaveBeenCalledWith('/api/v1/taxonomy/search', {
      params: { q: 'urgent', skip: 0, take: 20 },
    });
    expect(result.current.data).toEqual({
      groups: [
        {
          targetType: 'Granit.Documents.Domain.Document',
          items: [
            {
              targetType: 'Granit.Documents.Domain.Document',
              targetId: 'doc-1',
              label: 'Urgent, Legal',
              snippet: null,
              matchedTagIds: ['tag-1', 'tag-2'],
              matchedCategoryId: null,
            },
          ],
        },
      ],
      totalCount: 1,
      skip: 0,
      take: 20,
    });
  });

  it('respects enabled=false (no fetch fired)', () => {
    const client = createMockClient();
    vi.mocked(client.get).mockResolvedValue({ data: [] });

    const { result } = renderHook(() => useTaxonomySearch({ q: 'a', enabled: false }), {
      wrapper: createWrapper(client),
    });

    expect(result.current.fetchStatus).toBe('idle');
    expect(client.get).not.toHaveBeenCalled();
  });

  it('strips the enabled flag from the query key (only filter persists)', async () => {
    const client = createMockClient();
    vi.mocked(client.get).mockResolvedValue({ data: [sampleGroup] });

    const { result } = renderHook(() => useTaxonomySearch({ q: 'urgent', enabled: true }), {
      wrapper: createWrapper(client),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(client.get).toHaveBeenCalledWith('/api/v1/taxonomy/search', {
      params: { q: 'urgent' },
    });
  });
});
