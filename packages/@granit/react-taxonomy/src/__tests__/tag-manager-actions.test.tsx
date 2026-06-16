import { createMockClient, createTestQueryClient } from '@granit/react-testing';
import { toISODateString } from '@granit/types';
import { QueryClientProvider } from '@tanstack/react-query';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { TagManager } from '../components/tag-manager.tsx';
import { TaxonomyProvider } from '../providers/taxonomy-provider';

import type { AxiosInstance } from '@granit/api-client';
import type { TagResponse } from '@granit/taxonomy';
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

describe('TagManager row actions', () => {
  beforeEach(() => {
    vi.spyOn(window, 'confirm').mockReturnValue(true);
  });
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('PATCHes the tag when the name input loses focus on a non-empty change', async () => {
    const client = createMockClient();
    vi.mocked(client.get).mockResolvedValue({ data: [tag] });
    vi.mocked(client.patch).mockResolvedValue({ data: { ...tag, name: 'Critical' } });

    render(<TagManager scope="documents" canManage />, { wrapper: createWrapper(client) });

    await waitFor(() => expect(screen.getByDisplayValue('Urgent')).toBeInTheDocument());
    const input = screen.getByDisplayValue('Urgent');
    await userEvent.clear(input);
    await userEvent.type(input, 'Critical');
    await userEvent.tab();

    await waitFor(() => expect(client.patch).toHaveBeenCalled());
    expect(client.patch).toHaveBeenCalledWith(
      '/api/v1/taxonomy/tags/tag-1',
      expect.objectContaining({ name: 'Critical' })
    );
  });

  it('DELETEs the tag when the Delete button is confirmed', async () => {
    const client = createMockClient();
    vi.mocked(client.get).mockResolvedValue({ data: [tag] });
    vi.mocked(client.delete).mockResolvedValue({ data: undefined });

    render(<TagManager scope="documents" canManage />, { wrapper: createWrapper(client) });

    await waitFor(() => expect(screen.getByDisplayValue('Urgent')).toBeInTheDocument());
    await userEvent.click(screen.getByRole('button', { name: 'Delete' }));

    expect(client.delete).toHaveBeenCalledWith('/api/v1/taxonomy/tags/tag-1');
  });

  it('cancels the create draft when Cancel is clicked', async () => {
    const client = createMockClient();
    vi.mocked(client.get).mockResolvedValue({ data: [] });

    render(<TagManager scope="documents" canManage />, { wrapper: createWrapper(client) });

    await waitFor(() => expect(screen.getByRole('button', { name: 'New tag' })).toBeEnabled());
    await userEvent.click(screen.getByRole('button', { name: 'New tag' }));
    await userEvent.click(screen.getByRole('button', { name: 'Cancel' }));

    expect(screen.queryByRole('button', { name: 'Create' })).toBeNull();
  });

  it('toggles HideOnEntityCard via the checkbox', async () => {
    const client = createMockClient();
    vi.mocked(client.get).mockResolvedValue({ data: [tag] });
    vi.mocked(client.patch).mockResolvedValue({ data: { ...tag, hideOnEntityCard: true } });

    render(<TagManager scope="documents" canManage />, { wrapper: createWrapper(client) });

    const checkbox = await screen.findByLabelText('Hidden on cards');
    await userEvent.click(checkbox);

    await waitFor(() => expect(client.patch).toHaveBeenCalled());
    expect(client.patch).toHaveBeenCalledWith(
      '/api/v1/taxonomy/tags/tag-1',
      expect.objectContaining({ hideOnEntityCard: true })
    );
  });
});
