import { createMockClient, createTestQueryClient } from '@granit/react-testing';
import { QueryClientProvider } from '@tanstack/react-query';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { ShareDialog } from '../components/share-dialog.tsx';
import { DocumentsProvider } from '../providers/documents-provider';

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
  createdBy: 'admin',
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

  it('grants a folder share through the draft form and clears the draft on success', async () => {
    const client = createMockClient();
    vi.mocked(client.get).mockResolvedValue({ data: { items: [] } });
    vi.mocked(client.post).mockResolvedValue({ data: { ...folderShare, id: 'share-new' } });

    render(<ShareDialog target={{ type: 'Folder', id: 'fld-1' }} canManage />, {
      wrapper: createWrapper(client),
    });

    await waitFor(() => expect(screen.getByText('No shares yet.')).toBeInTheDocument());
    await userEvent.click(screen.getByRole('button', { name: 'Add share' }));
    const granteeInput = screen.getByLabelText('Grantee');
    await userEvent.type(granteeInput, 'bob');
    // Exercise the type, permission, expiresAt, isDefault setters.
    await userEvent.selectOptions(screen.getByLabelText('Type'), 'Group');
    await userEvent.selectOptions(screen.getByLabelText('Permission'), 'Edit');
    const expiresInput = screen.getByLabelText('Expires');
    await userEvent.type(expiresInput, '2026-12-31T23:59');
    const checkbox = screen.getByRole('checkbox');
    await userEvent.click(checkbox); // toggle isDefault off

    await userEvent.click(screen.getByRole('button', { name: 'Grant' }));

    await waitFor(() => expect(client.post).toHaveBeenCalled());
    const [url, body] = vi.mocked(client.post).mock.calls[0] ?? [];
    expect(url).toContain('/folders/fld-1/shares');
    expect(body).toMatchObject({
      granteeType: 'Group',
      granteeId: 'bob',
      permission: 'Edit',
      isDefault: false,
    });
  });

  it('does not submit when the granteeId is empty (whitespace only)', async () => {
    const client = createMockClient();
    vi.mocked(client.get).mockResolvedValue({ data: { items: [] } });

    render(<ShareDialog target={{ type: 'Folder', id: 'fld-1' }} canManage />, {
      wrapper: createWrapper(client),
    });

    await waitFor(() => expect(screen.getByText('No shares yet.')).toBeInTheDocument());
    await userEvent.click(screen.getByRole('button', { name: 'Add share' }));
    await userEvent.type(screen.getByLabelText('Grantee'), '   ');
    await userEvent.click(screen.getByRole('button', { name: 'Grant' }));

    // Draft is still open, post was never called.
    expect(client.post).not.toHaveBeenCalled();
    expect(screen.getByRole('button', { name: 'Grant' })).toBeInTheDocument();
  });

  it('cancels the draft when Cancel is clicked', async () => {
    const client = createMockClient();
    vi.mocked(client.get).mockResolvedValue({ data: { items: [] } });

    render(<ShareDialog target={{ type: 'Folder', id: 'fld-1' }} canManage />, {
      wrapper: createWrapper(client),
    });

    await waitFor(() => expect(screen.getByText('No shares yet.')).toBeInTheDocument());
    await userEvent.click(screen.getByRole('button', { name: 'Add share' }));
    expect(screen.getByRole('button', { name: 'Grant' })).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Cancel' }));
    expect(screen.queryByRole('button', { name: 'Grant' })).not.toBeInTheDocument();
  });

  it('grants a document share (no isDefault checkbox) and omits the isDefault field', async () => {
    const client = createMockClient();
    vi.mocked(client.get).mockResolvedValue({ data: { items: [] } });
    vi.mocked(client.post).mockResolvedValue({
      data: { ...folderShare, id: 'share-doc', targetType: 'Document', documentId: 'doc-1' },
    });

    render(<ShareDialog target={{ type: 'Document', id: 'doc-1' }} canManage />, {
      wrapper: createWrapper(client),
    });

    await waitFor(() => expect(screen.getByText('No shares yet.')).toBeInTheDocument());
    await userEvent.click(screen.getByRole('button', { name: 'Add share' }));
    // No checkbox shown for documents.
    expect(screen.queryByRole('checkbox')).not.toBeInTheDocument();
    await userEvent.type(screen.getByLabelText('Grantee'), 'carol');
    await userEvent.click(screen.getByRole('button', { name: 'Grant' }));

    await waitFor(() => expect(client.post).toHaveBeenCalled());
    const [url, body] = vi.mocked(client.post).mock.calls[0] ?? [];
    expect(url).toContain('/documents/doc-1/shares');
    expect(body).toMatchObject({ granteeType: 'User', granteeId: 'carol', permission: 'Read' });
    expect((body as { isDefault?: unknown }).isDefault).toBeUndefined();
  });
});
