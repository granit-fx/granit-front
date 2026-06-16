import { axiosResponse, createMockClient } from '@granit/testing';
import { describe, expect, it, vi } from 'vitest';

import {
  appendDocumentVersion,
  finalizeUpload,
  getDocument,
  listDocumentVersions,
  listTrashedDocuments,
  moveDocument,
  permanentlyDeleteDocument,
  renameDocument,
  requestDocumentDownloadUrl,
  requestUploadTicket,
  restoreDocument,
  transferDocumentOwner,
  trashDocument,
} from '../api/documents-api';

import type {
  AppendVersionRequest,
  DocumentResponse,
  DocumentVersionResponse,
  DownloadUrlResponse,
  FinalizeUploadRequest,
  ListDocumentVersionsResponse,
  ListTrashedDocumentsResponse,
  UploadTicketRequest,
  UploadTicketResponse,
} from '../types/index';

const basePath = '/api/v1/documents';

const sampleDocument: DocumentResponse = {
  id: 'doc-1',
  folderId: 'folder-1',
  name: 'Contract.pdf',
  description: null,
  ownerId: 'user-1',
  currentVersionId: 'ver-1',
  sizeBytes: 1024,
  contentType: 'application/pdf',
  status: 'Active',
  createdAt: '2026-05-01T10:00:00Z',
  modifiedAt: null,
  concurrencyStamp: 'stamp-1',
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
  uploadedAt: '2026-05-01T10:00:00Z',
  commitMessage: null,
  isCurrent: true,
};

describe('requestUploadTicket', () => {
  it('POSTs the request to /documents/upload-ticket', async () => {
    const client = createMockClient();
    const request: UploadTicketRequest = {
      fileName: 'Contract.pdf',
      contentType: 'application/pdf',
      maxAllowedBytes: 5_000_000,
    };
    const ticket: UploadTicketResponse = {
      blobId: 'blob-1',
      uploadUrl: 'https://example.com/upload',
      httpMethod: 'PUT',
      expiresAt: '2026-05-01T10:15:00Z',
      requiredHeaders: { 'Content-Type': 'application/pdf' },
    };
    vi.mocked(client.post).mockResolvedValue(axiosResponse(ticket));

    const result = await requestUploadTicket(client, basePath, request);

    expect(client.post).toHaveBeenCalledWith(`${basePath}/documents/upload-ticket`, request);
    expect(result).toEqual(ticket);
  });
});

describe('finalizeUpload', () => {
  it('POSTs the finalize request to /documents/finalize', async () => {
    const client = createMockClient();
    const request: FinalizeUploadRequest = {
      blobId: 'blob-1',
      folderId: 'folder-1',
      name: 'Contract.pdf',
      description: null,
      commitMessage: 'Initial upload',
    };
    vi.mocked(client.post).mockResolvedValue(axiosResponse(sampleDocument));

    const result = await finalizeUpload(client, basePath, request);

    expect(client.post).toHaveBeenCalledWith(`${basePath}/documents/finalize`, request);
    expect(result).toEqual(sampleDocument);
  });
});

describe('getDocument', () => {
  it('GETs /documents/{id}', async () => {
    const client = createMockClient();
    vi.mocked(client.get).mockResolvedValue(axiosResponse(sampleDocument));

    await getDocument(client, basePath, 'doc-1');

    expect(client.get).toHaveBeenCalledWith(`${basePath}/documents/doc-1`);
  });
});

describe('renameDocument', () => {
  it('PATCHes /documents/{id} with the partial payload', async () => {
    const client = createMockClient();
    vi.mocked(client.patch).mockResolvedValue(
      axiosResponse({ ...sampleDocument, name: 'Renamed.pdf' })
    );

    const result = await renameDocument(client, basePath, 'doc-1', {
      name: 'Renamed.pdf',
      description: null,
    });

    expect(client.patch).toHaveBeenCalledWith(`${basePath}/documents/doc-1`, {
      name: 'Renamed.pdf',
      description: null,
    });
    expect(result.name).toBe('Renamed.pdf');
  });

  it('forwards clearDescription so the server drops the description', async () => {
    const client = createMockClient();
    vi.mocked(client.patch).mockResolvedValue(axiosResponse(sampleDocument));

    await renameDocument(client, basePath, 'doc-1', {
      name: null,
      description: null,
      clearDescription: true,
    });

    expect(client.patch).toHaveBeenCalledWith(`${basePath}/documents/doc-1`, {
      name: null,
      description: null,
      clearDescription: true,
    });
  });
});

describe('moveDocument', () => {
  it('POSTs newFolderId to /documents/{id}/move', async () => {
    const client = createMockClient();
    vi.mocked(client.post).mockResolvedValue(axiosResponse(sampleDocument));

    await moveDocument(client, basePath, 'doc-1', { newFolderId: 'folder-2' });

    expect(client.post).toHaveBeenCalledWith(`${basePath}/documents/doc-1/move`, {
      newFolderId: 'folder-2',
    });
  });
});

describe('transferDocumentOwner', () => {
  it('PUTs newOwnerId to /documents/{id}/owner', async () => {
    const client = createMockClient();
    const newOwner = '00000000-0000-4000-8000-0000000000a9';
    vi.mocked(client.put).mockResolvedValue(
      axiosResponse({ ...sampleDocument, ownerId: newOwner })
    );

    const result = await transferDocumentOwner(client, basePath, 'doc-1', { newOwnerId: newOwner });

    expect(client.put).toHaveBeenCalledWith(`${basePath}/documents/doc-1/owner`, {
      newOwnerId: newOwner,
    });
    expect(result.ownerId).toBe(newOwner);
  });
});

