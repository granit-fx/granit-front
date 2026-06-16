import { createMockClient, createTestQueryClient } from '@granit/react-testing';
import { QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import {
  useAttachTagToDocument,
  useDetachTagFromDocument,
  useDocumentTags,
} from '../hooks/use-document-tags';
import { TaxonomyProvider } from '../providers/taxonomy-provider';

import type { AxiosInstance } from '@granit/api-client';
import type { TagResponse } from '@granit/taxonomy';
import type { QueryClient } from '@tanstack/react-query';
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

interface Harness {
  readonly client: AxiosInstance;
  readonly queryClient: QueryClient;
  readonly wrapper: (props: { children: ReactNode }) => ReactNode;
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

describe('useDocumentTags', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('GETs the proxy URL with the encoded document id', async () => {
    const { client, wrapper } = createHarness();
    vi.mocked(client.get).mockResolvedValue({ data: [sampleTag] });

    const { result } = renderHook(
      () => useDocumentTags({ basePath: '/api/v1', documentId: 'doc-1' }),
      { wrapper }
    );

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(client.get).toHaveBeenCalledWith('/api/v1/documents/doc-1/tags');
  });

  it('does not fire when documentId is empty', () => {
    const { client, wrapper } = createHarness();
    vi.mocked(client.get).mockResolvedValue({ data: [] });

    const { result } = renderHook(() => useDocumentTags({ basePath: '/api/v1', documentId: '' }), {
      wrapper,
    });

    expect(result.current.fetchStatus).toBe('idle');
    expect(client.get).not.toHaveBeenCalled();
  });
});

describe('useAttachTagToDocument', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('POSTs the proxy URL and invalidates the document tags cache', async () => {
    const { client, queryClient, wrapper } = createHarness();
    vi.mocked(client.post).mockResolvedValue({ data: undefined });
    const invalidate = vi.spyOn(queryClient, 'invalidateQueries');

    const { result } = renderHook(
      () => useAttachTagToDocument({ basePath: '/api/v1', documentId: 'doc-1' }),
      { wrapper }
    );
    await result.current.mutateAsync('tag-1');

    expect(client.post).toHaveBeenCalledWith('/api/v1/documents/doc-1/tags/tag-1');
    const keys = invalidate.mock.calls.map((call) => call[0]?.queryKey);
    expect(keys).toEqual([
      ['taxonomy', 'document-tags', { basePath: '/api/v1', documentId: 'doc-1' }],
    ]);
  });
});

describe('useDetachTagFromDocument', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('DELETEs the proxy URL and invalidates the document tags cache', async () => {
    const { client, queryClient, wrapper } = createHarness();
    vi.mocked(client.delete).mockResolvedValue({ data: undefined });
    const invalidate = vi.spyOn(queryClient, 'invalidateQueries');

    const { result } = renderHook(
      () => useDetachTagFromDocument({ basePath: '/api/v1', documentId: 'doc-1' }),
      { wrapper }
    );
    await result.current.mutateAsync('tag-1');

    expect(client.delete).toHaveBeenCalledWith('/api/v1/documents/doc-1/tags/tag-1');
    expect(invalidate).toHaveBeenCalledTimes(1);
  });
});
