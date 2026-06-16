import { createMockClient, createTestQueryClient } from '@granit/react-testing';
import { QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { useFolder, useFolderBreadcrumb, useFolders } from '../hooks/use-folders';
import { DocumentsProvider } from '../providers/documents-provider';

import type { AxiosInstance } from '@granit/api-client';
import type {
  FolderBreadcrumbResponse,
  FolderResponse,
  ListFoldersResponse,
} from '@granit/documents';
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

const sampleList: ListFoldersResponse = { folders: [sampleFolder] };
const sampleBreadcrumb: FolderBreadcrumbResponse = { folders: [sampleFolder] };

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

describe('useFolders', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('GETs /folders with no params by default', async () => {
    const client = createMockClient();
    vi.mocked(client.get).mockResolvedValue({ data: sampleList });

    const { result } = renderHook(() => useFolders(), { wrapper: createWrapper(client) });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(client.get).toHaveBeenCalledWith('/api/v1/documents/folders', { params: {} });
    expect(result.current.data).toEqual(sampleList);
  });

  it('forwards parentId and status filter', async () => {
    const client = createMockClient();
    vi.mocked(client.get).mockResolvedValue({ data: sampleList });

    const { result } = renderHook(() => useFolders({ parentId: 'fld-9', status: 'Trashed' }), {
      wrapper: createWrapper(client),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(client.get).toHaveBeenCalledWith('/api/v1/documents/folders', {
      params: { parentId: 'fld-9', status: 'Trashed' },
    });
  });

  it('respects options.enabled = false', () => {
    const client = createMockClient();
    vi.mocked(client.get).mockResolvedValue({ data: sampleList });

    const { result } = renderHook(() => useFolders({}, { enabled: false }), {
      wrapper: createWrapper(client),
    });

    expect(result.current.fetchStatus).toBe('idle');
    expect(client.get).not.toHaveBeenCalled();
  });
});

describe('useFolder', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('GETs /folders/{id}', async () => {
    const client = createMockClient();
    vi.mocked(client.get).mockResolvedValue({ data: sampleFolder });

    const { result } = renderHook(() => useFolder('fld-1'), { wrapper: createWrapper(client) });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(client.get).toHaveBeenCalledWith('/api/v1/documents/folders/fld-1');
  });

  it('does not fire when id is empty', () => {
    const client = createMockClient();
    const { result } = renderHook(() => useFolder(''), { wrapper: createWrapper(client) });
    expect(result.current.fetchStatus).toBe('idle');
    expect(client.get).not.toHaveBeenCalled();
  });
});

describe('useFolderBreadcrumb', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('GETs /folders/{id}/breadcrumb', async () => {
    const client = createMockClient();
    vi.mocked(client.get).mockResolvedValue({ data: sampleBreadcrumb });

    const { result } = renderHook(() => useFolderBreadcrumb('fld-1'), {
      wrapper: createWrapper(client),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(client.get).toHaveBeenCalledWith('/api/v1/documents/folders/fld-1/breadcrumb');
    expect(result.current.data).toEqual(sampleBreadcrumb);
  });

  it('does not fire when id is empty', () => {
    const client = createMockClient();
    const { result } = renderHook(() => useFolderBreadcrumb(''), {
      wrapper: createWrapper(client),
    });
    expect(result.current.fetchStatus).toBe('idle');
    expect(client.get).not.toHaveBeenCalled();
  });
});
