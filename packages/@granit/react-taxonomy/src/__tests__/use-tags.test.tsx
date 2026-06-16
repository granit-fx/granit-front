import { createMockClient, createTestQueryClient } from '@granit/react-testing';
import { QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { useTagAssignments, useTags } from '../hooks/use-tags';
import { TaxonomyProvider } from '../providers/taxonomy-provider';

import type { AxiosInstance } from '@granit/api-client';
import type { TagResponse } from '@granit/taxonomy';
import type { ReactNode } from 'react';

const sampleTag: TagResponse = {
  id: 'tag-1',
  tenantId: null,
  scope: 'documents',
  name: 'Urgent',
  color: '#FF0000',
  hideOnEntityCard: false,
  createdAt: '2026-05-01T08:00:00Z',
  modifiedAt: '2026-05-01T08:00:00Z',
  concurrencyStamp: 'stamp-1',
};

function createWrapper(client: AxiosInstance, basePath?: string) {
  return function Wrapper({ children }: { children: ReactNode }) {
    const queryClient = createTestQueryClient();
    return (
      <QueryClientProvider client={queryClient}>
        <TaxonomyProvider config={{ client, basePath }}>{children}</TaxonomyProvider>
      </QueryClientProvider>
    );
  };
}

describe('useTags', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('GETs /tags with the scope and returns the array', async () => {
    const client = createMockClient();
    vi.mocked(client.get).mockResolvedValue({ data: [sampleTag] });

    const { result } = renderHook(() => useTags({ scope: 'documents' }), {
      wrapper: createWrapper(client),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(client.get).toHaveBeenCalledWith('/api/v1/taxonomy/tags', {
      params: { scope: 'documents' },
    });
    expect(result.current.data).toEqual([sampleTag]);
  });

  it('forwards the autocomplete query when provided', async () => {
    const client = createMockClient();
    vi.mocked(client.get).mockResolvedValue({ data: [sampleTag] });

    const { result } = renderHook(() => useTags({ scope: 'documents', q: 'urg' }), {
      wrapper: createWrapper(client),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(client.get).toHaveBeenCalledWith('/api/v1/taxonomy/tags', {
      params: { scope: 'documents', q: 'urg' },
    });
  });

  it('honors a basePath override on the provider', async () => {
    const client = createMockClient();
    vi.mocked(client.get).mockResolvedValue({ data: [] });

    const { result } = renderHook(() => useTags({ scope: 'parties' }), {
      wrapper: createWrapper(client, '/custom/taxonomy'),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(client.get).toHaveBeenCalledWith('/custom/taxonomy/tags', {
      params: { scope: 'parties' },
    });
  });
});

describe('useTagAssignments', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('GETs /assignments with the target ref and returns TagResponse[]', async () => {
    const client = createMockClient();
    vi.mocked(client.get).mockResolvedValue({ data: { items: [sampleTag] } });

    const { result } = renderHook(
      () =>
        useTagAssignments({
          targetType: 'Granit.Documents.Domain.Document',
          targetId: 'doc-1',
        }),
      { wrapper: createWrapper(client) }
    );

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(client.get).toHaveBeenCalledWith('/api/v1/taxonomy/assignments', {
      params: {
        targetType: 'Granit.Documents.Domain.Document',
        targetId: 'doc-1',
      },
    });
    expect(result.current.data).toEqual([sampleTag]);
  });

  it('does not fire the query when the target is incomplete', async () => {
    const client = createMockClient();
    vi.mocked(client.get).mockResolvedValue({ data: [] });

    const { result } = renderHook(() => useTagAssignments({ targetType: '', targetId: '' }), {
      wrapper: createWrapper(client),
    });

    expect(result.current.fetchStatus).toBe('idle');
    expect(client.get).not.toHaveBeenCalled();
  });
});
