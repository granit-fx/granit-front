import { createMockClient, createTestQueryClient } from '@granit/react-testing';
import { QueryClientProvider } from '@tanstack/react-query';
import { renderHook } from '@testing-library/react';
import * as React from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';

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
} from '../hooks/use-document-mutations.js';
import { DocumentsProvider } from '../providers/documents-provider.js';

import type { AxiosInstance } from '@granit/api-client';
import type {
  DocumentResponse,
  DocumentVersionResponse,
  UploadTicketResponse,
} from '@granit/documents';
import type { QueryClient } from '@tanstack/react-query';
import type { ReactNode } from 'react';

const sampleDoc: DocumentResponse = {
  id: 'doc-1',
  folderId: 'fld-1',
  name: 'contract.pdf',
  description: null,
  ownerId: 'user-1',
  currentVersionId: 'ver-1',
  status: 'Active',
  trashedAt: null,
  permission: null,
};

const sampleVersion: DocumentVersionResponse = {
  id: 'ver-1',
  documentId: 'doc-1',
  versionNumber: 1,
  blobDescriptorId: 'blob-1',
  sizeBytes: 1024,
  contentType: 'application/pdf',
  contentHash: null,
  uploadedByUserId: 'user-1',
  uploadedAt: '2026-05-01T00:00:00Z',
  commitMessage: null,
  isCurrent: true,
};

const sampleTicket: UploadTicketResponse = {
  blobId: 'blob-1',
  uploadUrl: 'https://blob.example/upload',
  httpMethod: 'PUT',
  expiresAt: '2026-05-01T01:00:00Z',
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
    await result.current.mutateAsync({ id: 'doc-1', request: { name: 'renamed.pdf' } });

    expect(client.patch).toHaveBeenCalledWith('/api/v1/documents/documents/doc-1', {
      name: 'renamed.pdf',
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
    await result.current.mutateAsync({ id: 'doc-1', request: { newFolderId: 'fld-9' } });

    expect(client.post).toHaveBeenCalledWith('/api/v1/documents/documents/doc-1/move', {
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
    await result.current.mutateAsync({ id: 'doc-1', request: { newOwnerId: newOwner } });

    expect(client.put).toHaveBeenCalledWith('/api/v1/documents/documents/doc-1/owner', {
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
    await result.current.mutateAsync('doc-1');

    expect(client.delete).toHaveBeenCalledWith('/api/v1/documents/documents/doc-1');
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
    await result.current.mutateAsync('doc-1');

    expect(client.post).toHaveBeenCalledWith('/api/v1/documents/documents/doc-1/restore');
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
    await result.current.mutateAsync('doc-1');

    expect(client.delete).toHaveBeenCalledWith('/api/v1/documents/documents/doc-1/permanent');
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
    await result.current.mutateAsync({ id: 'doc-1', request: { blobId: 'blob-2' } });

    expect(client.post).toHaveBeenCalledWith('/api/v1/documents/documents/doc-1/versions', {
      blobId: 'blob-2',
    });
    const keys = invalidate.mock.calls.map((call) => call[0]?.queryKey);
    expect(keys).toEqual([
      ['documents', 'documents', 'doc-1', 'versions'],
      ['documents', 'documents', 'doc-1'],
      ['documents', 'quota'],
    ]);
  });
});
