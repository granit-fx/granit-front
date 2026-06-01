import { createMockClient, createTestQueryClient } from '@granit/react-testing';
import { QueryClientProvider } from '@tanstack/react-query';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { TaxonomySearchBar } from '../components/taxonomy-search-bar.tsx';
import { TaxonomyProvider } from '../providers/taxonomy-provider';

import type { AxiosInstance } from '@granit/api-client';
import type { TaxonomySearchResultGroup } from '@granit/taxonomy';
import type { ReactNode } from 'react';

const sampleGroup: TaxonomySearchResultGroup = {
  targetType: 'Granit.Documents.Domain.Document',
  items: [
    {
      targetType: 'Granit.Documents.Domain.Document',
      targetId: 'doc-1',
      label: 'Q1 contract',
      snippet: '…tagged Urgent…',
      matchedTagIds: ['tag-1'],
      matchedCategoryId: null,
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

describe('TaxonomySearchBar', () => {
  it('shows the below-threshold hint until the query reaches the minimum', async () => {
    const client = createMockClient();
    vi.mocked(client.get).mockResolvedValue({ data: [] });

    render(<TaxonomySearchBar onSelect={vi.fn()} debounceMs={0} />, {
      wrapper: createWrapper(client),
    });

    await userEvent.click(screen.getByRole('combobox'));
    await userEvent.type(screen.getByRole('combobox'), 'a');
    expect(await screen.findByText(/Type at least 2 characters/)).toBeInTheDocument();
  });

  it('falls back to the last . segment when no targetType label is supplied', async () => {
    const client = createMockClient();
    vi.mocked(client.get).mockResolvedValue({ data: [sampleGroup] });

    render(<TaxonomySearchBar onSelect={vi.fn()} debounceMs={0} />, {
      wrapper: createWrapper(client),
    });

    const input = screen.getByRole('combobox');
    await userEvent.click(input);
    await userEvent.type(input, 'urgent');

    await waitFor(() => expect(screen.getByText('Q1 contract')).toBeInTheDocument());
    expect(screen.getByText('Document')).toBeInTheDocument();
  });

  it('uses an explicit targetType label when provided', async () => {
    const client = createMockClient();
    vi.mocked(client.get).mockResolvedValue({ data: [sampleGroup] });

    render(
      <TaxonomySearchBar
        onSelect={vi.fn()}
        debounceMs={0}
        targetTypeLabels={{ 'Granit.Documents.Domain.Document': 'Documents 📄' }}
      />,
      { wrapper: createWrapper(client) }
    );

    const input = screen.getByRole('combobox');
    await userEvent.click(input);
    await userEvent.type(input, 'urgent');

    await waitFor(() => expect(screen.getByText('Documents 📄')).toBeInTheDocument());
  });

  it('calls onSelect when a result is clicked', async () => {
    const client = createMockClient();
    vi.mocked(client.get).mockResolvedValue({ data: [sampleGroup] });
    const onSelect = vi.fn();

    render(<TaxonomySearchBar onSelect={onSelect} debounceMs={0} />, {
      wrapper: createWrapper(client),
    });

    const input = screen.getByRole('combobox');
    await userEvent.click(input);
    await userEvent.type(input, 'urgent');

    const item = await screen.findByText('Q1 contract');
    await userEvent.click(item);

    expect(onSelect).toHaveBeenCalledWith(sampleGroup.items[0]);
  });

  it('shows the empty state when the backend returns no groups', async () => {
    const client = createMockClient();
    vi.mocked(client.get).mockResolvedValue({ data: [] });

    render(<TaxonomySearchBar onSelect={vi.fn()} debounceMs={0} />, {
      wrapper: createWrapper(client),
    });

    const input = screen.getByRole('combobox');
    await userEvent.click(input);
    await userEvent.type(input, 'urgent');

    expect(await screen.findByText('No results.')).toBeInTheDocument();
  });
});
