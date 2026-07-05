import { batchResolveDocumentAssets } from '@granit/documents';
import { DocumentsProvider } from '@granit/react-documents';
import { createTestQueryClient } from '@granit/react-testing';
import { createMockClient } from '@granit/testing';
import { QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react';
import * as React from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { useResolvedDocuments } from '../hooks/use-blog-media';

import type { ResolvedDocumentResponse } from '@granit/documents';
import type { AxiosInstance } from 'axios';
import type { ReactNode } from 'react';

vi.mock('@granit/documents', async (importOriginal) => {
  const actual = (await importOriginal()) as Record<string, unknown>;
  return { ...actual, batchResolveDocumentAssets: vi.fn() };
});

function wrapper(client: AxiosInstance) {
  return function Wrapper({ children }: { children: ReactNode }) {
    const queryClient = createTestQueryClient();
    return React.createElement(
      QueryClientProvider,
      { client: queryClient },
      React.createElement(DocumentsProvider, { config: { client }, children })
    );
  };
}

const resolved: ResolvedDocumentResponse = {
  documentId: 'doc-1',
  versionId: 'v1',
  url: 'https://cdn/doc-1.jpg',
  width: 800,
  height: 600,
  mimeType: 'image/jpeg',
  sizeBytes: 1024,
  lastModified: null,
};

afterEach(() => vi.clearAllMocks());

describe('useResolvedDocuments', () => {
  it('resolves a set of ids into a map', async () => {
    const client = createMockClient();
    vi.mocked(batchResolveDocumentAssets).mockResolvedValue([resolved]);

    const { result } = renderHook(() => useResolvedDocuments(['doc-1'], 'Web'), {
      wrapper: wrapper(client),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data?.get('doc-1')?.url).toBe('https://cdn/doc-1.jpg');
    expect(batchResolveDocumentAssets).toHaveBeenCalledWith(client, expect.any(String), {
      requests: [{ documentId: 'doc-1', renditionType: 'Web' }],
    });
  });

  it('is disabled when there are no ids', () => {
    const client = createMockClient();
    const { result } = renderHook(() => useResolvedDocuments([]), { wrapper: wrapper(client) });
    expect(result.current.fetchStatus).toBe('idle');
  });
});
