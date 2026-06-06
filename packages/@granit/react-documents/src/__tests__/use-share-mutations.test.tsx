import { createMockClient, createTestQueryClient } from '@granit/react-testing';
import { QueryClientProvider } from '@tanstack/react-query';
import { renderHook } from '@testing-library/react';
import * as React from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import {
  useGrantDocumentShare,
  useGrantFolderShare,
  useRevokeShare,
} from '../hooks/use-share-mutations';
import { DocumentsProvider } from '../providers/documents-provider';

import type { AxiosInstance } from '@granit/api-client';
import type { ShareResponse } from '@granit/documents';
import type { QueryClient } from '@tanstack/react-query';
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
  createdBy: 'user-1',
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
      <DocumentsProvider config={{ client }}>{children}</DocumentsProvider>
    </QueryClientProvider>
  );
  return { client, queryClient, wrapper };
}

describe('useGrantFolderShare', () => {
  afterEach(() => vi.restoreAllMocks());

  it('POSTs /folders/{id}/shares and invalidates the shares namespace', async () => {
    const { client, queryClient, wrapper } = createHarness();
    vi.mocked(client.post).mockResolvedValue({ data: sampleShare });
    const invalidate = vi.spyOn(queryClient, 'invalidateQueries');

    const { result } = renderHook(() => useGrantFolderShare(), { wrapper });
    await result.current.mutateAsync({
      folderId: 'fld-1',
      request: { granteeType: 'User', granteeId: 'user-2', permission: 'Read' },
    });

    expect(client.post).toHaveBeenCalledWith(
      '/api/v1/documents/folders/fld-1/shares',
      expect.any(Object)
    );
    const keys = invalidate.mock.calls.map((call) => call[0]?.queryKey);
    expect(keys).toEqual([['documents', 'shares']]);
  });
});

describe('useGrantDocumentShare', () => {
  afterEach(() => vi.restoreAllMocks());

  it('POSTs /documents/{id}/shares and invalidates the shares namespace', async () => {
    const { client, queryClient, wrapper } = createHarness();
    vi.mocked(client.post).mockResolvedValue({ data: sampleShare });
    const invalidate = vi.spyOn(queryClient, 'invalidateQueries');

    const { result } = renderHook(() => useGrantDocumentShare(), { wrapper });
    await result.current.mutateAsync({
      documentId: 'doc-1',
      request: { granteeType: 'User', granteeId: 'user-2', permission: 'Edit' },
    });

    expect(client.post).toHaveBeenCalledWith(
      '/api/v1/documents/documents/doc-1/shares',
      expect.any(Object)
    );
    const keys = invalidate.mock.calls.map((call) => call[0]?.queryKey);
    expect(keys).toEqual([['documents', 'shares']]);
  });
});

describe('useRevokeShare', () => {
  afterEach(() => vi.restoreAllMocks());

  it('DELETEs /shares/{id} and invalidates the shares namespace', async () => {
    const { client, queryClient, wrapper } = createHarness();
    vi.mocked(client.delete).mockResolvedValue({ data: undefined });
    const invalidate = vi.spyOn(queryClient, 'invalidateQueries');

    const { result } = renderHook(() => useRevokeShare(), { wrapper });
    await result.current.mutateAsync('shr-1');

    expect(client.delete).toHaveBeenCalledWith('/api/v1/documents/shares/shr-1');
    const keys = invalidate.mock.calls.map((call) => call[0]?.queryKey);
    expect(keys).toEqual([['documents', 'shares']]);
  });
});
