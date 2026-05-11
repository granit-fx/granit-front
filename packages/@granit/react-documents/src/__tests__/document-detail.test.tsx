import { createMockClient, createTestQueryClient } from '@granit/react-testing';
import { QueryClientProvider } from '@tanstack/react-query';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { DocumentDetail } from '../components/document-detail.tsx';
import { DocumentsProvider } from '../providers/documents-provider.js';

import type { AxiosInstance } from '@granit/api-client';
import type { DocumentResponse, ListDocumentTagsResponse } from '@granit/documents';
import type { ReactNode } from 'react';

const sampleDocument: DocumentResponse = {
  id: 'doc-1',
  folderId: 'fld-1',
  name: 'Contract.pdf',
  description: 'Master agreement',
  ownerUserId: 'user-1',
  currentVersionId: 'ver-1',
  status: 'Active',
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
    expect(body).toEqual({ name: 'NewName.pdf' });
  });
});
