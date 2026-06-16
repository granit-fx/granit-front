import { createMockClient, createTestQueryClient } from '@granit/react-testing';
import { toISODateString } from '@granit/types';
import { QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { useDocumentRenditions, useRenditionDownloadUrl } from '../hooks/use-renditions';
import { DocumentsProvider } from '../providers/documents-provider';

import type { AxiosInstance } from '@granit/api-client';
import type { ListRenditionsResponse, RenditionDownloadUrlResponse } from '@granit/documents';
import type { ReactNode } from 'react';

const sampleRenditions: ListRenditionsResponse = {
  documentId: 'doc-1',
  documentVersionId: 'ver-1',
  renditions: [],
};

const sampleDownloadUrl: RenditionDownloadUrlResponse = {
  url: 'https://cdn.example.com/rendition.webp',
  expiresAt: toISODateString('2026-06-06T01:00:00Z'),
};

function createWrapper(client: AxiosInstance) {
  return function Wrapper({ children }: { children: ReactNode }) {
    const queryClient = createTestQueryClient();
    return (
      <QueryClientProvider client={queryClient}>
        <DocumentsProvider config={{ client }}>{children}</DocumentsProvider>
      </QueryClientProvider>
    );
  };
}

describe('useDocumentRenditions', () => {
  afterEach(() => vi.restoreAllMocks());

  it('GETs /documents/{id}/renditions', async () => {
    const client = createMockClient();
    vi.mocked(client.get).mockResolvedValue({ data: sampleRenditions });

    const { result } = renderHook(() => useDocumentRenditions('doc-1'), {
      wrapper: createWrapper(client),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(client.get).toHaveBeenCalledWith('/api/v1/documents/documents/doc-1/renditions');
    expect(result.current.data).toEqual(sampleRenditions);
  });

  it('does not fire when id is empty', () => {
    const client = createMockClient();
    const { result } = renderHook(() => useDocumentRenditions(''), {
      wrapper: createWrapper(client),
    });
    expect(result.current.fetchStatus).toBe('idle');
    expect(client.get).not.toHaveBeenCalled();
  });

  it('honours enabled: false', () => {
    const client = createMockClient();
    const { result } = renderHook(() => useDocumentRenditions('doc-1', { enabled: false }), {
      wrapper: createWrapper(client),
    });
    expect(result.current.fetchStatus).toBe('idle');
    expect(client.get).not.toHaveBeenCalled();
  });
});

describe('useRenditionDownloadUrl', () => {
  afterEach(() => vi.restoreAllMocks());

  it('GETs /documents/{id}/renditions/{type}/download', async () => {
    const client = createMockClient();
    vi.mocked(client.get).mockResolvedValue({ data: sampleDownloadUrl });

    const { result } = renderHook(() => useRenditionDownloadUrl('doc-1', 'Thumbnail'), {
      wrapper: createWrapper(client),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(client.get).toHaveBeenCalledWith(
      '/api/v1/documents/documents/doc-1/renditions/Thumbnail/download'
    );
    expect(result.current.data).toEqual(sampleDownloadUrl);
  });

  it('does not fire when id is empty', () => {
    const client = createMockClient();
    const { result } = renderHook(() => useRenditionDownloadUrl('', 'Thumbnail'), {
      wrapper: createWrapper(client),
    });
    expect(result.current.fetchStatus).toBe('idle');
    expect(client.get).not.toHaveBeenCalled();
  });

  it('honours enabled: false', () => {
    const client = createMockClient();
    const { result } = renderHook(
      () => useRenditionDownloadUrl('doc-1', 'Thumbnail', { enabled: false }),
      { wrapper: createWrapper(client) }
    );
    expect(result.current.fetchStatus).toBe('idle');
    expect(client.get).not.toHaveBeenCalled();
  });
});
