import { axiosResponse, createMockClient } from '@granit/testing';
import { describe, expect, it, vi } from 'vitest';

import {
  grantDocumentShare,
  grantFolderShare,
  listDocumentShares,
  listFolderShares,
  revokeShare,
} from '../api/shares-api.js';

import type { GrantShareRequest, ListSharesResponse, ShareResponse } from '../types/index.js';

const basePath = '/api/v1/documents';

const sampleFolderShare: ShareResponse = {
  id: 'share-1',
  targetType: 'Folder',
  folderId: 'folder-1',
  documentId: null,
  granteeType: 'User',
  granteeId: 'user-2',
  permission: 'Read',
  isDefault: true,
  expiresAt: null,
  createdAt: '2026-05-01T10:00:00Z',
  createdByUserId: 'user-1',
};

const sampleDocumentShare: ShareResponse = {
  ...sampleFolderShare,
  id: 'share-2',
  targetType: 'Document',
  folderId: null,
  documentId: 'doc-1',
};

describe('listFolderShares', () => {
  it('GETs /folders/{folderId}/shares', async () => {
    const client = createMockClient();
    const list: ListSharesResponse = { items: [sampleFolderShare] };
    vi.mocked(client.get).mockResolvedValue(axiosResponse(list));

    const result = await listFolderShares(client, basePath, 'folder-1');

    expect(client.get).toHaveBeenCalledWith(`${basePath}/folders/folder-1/shares`);
    expect(result.items).toHaveLength(1);
  });
});

describe('grantFolderShare', () => {
  it('POSTs the grant request to /folders/{folderId}/shares', async () => {
    const client = createMockClient();
    const request: GrantShareRequest = {
      granteeType: 'User',
      granteeId: 'user-2',
      permission: 'Read',
      isDefault: true,
    };
    vi.mocked(client.post).mockResolvedValue(axiosResponse(sampleFolderShare));

    const result = await grantFolderShare(client, basePath, 'folder-1', request);

    expect(client.post).toHaveBeenCalledWith(`${basePath}/folders/folder-1/shares`, request);
    expect(result).toEqual(sampleFolderShare);
  });
});

describe('listDocumentShares', () => {
  it('GETs /documents/{documentId}/shares', async () => {
    const client = createMockClient();
    vi.mocked(client.get).mockResolvedValue(axiosResponse({ items: [sampleDocumentShare] }));

    await listDocumentShares(client, basePath, 'doc-1');

    expect(client.get).toHaveBeenCalledWith(`${basePath}/documents/doc-1/shares`);
  });
});

describe('grantDocumentShare', () => {
  it('POSTs the grant request to /documents/{documentId}/shares', async () => {
    const client = createMockClient();
    const request: GrantShareRequest = {
      granteeType: 'Group',
      granteeId: 'group-1',
      permission: 'Edit',
    };
    vi.mocked(client.post).mockResolvedValue(axiosResponse(sampleDocumentShare));

    await grantDocumentShare(client, basePath, 'doc-1', request);

    expect(client.post).toHaveBeenCalledWith(`${basePath}/documents/doc-1/shares`, request);
  });
});

describe('revokeShare', () => {
  it('DELETEs /shares/{id} and resolves to void', async () => {
    const client = createMockClient();
    vi.mocked(client.delete).mockResolvedValue(axiosResponse(undefined));

    const result = await revokeShare(client, basePath, 'share-1');

    expect(client.delete).toHaveBeenCalledWith(`${basePath}/shares/share-1`);
    expect(result).toBeUndefined();
  });
});
