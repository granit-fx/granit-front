import { createMockClient, createTestQueryClient } from '@granit/react-testing';
import { QueryClientProvider } from '@tanstack/react-query';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { DocumentsSidebar } from '../components/documents-sidebar.tsx';
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

describe('DocumentsSidebar', () => {
  it('defaults to the folders tab and renders the FolderTree', () => {
    const client = createMockClient();
    vi.mocked(client.get).mockResolvedValue({ data: { folders: [] } });

    render(
      <DocumentsSidebar folderTree={{}} favorites={[]} recents={[]} onPickBookmark={vi.fn()} />,
      { wrapper: createWrapper(client) }
    );

    const foldersBtn = screen.getByRole('tab', { name: /Folders/i });
    expect(foldersBtn.getAttribute('aria-selected')).toBe('true');
    expect(document.querySelector('[data-granit-folder-tree]')).not.toBeNull();
  });

  it('switches to favorites and lists bookmarks', async () => {
    const client = createMockClient();
    vi.mocked(client.get).mockResolvedValue({ data: { folders: [] } });
    const onPick = vi.fn();

    render(
      <DocumentsSidebar
        folderTree={{}}
        favorites={[bookmark('doc-1', 'contract.pdf')]}
        recents={[]}
        onPickBookmark={onPick}
      />,
      { wrapper: createWrapper(client) }
    );

    await userEvent.click(screen.getByRole('tab', { name: /Favorites/i }));
    expect(screen.getByText('contract.pdf')).toBeInTheDocument();

    await userEvent.click(screen.getByText('contract.pdf'));
    expect(onPick).toHaveBeenCalledWith(expect.objectContaining({ id: 'doc-1' }));
  });

  it('shows an empty state on the favorites tab when none are pinned', async () => {
    const client = createMockClient();
    vi.mocked(client.get).mockResolvedValue({ data: { folders: [] } });

    render(
      <DocumentsSidebar
        folderTree={{}}
        favorites={[]}
        recents={[]}
        onPickBookmark={vi.fn()}
        labels={{ favoritesEmpty: 'Pin docs to see them here.' }}
      />,
      { wrapper: createWrapper(client) }
    );

    await userEvent.click(screen.getByRole('tab', { name: /Favorites/i }));
    expect(screen.getByText('Pin docs to see them here.')).toBeInTheDocument();
  });

  it('switches to recents and triggers onPickBookmark on click', async () => {
    const client = createMockClient();
    vi.mocked(client.get).mockResolvedValue({ data: { folders: [] } });
    const onPick = vi.fn();

    render(
      <DocumentsSidebar
        folderTree={{}}
        favorites={[]}
        recents={[bookmark('doc-2', 'invoice.pdf')]}
        onPickBookmark={onPick}
      />,
      { wrapper: createWrapper(client) }
    );

    await userEvent.click(screen.getByRole('tab', { name: /Recent/i }));
    await userEvent.click(screen.getByText('invoice.pdf'));
    expect(onPick).toHaveBeenCalledWith(expect.objectContaining({ id: 'doc-2' }));
  });

  it('shows the favorites count badge', () => {
    const client = createMockClient();
    vi.mocked(client.get).mockResolvedValue({ data: { folders: [] } });

    render(
      <DocumentsSidebar
        folderTree={{}}
        favorites={[bookmark('a', 'a.pdf'), bookmark('b', 'b.pdf')]}
        recents={[]}
        onPickBookmark={vi.fn()}
      />,
      { wrapper: createWrapper(client) }
    );

    const counts = document.querySelectorAll('[data-granit-documents-sidebar-count]');
    expect(counts[0]?.textContent).toBe('2');
  });

  it('fires onRemoveFavorite when the remove button is clicked', async () => {
    const client = createMockClient();
    vi.mocked(client.get).mockResolvedValue({ data: { folders: [] } });
    const onRemove = vi.fn();

    render(
      <DocumentsSidebar
        folderTree={{}}
        favorites={[bookmark('doc-1', 'contract.pdf')]}
        recents={[]}
        onPickBookmark={vi.fn()}
        onRemoveFavorite={onRemove}
        labels={{ removeFavorite: 'Unpin' }}
      />,
      { wrapper: createWrapper(client) }
    );

    await userEvent.click(screen.getByRole('tab', { name: /Favorites/i }));
    await userEvent.click(screen.getByRole('button', { name: 'Unpin' }));
    expect(onRemove).toHaveBeenCalledWith('doc-1');
  });
});
