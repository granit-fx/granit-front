import { createMockClient, createTestQueryClient } from '@granit/react-testing';
import { QueryClientProvider } from '@tanstack/react-query';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { DocumentsExplorer } from '../components/documents-explorer.tsx';
import { DocumentsProvider } from '../providers/documents-provider.js';

import type { AxiosInstance } from '@granit/api-client';
import type { FolderResponse } from '@granit/documents';
import type { ReactNode } from 'react';

const activeFolder: FolderResponse = {
  id: 'fld-1',
  parentFolderId: null,
  name: 'Contracts',
  path: '/Contracts',
  depth: 1,
  ownerId: 'user-1',
  status: 'Active',
  trashedAt: null,
  permission: null,
};

function createWrapper(client: AxiosInstance) {
  return function Wrapper({ children }: { children: ReactNode }) {
    const qc = createTestQueryClient();
    return (
      <QueryClientProvider client={qc}>
        <DocumentsProvider config={{ client }}>{children}</DocumentsProvider>
      </QueryClientProvider>
    );
  };
}

describe('DocumentsExplorer', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('renders the title and the empty documents list', async () => {
    const client = createMockClient();
    vi.mocked(client.get).mockResolvedValue({
      data: { items: [], totalCount: 0, page: 1, pageSize: 50, folders: [] },
    });

    render(<DocumentsExplorer />, { wrapper: createWrapper(client) });

    expect(screen.getByText('Documents')).toBeInTheDocument();
    await waitFor(() => expect(screen.getByText('This folder is empty.')).toBeInTheDocument());
  });

  it('hides the upload button when canManage is false', async () => {
    const client = createMockClient();
    vi.mocked(client.get).mockResolvedValue({ data: { folders: [] } });

    render(<DocumentsExplorer />, { wrapper: createWrapper(client) });

    await waitFor(() => expect(screen.getByText('Documents')).toBeInTheDocument());
    expect(screen.queryByText('Upload')).toBeNull();
  });

  it('shows the upload button when canManage is true', async () => {
    const client = createMockClient();
    vi.mocked(client.get).mockResolvedValue({ data: { folders: [] } });

    render(<DocumentsExplorer canManage />, { wrapper: createWrapper(client) });

    await waitFor(() => expect(screen.getByText('Upload')).toBeInTheDocument());
  });

  it('drops the breadcrumb when the selected folder is trashed from the tree', async () => {
    const client = createMockClient();
    let folderStatus: FolderResponse['status'] = 'Active';
    vi.mocked(client.get).mockImplementation(((url: string) => {
      if (url.includes('/folders/fld-1/breadcrumb')) {
        return Promise.resolve({ data: { folders: [activeFolder] } });
      }
      if (url.includes('/folders/fld-1')) {
        return Promise.resolve({ data: { ...activeFolder, status: folderStatus } });
      }
      if (url.includes('/folders')) {
        return Promise.resolve({
          data: { folders: folderStatus === 'Active' ? [activeFolder] : [] },
        });
      }
      // QueryEngine /documents
      return Promise.resolve({ data: { items: [], totalCount: 0, page: 1, pageSize: 50 } });
    }) as AxiosInstance['get']);
    vi.mocked(client.delete).mockImplementation(((url: string) => {
      if (url.endsWith('/folders/fld-1')) {
        folderStatus = 'Trashed';
        return Promise.resolve({ data: { ...activeFolder, status: 'Trashed' } });
      }
      return Promise.resolve({ data: undefined });
    }) as AxiosInstance['delete']);
    render(<DocumentsExplorer canManage />, { wrapper: createWrapper(client) });

    await waitFor(() => expect(screen.getByText('Contracts')).toBeInTheDocument());

    // Select the folder — breadcrumb mounts (folderId.length > 0)
    await userEvent.click(screen.getByRole('button', { name: 'Contracts' }));
    await waitFor(() =>
      expect(document.querySelector('[data-granit-folder-breadcrumb]')).not.toBeNull()
    );

    // Trash from the tree (inline confirm flow — no window.confirm)
    await userEvent.click(screen.getByRole('button', { name: 'Delete' }));
    await userEvent.click(screen.getByRole('button', { name: 'Confirm' }));
    await waitFor(() => expect(client.delete).toHaveBeenCalled());

    // The eager onDeleted path nulls currentFolder synchronously — breadcrumb
    // unmounts (no folderId.length > 0).
    await waitFor(() =>
      expect(document.querySelector('[data-granit-folder-breadcrumb]')).toBeNull()
    );
  });

  it('drops a stale selection when the watched folder becomes non-Active (cascade)', async () => {
    const client = createMockClient();
    // The tree still lists the folder as Active (its parent was cascade-
    // trashed by the backend so /folders {parentId} hasn't refreshed yet),
    // but a direct GET /folders/{id} on the selected row now returns
    // status: 'Trashed' — typical of a backend that cascades soft-delete to
    // descendants. The explorer must react to that and null the selection.
    vi.mocked(client.get).mockImplementation(((url: string) => {
      if (url.includes('/folders/fld-1/breadcrumb')) {
        return Promise.resolve({ data: { folders: [activeFolder] } });
      }
      if (url.endsWith('/folders/fld-1')) {
        return Promise.resolve({ data: { ...activeFolder, status: 'Trashed' } });
      }
      if (url.includes('/folders')) {
        return Promise.resolve({ data: { folders: [activeFolder] } });
      }
      return Promise.resolve({ data: { items: [], totalCount: 0, page: 1, pageSize: 50 } });
    }) as AxiosInstance['get']);

    render(<DocumentsExplorer />, { wrapper: createWrapper(client) });
    await waitFor(() => expect(screen.getByText('Contracts')).toBeInTheDocument());

    // Select the (stale-from-tree) folder. useFolder fires, returns Trashed,
    // and the useEffect should reset currentFolder before the breadcrumb
    // ever stabilises.
    await userEvent.click(screen.getByRole('button', { name: 'Contracts' }));

    await waitFor(() =>
      expect(document.querySelector('[data-granit-folder-breadcrumb]')).toBeNull()
    );
  });

  it('drops a stale selection when the watched folder query errors (404/403)', async () => {
    const client = createMockClient();
    vi.mocked(client.get).mockImplementation(((url: string) => {
      if (url.endsWith('/folders/fld-1')) {
        return Promise.reject(new Error('not found'));
      }
      if (url.includes('/folders')) {
        return Promise.resolve({ data: { folders: [activeFolder] } });
      }
      return Promise.resolve({ data: { items: [], totalCount: 0, page: 1, pageSize: 50 } });
    }) as AxiosInstance['get']);

    render(<DocumentsExplorer />, { wrapper: createWrapper(client) });
    await waitFor(() => expect(screen.getByText('Contracts')).toBeInTheDocument());

    await userEvent.click(screen.getByRole('button', { name: 'Contracts' }));

    await waitFor(() =>
      expect(document.querySelector('[data-granit-folder-breadcrumb]')).toBeNull()
    );
  });
});
