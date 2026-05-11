import { createMockClient, createTestQueryClient } from '@granit/react-testing';
import { QueryClientProvider } from '@tanstack/react-query';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { FolderTree } from '../components/folder-tree.tsx';
import { DocumentsProvider } from '../providers/documents-provider.js';

import type { AxiosInstance } from '@granit/api-client';
import type { FolderResponse, ListFoldersResponse } from '@granit/documents';
import type { ReactNode } from 'react';

const root: FolderResponse = {
  id: 'fld-1',
  parentFolderId: null,
  name: 'Contracts',
  path: '/Contracts',
  depth: 1,
  ownerUserId: 'user-1',
  status: 'Active',
  trashedAt: null,
  permission: null,
};

const child: FolderResponse = {
  id: 'fld-2',
  parentFolderId: 'fld-1',
  name: '2026',
  path: '/Contracts/2026',
  depth: 2,
  ownerUserId: 'user-1',
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

describe('FolderTree', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('renders the loading state initially', () => {
    const client = createMockClient();
    vi.mocked(client.get).mockReturnValue(new Promise(() => {}));

    render(<FolderTree />, { wrapper: createWrapper(client) });

    expect(screen.getByText('Loading…')).toBeInTheDocument();
  });

  it('renders the root list and lazy-loads children on expand', async () => {
    const client = createMockClient();
    const rootList: ListFoldersResponse = { folders: [root] };
    const childList: ListFoldersResponse = { folders: [child] };
    vi.mocked(client.get).mockImplementation(((
      _url: string,
      opts?: { params?: { parentId?: string | null } }
    ) => {
      if (opts?.params?.parentId === 'fld-1') {
        return Promise.resolve({ data: childList });
      }
      return Promise.resolve({ data: rootList });
    }) as AxiosInstance['get']);

    render(<FolderTree />, { wrapper: createWrapper(client) });

    await waitFor(() => expect(screen.getByText('Contracts')).toBeInTheDocument());
    expect(screen.queryByText('2026')).toBeNull();

    await userEvent.click(screen.getByRole('button', { expanded: false }));
    await waitFor(() => expect(screen.getByText('2026')).toBeInTheDocument());
  });

  it('renders the empty state when there are no roots', async () => {
    const client = createMockClient();
    vi.mocked(client.get).mockResolvedValue({ data: { folders: [] } });

    render(<FolderTree />, { wrapper: createWrapper(client) });

    await waitFor(() => expect(screen.getByText('No folders.')).toBeInTheDocument());
  });

  it('calls onSelect when the user clicks a folder name', async () => {
    const client = createMockClient();
    vi.mocked(client.get).mockResolvedValue({ data: { folders: [root] } });
    const onSelect = vi.fn();

    render(<FolderTree onSelect={onSelect} />, { wrapper: createWrapper(client) });

    await waitFor(() => expect(screen.getByText('Contracts')).toBeInTheDocument());
    await userEvent.click(screen.getByRole('button', { name: 'Contracts' }));

    expect(onSelect).toHaveBeenCalledWith(root);
  });

  it('shows manage actions only when canManage is true', async () => {
    const client = createMockClient();
    vi.mocked(client.get).mockResolvedValue({ data: { folders: [root] } });

    render(<FolderTree canManage />, { wrapper: createWrapper(client) });

    await waitFor(() => expect(screen.getByText('Contracts')).toBeInTheDocument());
    expect(screen.getAllByRole('button', { name: 'Rename' }).length).toBeGreaterThan(0);
  });
});
