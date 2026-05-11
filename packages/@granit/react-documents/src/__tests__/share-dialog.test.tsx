import { createMockClient, createTestQueryClient } from '@granit/react-testing';
import { QueryClientProvider } from '@tanstack/react-query';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { ShareDialog } from '../components/share-dialog.tsx';
import { DocumentsProvider } from '../providers/documents-provider.js';

import type { AxiosInstance } from '@granit/api-client';
import type { ListSharesResponse, ShareResponse } from '@granit/documents';
import type { ReactNode } from 'react';

const folderShare: ShareResponse = {
  id: 'share-1',
  targetType: 'Folder',
  folderId: 'fld-1',
  documentId: null,
  granteeType: 'User',
  granteeId: 'alice',
  permission: 'Read',
  isDefault: true,
  expiresAt: null,
  createdAt: '2026-05-01T08:00:00Z',
  createdByUserId: 'admin',
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

describe('ShareDialog', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('renders the loading state', () => {
    const client = createMockClient();
    vi.mocked(client.get).mockReturnValue(new Promise(() => {}));

    render(<ShareDialog target={{ type: 'Folder', id: 'fld-1' }} />, {
      wrapper: createWrapper(client),
    });

    expect(screen.getByText('Loading shares…')).toBeInTheDocument();
  });

  it('renders existing folder shares', async () => {
    const client = createMockClient();
    const response: ListSharesResponse = { items: [folderShare] };
    vi.mocked(client.get).mockResolvedValue({ data: response });

    render(<ShareDialog target={{ type: 'Folder', id: 'fld-1' }} canManage />, {
      wrapper: createWrapper(client),
    });

    await waitFor(() => expect(screen.getByText('alice')).toBeInTheDocument());
    expect(screen.getByText('User')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Revoke' })).toBeInTheDocument();
  });

  it('revokes a share when the user clicks Revoke', async () => {
    const client = createMockClient();
    const response: ListSharesResponse = { items: [folderShare] };
    vi.mocked(client.get).mockResolvedValue({ data: response });
    vi.mocked(client.delete).mockResolvedValue({ data: null });

    render(<ShareDialog target={{ type: 'Folder', id: 'fld-1' }} canManage />, {
      wrapper: createWrapper(client),
    });

    await waitFor(() => expect(screen.getByText('alice')).toBeInTheDocument());
    await userEvent.click(screen.getByRole('button', { name: 'Revoke' }));

    await waitFor(() => expect(client.delete).toHaveBeenCalled());
  });

  it('renders the empty state when there are no shares', async () => {
    const client = createMockClient();
    vi.mocked(client.get).mockResolvedValue({ data: { items: [] } });

    render(<ShareDialog target={{ type: 'Document', id: 'doc-1' }} />, {
      wrapper: createWrapper(client),
    });

    await waitFor(() => expect(screen.getByText('No shares yet.')).toBeInTheDocument());
  });
});
