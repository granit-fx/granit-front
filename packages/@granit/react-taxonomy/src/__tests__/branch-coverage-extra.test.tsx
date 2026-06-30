import { createMockClient, createTestQueryClient } from '@granit/react-testing';
import { toISODateString } from '@granit/types';
import { QueryClientProvider } from '@tanstack/react-query';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { TagChipStrip } from '../components/tag-chip-strip.tsx';
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

describe('TagChipStrip — autocomplete editing branch', () => {
  it('renders the autocomplete combobox when canManage and + Tag is clicked', async () => {
    const client = createMockClient();
    vi.mocked(client.get).mockImplementation(((url: string) => {
      if (url.includes('/assignments')) return Promise.resolve({ data: { items: [tag] } });
      return Promise.resolve({ data: [] });
    }) as AxiosInstance['get']);

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
    await userEvent.click(screen.getByText('+ Tag'));

    expect(screen.getByRole('combobox')).toBeInTheDocument();
  });
});
