import { createMockClient, createTestQueryClient } from '@granit/react-testing';
import { toISODateString } from '@granit/types';
import { QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import {
  useDocument,
  useDocumentDownloadUrl,
  useDocumentVersions,
  useTrashedDocuments,
} from '../hooks/use-documents';
import { DocumentsProvider } from '../providers/documents-provider';

import type { AxiosInstance } from '@granit/api-client';
import type {
  DocumentResponse,
  DocumentVersionResponse,
  DownloadUrlResponse,
  ListDocumentVersionsResponse,
  ListTrashedDocumentsResponse,
  TrashedDocumentResponse,
} from '@granit/documents';
import type { ReactNode } from 'react';

const sampleDoc: DocumentResponse = {
  id: 'doc-1',
  folderId: 'fld-1',
  name: 'contract.pdf',
  description: null,
  ownerId: 'user-1',
  currentVersionId: 'ver-1',
  concurrencyStamp: 'stamp-1',
  sizeBytes: 1024,
  contentType: 'application/pdf',
  status: 'Active',
  createdAt: toISODateString('2026-05-01T00:00:00Z'),
  modifiedAt: null,
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
  uploadedAt: toISODateString('2026-05-01T00:00:00Z'),
  commitMessage: null,
  isCurrent: true,
};

const sampleVersions: ListDocumentVersionsResponse = {
  versions: [sampleVersion],
  totalCount: 1,
  skip: 0,
  take: 50,
};

const sampleTrashed: TrashedDocumentResponse = {
  id: 'doc-1',
  folderId: 'fld-1',
  name: 'contract.pdf',
  ownerId: 'user-1',
  trashedAt: toISODateString('2026-05-01T00:00:00Z'),
  daysUntilPermanentDeletion: 29,
};

const sampleTrashList: ListTrashedDocumentsResponse = {
  documents: [sampleTrashed],
  totalCount: 1,
  skip: 0,
  take: 50,
};

const sampleDownload: DownloadUrlResponse = {
  url: 'https://blob.example/signed',
  expiresAt: toISODateString('2026-05-01T01:00:00Z'),
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

describe('useDocument', () => {
  afterEach(() => vi.restoreAllMocks());

  it('GETs /documents/{id}', async () => {
    const client = createMockClient();
    vi.mocked(client.get).mockResolvedValue({ data: sampleDoc });

    const { result } = renderHook(() => useDocument('doc-1'), { wrapper: createWrapper(client) });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(client.get).toHaveBeenCalledWith('/api/v1/documents/documents/doc-1');
  });

  it('does not fire when id is empty', () => {
    const client = createMockClient();
    const { result } = renderHook(() => useDocument(''), { wrapper: createWrapper(client) });
    expect(result.current.fetchStatus).toBe('idle');
    expect(client.get).not.toHaveBeenCalled();
  });
});

describe('useDocumentVersions', () => {
  afterEach(() => vi.restoreAllMocks());

  it('GETs /documents/{id}/versions with paging params', async () => {
    const client = createMockClient();
    vi.mocked(client.get).mockResolvedValue({ data: sampleVersions });

    const { result } = renderHook(() => useDocumentVersions('doc-1', { skip: 0, take: 25 }), {
      wrapper: createWrapper(client),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(client.get).toHaveBeenCalledWith('/api/v1/documents/documents/doc-1/versions', {
      params: { skip: 0, take: 25 },
    });
  });

  it('does not fire when id is empty', () => {
    const client = createMockClient();
    const { result } = renderHook(() => useDocumentVersions(''), {
      wrapper: createWrapper(client),
    });
    expect(result.current.fetchStatus).toBe('idle');
    expect(client.get).not.toHaveBeenCalled();
  });
});

describe('useTrashedDocuments', () => {
  afterEach(() => vi.restoreAllMocks());

  it('GETs /documents/trash', async () => {
    const client = createMockClient();
    vi.mocked(client.get).mockResolvedValue({ data: sampleTrashList });

    const { result } = renderHook(() => useTrashedDocuments({ take: 10 }), {
      wrapper: createWrapper(client),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(client.get).toHaveBeenCalledWith('/api/v1/documents/documents/trash', {
      params: { take: 10 },
    });
    expect(result.current.data).toEqual(sampleTrashList);
  });
});

describe('useDocumentDownloadUrl', () => {
  afterEach(() => vi.restoreAllMocks());

  it('GETs /documents/{id}/download with no versionId', async () => {
    const client = createMockClient();
    vi.mocked(client.get).mockResolvedValue({ data: sampleDownload });

    const { result } = renderHook(() => useDocumentDownloadUrl('doc-1'), {
      wrapper: createWrapper(client),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(client.get).toHaveBeenCalledWith('/api/v1/documents/documents/doc-1/download', {
      params: {},
    });
  });

  it('forwards versionId when supplied', async () => {
    const client = createMockClient();
    vi.mocked(client.get).mockResolvedValue({ data: sampleDownload });

    const { result } = renderHook(() => useDocumentDownloadUrl('doc-1', 'ver-1'), {
      wrapper: createWrapper(client),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(client.get).toHaveBeenCalledWith('/api/v1/documents/documents/doc-1/download', {
      params: { versionId: 'ver-1' },
    });
  });

  it('does not fire when id is empty', () => {
    const client = createMockClient();
    const { result } = renderHook(() => useDocumentDownloadUrl(''), {
      wrapper: createWrapper(client),
    });
    expect(result.current.fetchStatus).toBe('idle');
    expect(client.get).not.toHaveBeenCalled();
  });
});
