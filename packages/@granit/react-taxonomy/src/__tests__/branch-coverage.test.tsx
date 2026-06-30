import { createMockClient, createTestQueryClient } from '@granit/react-testing';
import { toISODateString } from '@granit/types';
import { QueryClientProvider } from '@tanstack/react-query';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { CategorySelector } from '../components/category-selector.tsx';
import { TagAutocomplete } from '../components/tag-autocomplete.tsx';
import { TagChipStrip } from '../components/tag-chip-strip.tsx';
import { TaxonomyProvider } from '../providers/taxonomy-provider';

import type { AxiosInstance } from '@granit/api-client';
import type { CategoryResponse, TagResponse } from '@granit/taxonomy';
import type { ReactNode } from 'react';

const tag: TagResponse = {
  id: 'tag-1',
  tenantId: null,
  scope: 'documents',
  name: 'Urgent',
  color: '#FF0000',
  hideOnEntityCard: false,
  createdAt: toISODateString('2026-05-01T08:00:00Z'),
  modifiedAt: toISODateString('2026-05-01T08:00:00Z'),
  concurrencyStamp: 'stamp-1',
};

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
      <QueryClientProvider client={qc}>
        <TaxonomyProvider config={{ client }}>{children}</TaxonomyProvider>
      </QueryClientProvider>
    );
  };
}

describe('TagChipStrip — manage flow', () => {
  it('unassigns when × is clicked on a chip under canManage', async () => {
    const client = createMockClient();
    vi.mocked(client.get).mockImplementation(((url: string) => {
      if (url.includes('/assignments')) return Promise.resolve({ data: { items: [tag] } });
      return Promise.resolve({ data: [] });
    }) as AxiosInstance['get']);
    vi.mocked(client.delete).mockResolvedValue({ data: undefined });

    render(
      <TagChipStrip
        scope="documents"
        targetType="Granit.Documents.Domain.Document"
        targetId="doc-1"
        canManage
      />,
      { wrapper: createWrapper(client) }
    );

    await waitFor(() => expect(screen.getByText('Urgent')).toBeInTheDocument());
    await userEvent.click(screen.getByRole('button', { name: /Remove Urgent/i }));

    await waitFor(() =>
      expect(client.delete).toHaveBeenCalledWith(
        expect.stringContaining('/api/v1/taxonomy/tags/tag-1/assign/')
      )
    );
  });

  it('renders the error state when the assignments query fails', async () => {
    const client = createMockClient();
    vi.mocked(client.get).mockRejectedValue(new Error('boom'));

    render(
      <TagChipStrip
        scope="documents"
        targetType="Granit.Documents.Domain.Document"
        targetId="doc-1"
      />,
      { wrapper: createWrapper(client) }
    );

    await waitFor(() => expect(screen.getByRole('alert')).toBeInTheDocument());
  });
});

describe('TagAutocomplete — Arrow Up + Escape', () => {
  it('Arrow Up clamps highlight at 0; Escape closes the dropdown', async () => {
    const client = createMockClient();
    vi.mocked(client.get).mockResolvedValue({ data: [tag] });

    render(<TagAutocomplete scope="documents" value={[]} onAdd={vi.fn()} onRemove={vi.fn()} />, {
      wrapper: createWrapper(client),
    });

    const input = screen.getByRole('combobox');
    await userEvent.click(input);
    await waitFor(() => expect(client.get).toHaveBeenCalled());
    await userEvent.keyboard('{ArrowUp}{ArrowUp}');
    expect(input).toHaveAttribute('aria-expanded', 'true');

    await userEvent.keyboard('{Escape}');
    expect(input).toHaveAttribute('aria-expanded', 'false');
  });
});

describe('CategorySelector — clear flow', () => {
  it('DELETEs assignment when Clear is clicked', async () => {
    const client = createMockClient();
    vi.mocked(client.get).mockResolvedValue({
      data: {
        ...root,
        breadcrumb: [root],
      },
    });
    vi.mocked(client.delete).mockResolvedValue({ data: undefined });

    render(
      <CategorySelector
        scope="documents"
        targetType="Granit.Documents.Domain.Document"
        targetId="doc-1"
        value="cat-1"
        canManage
      />,
      { wrapper: createWrapper(client) }
    );

    await waitFor(() => expect(screen.getByText('legal')).toBeInTheDocument());
    await userEvent.click(screen.getByRole('button', { name: 'Clear' }));

    await waitFor(() =>
      expect(client.delete).toHaveBeenCalledWith(
        expect.stringContaining('/api/v1/taxonomy/categories/assign/')
      )
    );
  });
});
