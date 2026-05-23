import { createMockClient, createTestQueryClient } from '@granit/react-testing';
import { QueryClientProvider } from '@tanstack/react-query';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { DocumentsList } from '../components/documents-list.tsx';
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

describe('DocumentsList', () => {
  it('renders the loading state while the QueryEngine page is in flight', () => {
    const client = createMockClient();
    vi.mocked(client.get).mockReturnValue(new Promise(() => {})); // never resolves

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
    const onOpenDocument = vi.fn();

    render(<DocumentsList folderId="fld-1" onOpenDocument={onOpenDocument} />, {
      wrapper: createWrapper(client),
    });

    await waitFor(() => expect(screen.getByText('contract.pdf')).toBeInTheDocument());
    expect(screen.getByText('invoice.pdf')).toBeInTheDocument();
    expect(screen.getByText('Page 1 of 1')).toBeInTheDocument();

    await userEvent.click(screen.getByText('contract.pdf'));
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
    // QueryEngine serializes filters/sort/pagination directly onto the URL.
    expect(url).toContain('/api/v1/documents/documents');
    expect(url).toContain('fld-42');
    expect(url).toContain('Active');
    expect(url).toContain('name');
  });
});
