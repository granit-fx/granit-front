import { createMockClient, createTestQueryClient } from '@granit/react-testing';
import { QueryClientProvider } from '@tanstack/react-query';
import { render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { DocumentsExplorer } from '../components/documents-explorer.tsx';
import { DocumentsProvider } from '../providers/documents-provider.js';

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

describe('DocumentsExplorer', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('renders the title and the empty documents list', async () => {
    const client = createMockClient();
    vi.mocked(client.get).mockResolvedValue({
      data: { items: [], totalCount: 0, page: 1, pageSize: 50, folders: [] },
    });

    render(<DocumentsExplorer />, { wrapper: createWrapper(client) });

    expect(screen.getByText('Documents')).toBeInTheDocument();
    await waitFor(() => expect(screen.getByText('This folder is empty.')).toBeInTheDocument());
  });

  it('hides the upload button when canManage is false', async () => {
    const client = createMockClient();
    vi.mocked(client.get).mockResolvedValue({ data: { folders: [] } });

    render(<DocumentsExplorer />, { wrapper: createWrapper(client) });

    await waitFor(() => expect(screen.getByText('Documents')).toBeInTheDocument());
    expect(screen.queryByText('Upload')).toBeNull();
  });

  it('shows the upload button when canManage is true', async () => {
    const client = createMockClient();
    vi.mocked(client.get).mockResolvedValue({ data: { folders: [] } });

    render(<DocumentsExplorer canManage />, { wrapper: createWrapper(client) });

    await waitFor(() => expect(screen.getByText('Upload')).toBeInTheDocument());
  });
});
