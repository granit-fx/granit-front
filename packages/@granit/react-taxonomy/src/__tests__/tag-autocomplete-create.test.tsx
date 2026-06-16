import { createMockClient, createTestQueryClient } from '@granit/react-testing';
import { toISODateString } from '@granit/types';
import { QueryClientProvider } from '@tanstack/react-query';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { TagAutocomplete } from '../components/tag-autocomplete.tsx';
import { TaxonomyProvider } from '../providers/taxonomy-provider';

import type { AxiosInstance } from '@granit/api-client';
import type { TagResponse } from '@granit/taxonomy';
import type { ReactNode } from 'react';

const createdTag: TagResponse = {
  id: 'tag-new',
  tenantId: null,
  scope: 'documents',
  name: 'Brand new',
  color: '#94a3b8',
  hideOnEntityCard: false,
  createdAt: toISODateString('2026-05-01T08:00:00Z'),
  modifiedAt: toISODateString('2026-05-01T08:00:00Z'),
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

describe('TagAutocomplete inline create', () => {
  it('POSTs a new tag when the create option is clicked', async () => {
    const client = createMockClient();
    vi.mocked(client.get).mockResolvedValue({ data: [] });
    vi.mocked(client.post).mockResolvedValue({ data: createdTag });
    const onAdd = vi.fn();

    render(
      <TagAutocomplete scope="documents" value={[]} canManage onAdd={onAdd} onRemove={vi.fn()} />,
      { wrapper: createWrapper(client) }
    );

    const input = screen.getByRole('combobox');
    await userEvent.click(input);
    await userEvent.type(input, 'Brand new');
    await waitFor(() => expect(screen.getByText(/Create.*Brand new/)).toBeInTheDocument());
    await userEvent.click(screen.getByText(/Create.*Brand new/));

    await waitFor(() => expect(client.post).toHaveBeenCalled());
    expect(client.post).toHaveBeenCalledWith(
      '/api/v1/taxonomy/tags',
      expect.objectContaining({ name: 'Brand new', scope: 'documents' })
    );
    await waitFor(() => expect(onAdd).toHaveBeenCalledWith(createdTag));
  });
});
