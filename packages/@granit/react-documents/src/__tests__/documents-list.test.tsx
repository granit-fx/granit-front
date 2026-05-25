import { createMockClient, createTestQueryClient } from '@granit/react-testing';
import { QueryClientProvider } from '@tanstack/react-query';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { DocumentsList } from '../components/documents-list.tsx';
import { DOCUMENT_DRAG_MIME } from '../constants.js';
import { DocumentsProvider } from '../providers/documents-provider.js';

import type { AxiosInstance } from '@granit/api-client';
import type { ReactNode } from 'react';

function createWrapper(client: AxiosInstance) {
  return function Wrapper({ children }: { children: ReactNode }) {
    const qc = createTestQueryClient();
    return (
      <QueryClientProvider client={qc}>
        <DocumentsProvider config={{ client, basePath: '/api/v1/documents' }}>
          {children}
        </DocumentsProvider>
      </QueryClientProvider>
    );
  };
}

function mockTwoDocs(client: AxiosInstance): void {
  vi.mocked(client.get).mockResolvedValue({
    data: {
      items: [
        { id: 'doc-1', folderId: 'fld-1', name: 'contract.pdf', status: 'Active' },
        { id: 'doc-2', folderId: 'fld-1', name: 'invoice.pdf', status: 'Active' },
      ],
      totalCount: 2,
      page: 1,
      pageSize: 50,
    },
    status: 200,
    statusText: 'OK',
    headers: {},
    config: { headers: {} } as never,
  });
}

