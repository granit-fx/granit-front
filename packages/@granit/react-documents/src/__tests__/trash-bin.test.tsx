import { createMockClient, createTestQueryClient } from '@granit/react-testing';
import { toISODateString } from '@granit/types';
import { QueryClientProvider } from '@tanstack/react-query';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { TrashBin } from '../components/trash-bin.tsx';
import { DocumentsProvider } from '../providers/documents-provider';

import type { AxiosInstance } from '@granit/api-client';
import type { ListTrashedDocumentsResponse, TrashedDocumentResponse } from '@granit/documents';
import type { ReactNode } from 'react';

const trashed: TrashedDocumentResponse = {
  id: 'doc-1',
  folderId: 'fld-1',
  name: 'Old.pdf',
  ownerId: 'user-1',
  trashedAt: toISODateString('2026-05-01T08:00:00Z'),
  daysUntilPermanentDeletion: 5,
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

describe('TrashBin', () => {
  beforeEach(() => {
    vi.spyOn(window, 'confirm').mockReturnValue(true);
  });
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('renders the loading state', () => {
    const client = createMockClient();
    vi.mocked(client.get).mockReturnValue(new Promise(() => {}));

    render(<TrashBin />, { wrapper: createWrapper(client) });

    expect(screen.getByText('Loading trash…')).toBeInTheDocument();
  });

  it('renders the empty state', async () => {
    const client = createMockClient();
    const response: ListTrashedDocumentsResponse = {
      documents: [],
      totalCount: 0,
      skip: 0,
      take: 20,
    };
    vi.mocked(client.get).mockResolvedValue({ data: response });

    render(<TrashBin />, { wrapper: createWrapper(client) });

    await waitFor(() => expect(screen.getByText('Trash is empty.')).toBeInTheDocument());
  });

  it('lists trashed documents with the countdown', async () => {
    const client = createMockClient();
    const response: ListTrashedDocumentsResponse = {
      documents: [trashed],
      totalCount: 1,
      skip: 0,
      take: 20,
    };
    vi.mocked(client.get).mockResolvedValue({ data: response });

    render(<TrashBin canManage />, { wrapper: createWrapper(client) });

    await waitFor(() => expect(screen.getByText('Old.pdf')).toBeInTheDocument());
    expect(screen.getByText(/5\s+days left/)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Restore' })).toBeInTheDocument();
  });

  it('calls the restore mutation when the user clicks Restore', async () => {
    const client = createMockClient();
    const response: ListTrashedDocumentsResponse = {
      documents: [trashed],
      totalCount: 1,
      skip: 0,
      take: 20,
    };
    vi.mocked(client.get).mockResolvedValue({ data: response });
    vi.mocked(client.post).mockResolvedValue({ data: { ...trashed, status: 'Active' } });

    render(<TrashBin canManage />, { wrapper: createWrapper(client) });

    await waitFor(() => expect(screen.getByText('Old.pdf')).toBeInTheDocument());
    await userEvent.click(screen.getByRole('button', { name: 'Restore' }));

    await waitFor(() => expect(client.post).toHaveBeenCalled());
    const url = vi.mocked(client.post).mock.calls[0]?.[0];
    expect(url).toContain('/restore');
  });

  it('does not render manage action column when canManage is false', async () => {
    const client = createMockClient();
    const response: ListTrashedDocumentsResponse = {
      documents: [trashed],
      totalCount: 1,
      skip: 0,
      take: 20,
    };
    vi.mocked(client.get).mockResolvedValue({ data: response });

    render(<TrashBin />, { wrapper: createWrapper(client) });

    await waitFor(() => expect(screen.getByText('Old.pdf')).toBeInTheDocument());
    expect(screen.queryByRole('button', { name: 'Restore' })).toBeNull();
  });

  it('runs the permanent-delete flow when both confirms return true', async () => {
    const client = createMockClient();
    const response: ListTrashedDocumentsResponse = {
      documents: [trashed],
      totalCount: 1,
      skip: 0,
      take: 20,
    };
    vi.mocked(client.get).mockResolvedValue({ data: response });
    vi.mocked(client.delete).mockResolvedValue({ data: undefined });

    render(<TrashBin canManage />, { wrapper: createWrapper(client) });
    await waitFor(() => expect(screen.getByText('Old.pdf')).toBeInTheDocument());

    await userEvent.click(screen.getByRole('button', { name: 'Permanently delete' }));
    await waitFor(() => expect(client.delete).toHaveBeenCalled());
  });

  it('aborts permanent-delete when the first confirm is cancelled', async () => {
    vi.mocked(window.confirm).mockReturnValue(false);
    const client = createMockClient();
    const response: ListTrashedDocumentsResponse = {
      documents: [trashed],
      totalCount: 1,
      skip: 0,
      take: 20,
    };
    vi.mocked(client.get).mockResolvedValue({ data: response });

    render(<TrashBin canManage />, { wrapper: createWrapper(client) });
    await waitFor(() => expect(screen.getByText('Old.pdf')).toBeInTheDocument());

    await userEvent.click(screen.getByRole('button', { name: 'Permanently delete' }));
    expect(client.delete).not.toHaveBeenCalled();
  });

  it('aborts permanent-delete when only the second confirm is cancelled', async () => {
    const confirmSpy = vi.spyOn(window, 'confirm');
    confirmSpy.mockReturnValueOnce(true).mockReturnValueOnce(false);
    const client = createMockClient();
    const response: ListTrashedDocumentsResponse = {
      documents: [trashed],
      totalCount: 1,
      skip: 0,
      take: 20,
    };
    vi.mocked(client.get).mockResolvedValue({ data: response });

    render(<TrashBin canManage />, { wrapper: createWrapper(client) });
    await waitFor(() => expect(screen.getByText('Old.pdf')).toBeInTheDocument());

    await userEvent.click(screen.getByRole('button', { name: 'Permanently delete' }));
    expect(client.delete).not.toHaveBeenCalled();
  });

  it('paginates next/previous when totalCount exceeds the page size', async () => {
    const client = createMockClient();
    const response: ListTrashedDocumentsResponse = {
      documents: [trashed],
      totalCount: 5,
      skip: 0,
      take: 1,
    };
    vi.mocked(client.get).mockResolvedValue({ data: response });

    render(<TrashBin pageSize={1} />, { wrapper: createWrapper(client) });
    await waitFor(() => expect(screen.getByText('Old.pdf')).toBeInTheDocument());

    const next = screen.getByRole('button', { name: 'Next' });
    expect(next).not.toBeDisabled();
    await userEvent.click(next);

    const prev = screen.getByRole('button', { name: 'Previous' });
    expect(prev).not.toBeDisabled();
    await userEvent.click(prev);
  });
});
