import { createMockClient, createTestQueryClient } from '@granit/react-testing';
import { QueryClientProvider } from '@tanstack/react-query';
import { act, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { TagAutocomplete } from '../components/tag-autocomplete.tsx';
import { TaxonomyProvider } from '../providers/taxonomy-provider';

import type { AxiosInstance } from '@granit/api-client';
import type { TagResponse } from '@granit/taxonomy';
import type { ReactNode } from 'react';

const sampleTag: TagResponse = {
  id: 'tag-1',
  tenantId: null,
  scope: 'documents',
  name: 'Urgent',
  color: '#FF0000',
  hideOnEntityCard: false,
  createdAt: '2026-05-01T08:00:00Z',
  modifiedAt: '2026-05-01T08:00:00Z',
};

const otherTag: TagResponse = {
  id: 'tag-2',
  tenantId: null,
  scope: 'documents',
  name: 'Internal',
  color: '#00FF00',
  hideOnEntityCard: false,
  createdAt: '2026-05-01T08:00:00Z',
  modifiedAt: '2026-05-01T08:00:00Z',
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

describe('TagAutocomplete', () => {
  it('renders selected chips and a combobox input', () => {
    const client = createMockClient();
    vi.mocked(client.get).mockResolvedValue({ data: [sampleTag, otherTag] });

    render(
      <TagAutocomplete scope="documents" value={['tag-1']} onAdd={vi.fn()} onRemove={vi.fn()} />,
      { wrapper: createWrapper(client) }
    );

    expect(screen.getByRole('combobox')).toBeInTheDocument();
  });

  it('calls onAdd with the picked suggestion when Enter is pressed', async () => {
    const client = createMockClient();
    vi.mocked(client.get).mockResolvedValue({ data: [otherTag] });
    const onAdd = vi.fn();

    render(<TagAutocomplete scope="documents" value={[]} onAdd={onAdd} onRemove={vi.fn()} />, {
      wrapper: createWrapper(client),
    });

    const input = screen.getByRole('combobox');
    await userEvent.click(input);
    await waitFor(() => expect(client.get).toHaveBeenCalled());
    await act(async () => {
      input.focus();
    });
    await userEvent.keyboard('{Enter}');

    expect(onAdd).toHaveBeenCalledWith(otherTag);
  });

  it('removes the last selected chip on Backspace when the input is empty', async () => {
    const client = createMockClient();
    vi.mocked(client.get).mockResolvedValue({ data: [sampleTag, otherTag] });
    const onRemove = vi.fn();

    render(
      <TagAutocomplete scope="documents" value={['tag-1']} onAdd={vi.fn()} onRemove={onRemove} />,
      { wrapper: createWrapper(client) }
    );

    await waitFor(() => expect(client.get).toHaveBeenCalled());
    const input = screen.getByRole('combobox');
    await userEvent.click(input);
    await userEvent.keyboard('{Backspace}');

    expect(onRemove).toHaveBeenCalledWith(sampleTag);
  });

  it('shows the create option only when canManage and no exact match', async () => {
    const client = createMockClient();
    vi.mocked(client.get).mockResolvedValue({ data: [] });

    render(
      <TagAutocomplete scope="documents" value={[]} canManage onAdd={vi.fn()} onRemove={vi.fn()} />,
      { wrapper: createWrapper(client) }
    );

    const input = screen.getByRole('combobox');
    await userEvent.click(input);
    await userEvent.type(input, 'New tag');

    expect(screen.getByText(/Create.*New tag/)).toBeInTheDocument();
  });

  it('does not show create when canManage is false', async () => {
    const client = createMockClient();
    vi.mocked(client.get).mockResolvedValue({ data: [] });

    render(<TagAutocomplete scope="documents" value={[]} onAdd={vi.fn()} onRemove={vi.fn()} />, {
      wrapper: createWrapper(client),
    });

    const input = screen.getByRole('combobox');
    await userEvent.click(input);
    await userEvent.type(input, 'New tag');

    expect(screen.queryByText(/Create/)).toBeNull();
  });
});