describe('trashDocument', () => {
  it('DELETEs /documents/{id}', async () => {
    const client = createMockClient();
    vi.mocked(client.delete).mockResolvedValue(
      axiosResponse({ ...sampleDocument, status: 'Trashed' as const })
    );

    const result = await trashDocument(client, basePath, 'doc-1');

    expect(client.delete).toHaveBeenCalledWith(`${basePath}/documents/doc-1`);
    expect(result.status).toBe('Trashed');
  });
});

describe('restoreDocument', () => {
  it('POSTs /documents/{id}/restore (no body)', async () => {
    const client = createMockClient();
    vi.mocked(client.post).mockResolvedValue(axiosResponse(sampleDocument));

    await restoreDocument(client, basePath, 'doc-1');

    expect(client.post).toHaveBeenCalledWith(`${basePath}/documents/doc-1/restore`);
  });
});

describe('permanentlyDeleteDocument', () => {
  it('DELETEs /documents/{id}/permanent and resolves to void', async () => {
    const client = createMockClient();
    vi.mocked(client.delete).mockResolvedValue(axiosResponse(undefined));

    const result = await permanentlyDeleteDocument(client, basePath, 'doc-1');

    expect(client.delete).toHaveBeenCalledWith(`${basePath}/documents/doc-1/permanent`);
    expect(result).toBeUndefined();
  });
});

describe('requestDocumentDownloadUrl', () => {
  const url: DownloadUrlResponse = {
    url: 'https://example.com/download',
    expiresAt: '2026-05-01T10:15:00Z',
  };

  it('GETs /documents/{id}/download with no query when versionId is omitted', async () => {
    const client = createMockClient();
    vi.mocked(client.get).mockResolvedValue(axiosResponse(url));

    await requestDocumentDownloadUrl(client, basePath, 'doc-1');

    expect(client.get).toHaveBeenCalledWith(`${basePath}/documents/doc-1/download`, {
      params: {},
    });
  });

  it('appends versionId when supplied', async () => {
    const client = createMockClient();
    vi.mocked(client.get).mockResolvedValue(axiosResponse(url));

    await requestDocumentDownloadUrl(client, basePath, 'doc-1', 'ver-2');

    expect(client.get).toHaveBeenCalledWith(`${basePath}/documents/doc-1/download`, {
      params: { versionId: 'ver-2' },
    });
  });
});

describe('listDocumentVersions', () => {
  it('GETs /documents/{id}/versions with pagination params when supplied', async () => {
    const client = createMockClient();
    const page: ListDocumentVersionsResponse = {
      versions: [sampleVersion],
      totalCount: 1,
      skip: 0,
      take: 50,
    };
    vi.mocked(client.get).mockResolvedValue(axiosResponse(page));

    await listDocumentVersions(client, basePath, 'doc-1', { skip: 0, take: 50 });

    expect(client.get).toHaveBeenCalledWith(`${basePath}/documents/doc-1/versions`, {
      params: { skip: 0, take: 50 },
    });
  });

  it('omits pagination params when not supplied', async () => {
    const client = createMockClient();
    vi.mocked(client.get).mockResolvedValue(
      axiosResponse({ versions: [], totalCount: 0, skip: 0, take: 0 })
    );

    await listDocumentVersions(client, basePath, 'doc-1');

    expect(client.get).toHaveBeenCalledWith(`${basePath}/documents/doc-1/versions`, {
      params: {},
    });
  });
});

describe('appendDocumentVersion', () => {
  it('POSTs the append request to /documents/{id}/versions', async () => {
    const client = createMockClient();
    const request: AppendVersionRequest = { blobId: 'blob-2', commitMessage: 'v2' };
    vi.mocked(client.post).mockResolvedValue(
      axiosResponse({ ...sampleVersion, id: 'ver-2', versionNumber: 2 })
    );

    const result = await appendDocumentVersion(client, basePath, 'doc-1', request);

    expect(client.post).toHaveBeenCalledWith(`${basePath}/documents/doc-1/versions`, request);
    expect(result.versionNumber).toBe(2);
  });
});

describe('listTrashedDocuments', () => {
  it('GETs /documents/trash with pagination', async () => {
    const client = createMockClient();
    const page: ListTrashedDocumentsResponse = {
      documents: [],
      totalCount: 0,
      skip: 0,
      take: 50,
    };
    vi.mocked(client.get).mockResolvedValue(axiosResponse(page));

    await listTrashedDocuments(client, basePath, { skip: 0, take: 50 });

    expect(client.get).toHaveBeenCalledWith(`${basePath}/documents/trash`, {
      params: { skip: 0, take: 50 },
    });
  });

  it('omits pagination params when no filter supplied', async () => {
    const client = createMockClient();
    vi.mocked(client.get).mockResolvedValue(
      axiosResponse({ documents: [], totalCount: 0, skip: 0, take: 0 })
    );

    await listTrashedDocuments(client, basePath);

    expect(client.get).toHaveBeenCalledWith(`${basePath}/documents/trash`, { params: {} });
  });
});
