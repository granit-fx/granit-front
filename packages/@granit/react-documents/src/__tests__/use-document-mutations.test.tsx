import { createMockClient, createTestQueryClient } from '@granit/react-testing';
import { toISODateString } from '@granit/types';
import { QueryClientProvider } from '@tanstack/react-query';
import { renderHook } from '@testing-library/react';
import * as React from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { mockDocumentsData, mockVersionsData } from '@granit/react-documents/testing';

import {
  useAppendDocumentVersion,
  useFinalizeUpload,
  useMoveDocument,
  usePermanentlyDeleteDocument,
  useRenameDocument,
  useRequestUploadTicket,
  useRestoreDocument,
  useTransferDocumentOwner,
  useTrashDocument,
} from '../hooks/use-document-mutations';
import { DocumentsProvider } from '../providers/documents-provider';

import type { AxiosInstance } from '@granit/api-client';
import type { UploadTicketResponse } from '@granit/documents';
import type { QueryClient } from '@tanstack/react-query';
import type { ReactNode } from 'react';

const sampleDoc = mockDocumentsData[0]!;
const docId = sampleDoc.id;

const sampleVersion = mockVersionsData[0]!;

const sampleTicket: UploadTicketResponse = {
  blobId: 'blob-1',
  uploadUrl: 'https://blob.example/upload',
  httpMethod: 'PUT',
  expiresAt: toISODateString('2026-05-01T01:00:00Z'),
  requiredHeaders: {},
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

describe('useRequestUploadTicket', () => {
  afterEach(() => vi.restoreAllMocks());

  it('POSTs /documents/upload-ticket and does NOT invalidate anything', async () => {
    const { client, queryClient, wrapper } = createHarness();
    vi.mocked(client.post).mockResolvedValue({ data: sampleTicket });
    const invalidate = vi.spyOn(queryClient, 'invalidateQueries');

    const { result } = renderHook(() => useRequestUploadTicket(), { wrapper });
    await result.current.mutateAsync({
      fileName: 'contract.pdf',
      contentType: 'application/pdf',
      maxAllowedBytes: 5_000_000,
    });

    expect(client.post).toHaveBeenCalledWith(
      '/api/v1/documents/documents/upload-ticket',
      expect.any(Object)
    );
    expect(invalidate).not.toHaveBeenCalled();
  });
});

describe('useFinalizeUpload', () => {
  afterEach(() => vi.restoreAllMocks());

  it('POSTs /documents/finalize and invalidates folders + quota', async () => {
    const { client, queryClient, wrapper } = createHarness();
    vi.mocked(client.post).mockResolvedValue({ data: sampleDoc });
    const invalidate = vi.spyOn(queryClient, 'invalidateQueries');

    const { result } = renderHook(() => useFinalizeUpload(), { wrapper });
    await result.current.mutateAsync({
      blobId: 'blob-1',
      folderId: 'fld-1',
      name: 'contract.pdf',
      description: null,
      commitMessage: null,
    });

    expect(client.post).toHaveBeenCalledWith(
      '/api/v1/documents/documents/finalize',
      expect.any(Object)
    );
    const keys = invalidate.mock.calls.map((call) => call[0]?.queryKey);
    expect(keys).toEqual([
      ['documents', 'folders'],
      ['documents', 'quota'],
    ]);
  });
});

describe('useRenameDocument', () => {
  afterEach(() => vi.restoreAllMocks());

  it('PATCHes and invalidates the documents namespace', async () => {
    const { client, queryClient, wrapper } = createHarness();
    vi.mocked(client.patch).mockResolvedValue({ data: sampleDoc });
    const invalidate = vi.spyOn(queryClient, 'invalidateQueries');

    const { result } = renderHook(() => useRenameDocument(), { wrapper });
    await result.current.mutateAsync({
      id: docId,
      request: { concurrencyStamp: 'stamp-1', name: 'renamed.pdf', description: null },
    });

    expect(client.patch).toHaveBeenCalledWith(`/api/v1/documents/documents/${docId}`, {
      concurrencyStamp: 'stamp-1',
      name: 'renamed.pdf',
      description: null,
    });
    const keys = invalidate.mock.calls.map((call) => call[0]?.queryKey);
    expect(keys).toEqual([['documents', 'documents']]);
  });
});

describe('useMoveDocument', () => {
  afterEach(() => vi.restoreAllMocks());

  it('POSTs /move and invalidates the documents namespace', async () => {
    const { client, queryClient, wrapper } = createHarness();
    vi.mocked(client.post).mockResolvedValue({ data: sampleDoc });
    const invalidate = vi.spyOn(queryClient, 'invalidateQueries');

    const { result } = renderHook(() => useMoveDocument(), { wrapper });
    await result.current.mutateAsync({ id: docId, request: { newFolderId: 'fld-9' } });

    expect(client.post).toHaveBeenCalledWith(`/api/v1/documents/documents/${docId}/move`, {
      newFolderId: 'fld-9',
    });
    const keys = invalidate.mock.calls.map((call) => call[0]?.queryKey);
    expect(keys).toEqual([['documents', 'documents']]);
  });
});

describe('useTransferDocumentOwner', () => {
  afterEach(() => vi.restoreAllMocks());

  it('PUTs /documents/{id}/owner and invalidates the documents namespace', async () => {
    const { client, queryClient, wrapper } = createHarness();
    const newOwner = '00000000-0000-4000-8000-0000000000a9';
    vi.mocked(client.put).mockResolvedValue({ data: { ...sampleDoc, ownerId: newOwner } });
    const invalidate = vi.spyOn(queryClient, 'invalidateQueries');

    const { result } = renderHook(() => useTransferDocumentOwner(), { wrapper });
    await result.current.mutateAsync({ id: docId, request: { newOwnerId: newOwner } });

    expect(client.put).toHaveBeenCalledWith(`/api/v1/documents/documents/${docId}/owner`, {
      newOwnerId: newOwner,
    });
    const keys = invalidate.mock.calls.map((call) => call[0]?.queryKey);
    expect(keys).toEqual([['documents', 'documents']]);
  });
});

describe('useTrashDocument', () => {
  afterEach(() => vi.restoreAllMocks());

  it('DELETEs and invalidates documents + trash + quota', async () => {
    const { client, queryClient, wrapper } = createHarness();
    vi.mocked(client.delete).mockResolvedValue({ data: sampleDoc });
    const invalidate = vi.spyOn(queryClient, 'invalidateQueries');

    const { result } = renderHook(() => useTrashDocument(), { wrapper });
    await result.current.mutateAsync(docId);

    expect(client.delete).toHaveBeenCalledWith(`/api/v1/documents/documents/${docId}`);
    const keys = invalidate.mock.calls.map((call) => call[0]?.queryKey);
    expect(keys).toEqual([
      ['documents', 'documents'],
      ['documents', 'documents', 'trash'],
      ['documents', 'quota'],
    ]);
  });
});

describe('useRestoreDocument', () => {
  afterEach(() => vi.restoreAllMocks());

  it('POSTs /restore and invalidates documents + trash + quota', async () => {
    const { client, queryClient, wrapper } = createHarness();
    vi.mocked(client.post).mockResolvedValue({ data: sampleDoc });
    const invalidate = vi.spyOn(queryClient, 'invalidateQueries');

    const { result } = renderHook(() => useRestoreDocument(), { wrapper });
    await result.current.mutateAsync(docId);

    expect(client.post).toHaveBeenCalledWith(`/api/v1/documents/documents/${docId}/restore`);
    const keys = invalidate.mock.calls.map((call) => call[0]?.queryKey);
    expect(keys).toEqual([
      ['documents', 'documents'],
      ['documents', 'documents', 'trash'],
      ['documents', 'quota'],
    ]);
  });
});

describe('usePermanentlyDeleteDocument', () => {
  afterEach(() => vi.restoreAllMocks());

  it('DELETEs /permanent and invalidates documents + trash + quota', async () => {
    const { client, queryClient, wrapper } = createHarness();
    vi.mocked(client.delete).mockResolvedValue({ data: undefined });
    const invalidate = vi.spyOn(queryClient, 'invalidateQueries');

    const { result } = renderHook(() => usePermanentlyDeleteDocument(), { wrapper });
    await result.current.mutateAsync(docId);

    expect(client.delete).toHaveBeenCalledWith(`/api/v1/documents/documents/${docId}/permanent`);
    const keys = invalidate.mock.calls.map((call) => call[0]?.queryKey);
    expect(keys).toEqual([
      ['documents', 'documents'],
      ['documents', 'documents', 'trash'],
      ['documents', 'quota'],
    ]);
  });
});

describe('useAppendDocumentVersion', () => {
  afterEach(() => vi.restoreAllMocks());

  it('POSTs /versions and invalidates versions + detail + quota', async () => {
    const { client, queryClient, wrapper } = createHarness();
    vi.mocked(client.post).mockResolvedValue({ data: sampleVersion });
    const invalidate = vi.spyOn(queryClient, 'invalidateQueries');

    const { result } = renderHook(() => useAppendDocumentVersion(), { wrapper });
    await result.current.mutateAsync({
      id: docId,
      request: { blobId: 'blob-2', commitMessage: null },
    });

    expect(client.post).toHaveBeenCalledWith(`/api/v1/documents/documents/${docId}/versions`, {
      blobId: 'blob-2',
      commitMessage: null,
    });
    const keys = invalidate.mock.calls.map((call) => call[0]?.queryKey);
    expect(keys).toEqual([
      ['documents', 'documents', docId, 'versions'],
      ['documents', 'documents', docId],
      ['documents', 'quota'],
    ]);
  });
});
