import { createMockClient, createTestQueryClient } from '@granit/react-testing';
import { QueryClientProvider } from '@tanstack/react-query';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest';

import { TransferOwnershipDialog } from '../components/transfer-ownership-dialog.tsx';
import { DocumentsProvider } from '../providers/documents-provider.js';

import type { AxiosInstance } from '@granit/api-client';
import type { DocumentResponse, FolderResponse } from '@granit/documents';
import type { ReactNode } from 'react';

// jsdom's <dialog> ships without showModal/close until very recent versions —
// patch them once so the dialog component can drive open/close cleanly.
beforeAll(() => {
  const proto = HTMLDialogElement.prototype as unknown as {
    showModal: () => void;
    close: () => void;
    open: boolean;
  };
  if (typeof proto.showModal !== 'function') {
    proto.showModal = function showModal(this: HTMLDialogElement) {
      this.setAttribute('open', '');
    };
  }
  if (typeof proto.close !== 'function') {
    proto.close = function close(this: HTMLDialogElement) {
      this.removeAttribute('open');
    };
  }
});

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

const SAMPLE_DOCUMENT: DocumentResponse = {
  id: 'doc-1',
  folderId: 'fld-1',
  name: 'NDA.pdf',
  description: null,
  ownerId: '00000000-0000-4000-8000-000000000001',
  currentVersionId: 'ver-1',
  status: 'Active',
  trashedAt: null,
  permission: 'Manage',
};

const SAMPLE_FOLDER: FolderResponse = {
  id: 'fld-9',
  parentFolderId: null,
  name: 'Contracts',
  path: '/Contracts',
  depth: 1,
  ownerId: '00000000-0000-4000-8000-000000000001',
  status: 'Active',
  trashedAt: null,
  permission: 'Manage',
};

const NEW_OWNER_ID = '00000000-0000-4000-8000-0000000000a9';

describe('TransferOwnershipDialog', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('does not call the API until a valid Guid is entered', async () => {
    const client = createMockClient();
    const onClose = vi.fn();

    render(
      <TransferOwnershipDialog
        open
        onClose={onClose}
        target={{ type: 'Document', id: SAMPLE_DOCUMENT.id }}
        currentOwnerId={SAMPLE_DOCUMENT.ownerId}
      />,
      { wrapper: createWrapper(client) }
    );

    const input = await screen.findByLabelText('New owner (user id)');
    await userEvent.type(input, 'not-a-guid');
    await userEvent.click(screen.getByRole('button', { name: 'Transfer' }));

    expect(await screen.findByText('Enter a valid Guid.')).toBeInTheDocument();
    expect(client.put).not.toHaveBeenCalled();
    expect(onClose).not.toHaveBeenCalled();
  });

  it('PUTs /documents/{id}/owner and closes on success', async () => {
    const client = createMockClient();
    vi.mocked(client.put).mockResolvedValue({
      data: { ...SAMPLE_DOCUMENT, ownerId: NEW_OWNER_ID },
    });
    const onClose = vi.fn();
    const onSuccess = vi.fn();

    render(
      <TransferOwnershipDialog
        open
        onClose={onClose}
        onSuccess={onSuccess}
        target={{ type: 'Document', id: SAMPLE_DOCUMENT.id }}
        currentOwnerId={SAMPLE_DOCUMENT.ownerId}
      />,
      { wrapper: createWrapper(client) }
    );

    const input = await screen.findByLabelText('New owner (user id)');
    await userEvent.type(input, NEW_OWNER_ID);
    await userEvent.click(screen.getByRole('button', { name: 'Transfer' }));

    await waitFor(() => expect(client.put).toHaveBeenCalled());
    expect(client.put).toHaveBeenCalledWith('/api/v1/documents/documents/doc-1/owner', {
      newOwnerId: NEW_OWNER_ID,
    });
    await waitFor(() => expect(onSuccess).toHaveBeenCalledWith(NEW_OWNER_ID));
    expect(onClose).toHaveBeenCalled();
  });

  it('PUTs /folders/{id}/owner when target type is Folder', async () => {
    const client = createMockClient();
    vi.mocked(client.put).mockResolvedValue({
      data: { ...SAMPLE_FOLDER, ownerId: NEW_OWNER_ID },
    });

    render(
      <TransferOwnershipDialog
        open
        onClose={() => {}}
        target={{ type: 'Folder', id: SAMPLE_FOLDER.id }}
      />,
      { wrapper: createWrapper(client) }
    );

    const input = await screen.findByLabelText('New owner (user id)');
    await userEvent.type(input, NEW_OWNER_ID);
    await userEvent.click(screen.getByRole('button', { name: 'Transfer' }));

    await waitFor(() =>
      expect(client.put).toHaveBeenCalledWith('/api/v1/documents/folders/fld-9/owner', {
        newOwnerId: NEW_OWNER_ID,
      })
    );
  });

  it('rejects the nil Guid client-side', async () => {
    const client = createMockClient();

    render(
      <TransferOwnershipDialog
        open
        onClose={() => {}}
        target={{ type: 'Document', id: SAMPLE_DOCUMENT.id }}
      />,
      { wrapper: createWrapper(client) }
    );

    const input = await screen.findByLabelText('New owner (user id)');
    await userEvent.type(input, '00000000-0000-0000-0000-000000000000');
    await userEvent.click(screen.getByRole('button', { name: 'Transfer' }));

    expect(await screen.findByText('Enter a valid Guid.')).toBeInTheDocument();
    expect(client.put).not.toHaveBeenCalled();
  });

  it('surfaces server-side errors verbatim (e.g. 422 tenant root)', async () => {
    const client = createMockClient();
    vi.mocked(client.put).mockRejectedValue(new Error('Cannot transfer the tenant root folder.'));

    render(
      <TransferOwnershipDialog open onClose={() => {}} target={{ type: 'Folder', id: 'root' }} />,
      { wrapper: createWrapper(client) }
    );

    const input = await screen.findByLabelText('New owner (user id)');
    await userEvent.type(input, NEW_OWNER_ID);
    await userEvent.click(screen.getByRole('button', { name: 'Transfer' }));

    expect(await screen.findByText('Cannot transfer the tenant root folder.')).toBeInTheDocument();
  });

  it('cancels without calling the API', async () => {
    const client = createMockClient();
    const onClose = vi.fn();

    render(
      <TransferOwnershipDialog
        open
        onClose={onClose}
        target={{ type: 'Document', id: SAMPLE_DOCUMENT.id }}
      />,
      { wrapper: createWrapper(client) }
    );

    await userEvent.click(screen.getByRole('button', { name: 'Cancel' }));

    expect(client.put).not.toHaveBeenCalled();
    expect(onClose).toHaveBeenCalled();
  });
});
