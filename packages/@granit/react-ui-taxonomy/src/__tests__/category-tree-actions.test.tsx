import { TaxonomyProvider } from '@granit/react-taxonomy';
import { createMockClient, createTestQueryClient } from '@granit/react-testing';
import { toISODateString } from '@granit/types';
import { QueryClientProvider } from '@tanstack/react-query';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { I18nextProvider } from 'react-i18next';
import { describe, expect, it, vi } from 'vitest';

import { CategoryTree } from '../components/category-tree.tsx';

import { testI18n } from './test-utils';

import type { AxiosInstance } from '@granit/api-client';
import type { CategoryResponse } from '@granit/taxonomy';
import type { ReactNode } from 'react';

const root: CategoryResponse = {
  id: 'cat-1',
  tenantId: null,
  scope: 'documents',
  parentId: null,
  path: '/legal',
  name: 'legal',
  depth: 0,
  iconName: null,
  hideOnEntityCard: false,
  hasChildren: false,
  createdAt: toISODateString('2026-05-01T08:00:00Z'),
  modifiedAt: null,
  concurrencyStamp: 'stamp-1',
};

function createWrapper(client: AxiosInstance) {
  return function Wrapper({ children }: { children: ReactNode }) {
    const qc = createTestQueryClient();
    return (
      <I18nextProvider i18n={testI18n}>
        <QueryClientProvider client={qc}>
          <TaxonomyProvider config={{ client }}>{children}</TaxonomyProvider>
        </QueryClientProvider>
      </I18nextProvider>
    );
  };
}

/**
 * Resolve the visible dialog. FormDialog renders role `dialog`;
 * ConfirmActionDialog (AlertDialog) renders role `alertdialog`.
 */
function getDialog() {
  return screen.queryByRole('dialog') ?? screen.getByRole('alertdialog');
}

describe('CategoryTree manage actions', () => {
  it('POSTs a new root category from the Add-category dialog', async () => {
    const client = createMockClient();
    vi.mocked(client.get).mockResolvedValue({ data: [] });
    vi.mocked(client.post).mockResolvedValue({ data: root });

    render(<CategoryTree scope="documents" canManage />, { wrapper: createWrapper(client) });

    await waitFor(() => expect(screen.getByText('No categories.')).toBeInTheDocument());
    // No labels passed → the root add button uses the default `add` label ('+').
    await userEvent.click(screen.getByRole('button', { name: '+' }));

    const dialog = getDialog();
    await userEvent.type(within(dialog).getByLabelText('Name'), 'legal');
    await userEvent.click(within(dialog).getByRole('button', { name: 'Save' }));

    await waitFor(() =>
      expect(client.post).toHaveBeenCalledWith(
        '/api/v1/taxonomy/categories',
        expect.objectContaining({ parentId: null, name: 'legal' })
      )
    );
  });

  it('PATCHes a renamed category from the Rename dialog', async () => {
    const client = createMockClient();
    vi.mocked(client.get).mockResolvedValue({ data: [root] });
    vi.mocked(client.patch).mockResolvedValue({ data: root });

    render(<CategoryTree scope="documents" canManage />, { wrapper: createWrapper(client) });

    await waitFor(() => expect(screen.getByText('legal')).toBeInTheDocument());
    await userEvent.click(screen.getAllByRole('button', { name: 'Rename' })[0]!);

    const dialog = getDialog();
    const input = within(dialog).getByLabelText('Name');
    await userEvent.clear(input);
    await userEvent.type(input, 'legal-updated');
    await userEvent.click(within(dialog).getByRole('button', { name: 'Save' }));

    await waitFor(() =>
      expect(client.patch).toHaveBeenCalledWith(
        '/api/v1/taxonomy/categories/cat-1',
        expect.objectContaining({ name: 'legal-updated' })
      )
    );
  });

  it('DELETEs when the delete confirmation dialog is confirmed', async () => {
    const client = createMockClient();
    vi.mocked(client.get).mockResolvedValue({ data: [root] });
    vi.mocked(client.delete).mockResolvedValue({ data: undefined });

    render(<CategoryTree scope="documents" canManage />, { wrapper: createWrapper(client) });

    await waitFor(() => expect(screen.getByText('legal')).toBeInTheDocument());
    await userEvent.click(screen.getAllByRole('button', { name: 'Delete' })[0]!);

    const dialog = getDialog();
    // The confirm dialog's primary action; cancel is also labelled, so scope to
    // the destructive confirm button rendered by ConfirmActionDialog.
    await userEvent.click(within(dialog).getAllByRole('button', { name: 'Delete' })[0]!);

    await waitFor(() =>
      expect(client.delete).toHaveBeenCalledWith('/api/v1/taxonomy/categories/cat-1')
    );
  });

  it('does NOT PATCH when the Rename dialog is cancelled', async () => {
    const client = createMockClient();
    vi.mocked(client.get).mockResolvedValue({ data: [root] });
    vi.mocked(client.patch).mockResolvedValue({ data: root });

    render(<CategoryTree scope="documents" canManage />, { wrapper: createWrapper(client) });

    await waitFor(() => expect(screen.getByText('legal')).toBeInTheDocument());
    await userEvent.click(screen.getAllByRole('button', { name: 'Rename' })[0]!);

    const dialog = getDialog();
    await userEvent.click(within(dialog).getByRole('button', { name: 'Cancel' }));

    expect(client.patch).not.toHaveBeenCalled();
  });

  it('POSTs move with newParentId=null when the new-parent field is left empty', async () => {
    const client = createMockClient();
    vi.mocked(client.get).mockResolvedValue({ data: [{ ...root, parentId: 'cat-9' }] });
    vi.mocked(client.post).mockResolvedValue({ data: root });

    render(<CategoryTree scope="documents" canManage />, { wrapper: createWrapper(client) });

    await waitFor(() => expect(screen.getByText('legal')).toBeInTheDocument());
    await userEvent.click(screen.getAllByRole('button', { name: 'Move' })[0]!);

    const dialog = getDialog();
    await userEvent.click(within(dialog).getByRole('button', { name: 'Save' }));

    await waitFor(() =>
      expect(client.post).toHaveBeenCalledWith('/api/v1/taxonomy/categories/cat-1/move', {
        newParentId: null,
      })
    );
  });
});
