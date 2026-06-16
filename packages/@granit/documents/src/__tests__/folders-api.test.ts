import { axiosResponse, createMockClient } from '@granit/testing';
import { describe, expect, it, vi } from 'vitest';

import {
  createFolder,
  getFolder,
  getFolderBreadcrumb,
  listFolders,
  moveFolder,
  renameFolder,
  restoreFolder,
  transferFolderOwner,
  trashFolder,
} from '../api/folders-api';

import type {
  CreateFolderRequest,
  FolderBreadcrumbResponse,
  FolderResponse,
  ListFoldersResponse,
  MoveFolderRequest,
} from '../types/index';

const basePath = '/api/v1/documents';

const sampleFolder: FolderResponse = {
  id: 'folder-1',
  parentFolderId: null,
  name: 'Contracts',
  path: '/Contracts',
  depth: 1,
  ownerId: 'user-1',
  status: 'Active',
  createdAt: '2026-05-01T10:00:00Z',
  modifiedAt: null,
  trashedAt: null,
  permission: null,
};

const sampleChild: FolderResponse = {
  ...sampleFolder,
  id: 'folder-2',
  parentFolderId: 'folder-1',
  name: '2026',
  path: '/Contracts/2026',
  depth: 2,
};

describe('listFolders', () => {
  it('GETs /folders with no params when filter is empty', async () => {
    const client = createMockClient();
    const list: ListFoldersResponse = { folders: [sampleFolder] };
    vi.mocked(client.get).mockResolvedValue(axiosResponse(list));

    const result = await listFolders(client, basePath);

    expect(client.get).toHaveBeenCalledWith(`${basePath}/folders`, { params: {} });
    expect(result).toEqual(list);
  });

  it('omits parentId from params when explicitly null', async () => {
    const client = createMockClient();
    vi.mocked(client.get).mockResolvedValue(axiosResponse({ folders: [] }));

    await listFolders(client, basePath, { parentId: null });

    expect(client.get).toHaveBeenCalledWith(`${basePath}/folders`, { params: {} });
  });

  it('forwards parentId and status when supplied', async () => {
    const client = createMockClient();
    vi.mocked(client.get).mockResolvedValue(axiosResponse({ folders: [sampleChild] }));

    await listFolders(client, basePath, { parentId: 'folder-1', status: 'Trashed' });

    expect(client.get).toHaveBeenCalledWith(`${basePath}/folders`, {
      params: { parentId: 'folder-1', status: 'Trashed' },
    });
  });
});

describe('getFolder', () => {
  it('GETs /folders/{id}', async () => {
    const client = createMockClient();
    vi.mocked(client.get).mockResolvedValue(axiosResponse(sampleFolder));

    const result = await getFolder(client, basePath, 'folder-1');

    expect(client.get).toHaveBeenCalledWith(`${basePath}/folders/folder-1`);
    expect(result).toEqual(sampleFolder);
  });
});

describe('getFolderBreadcrumb', () => {
  it('GETs /folders/{id}/breadcrumb', async () => {
    const client = createMockClient();
    const breadcrumb: FolderBreadcrumbResponse = {
      folders: [sampleFolder, sampleChild],
    };
    vi.mocked(client.get).mockResolvedValue(axiosResponse(breadcrumb));

    const result = await getFolderBreadcrumb(client, basePath, 'folder-2');

    expect(client.get).toHaveBeenCalledWith(`${basePath}/folders/folder-2/breadcrumb`);
    expect(result.folders).toHaveLength(2);
  });
});

describe('createFolder', () => {
  it('POSTs the request body to /folders', async () => {
    const client = createMockClient();
    const request: CreateFolderRequest = { parentFolderId: null, name: 'Contracts' };
    vi.mocked(client.post).mockResolvedValue(axiosResponse(sampleFolder));

    const result = await createFolder(client, basePath, request);

    expect(client.post).toHaveBeenCalledWith(`${basePath}/folders`, request);
    expect(result).toEqual(sampleFolder);
  });
});

describe('renameFolder', () => {
  it('PATCHes /folders/{id} with the rename payload', async () => {
    const client = createMockClient();
    vi.mocked(client.patch).mockResolvedValue(axiosResponse({ ...sampleFolder, name: 'Renamed' }));

    const result = await renameFolder(client, basePath, 'folder-1', { name: 'Renamed' });

    expect(client.patch).toHaveBeenCalledWith(`${basePath}/folders/folder-1`, {
      name: 'Renamed',
    });
    expect(result.name).toBe('Renamed');
  });
});

describe('moveFolder', () => {
  it('POSTs newParentFolderId to /folders/{id}/move', async () => {
    const client = createMockClient();
    const request: MoveFolderRequest = { newParentFolderId: 'folder-3' };
    vi.mocked(client.post).mockResolvedValue(axiosResponse(sampleChild));

    await moveFolder(client, basePath, 'folder-2', request);

    expect(client.post).toHaveBeenCalledWith(`${basePath}/folders/folder-2/move`, request);
  });

  it('forwards null newParentFolderId to move under the tenant root', async () => {
    const client = createMockClient();
    vi.mocked(client.post).mockResolvedValue(
      axiosResponse({ ...sampleChild, parentFolderId: null })
    );

    await moveFolder(client, basePath, 'folder-2', { newParentFolderId: null });

    expect(client.post).toHaveBeenCalledWith(`${basePath}/folders/folder-2/move`, {
      newParentFolderId: null,
    });
  });
});

describe('transferFolderOwner', () => {
  it('PUTs newOwnerId to /folders/{id}/owner', async () => {
    const client = createMockClient();
    const newOwner = '00000000-0000-4000-8000-0000000000a9';
    vi.mocked(client.put).mockResolvedValue(axiosResponse({ ...sampleFolder, ownerId: newOwner }));

    const result = await transferFolderOwner(client, basePath, 'folder-1', {
      newOwnerId: newOwner,
    });

    expect(client.put).toHaveBeenCalledWith(`${basePath}/folders/folder-1/owner`, {
      newOwnerId: newOwner,
    });
    expect(result.ownerId).toBe(newOwner);
  });
});

describe('trashFolder', () => {
  it('DELETEs /folders/{id}', async () => {
    const client = createMockClient();
    vi.mocked(client.delete).mockResolvedValue(
      axiosResponse({ ...sampleFolder, status: 'Trashed' as const })
    );

    const result = await trashFolder(client, basePath, 'folder-1');

    expect(client.delete).toHaveBeenCalledWith(`${basePath}/folders/folder-1`);
    expect(result.status).toBe('Trashed');
  });
});

describe('restoreFolder', () => {
  it('POSTs /folders/{id}/restore (no body)', async () => {
    const client = createMockClient();
    vi.mocked(client.post).mockResolvedValue(axiosResponse(sampleFolder));

    await restoreFolder(client, basePath, 'folder-1');

    expect(client.post).toHaveBeenCalledWith(`${basePath}/folders/folder-1/restore`);
  });
});
