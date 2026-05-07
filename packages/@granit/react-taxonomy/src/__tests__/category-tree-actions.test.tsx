import { createMockClient, createTestQueryClient } from '@granit/react-testing';
import { QueryClientProvider } from '@tanstack/react-query';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { CategoryTree } from '../components/category-tree.tsx';
import { TaxonomyProvider } from '../providers/taxonomy-provider.js';

import type { AxiosInstance } from '@granit/api-client';
import type { CategoryResponse } from '@granit/taxonomy';
import type { ReactNode } from 'react';

const root: CategoryResponse = {
  id: 'cat-1',
  scope: 'documents',
  parentId: null,
  path: '/legal',
  name: 'legal',
  depth: 0,
  hasChildren: false,
};

function createWrapper(client: AxiosInstance) {
  return function Wrapper({ children }: { children: ReactNode }) {
    const qc = createTestQueryClient();
    return (
      <QueryClientProvider client={qc}>
        <TaxonomyProvider config={{ client }}>{children}</TaxonomyProvider>
      </QueryClientProvider>
    );
  };
}

describe('CategoryTree manage actions', () => {
  beforeEach(() => {
    vi.spyOn(window, 'prompt').mockImplementation(() => null);
    vi.spyOn(window, 'confirm').mockImplementation(() => true);
  });
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('POSTs a new root category when the Add root button is used', async () => {
    const client = createMockClient();
    vi.mocked(client.get).mockResolvedValue({ data: [] });
    vi.mocked(client.post).mockResolvedValue({ data: root });
    vi.mocked(window.prompt).mockReturnValueOnce('legal');

    render(<CategoryTree scope="documents" canManage />, { wrapper: createWrapper(client) });

    await waitFor(() => expect(screen.getByText('No categories.')).toBeInTheDocument());
    const addRoot = screen.getByRole('button', { name: '+' });
    await userEvent.click(addRoot);

    expect(client.post).toHaveBeenCalledWith(
      '/api/v1/taxonomy/categories',
      expect.objectContaining({ parentId: null, name: 'legal' })
    );
  });

  it('PATCHes a renamed category when the Rename button is used', async () => {
    const client = createMockClient();
    vi.mocked(client.get).mockResolvedValue({ data: [root] });
    vi.mocked(client.patch).mockResolvedValue({ data: root });
    vi.mocked(window.prompt).mockReturnValueOnce('legal-updated');

    render(<CategoryTree scope="documents" canManage />, { wrapper: createWrapper(client) });

    await waitFor(() => expect(screen.getByText('legal')).toBeInTheDocument());
    await userEvent.click(screen.getAllByRole('button', { name: 'Rename' })[0]!);

    expect(client.patch).toHaveBeenCalledWith(
      '/api/v1/taxonomy/categories/cat-1',
      expect.objectContaining({ name: 'legal-updated' })
    );
  });

  it('DELETEs when the Delete button is confirmed', async () => {
    const client = createMockClient();
    vi.mocked(client.get).mockResolvedValue({ data: [root] });
    vi.mocked(client.delete).mockResolvedValue({ data: undefined });

    render(<CategoryTree scope="documents" canManage />, { wrapper: createWrapper(client) });

    await waitFor(() => expect(screen.getByText('legal')).toBeInTheDocument());
    await userEvent.click(screen.getAllByRole('button', { name: 'Delete' })[0]!);

    expect(client.delete).toHaveBeenCalledWith('/api/v1/taxonomy/categories/cat-1');
  });

  it('skips the rename PATCH when the prompt is cancelled', async () => {
    const client = createMockClient();
    vi.mocked(client.get).mockResolvedValue({ data: [root] });
    vi.mocked(client.patch).mockResolvedValue({ data: root });
    vi.mocked(window.prompt).mockReturnValueOnce(null);

    render(<CategoryTree scope="documents" canManage />, { wrapper: createWrapper(client) });

    await waitFor(() => expect(screen.getByText('legal')).toBeInTheDocument());
    await userEvent.click(screen.getAllByRole('button', { name: 'Rename' })[0]!);

    expect(client.patch).not.toHaveBeenCalled();
  });

  it('POSTs move with newParentId=null when the prompt is empty', async () => {
    const client = createMockClient();
    vi.mocked(client.get).mockResolvedValue({ data: [{ ...root, parentId: 'cat-9' }] });
    vi.mocked(client.post).mockResolvedValue({ data: root });
    vi.mocked(window.prompt).mockReturnValueOnce('');

    render(<CategoryTree scope="documents" canManage />, { wrapper: createWrapper(client) });

    await waitFor(() => expect(screen.getByText('legal')).toBeInTheDocument());
    await userEvent.click(screen.getAllByRole('button', { name: 'Move' })[0]!);

    expect(client.post).toHaveBeenCalledWith('/api/v1/taxonomy/categories/cat-1/move', {
      newParentId: null,
    });
  });
});
