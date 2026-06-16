import { createMockClient, createTestQueryClient } from '@granit/react-testing';
import { QueryClientProvider } from '@tanstack/react-query';
import { renderHook } from '@testing-library/react';
import * as React from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import {
  useCreateFolder,
  useMoveFolder,
  useRenameFolder,
  useRestoreFolder,
  useTransferFolderOwner,
  useTrashFolder,
} from '../hooks/use-folder-mutations';
import { DocumentsProvider } from '../providers/documents-provider';

import type { AxiosInstance } from '@granit/api-client';
import type { FolderResponse } from '@granit/documents';
import type { QueryClient } from '@tanstack/react-query';
import type { ReactNode } from 'react';

const sampleFolder: FolderResponse = {
  id: 'fld-1',
  parentFolderId: null,
  name: 'Contracts',
  path: '/Contracts',
  depth: 1,
  createdAt: '2026-05-01T10:00:00Z',
  modifiedAt: null,
  ownerId: 'user-1',
  status: 'Active',
  trashedAt: null,
  permission: null,
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

describe('useCreateFolder', () => {
  afterEach(() => vi.restoreAllMocks());

  it('POSTs /folders and invalidates the list family', async () => {
    const { client, queryClient, wrapper } = createHarness();
    vi.mocked(client.post).mockResolvedValue({ data: sampleFolder });
    const invalidate = vi.spyOn(queryClient, 'invalidateQueries');

    const { result } = renderHook(() => useCreateFolder(), { wrapper });
    await result.current.mutateAsync({ parentFolderId: null, name: 'Contracts' });

    expect(client.post).toHaveBeenCalledWith('/api/v1/documents/folders', {
      parentFolderId: null,
      name: 'Contracts',
    });
    const keys = invalidate.mock.calls.map((call) => call[0]?.queryKey);
    expect(keys).toEqual([['documents', 'folders', 'list']]);
  });
});

describe('useRenameFolder', () => {
  afterEach(() => vi.restoreAllMocks());

  it('PATCHes /folders/{id} and invalidates the folder namespace', async () => {
    const { client, queryClient, wrapper } = createHarness();
    vi.mocked(client.patch).mockResolvedValue({ data: sampleFolder });
    const invalidate = vi.spyOn(queryClient, 'invalidateQueries');

    const { result } = renderHook(() => useRenameFolder(), { wrapper });
    await result.current.mutateAsync({ id: 'fld-1', request: { name: 'Renamed' } });

    expect(client.patch).toHaveBeenCalledWith('/api/v1/documents/folders/fld-1', {
      name: 'Renamed',
    });
    const keys = invalidate.mock.calls.map((call) => call[0]?.queryKey);
    expect(keys).toEqual([['documents', 'folders']]);
  });
});

describe('useMoveFolder', () => {
  afterEach(() => vi.restoreAllMocks());

  it('POSTs /folders/{id}/move and invalidates the folder namespace', async () => {
    const { client, queryClient, wrapper } = createHarness();
    vi.mocked(client.post).mockResolvedValue({ data: sampleFolder });
    const invalidate = vi.spyOn(queryClient, 'invalidateQueries');

    const { result } = renderHook(() => useMoveFolder(), { wrapper });
    await result.current.mutateAsync({
      id: 'fld-1',
      request: { newParentFolderId: 'fld-9' },
    });

    expect(client.post).toHaveBeenCalledWith('/api/v1/documents/folders/fld-1/move', {
      newParentFolderId: 'fld-9',
    });
    const keys = invalidate.mock.calls.map((call) => call[0]?.queryKey);
    expect(keys).toEqual([['documents', 'folders']]);
  });

  it('propagates 409 errors (cycle / cross-tenant) without invalidating', async () => {
    const { client, queryClient, wrapper } = createHarness();
    const error = Object.assign(new Error('cycle'), {
      response: { status: 409, data: { detail: 'cycle' } },
    });
    vi.mocked(client.post).mockRejectedValue(error);
    const invalidate = vi.spyOn(queryClient, 'invalidateQueries');

    const { result } = renderHook(() => useMoveFolder(), { wrapper });
    await expect(
      result.current.mutateAsync({ id: 'fld-1', request: { newParentFolderId: 'fld-1' } })
    ).rejects.toMatchObject({ response: { status: 409 } });

    expect(invalidate).not.toHaveBeenCalled();
  });
});

describe('useTrashFolder', () => {
  afterEach(() => vi.restoreAllMocks());

  it('DELETEs /folders/{id} and invalidates folders + trash', async () => {
    const { client, queryClient, wrapper } = createHarness();
    vi.mocked(client.delete).mockResolvedValue({ data: sampleFolder });
    const invalidate = vi.spyOn(queryClient, 'invalidateQueries');

    const { result } = renderHook(() => useTrashFolder(), { wrapper });
    await result.current.mutateAsync('fld-1');

    expect(client.delete).toHaveBeenCalledWith('/api/v1/documents/folders/fld-1');
    const keys = invalidate.mock.calls.map((call) => call[0]?.queryKey);
    expect(keys).toEqual([
      ['documents', 'folders'],
      ['documents', 'documents', 'trash'],
    ]);
  });
});

describe('useTransferFolderOwner', () => {
  afterEach(() => vi.restoreAllMocks());

  it('PUTs /folders/{id}/owner and invalidates the folder namespace', async () => {
    const { client, queryClient, wrapper } = createHarness();
    const newOwner = '00000000-0000-4000-8000-0000000000a9';
    vi.mocked(client.put).mockResolvedValue({
      data: { ...sampleFolder, ownerId: newOwner },
    });
    const invalidate = vi.spyOn(queryClient, 'invalidateQueries');

    const { result } = renderHook(() => useTransferFolderOwner(), { wrapper });
    await result.current.mutateAsync({ id: 'fld-1', request: { newOwnerId: newOwner } });

    expect(client.put).toHaveBeenCalledWith('/api/v1/documents/folders/fld-1/owner', {
      newOwnerId: newOwner,
    });
    const keys = invalidate.mock.calls.map((call) => call[0]?.queryKey);
    expect(keys).toEqual([['documents', 'folders']]);
  });
});

describe('useRestoreFolder', () => {
  afterEach(() => vi.restoreAllMocks());

  it('POSTs /folders/{id}/restore and invalidates folders + trash', async () => {
    const { client, queryClient, wrapper } = createHarness();
    vi.mocked(client.post).mockResolvedValue({ data: sampleFolder });
    const invalidate = vi.spyOn(queryClient, 'invalidateQueries');

    const { result } = renderHook(() => useRestoreFolder(), { wrapper });
    await result.current.mutateAsync('fld-1');

    expect(client.post).toHaveBeenCalledWith('/api/v1/documents/folders/fld-1/restore');
    const keys = invalidate.mock.calls.map((call) => call[0]?.queryKey);
    expect(keys).toEqual([
      ['documents', 'folders'],
      ['documents', 'documents', 'trash'],
    ]);
  });
});