describe('DocumentsList', () => {
  it('renders the loading state while the QueryEngine page is in flight', () => {
    const client = createMockClient();
    vi.mocked(client.get).mockReturnValue(new Promise(() => {}));

    render(<DocumentsList folderId="fld-1" />, { wrapper: createWrapper(client) });

    expect(screen.getByText('Loading documents…')).toBeInTheDocument();
  });

  it('renders the empty state when the QueryEngine returns zero items', async () => {
    const client = createMockClient();
    vi.mocked(client.get).mockResolvedValue({
      data: { items: [], totalCount: 0, page: 1, pageSize: 50 },
      status: 200,
      statusText: 'OK',
      headers: {},
      config: { headers: {} } as never,
    });

    render(<DocumentsList folderId="fld-1" />, { wrapper: createWrapper(client) });

    await waitFor(() => expect(screen.getByText('This folder is empty.')).toBeInTheDocument());
  });

  it('renders rows + pagination from the QueryEngine PagedResult and triggers onOpenDocument', async () => {
    const client = createMockClient();
    mockTwoDocs(client);
    const onOpenDocument = vi.fn();

    render(<DocumentsList folderId="fld-1" onOpenDocument={onOpenDocument} />, {
      wrapper: createWrapper(client),
    });

    await waitFor(() => expect(screen.getByText('contract.pdf')).toBeInTheDocument());
    expect(screen.getByText('invoice.pdf')).toBeInTheDocument();
    expect(screen.getByText('Page 1 of 1')).toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: 'contract.pdf' }));
    expect(onOpenDocument).toHaveBeenCalledWith('doc-1');
  });

  it('renders the error state when the QueryEngine call fails', async () => {
    const client = createMockClient();
    vi.mocked(client.get).mockRejectedValue(new Error('boom'));

    render(<DocumentsList folderId="fld-err" />, { wrapper: createWrapper(client) });

    await waitFor(() => expect(screen.getByText('Failed to load documents.')).toBeInTheDocument());
  });

  it('renders a row without onOpenDocument as a plain span (no button)', async () => {
    const client = createMockClient();
    vi.mocked(client.get).mockResolvedValue({
      data: {
        items: [{ id: 'doc-1', folderId: 'fld-1', name: 'readonly.pdf', status: 'Active' }],
        totalCount: 1,
        page: 1,
        pageSize: 50,
      },
      status: 200,
      statusText: 'OK',
      headers: {},
      config: { headers: {} } as never,
    });

    render(<DocumentsList folderId="fld-1" />, { wrapper: createWrapper(client) });

    await waitFor(() => expect(screen.getByText('readonly.pdf')).toBeInTheDocument());
    expect(screen.queryByRole('button', { name: 'readonly.pdf' })).not.toBeInTheDocument();
  });

  it('hits the QueryEngine endpoint /documents with the folderId + status Active filters', async () => {
    const client = createMockClient();
    vi.mocked(client.get).mockResolvedValue({
      data: { items: [], totalCount: 0, page: 1, pageSize: 50 },
      status: 200,
      statusText: 'OK',
      headers: {},
      config: { headers: {} } as never,
    });

    render(<DocumentsList folderId="fld-42" />, { wrapper: createWrapper(client) });

    await waitFor(() => expect(client.get).toHaveBeenCalled());
    const url = vi.mocked(client.get).mock.calls[0]?.[0] ?? '';
    expect(url).toContain('/api/v1/documents/documents');
    expect(url).toContain('fld-42');
    expect(url).toContain('Active');
    expect(url).toContain('name');
  });

  it('toggles selection via per-row checkbox and bubbles onSelectionChange', async () => {
    const client = createMockClient();
    mockTwoDocs(client);
    const onSelectionChange = vi.fn();

    render(<DocumentsList folderId="fld-1" onSelectionChange={onSelectionChange} />, {
      wrapper: createWrapper(client),
    });

    await waitFor(() => expect(screen.getByText('contract.pdf')).toBeInTheDocument());

    const rowCheckbox = screen.getByRole('checkbox', { name: 'Select contract.pdf' });
    await userEvent.click(rowCheckbox);

    await waitFor(() => {
      const lastCall = onSelectionChange.mock.calls.at(-1);
      const set = lastCall?.[0] as ReadonlySet<string>;
      expect(set.has('doc-1')).toBe(true);
    });
  });

  it('select-all checkbox toggles all rows', async () => {
    const client = createMockClient();
    mockTwoDocs(client);
    const onSelectionChange = vi.fn();

    render(<DocumentsList folderId="fld-1" onSelectionChange={onSelectionChange} />, {
      wrapper: createWrapper(client),
    });

    await waitFor(() => expect(screen.getByText('contract.pdf')).toBeInTheDocument());
    await userEvent.click(screen.getByRole('checkbox', { name: 'Select all' }));

    await waitFor(() => {
      const lastCall = onSelectionChange.mock.calls.at(-1);
      const set = lastCall?.[0] as ReadonlySet<string>;
      expect(set.size).toBe(2);
    });
  });

  it('renames a row via the inline editor (Rename action)', async () => {
    const client = createMockClient();
    mockTwoDocs(client);
    vi.mocked(client.patch).mockResolvedValue({
      data: { id: 'doc-1', folderId: 'fld-1', name: 'renamed.pdf', status: 'Active' },
      status: 200,
      statusText: 'OK',
      headers: {},
      config: { headers: {} } as never,
    });

    render(<DocumentsList folderId="fld-1" canManage onOpenDocument={vi.fn()} />, {
      wrapper: createWrapper(client),
    });

    await waitFor(() => expect(screen.getByText('contract.pdf')).toBeInTheDocument());

    const renameButtons = screen.getAllByRole('button', { name: 'Rename' });
    await userEvent.click(renameButtons[0]!);

    const input = screen.getByRole('textbox', { name: 'Rename' });
    await userEvent.clear(input);
    await userEvent.type(input, 'renamed.pdf{Enter}');

    await waitFor(() => expect(client.patch).toHaveBeenCalled());
  });

  it('confirms inline before trashing a row', async () => {
    const client = createMockClient();
    mockTwoDocs(client);
    vi.mocked(client.delete).mockResolvedValue({
      data: undefined,
      status: 204,
      statusText: 'No Content',
      headers: {},
      config: { headers: {} } as never,
    });

    render(<DocumentsList folderId="fld-1" canManage onOpenDocument={vi.fn()} />, {
      wrapper: createWrapper(client),
    });

    await waitFor(() => expect(screen.getByText('contract.pdf')).toBeInTheDocument());

    const trashButtons = screen.getAllByRole('button', { name: 'Move to trash' });
    await userEvent.click(trashButtons[0]!);

    expect(screen.getByRole('alertdialog')).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Confirm' }));

    await waitFor(() => expect(client.delete).toHaveBeenCalled());
  });

  it('sets the granit-documents DataTransfer payload on row drag start (single row)', async () => {
    const client = createMockClient();
    mockTwoDocs(client);

    render(<DocumentsList folderId="fld-1" canManage onOpenDocument={vi.fn()} />, {
      wrapper: createWrapper(client),
    });

    await waitFor(() => expect(screen.getByText('contract.pdf')).toBeInTheDocument());

    const row = document.querySelector<HTMLElement>('[data-granit-document-id="doc-1"]');
    expect(row).not.toBeNull();
    expect(row!.getAttribute('draggable')).toBe('true');

    const setData = vi.fn();
    const dragStart = new Event('dragstart', { bubbles: true, cancelable: true });
    Object.defineProperty(dragStart, 'dataTransfer', {
      value: { setData, types: [], effectAllowed: 'none' },
    });
    row!.dispatchEvent(dragStart);

    const granitCall = setData.mock.calls.find(([type]) => type === DOCUMENT_DRAG_MIME);
    expect(granitCall).toBeDefined();
    const payload = JSON.parse(granitCall![1] as string) as { ids: string[] };
    expect(payload.ids).toEqual(['doc-1']);
  });

  it('drags the whole selection when the dragged row is part of it', async () => {
    const client = createMockClient();
    mockTwoDocs(client);

    render(<DocumentsList folderId="fld-1" canManage onOpenDocument={vi.fn()} />, {
      wrapper: createWrapper(client),
    });

    await waitFor(() => expect(screen.getByText('contract.pdf')).toBeInTheDocument());

    // Select both rows via the select-all checkbox.
    await userEvent.click(screen.getByRole('checkbox', { name: 'Select all' }));

    const row = document.querySelector<HTMLElement>('[data-granit-document-id="doc-1"]');
    const setData = vi.fn();
    const dragStart = new Event('dragstart', { bubbles: true, cancelable: true });
    Object.defineProperty(dragStart, 'dataTransfer', {
      value: { setData, types: [], effectAllowed: 'none' },
    });
    row!.dispatchEvent(dragStart);

    const granitCall = setData.mock.calls.find(([type]) => type === DOCUMENT_DRAG_MIME);
    expect(granitCall).toBeDefined();
    const payload = JSON.parse(granitCall![1] as string) as { ids: string[] };
    expect(payload.ids.toSorted()).toEqual(['doc-1', 'doc-2']);
  });

  it('does not start a drag when canManage is false', async () => {
    const client = createMockClient();
    mockTwoDocs(client);

    render(<DocumentsList folderId="fld-1" onOpenDocument={vi.fn()} />, {
      wrapper: createWrapper(client),
    });

    await waitFor(() => expect(screen.getByText('contract.pdf')).toBeInTheDocument());
    const row = document.querySelector<HTMLElement>('[data-granit-document-id="doc-1"]');
    expect(row!.getAttribute('draggable')).toBe('false');
  });

  it('renders the table in list mode (default)', async () => {
    const client = createMockClient();
    mockTwoDocs(client);
    render(<DocumentsList folderId="fld-1" onOpenDocument={vi.fn()} />, {
      wrapper: createWrapper(client),
    });
    await waitFor(() => expect(screen.getByText('contract.pdf')).toBeInTheDocument());
    expect(document.querySelector('[data-granit-documents-list-table]')).not.toBeNull();
    expect(document.querySelector('[data-granit-documents-list-grid]')).toBeNull();
  });

  it('renders tiles + kind data attributes in grid mode', async () => {
    const client = createMockClient();
    mockTwoDocs(client);
    render(
      <DocumentsList folderId="fld-1" viewMode="grid" tileSize={200} onOpenDocument={vi.fn()} />,
      { wrapper: createWrapper(client) }
    );
    await waitFor(() => expect(screen.getByText('contract.pdf')).toBeInTheDocument());

    const grid = document.querySelector<HTMLElement>('[data-granit-documents-list-grid]');
    expect(grid).not.toBeNull();
    expect(document.querySelector('[data-granit-documents-list-table]')).toBeNull();
    // CSS var carries the tile size to the host stylesheet.
    expect(grid!.style.getPropertyValue('--granit-documents-tile-size')).toBe('200px');

    const tiles = document.querySelectorAll('[data-granit-documents-list-tile]');
    expect(tiles.length).toBe(2);
    // contract.pdf → 'pdf'; invoice.pdf → 'pdf'
    expect(tiles[0]!.getAttribute('data-granit-document-kind')).toBe('pdf');
    expect(tiles[1]!.getAttribute('data-granit-document-kind')).toBe('pdf');
  });

  it('invokes onPreviewDocument when Space is pressed on the focused row', async () => {
    const client = createMockClient();
    mockTwoDocs(client);
    const onPreviewDocument = vi.fn();

    render(
      <DocumentsList
        folderId="fld-1"
        onOpenDocument={vi.fn()}
        onPreviewDocument={onPreviewDocument}
      />,
      { wrapper: createWrapper(client) }
    );

    await waitFor(() => expect(screen.getByText('contract.pdf')).toBeInTheDocument());

    // Click the name to focus the row, then press Space.
    await userEvent.click(screen.getByRole('button', { name: 'contract.pdf' }));
    const table = document.querySelector<HTMLTableElement>('[data-granit-documents-list-table]');
    table!.focus();
    await userEvent.keyboard(' ');

    expect(onPreviewDocument).toHaveBeenCalled();
    const [doc] = onPreviewDocument.mock.calls[0]!;
    expect((doc as { id: string }).id).toBe('doc-1');
  });

  it('falls back to toggling selection on Space when no onPreviewDocument is set', async () => {
    const client = createMockClient();
    mockTwoDocs(client);
    const onSelectionChange = vi.fn();

    render(
      <DocumentsList
        folderId="fld-1"
        onOpenDocument={vi.fn()}
        onSelectionChange={onSelectionChange}
      />,
      { wrapper: createWrapper(client) }
    );

    await waitFor(() => expect(screen.getByText('contract.pdf')).toBeInTheDocument());

    await userEvent.click(screen.getByRole('button', { name: 'contract.pdf' }));
    // After click → selection has doc-1. Space should toggle it off.
    const table = document.querySelector<HTMLTableElement>('[data-granit-documents-list-table]');
    table!.focus();
    await userEvent.keyboard(' ');

    await waitFor(() => {
      const lastCall = onSelectionChange.mock.calls.at(-1);
      const set = lastCall?.[0] as ReadonlySet<string>;
      expect(set.has('doc-1')).toBe(false);
    });
  });

  it('opens a document on tile double-click', async () => {
    const client = createMockClient();
    mockTwoDocs(client);
    const onOpenDocument = vi.fn();
    render(<DocumentsList folderId="fld-1" viewMode="grid" onOpenDocument={onOpenDocument} />, {
      wrapper: createWrapper(client),
    });
    await waitFor(() => expect(screen.getByText('contract.pdf')).toBeInTheDocument());

    const tile = document.querySelector<HTMLElement>(
      '[data-granit-document-id="doc-1"][data-granit-documents-list-tile]'
    );
    await userEvent.dblClick(tile!);
    expect(onOpenDocument).toHaveBeenCalledWith('doc-1');
  });
});
