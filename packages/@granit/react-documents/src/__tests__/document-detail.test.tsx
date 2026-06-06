import { createMockClient, createTestQueryClient } from '@granit/react-testing';
import { QueryClientProvider } from '@tanstack/react-query';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { DocumentDetail } from '../components/document-detail.tsx';
import { DocumentsProvider } from '../providers/documents-provider';

import type { AxiosInstance } from '@granit/api-client';
import type { DocumentResponse, ListDocumentTagsResponse } from '@granit/documents';
import type { ReactNode } from 'react';

const sampleDocument: DocumentResponse = {
  id: 'doc-1',
  folderId: 'fld-1',
  name: 'Contract.pdf',
  description: 'Master agreement',
  ownerId: 'user-1',
  currentVersionId: 'ver-1',
  sizeBytes: 1024,
  contentType: 'application/pdf',
  status: 'Active',
  createdAt: '2026-05-01T10:00:00Z',
  modifiedAt: null,
  trashedAt: null,
  permission: null,
};

const noTags: ListDocumentTagsResponse = { items: [] };

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

function mockGet(client: AxiosInstance, document: DocumentResponse | null): void {
  vi.mocked(client.get).mockImplementation(((url: string) => {
    if (url.endsWith('/tags')) return Promise.resolve({ data: noTags });
    if (url.includes('/versions')) {
      return Promise.resolve({ data: { versions: [], totalCount: 0, skip: 0, take: 1 } });
    }
    if (url.includes('/download')) {
      return Promise.resolve({ data: { url: 'https://blob/x', expiresAt: '2026-05-12' } });
    }
    return Promise.resolve({ data: document });
  }) as AxiosInstance['get']);
}

describe('DocumentDetail', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('renders the loading state initially', () => {
    const client = createMockClient();
    vi.mocked(client.get).mockReturnValue(new Promise(() => {}));

    render(<DocumentDetail documentId="doc-1" />, { wrapper: createWrapper(client) });

    expect(screen.getByText('Loading document…')).toBeInTheDocument();
  });

  it('renders the document name, description, owner and status', async () => {
    const client = createMockClient();
    mockGet(client, sampleDocument);

    render(<DocumentDetail documentId="doc-1" />, { wrapper: createWrapper(client) });

    await waitFor(() => expect(screen.getByText('Contract.pdf')).toBeInTheDocument());
    expect(screen.getByText('Master agreement')).toBeInTheDocument();
    expect(screen.getByText('user-1')).toBeInTheDocument();
    expect(screen.getByText('Active')).toBeInTheDocument();
  });

  it('renders the not-found state when the document query returns null', async () => {
    const client = createMockClient();
    mockGet(client, null);

    render(<DocumentDetail documentId="missing" />, { wrapper: createWrapper(client) });

    await waitFor(() => expect(screen.getByText('Document not found.')).toBeInTheDocument());
  });

  it('renders the no-description fallback and onOpenVersions / onOpenShares callbacks', async () => {
    const client = createMockClient();
    const noDesc: DocumentResponse = { ...sampleDocument, description: null };
    mockGet(client, noDesc);
    const onOpenVersions = vi.fn();
    const onOpenShares = vi.fn();

    render(
      <DocumentDetail
        documentId="doc-1"
        onOpenVersions={onOpenVersions}
        onOpenShares={onOpenShares}
      />,
      { wrapper: createWrapper(client) }
    );

    await waitFor(() => expect(screen.getByText('No description.')).toBeInTheDocument());
    await userEvent.click(screen.getByRole('button', { name: /Versions/ }));
    expect(onOpenVersions).toHaveBeenCalledWith('doc-1');
    await userEvent.click(screen.getByRole('button', { name: /Shares/ }));
    expect(onOpenShares).toHaveBeenCalledWith('doc-1');
  });

  it('triggers a download (refetches the URL and opens a new window)', async () => {
    const client = createMockClient();
    mockGet(client, sampleDocument);
    const openSpy = vi.spyOn(window, 'open').mockImplementation(() => null);

    render(<DocumentDetail documentId="doc-1" />, { wrapper: createWrapper(client) });

    await waitFor(() => expect(screen.getByText('Contract.pdf')).toBeInTheDocument());
    await userEvent.click(screen.getByRole('button', { name: 'Download current version' }));

    await waitFor(() => expect(openSpy).toHaveBeenCalled());
    expect(openSpy.mock.calls[0]?.[0]).toBe('https://blob/x');
  });

  it('cancels the inline rename when Escape is pressed', async () => {
    const client = createMockClient();
    mockGet(client, sampleDocument);

    render(<DocumentDetail documentId="doc-1" canManage />, { wrapper: createWrapper(client) });

    await waitFor(() => expect(screen.getByText('Contract.pdf')).toBeInTheDocument());
    await userEvent.click(screen.getByRole('button', { name: 'Rename' }));
    const input = await screen.findByDisplayValue('Contract.pdf');
    await userEvent.type(input, '{Escape}');

    expect(screen.queryByDisplayValue('Contract.pdf')).not.toBeInTheDocument();
    expect(client.patch).not.toHaveBeenCalled();
  });

  it('no-ops the rename when the trimmed name is unchanged', async () => {
    const client = createMockClient();
    mockGet(client, sampleDocument);

    render(<DocumentDetail documentId="doc-1" canManage />, { wrapper: createWrapper(client) });

    await waitFor(() => expect(screen.getByText('Contract.pdf')).toBeInTheDocument());
    await userEvent.click(screen.getByRole('button', { name: 'Rename' }));
    const input = await screen.findByDisplayValue('Contract.pdf');
    // blur with the same name → commits, but no-op
    input.blur();
    await waitFor(() => expect(screen.queryByDisplayValue('Contract.pdf')).not.toBeInTheDocument());
    expect(client.patch).not.toHaveBeenCalled();
  });

  it('triggers a rename mutation when the inline edit is committed', async () => {
    const client = createMockClient();
    mockGet(client, sampleDocument);
    vi.mocked(client.patch).mockResolvedValue({
      data: { ...sampleDocument, name: 'NewName.pdf' },
    });

    render(<DocumentDetail documentId="doc-1" canManage />, { wrapper: createWrapper(client) });

    await waitFor(() => expect(screen.getByText('Contract.pdf')).toBeInTheDocument());
    await userEvent.click(screen.getByRole('button', { name: 'Rename' }));
    const input = await screen.findByDisplayValue('Contract.pdf');
    await userEvent.clear(input);
    await userEvent.type(input, 'NewName.pdf{Enter}');

    await waitFor(() => expect(client.patch).toHaveBeenCalled());
    const [, body] = vi.mocked(client.patch).mock.calls[0] ?? [];
    expect(body).toEqual({ name: 'NewName.pdf', description: null });
  });
});
