import { createMockClient, createTestQueryClient } from '@granit/react-testing';
import { QueryClientProvider } from '@tanstack/react-query';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { TaxonomySearchBar } from '../components/taxonomy-search-bar.tsx';
import { TaxonomyProvider } from '../providers/taxonomy-provider.js';

import type { AxiosInstance } from '@granit/api-client';
import type { TaxonomySearchResultGroup } from '@granit/taxonomy';
import type { ReactNode } from 'react';

const groups: readonly TaxonomySearchResultGroup[] = [
  {
    targetType: 'Granit.Documents.Domain.Document',
    items: [
      {
        targetType: 'Granit.Documents.Domain.Document',
        targetId: 'doc-1',
        label: 'Doc one',
        snippet: null,
        matchedTagIds: [],
        matchedCategoryId: null,
      },
      {
        targetType: 'Granit.Documents.Domain.Document',
        targetId: 'doc-2',
        label: 'Doc two',
        snippet: null,
        matchedTagIds: [],
        matchedCategoryId: null,
      },
    ],
  },
];

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

describe('TaxonomySearchBar keyboard navigation', () => {
  it('Arrow Down + Enter selects the next item', async () => {
    const client = createMockClient();
    vi.mocked(client.get).mockResolvedValue({ data: groups });
    const onSelect = vi.fn();

    render(<TaxonomySearchBar onSelect={onSelect} debounceMs={0} />, {
      wrapper: createWrapper(client),
    });

    const input = screen.getByRole('combobox');
    await userEvent.click(input);
    await userEvent.type(input, 'doc');
    await waitFor(() => expect(screen.getByText('Doc one')).toBeInTheDocument());

    await userEvent.keyboard('{ArrowDown}{Enter}');
    expect(onSelect).toHaveBeenCalledWith(groups[0]!.items[1]);
  });

  it('Escape closes the dropdown', async () => {
    const client = createMockClient();
    vi.mocked(client.get).mockResolvedValue({ data: groups });

    render(<TaxonomySearchBar onSelect={vi.fn()} debounceMs={0} />, {
      wrapper: createWrapper(client),
    });

    const input = screen.getByRole('combobox');
    await userEvent.click(input);
    await userEvent.type(input, 'doc');
    await waitFor(() => expect(screen.getByText('Doc one')).toBeInTheDocument());

    await userEvent.keyboard('{Escape}');
    expect(input).toHaveAttribute('aria-expanded', 'false');
  });
});
