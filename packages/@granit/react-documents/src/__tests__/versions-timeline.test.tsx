import { createMockClient, createTestQueryClient } from '@granit/react-testing';
import { QueryClientProvider } from '@tanstack/react-query';
import { render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { VersionsTimeline } from '../components/versions-timeline.tsx';
import { DocumentsProvider } from '../providers/documents-provider.js';

import type { AxiosInstance } from '@granit/api-client';
import type { DocumentVersionResponse } from '@granit/documents';
import type { ReactNode } from 'react';

const version: DocumentVersionResponse = {
  id: 'ver-1',
  documentId: 'doc-1',
  versionNumber: 1,
  blobDescriptorId: 'blob-1',
  sizeBytes: 2048,
  contentType: 'application/pdf',
  contentHash: null,
  uploadedByUserId: 'user-1',
  uploadedAt: '2026-05-01T08:00:00Z',
  commitMessage: 'Initial upload',
  isCurrent: true,
};

function createWrapper(client: AxiosInstance) {
  return function Wrapper({ children }: { children: ReactNode }) {
    const qc = createTestQueryClient();
    return (
      <QueryClientProvider client={qc}>
        <DocumentsProvider config={{ client }}>{children}</DocumentsProvider>
      </QueryClientProvider>
    );
  };
}

describe('VersionsTimeline', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('renders the loading label', () => {
    const client = createMockClient();
    vi.mocked(client.get).mockReturnValue(new Promise(() => {}));

    render(<VersionsTimeline documentId="doc-1" />, { wrapper: createWrapper(client) });

    expect(screen.getByText('Loading versions…')).toBeInTheDocument();
  });

  it('renders the empty state when there are no versions', async () => {
    const client = createMockClient();
    vi.mocked(client.get).mockResolvedValue({
      data: { versions: [], totalCount: 0, skip: 0, take: 20 },
    });

    render(<VersionsTimeline documentId="doc-1" />, { wrapper: createWrapper(client) });

    await waitFor(() => expect(screen.getByText('No versions yet.')).toBeInTheDocument());
  });

  it('renders rows with the formatted size', async () => {
    const client = createMockClient();
    vi.mocked(client.get).mockResolvedValue({
      data: { versions: [version], totalCount: 1, skip: 0, take: 20 },
    });

    render(<VersionsTimeline documentId="doc-1" />, { wrapper: createWrapper(client) });

    await waitFor(() => expect(screen.getByText('Initial upload')).toBeInTheDocument());
    expect(screen.getByText('2.0 KB')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Download' })).toBeInTheDocument();
  });
});
