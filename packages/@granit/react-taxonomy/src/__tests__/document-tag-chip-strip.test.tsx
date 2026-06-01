import { createMockClient, createTestQueryClient } from '@granit/react-testing';
import { QueryClientProvider } from '@tanstack/react-query';
import { render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { DocumentTagChipStrip } from '../components/document-tag-chip-strip.tsx';
import { TaxonomyProvider } from '../providers/taxonomy-provider';

import type { AxiosInstance } from '@granit/api-client';
import type { TagResponse } from '@granit/taxonomy';
import type { ReactNode } from 'react';

const tag: TagResponse = {
  id: 'tag-1',
  scope: 'documents',
  name: 'Urgent',
  color: '#FF0000',
  hideOnEntityCard: false,
  createdAt: '2026-05-01T08:00:00Z',
  updatedAt: '2026-05-01T08:00:00Z',
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

describe('DocumentTagChipStrip', () => {
  it('GETs the proxy URL and renders the returned tags', async () => {
    const client = createMockClient();
    vi.mocked(client.get).mockResolvedValue({ data: [tag] });

    render(<DocumentTagChipStrip scope="documents" basePath="/api/v1" documentId="doc-1" />, {
      wrapper: createWrapper(client),
    });

    await waitFor(() => expect(screen.getByText('Urgent')).toBeInTheDocument());
    expect(client.get).toHaveBeenCalledWith('/api/v1/documents/doc-1/tags');
  });

  it('renders the empty state when the proxy returns no tags', async () => {
    const client = createMockClient();
    vi.mocked(client.get).mockResolvedValue({ data: [] });

    render(<DocumentTagChipStrip scope="documents" basePath="/api/v1" documentId="doc-1" />, {
      wrapper: createWrapper(client),
    });

    await waitFor(() => expect(screen.getByText('No tags.')).toBeInTheDocument());
  });
});
