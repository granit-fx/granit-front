import { createMockClient, createTestQueryClient } from '@granit/react-testing';
import { toISODateString } from '@granit/types';
import { QueryClientProvider } from '@tanstack/react-query';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { CategorySelector } from '../components/category-selector.tsx';
import { TaxonomyProvider } from '../providers/taxonomy-provider';

import type { AxiosInstance } from '@granit/api-client';
import type { CategoryDetailResponse } from '@granit/taxonomy';
import type { ReactNode } from 'react';

const detail: CategoryDetailResponse = {
  id: 'cat-2',
  tenantId: null,
  scope: 'documents',
  parentId: 'cat-1',
  path: '/legal/contracts',
  name: 'contracts',
  depth: 1,
  iconName: null,
  hideOnEntityCard: false,
  hasChildren: false,
  createdAt: toISODateString('2026-05-01T08:00:00Z'),
  modifiedAt: null,
  concurrencyStamp: 'stamp-1',
  breadcrumb: [
    {
      id: 'cat-1',
      tenantId: null,
      scope: 'documents',
      parentId: null,
      path: '/legal',
      name: 'legal',
      depth: 0,
      iconName: null,
      hideOnEntityCard: false,
      hasChildren: true,
      createdAt: toISODateString('2026-05-01T08:00:00Z'),
      modifiedAt: null,
      concurrencyStamp: 'stamp-1',
    },
    {
      id: 'cat-2',
      tenantId: null,
      scope: 'documents',
      parentId: 'cat-1',
      path: '/legal/contracts',
      name: 'contracts',
      depth: 1,
      iconName: null,
      hideOnEntityCard: false,
      hasChildren: false,
      createdAt: toISODateString('2026-05-01T08:00:00Z'),
      modifiedAt: null,
      concurrencyStamp: 'stamp-1',
    },
  ],
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

describe('CategorySelector', () => {
  it('renders the "No category" state when value is null', () => {
    const client = createMockClient();

    render(
      <CategorySelector
        scope="documents"
        targetType="Granit.Documents.Domain.Document"
        targetId="doc-1"
        value={null}
      />,
      { wrapper: createWrapper(client) }
    );

    expect(screen.getByText('No category')).toBeInTheDocument();
  });

  it('renders the breadcrumb when a category is assigned', async () => {
    const client = createMockClient();
    vi.mocked(client.get).mockResolvedValue({ data: detail });

    render(
      <CategorySelector
        scope="documents"
        targetType="Granit.Documents.Domain.Document"
        targetId="doc-1"
        value="cat-2"
      />,
      { wrapper: createWrapper(client) }
    );

    await waitFor(() => expect(screen.getByText('contracts')).toBeInTheDocument());
    expect(client.get).toHaveBeenCalledWith('/api/v1/taxonomy/categories/cat-2');
  });

  it('opens the dialog when Choose is clicked under canManage', async () => {
    const client = createMockClient();
    vi.mocked(client.get).mockResolvedValue({ data: [] });

    render(
      <CategorySelector
        scope="documents"
        targetType="Granit.Documents.Domain.Document"
        targetId="doc-1"
        value={null}
        canManage
      />,
      { wrapper: createWrapper(client) }
    );

    await userEvent.click(screen.getByRole('button', { name: 'Choose…' }));
    expect(screen.getByRole('dialog')).toBeInTheDocument();
  });

  it('hides Choose / Clear when canManage is false', () => {
    const client = createMockClient();

    render(
      <CategorySelector
        scope="documents"
        targetType="Granit.Documents.Domain.Document"
        targetId="doc-1"
        value="cat-2"
      />,
      { wrapper: createWrapper(client) }
    );

    expect(screen.queryByRole('button', { name: 'Choose…' })).toBeNull();
    expect(screen.queryByRole('button', { name: 'Clear' })).toBeNull();
  });

  it('calls onUnassign after a successful Clear', async () => {
    const client = createMockClient();
    vi.mocked(client.get).mockResolvedValue({ data: detail });
    vi.mocked(client.delete).mockResolvedValue({ data: undefined });
    const onUnassign = vi.fn();

    render(
      <CategorySelector
        scope="documents"
        targetType="Granit.Documents.Domain.Document"
        targetId="doc-1"
        value="cat-2"
        canManage
        onUnassign={onUnassign}
      />,
      { wrapper: createWrapper(client) }
    );

    await waitFor(() => expect(screen.getByRole('button', { name: 'Clear' })).toBeInTheDocument());
    await userEvent.click(screen.getByRole('button', { name: 'Clear' }));

    await waitFor(() => expect(onUnassign).toHaveBeenCalledTimes(1));
  });
});
