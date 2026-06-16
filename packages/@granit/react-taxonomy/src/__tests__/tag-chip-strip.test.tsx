import { createMockClient, createTestQueryClient } from '@granit/react-testing';
import { QueryClientProvider } from '@tanstack/react-query';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { TagChipStrip } from '../components/tag-chip-strip.tsx';
import { TaxonomyProvider } from '../providers/taxonomy-provider';

import type { AxiosInstance } from '@granit/api-client';
import type { TagResponse } from '@granit/taxonomy';
import type { ReactNode } from 'react';

const visibleTag: TagResponse = {
  id: 'tag-1',
  tenantId: null,
  scope: 'documents',
  name: 'Urgent',
  color: '#FF0000',
  hideOnEntityCard: false,
  createdAt: '2026-05-01T08:00:00Z',
  modifiedAt: '2026-05-01T08:00:00Z',
  concurrencyStamp: 'stamp-1',
};

const hiddenTag: TagResponse = {
  id: 'tag-2',
  tenantId: null,
  scope: 'documents',
  name: 'Internal',
  color: '#00FF00',
  hideOnEntityCard: true,
  createdAt: '2026-05-01T08:00:00Z',
  modifiedAt: '2026-05-01T08:00:00Z',
  concurrencyStamp: 'stamp-1',
};

function createWrapperFromClient(client: AxiosInstance) {
  return function Wrapper({ children }: { children: ReactNode }) {
    const qc = createTestQueryClient();
    return (
      <QueryClientProvider client={qc}>
        <TaxonomyProvider config={{ client }}>{children}</TaxonomyProvider>
      </QueryClientProvider>
    );
  };
}

function buildClient(): AxiosInstance {
  const client = createMockClient();
  vi.mocked(client.get).mockImplementation(((url: string) => {
    if (url.includes('/assignments')) {
      return Promise.resolve({ data: { items: [visibleTag, hiddenTag] } });
    }
    return Promise.resolve({ data: [] });
  }) as AxiosInstance['get']);
  return client;
}

describe('TagChipStrip', () => {
  it('renders only the non-hidden tags by default (hideOnCardOnly = true)', async () => {
    const client = buildClient();

    render(
      <TagChipStrip
        scope="documents"
        targetType="Granit.Documents.Domain.Document"
        targetId="doc-1"
      />,
      { wrapper: createWrapperFromClient(client) }
    );

    await waitFor(() => expect(screen.getByText('Urgent')).toBeInTheDocument());
    expect(screen.queryByText('Internal')).toBeNull();
  });

  it('shows hidden-on-card tags when hideOnCardOnly is false', async () => {
    const client = buildClient();

    render(
      <TagChipStrip
        scope="documents"
        targetType="Granit.Documents.Domain.Document"
        targetId="doc-1"
        hideOnCardOnly={false}
      />,
      { wrapper: createWrapperFromClient(client) }
    );

    await waitFor(() => expect(screen.getByText('Urgent')).toBeInTheDocument());
    expect(screen.getByText('Internal')).toBeInTheDocument();
  });

  it('hides the + button when canManage is false', async () => {
    const client = buildClient();

    render(
      <TagChipStrip
        scope="documents"
        targetType="Granit.Documents.Domain.Document"
        targetId="doc-1"
      />,
      { wrapper: createWrapperFromClient(client) }
    );

    await waitFor(() => expect(screen.getByText('Urgent')).toBeInTheDocument());
    expect(screen.queryByText('+ Tag')).toBeNull();
  });

  it('opens the autocomplete when the + button is clicked under canManage', async () => {
    const client = buildClient();

    render(
      <TagChipStrip
        scope="documents"
        targetType="Granit.Documents.Domain.Document"
        targetId="doc-1"
        canManage
      />,
      { wrapper: createWrapperFromClient(client) }
    );

    await waitFor(() => expect(screen.getByText('Urgent')).toBeInTheDocument());
    await userEvent.click(screen.getByText('+ Tag'));

    expect(screen.getByRole('combobox')).toBeInTheDocument();
  });
});
