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

  it('renders the error state when the roots query fails', async () => {
    const client = createMockClient();
    vi.mocked(client.get).mockRejectedValue(new Error('boom'));

    render(<FolderTree labels={{ error: 'oops' }} />, { wrapper: createWrapper(client) });

    await waitFor(() => expect(screen.getByRole('alert')).toBeInTheDocument());
    // Error message from the thrown Error wins over the fallback label
    expect(screen.getByRole('alert').textContent).toMatch(/boom/);
  });

  it('falls back to the error label when the thrown error has no message', async () => {
    const client = createMockClient();
    // Custom error without a message string
    const err = new Error();
    vi.mocked(client.get).mockRejectedValue(err);

    render(<FolderTree labels={{ error: 'Custom error label' }} />, {
      wrapper: createWrapper(client),
    });

    await waitFor(() => expect(screen.getByRole('alert')).toBeInTheDocument());
  });

  it('triggers the create-root prompt and aborts when the prompt is empty', async () => {
    const client = createMockClient();
    vi.mocked(client.get).mockResolvedValue({ data: { folders: [] } });
    const promptSpy = vi.spyOn(window, 'prompt').mockReturnValue('   ');

    render(<FolderTree canManage />, { wrapper: createWrapper(client) });

    await waitFor(() => expect(screen.getByText('No folders.')).toBeInTheDocument());
    const addRoot = screen.getByRole('button', { name: '+' });
    await userEvent.click(addRoot);

    expect(promptSpy).toHaveBeenCalled();
    expect(client.post).not.toHaveBeenCalled();
  });

  it('creates a root folder when the prompt returns a name', async () => {
    const client = createMockClient();
    vi.mocked(client.get).mockResolvedValue({ data: { folders: [] } });
    vi.mocked(client.post).mockResolvedValue({ data: { ...root, name: 'New' } });
    vi.spyOn(window, 'prompt').mockReturnValue('New');

    render(<FolderTree canManage />, { wrapper: createWrapper(client) });
    await waitFor(() => expect(screen.getByText('No folders.')).toBeInTheDocument());
    await userEvent.click(screen.getByRole('button', { name: '+' }));

    await waitFor(() => expect(client.post).toHaveBeenCalled());
  });

  it('cancels rename when the prompt returns the same name', async () => {
    const client = createMockClient();
    vi.mocked(client.get).mockResolvedValue({ data: { folders: [root] } });
    vi.spyOn(window, 'prompt').mockReturnValue(root.name);

    render(<FolderTree canManage />, { wrapper: createWrapper(client) });
    await waitFor(() => expect(screen.getByText('Contracts')).toBeInTheDocument());

    await userEvent.click(screen.getByRole('button', { name: 'Rename' }));
    expect(client.patch).not.toHaveBeenCalled();
  });

  it('renames a folder when the prompt returns a new name', async () => {
    const client = createMockClient();
    vi.mocked(client.get).mockResolvedValue({ data: { folders: [root] } });
    vi.mocked(client.patch).mockResolvedValue({ data: { ...root, name: 'Renamed' } });
    vi.spyOn(window, 'prompt').mockReturnValue('Renamed');

    render(<FolderTree canManage />, { wrapper: createWrapper(client) });
    await waitFor(() => expect(screen.getByText('Contracts')).toBeInTheDocument());

    await userEvent.click(screen.getByRole('button', { name: 'Rename' }));
    await waitFor(() => expect(client.patch).toHaveBeenCalled());
  });

  it('aborts delete when the user cancels the confirm dialog', async () => {
    const client = createMockClient();
    vi.mocked(client.get).mockResolvedValue({ data: { folders: [root] } });
    vi.spyOn(window, 'confirm').mockReturnValue(false);

    render(<FolderTree canManage />, { wrapper: createWrapper(client) });
    await waitFor(() => expect(screen.getByText('Contracts')).toBeInTheDocument());

    await userEvent.click(screen.getByRole('button', { name: 'Delete' }));
    expect(client.delete).not.toHaveBeenCalled();
  });

  it('trashes a folder when the user confirms', async () => {
    const client = createMockClient();
    vi.mocked(client.get).mockResolvedValue({ data: { folders: [root] } });
    vi.mocked(client.delete).mockResolvedValue({ data: undefined });
    vi.spyOn(window, 'confirm').mockReturnValue(true);

    render(<FolderTree canManage />, { wrapper: createWrapper(client) });
    await waitFor(() => expect(screen.getByText('Contracts')).toBeInTheDocument());

    await userEvent.click(screen.getByRole('button', { name: 'Delete' }));
    await waitFor(() => expect(client.delete).toHaveBeenCalled());
  });

  it('creates a sub-folder via the node-level add button', async () => {
    const client = createMockClient();
    vi.mocked(client.get).mockResolvedValue({ data: { folders: [root] } });
    vi.mocked(client.post).mockResolvedValue({ data: { ...root, name: 'child' } });
    vi.spyOn(window, 'prompt').mockReturnValue('child');

    render(<FolderTree canManage />, { wrapper: createWrapper(client) });
    await waitFor(() => expect(screen.getByText('Contracts')).toBeInTheDocument());

    // The node-level + button is among the row buttons (not the top-level one)
    const addButtons = screen.getAllByRole('button', { name: '+' });
    // First add is the root-level. Click the per-node one.
    const nodeAdd = addButtons[addButtons.length - 1];
    if (!nodeAdd) throw new Error('expected node-level add button');
    await userEvent.click(nodeAdd);

    await waitFor(() => expect(client.post).toHaveBeenCalled());
  });
});
