import { createMockClient, createTestQueryClient } from '@granit/react-testing';
import { QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { DocumentSearchPalette } from '../components/document-search-palette.tsx';
import { DocumentsProvider } from '../providers/documents-provider';

import type { DocumentBookmark } from '../hooks/use-document-bookmarks';
import type { AxiosInstance } from '@granit/api-client';
import type { ReactNode } from 'react';

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

function bookmark(id: string, name: string): DocumentBookmark {
  return { id, name, folderId: null, recordedAt: 0 };
}

describe('DocumentSearchPalette', () => {
  // jsdom doesn't implement <dialog>.showModal / close
  beforeEach(() => {
    HTMLDialogElement.prototype.showModal = function showModal() {
      this.setAttribute('open', '');
    };
    HTMLDialogElement.prototype.close = function close() {
      this.removeAttribute('open');
      this.dispatchEvent(new Event('close'));
    };
  });
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('renders the closed shell when open is false', () => {
    const client = createMockClient();
    render(<DocumentSearchPalette open={false} onClose={vi.fn()} onPickDocument={vi.fn()} />, {
      wrapper: createWrapper(client),
    });
    const dialog = document.querySelector<HTMLDialogElement>(
      '[data-granit-document-search-palette]'
    );
    expect(dialog?.hasAttribute('open')).toBe(false);
  });

  it('opens when open=true and shows favorites + recents with an empty query', async () => {
    const client = createMockClient();
    render(
      <DocumentSearchPalette
        open
        onClose={vi.fn()}
        onPickDocument={vi.fn()}
        favorites={[bookmark('doc-1', 'contract.pdf')]}
        recents={[bookmark('doc-2', 'invoice.pdf')]}
      />,
      { wrapper: createWrapper(client) }
    );

    const dialog = await waitFor(() =>
      document.querySelector<HTMLDialogElement>('[data-granit-document-search-palette]')
    );
    expect(dialog?.hasAttribute('open')).toBe(true);
    expect(screen.getByText('contract.pdf')).toBeInTheDocument();
    expect(screen.getByText('invoice.pdf')).toBeInTheDocument();
  });

  it('dedupes when a favorite is also a recent', async () => {
    const client = createMockClient();
    render(
      <DocumentSearchPalette
        open
        onClose={vi.fn()}
        onPickDocument={vi.fn()}
        favorites={[bookmark('doc-1', 'shared.pdf')]}
        recents={[bookmark('doc-1', 'shared.pdf')]}
      />,
      { wrapper: createWrapper(client) }
    );

    await waitFor(() => expect(screen.getByText('shared.pdf')).toBeInTheDocument());
    expect(screen.getAllByText('shared.pdf').length).toBe(1);
  });

  it('debounces remote search and triggers GET /documents with a Contains filter', async () => {
    const client = createMockClient();
    vi.mocked(client.get).mockResolvedValue({
      data: {
        items: [{ id: 'doc-9', folderId: null, name: 'matching.pdf', status: 'Active' }],
        totalCount: 1,
        page: 1,
        pageSize: 20,
      },
    });

    render(<DocumentSearchPalette open onClose={vi.fn()} onPickDocument={vi.fn()} />, {
      wrapper: createWrapper(client),
    });

    const input = await waitFor(() =>
      document.querySelector<HTMLInputElement>('[data-granit-document-search-palette-input]')
    );
    await userEvent.type(input!, 'match');

    await waitFor(() => expect(screen.getByText('matching.pdf')).toBeInTheDocument());
    const url = vi.mocked(client.get).mock.calls.at(-1)?.[0] ?? '';
    expect(url).toContain('Contains');
    expect(url).toMatch(/match/i);
  });

  it('Enter fires onPickDocument with the highlighted entry', async () => {
    const client = createMockClient();
    const onPick = vi.fn();
    render(
      <DocumentSearchPalette
        open
        onClose={vi.fn()}
        onPickDocument={onPick}
        favorites={[bookmark('doc-1', 'contract.pdf')]}
        recents={[bookmark('doc-2', 'invoice.pdf')]}
      />,
      { wrapper: createWrapper(client) }
    );

    const dialog = await waitFor(() =>
      document.querySelector<HTMLDialogElement>('[data-granit-document-search-palette]')
    );
    fireEvent.keyDown(dialog!, { key: 'ArrowDown' });
    fireEvent.keyDown(dialog!, { key: 'Enter' });
    expect(onPick).toHaveBeenCalled();
    expect(onPick.mock.calls[0]?.[0]).toBe('doc-2');
  });

  it('shows the no-results state for an empty remote search', async () => {
    const client = createMockClient();
    vi.mocked(client.get).mockResolvedValue({
      data: { items: [], totalCount: 0, page: 1, pageSize: 20 },
    });
    render(
      <DocumentSearchPalette
        open
        onClose={vi.fn()}
        onPickDocument={vi.fn()}
        labels={{ noResults: 'Nada.' }}
      />,
      { wrapper: createWrapper(client) }
    );

    const input = await waitFor(() =>
      document.querySelector<HTMLInputElement>('[data-granit-document-search-palette-input]')
    );
    await userEvent.type(input!, 'xyzzy');
    await waitFor(() => expect(screen.getByText('Nada.')).toBeInTheDocument());
  });

  it('calls onClose when the dialog dispatches close', async () => {
    const client = createMockClient();
    const onClose = vi.fn();
    render(<DocumentSearchPalette open onClose={onClose} onPickDocument={vi.fn()} />, {
      wrapper: createWrapper(client),
    });

    const dialog = await waitFor(() =>
      document.querySelector<HTMLDialogElement>('[data-granit-document-search-palette]')
    );
    dialog!.close();
    expect(onClose).toHaveBeenCalled();
  });
});
