import { createMockClient, createTestQueryClient } from '@granit/react-testing';
import { QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { useDocumentShares, useFolderShares } from '../hooks/use-shares';
import { DocumentsProvider } from '../providers/documents-provider';

import type { AxiosInstance } from '@granit/api-client';
import type { ListSharesResponse, ShareResponse } from '@granit/documents';
import type { ReactNode } from 'react';

const sampleShare: ShareResponse = {
  id: 'shr-1',
  targetType: 'Folder',
  folderId: 'fld-1',
  documentId: null,
  granteeType: 'User',
  granteeId: 'user-2',
  permission: 'Read',
  isDefault: true,
  expiresAt: null,
  createdAt: '2026-05-01T00:00:00Z',
  createdByUserId: 'user-1',
};
const sampleResponse: ListSharesResponse = { items: [sampleShare] };

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

describe('useFolderShares', () => {
  afterEach(() => vi.restoreAllMocks());

  it('GETs /folders/{id}/shares', async () => {
    const client = createMockClient();
    vi.mocked(client.get).mockResolvedValue({ data: sampleResponse });

    const { result } = renderHook(() => useFolderShares('fld-1'), {
      wrapper: createWrapper(client),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(client.get).toHaveBeenCalledWith('/api/v1/documents/folders/fld-1/shares');
    expect(result.current.data).toEqual(sampleResponse);
  });

  it('does not fire when folderId is empty', () => {
    const client = createMockClient();
    const { result } = renderHook(() => useFolderShares(''), {
      wrapper: createWrapper(client),
    });
    expect(result.current.fetchStatus).toBe('idle');
    expect(client.get).not.toHaveBeenCalled();
  });
});

describe('useDocumentShares', () => {
  afterEach(() => vi.restoreAllMocks());

  it('GETs /documents/{id}/shares', async () => {
    const client = createMockClient();
    vi.mocked(client.get).mockResolvedValue({ data: sampleResponse });

    const { result } = renderHook(() => useDocumentShares('doc-1'), {
      wrapper: createWrapper(client),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(client.get).toHaveBeenCalledWith('/api/v1/documents/documents/doc-1/shares');
  });

  it('does not fire when documentId is empty', () => {
    const client = createMockClient();
    const { result } = renderHook(() => useDocumentShares(''), {
      wrapper: createWrapper(client),
    });
    expect(result.current.fetchStatus).toBe('idle');
    expect(client.get).not.toHaveBeenCalled();
  });
});
