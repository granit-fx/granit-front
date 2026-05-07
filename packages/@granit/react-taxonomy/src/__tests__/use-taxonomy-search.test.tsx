import { createMockClient, createTestQueryClient } from '@granit/react-testing';
import { QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { useTaxonomySearch } from '../hooks/use-taxonomy-search.js';
import { TaxonomyProvider } from '../providers/taxonomy-provider.js';

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

  it('GETs /search and returns the grouped results', async () => {
    const client = createMockClient();
    vi.mocked(client.get).mockResolvedValue({ data: [sampleGroup] });

    const { result } = renderHook(() => useTaxonomySearch({ q: 'urgent' }), {
      wrapper: createWrapper(client),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(client.get).toHaveBeenCalledWith('/api/v1/taxonomy/search', {
      params: { q: 'urgent' },
    });
    expect(result.current.data).toEqual([sampleGroup]);
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
