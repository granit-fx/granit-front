import { createMockClient, createTestQueryClient } from '@granit/react-testing';
import { QueryClientProvider } from '@tanstack/react-query';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

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
  hasChildren: true,
};

const child: CategoryResponse = {
  id: 'cat-2',
  scope: 'documents',
  parentId: 'cat-1',
  path: '/legal/contracts',
  name: 'contracts',
  depth: 1,
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

describe('CategoryTree', () => {
  it('renders the root list and lazy-loads children on expand', async () => {
    const client = createMockClient();
    let callCount = 0;
    vi.mocked(client.get).mockImplementation(((
      _url: string,
      opts?: { params?: { parentId?: string } }
    ) => {
      callCount += 1;
      if (opts?.params?.parentId === 'cat-1') {
        return Promise.resolve({ data: [child] });
      }
      return Promise.resolve({ data: [root] });
    }) as AxiosInstance['get']);

    render(<CategoryTree scope="documents" />, { wrapper: createWrapper(client) });

    await waitFor(() => expect(screen.getByText('legal')).toBeInTheDocument());
    // Children not loaded yet
    expect(screen.queryByText('contracts')).toBeNull();
    expect(callCount).toBe(1);

    await userEvent.click(screen.getByRole('button', { expanded: false }));
    await waitFor(() => expect(screen.getByText('contracts')).toBeInTheDocument());
    expect(callCount).toBeGreaterThanOrEqual(2);
  });

  it('shows manage actions only when canManage is true', async () => {
    const client = createMockClient();
    vi.mocked(client.get).mockResolvedValue({ data: [root] });

    const { rerender } = render(<CategoryTree scope="documents" />, {
      wrapper: createWrapper(client),
    });

    await waitFor(() => expect(screen.getByText('legal')).toBeInTheDocument());
    expect(screen.queryByRole('button', { name: 'Rename' })).toBeNull();

    // Rerender with canManage=true under a fresh wrapper to avoid query cache
    const wrapped = createWrapper(client);
    rerender(
      <div>
        {wrapped({
          children: <CategoryTree scope="documents" canManage />,
        })}
      </div>
    );
    await waitFor(() => expect(screen.getAllByText('legal').length).toBeGreaterThan(0));
    expect(screen.getAllByRole('button', { name: 'Rename' }).length).toBeGreaterThan(0);
  });

  it('renders empty state when no roots exist', async () => {
    const client = createMockClient();
    vi.mocked(client.get).mockResolvedValue({ data: [] });

    render(<CategoryTree scope="documents" />, { wrapper: createWrapper(client) });

    await waitFor(() => expect(screen.getByText('No categories.')).toBeInTheDocument());
  });
});
