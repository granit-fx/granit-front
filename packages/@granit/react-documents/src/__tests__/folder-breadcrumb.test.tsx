import { createMockClient, createTestQueryClient } from '@granit/react-testing';
import { QueryClientProvider } from '@tanstack/react-query';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { FolderBreadcrumb } from '../components/folder-breadcrumb.tsx';
import { DocumentsProvider } from '../providers/documents-provider';

import type { AxiosInstance } from '@granit/api-client';
import type { FolderBreadcrumbResponse, FolderResponse } from '@granit/documents';
import type { ReactNode } from 'react';

const a: FolderResponse = {
  id: 'fld-a',
  parentFolderId: null,
  name: 'Contracts',
  path: '/Contracts',
  depth: 1,
  ownerId: 'user-1',
  status: 'Active',
  trashedAt: null,
  permission: null,
};

const b: FolderResponse = {
  ...a,
  id: 'fld-b',
  parentFolderId: 'fld-a',
  name: '2026',
  path: '/Contracts/2026',
  depth: 2,
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

describe('FolderBreadcrumb', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('renders the loading label while pending', () => {
    const client = createMockClient();
    vi.mocked(client.get).mockReturnValue(new Promise(() => {}));

    render(<FolderBreadcrumb folderId="fld-b" />, { wrapper: createWrapper(client) });

    expect(screen.getByText('Loading…')).toBeInTheDocument();
  });

  it('renders the chain root → leaf', async () => {
    const client = createMockClient();
    const response: FolderBreadcrumbResponse = { folders: [a, b] };
    vi.mocked(client.get).mockResolvedValue({ data: response });

    render(<FolderBreadcrumb folderId="fld-b" />, { wrapper: createWrapper(client) });

    await waitFor(() => expect(screen.getByText('Contracts')).toBeInTheDocument());
    expect(screen.getByText('2026')).toBeInTheDocument();
  });

  it('calls onSelect for non-leaf segments only', async () => {
    const client = createMockClient();
    const response: FolderBreadcrumbResponse = { folders: [a, b] };
    vi.mocked(client.get).mockResolvedValue({ data: response });
    const onSelect = vi.fn();

    render(<FolderBreadcrumb folderId="fld-b" onSelect={onSelect} />, {
      wrapper: createWrapper(client),
    });

    await waitFor(() => expect(screen.getByText('Contracts')).toBeInTheDocument());

    await userEvent.click(screen.getByRole('button', { name: 'Contracts' }));
    expect(onSelect).toHaveBeenCalledWith(a);

    // Leaf is not a button
    expect(screen.queryByRole('button', { name: '2026' })).toBeNull();
  });
});
