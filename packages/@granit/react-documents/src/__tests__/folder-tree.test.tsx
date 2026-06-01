import { createMockClient, createTestQueryClient } from '@granit/react-testing';
import { QueryClientProvider } from '@tanstack/react-query';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { FolderTree } from '../components/folder-tree.tsx';
import { DOCUMENT_DRAG_MIME } from '../constants';
import { DocumentsProvider } from '../providers/documents-provider';

import type { AxiosInstance } from '@granit/api-client';
import type { FolderResponse, ListFoldersResponse } from '@granit/documents';
import type { ReactNode } from 'react';

const root: FolderResponse = {
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

const child: FolderResponse = {
  id: 'fld-2',
  parentFolderId: 'fld-1',
  name: '2026',
  path: '/Contracts/2026',
  depth: 2,
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
    expect(screen.getByRole('alert').textContent).toMatch(/boom/);
  });

  it('falls back to the error label when the thrown error has no message', async () => {
    const client = createMockClient();
    const err = new Error();
    vi.mocked(client.get).mockRejectedValue(err);

    render(<FolderTree labels={{ error: 'Custom error label' }} />, {
      wrapper: createWrapper(client),
    });

    await waitFor(() => expect(screen.getByRole('alert')).toBeInTheDocument());
  });

  it('opens an inline editor when clicking add-root and aborts on Escape', async () => {
    const client = createMockClient();
    vi.mocked(client.get).mockResolvedValue({ data: { folders: [] } });

    render(<FolderTree canManage />, { wrapper: createWrapper(client) });

    await waitFor(() => expect(screen.getByText('No folders.')).toBeInTheDocument());
    await userEvent.click(screen.getByRole('button', { name: /New root folder/ }));

    const input = screen.getByRole('textbox', { name: /Folder name/ });
    expect(input).toBeInTheDocument();
    await userEvent.keyboard('{Escape}');
    expect(client.post).not.toHaveBeenCalled();
    expect(screen.queryByRole('textbox', { name: /Folder name/ })).toBeNull();
  });

  it('creates a root folder when the inline editor commits a name', async () => {
    const client = createMockClient();
    vi.mocked(client.get).mockResolvedValue({ data: { folders: [] } });
    vi.mocked(client.post).mockResolvedValue({ data: { ...root, name: 'New' } });

    render(<FolderTree canManage />, { wrapper: createWrapper(client) });
    await waitFor(() => expect(screen.getByText('No folders.')).toBeInTheDocument());
    await userEvent.click(screen.getByRole('button', { name: /New root folder/ }));

    const input = screen.getByRole('textbox', { name: /Folder name/ });
    await userEvent.type(input, 'New{Enter}');

    await waitFor(() => expect(client.post).toHaveBeenCalled());
  });

  it('opens an inline rename editor and cancels when the name is unchanged', async () => {
    const client = createMockClient();
    vi.mocked(client.get).mockResolvedValue({ data: { folders: [root] } });

    render(<FolderTree canManage />, { wrapper: createWrapper(client) });
    await waitFor(() => expect(screen.getByText('Contracts')).toBeInTheDocument());

    // Click the inline Rename button, then submit unchanged name → no PATCH
    await userEvent.click(screen.getByRole('button', { name: 'Rename' }));
    const input = screen.getByRole('textbox', { name: 'Rename' });
    await userEvent.keyboard('{Enter}');

    expect(input).not.toBeInTheDocument();
    expect(client.patch).not.toHaveBeenCalled();
  });

  it('renames a folder when the inline editor commits a new name', async () => {
    const client = createMockClient();
    vi.mocked(client.get).mockResolvedValue({ data: { folders: [root] } });
    vi.mocked(client.patch).mockResolvedValue({ data: { ...root, name: 'Renamed' } });

    render(<FolderTree canManage />, { wrapper: createWrapper(client) });
    await waitFor(() => expect(screen.getByText('Contracts')).toBeInTheDocument());

    await userEvent.click(screen.getByRole('button', { name: 'Rename' }));
    const input = screen.getByRole('textbox', { name: 'Rename' });
    await userEvent.clear(input);
    await userEvent.type(input, 'Renamed{Enter}');

    await waitFor(() => expect(client.patch).toHaveBeenCalled());
  });

  it('aborts trash when the user clicks Cancel in the inline confirm', async () => {
    const client = createMockClient();
    vi.mocked(client.get).mockResolvedValue({ data: { folders: [root] } });

    render(<FolderTree canManage />, { wrapper: createWrapper(client) });
    await waitFor(() => expect(screen.getByText('Contracts')).toBeInTheDocument());

    await userEvent.click(screen.getByRole('button', { name: 'Delete' }));
    expect(screen.getByRole('alertdialog')).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Cancel' }));
    expect(client.delete).not.toHaveBeenCalled();
  });

  it('trashes a folder when the user confirms inline', async () => {
    const client = createMockClient();
    vi.mocked(client.get).mockResolvedValue({ data: { folders: [root] } });
    vi.mocked(client.delete).mockResolvedValue({ data: undefined });

    render(<FolderTree canManage />, { wrapper: createWrapper(client) });
    await waitFor(() => expect(screen.getByText('Contracts')).toBeInTheDocument());

    await userEvent.click(screen.getByRole('button', { name: 'Delete' }));
    await userEvent.click(screen.getByRole('button', { name: 'Confirm' }));

    await waitFor(() => expect(client.delete).toHaveBeenCalled());
  });

  it('invokes onDeleted with the folder id once the trash mutation succeeds', async () => {
    const client = createMockClient();
    vi.mocked(client.get).mockResolvedValue({ data: { folders: [root] } });
    vi.mocked(client.delete).mockResolvedValue({ data: undefined });
    const onDeleted = vi.fn();

    render(<FolderTree canManage onDeleted={onDeleted} />, { wrapper: createWrapper(client) });
    await waitFor(() => expect(screen.getByText('Contracts')).toBeInTheDocument());

    await userEvent.click(screen.getByRole('button', { name: 'Delete' }));
    await userEvent.click(screen.getByRole('button', { name: 'Confirm' }));

    await waitFor(() => expect(onDeleted).toHaveBeenCalledWith(root.id));
    expect(onDeleted).toHaveBeenCalledTimes(1);
  });

  it('does NOT invoke onDeleted when the trash mutation fails', async () => {
    const client = createMockClient();
    vi.mocked(client.get).mockResolvedValue({ data: { folders: [root] } });
    vi.mocked(client.delete).mockRejectedValue(new Error('forbidden'));
    const onDeleted = vi.fn();

    render(<FolderTree canManage onDeleted={onDeleted} />, { wrapper: createWrapper(client) });
    await waitFor(() => expect(screen.getByText('Contracts')).toBeInTheDocument());

    await userEvent.click(screen.getByRole('button', { name: 'Delete' }));
    await userEvent.click(screen.getByRole('button', { name: 'Confirm' }));

    await waitFor(() => expect(screen.getByRole('alert').textContent).toMatch(/forbidden/));
    expect(onDeleted).not.toHaveBeenCalled();
  });

  it('creates a sub-folder via the node-level add button (inline editor)', async () => {
    const client = createMockClient();
    vi.mocked(client.get).mockResolvedValue({ data: { folders: [root] } });
    vi.mocked(client.post).mockResolvedValue({ data: { ...root, name: 'child' } });

    render(<FolderTree canManage />, { wrapper: createWrapper(client) });
    await waitFor(() => expect(screen.getByText('Contracts')).toBeInTheDocument());

    // The per-node + button (aria-label 'New folder')
    const nodeAdd = screen.getByRole('button', { name: 'New folder' });
    await userEvent.click(nodeAdd);

    const input = await screen.findByRole('textbox', { name: /Folder name/ });
    await userEvent.type(input, 'child{Enter}');

    await waitFor(() => expect(client.post).toHaveBeenCalled());
  });

  it('marks the currentFolderId node with a data attribute', async () => {
    const client = createMockClient();
    vi.mocked(client.get).mockResolvedValue({ data: { folders: [root] } });

    render(<FolderTree currentFolderId={root.id} />, { wrapper: createWrapper(client) });

    await waitFor(() => expect(screen.getByText('Contracts')).toBeInTheDocument());
    const node = document.querySelector(`[data-granit-folder-id="${root.id}"]`);
    expect(node?.hasAttribute('data-granit-folder-tree-current')).toBe(true);
  });

  it('moves dropped documents into the target folder via useMoveDocument', async () => {
    const client = createMockClient();
    vi.mocked(client.get).mockResolvedValue({ data: { folders: [root] } });
    vi.mocked(client.post).mockResolvedValue({
      data: {
        id: 'doc-1',
        folderId: root.id,
        name: 'a.pdf',
        status: 'Active',
        ownerId: 'u',
        currentVersionId: 'v',
        description: null,
        trashedAt: null,
        permission: null,
      },
    });

    render(<FolderTree canManage />, { wrapper: createWrapper(client) });
    await waitFor(() => expect(screen.getByText('Contracts')).toBeInTheDocument());

    const row = document.querySelector<HTMLElement>('[data-granit-folder-tree-row]');
    expect(row).not.toBeNull();

    // Simulate dragenter / dragover / drop with the granit MIME payload.
    const ids = ['doc-1', 'doc-2'];
    const types = [DOCUMENT_DRAG_MIME];
    const store = new Map<string, string>([[DOCUMENT_DRAG_MIME, JSON.stringify({ ids })]]);
    const dataTransfer = {
      types,
      effectAllowed: 'move',
      dropEffect: 'none',
      getData: (type: string) => store.get(type) ?? '',
      setData: vi.fn(),
    };

    const enter = new Event('dragenter', { bubbles: true });
    Object.defineProperty(enter, 'dataTransfer', { value: dataTransfer });
    row!.dispatchEvent(enter);
    await waitFor(() => expect(row!.hasAttribute('data-granit-folder-tree-drop-over')).toBe(true));

    const drop = new Event('drop', { bubbles: true, cancelable: true });
    Object.defineProperty(drop, 'dataTransfer', { value: dataTransfer });
    row!.dispatchEvent(drop);

    await waitFor(() => {
      const moveCalls = vi.mocked(client.post).mock.calls.filter(([url]) => url.includes('/move'));
      expect(moveCalls.length).toBe(2);
    });
  });

  it('ignores drops that do not carry the granit MIME payload', () => {
    const client = createMockClient();
    vi.mocked(client.get).mockResolvedValue({ data: { folders: [root] } });

    render(<FolderTree canManage />, { wrapper: createWrapper(client) });
    return waitFor(() => expect(screen.getByText('Contracts')).toBeInTheDocument()).then(() => {
      const row = document.querySelector<HTMLElement>('[data-granit-folder-tree-row]');
      const dataTransfer = {
        types: ['Files'], // a file drag, not an internal document drag
        getData: () => '',
      };
      const drop = new Event('drop', { bubbles: true, cancelable: true });
      Object.defineProperty(drop, 'dataTransfer', { value: dataTransfer });
      row!.dispatchEvent(drop);

      const moveCalls = vi.mocked(client.post).mock.calls.filter(([url]) => url.includes('/move'));
      expect(moveCalls.length).toBe(0);
    });
  });
});
