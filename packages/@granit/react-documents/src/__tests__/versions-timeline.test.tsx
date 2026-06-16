import { createMockClient, createTestQueryClient } from '@granit/react-testing';
import { toISODateString } from '@granit/types';
import { QueryClientProvider } from '@tanstack/react-query';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { VersionsTimeline } from '../components/versions-timeline.tsx';
import { DocumentsProvider } from '../providers/documents-provider';

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
  uploadedAt: toISODateString('2026-05-01T08:00:00Z'),
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

  it('renders a non-current version row without the current marker', async () => {
    const client = createMockClient();
    const older: DocumentVersionResponse = { ...version, id: 'ver-0', isCurrent: false };
    vi.mocked(client.get).mockResolvedValue({
      data: { versions: [older, version], totalCount: 2, skip: 0, take: 20 },
    });

    render(<VersionsTimeline documentId="doc-1" pageSize={2} />, {
      wrapper: createWrapper(client),
    });

    await waitFor(() => expect(screen.getAllByText('Initial upload').length).toBeGreaterThan(0));
    // only one `current` marker rendered
    expect(screen.getAllByText(/\(current\)/)).toHaveLength(1);
  });

  it('paginates to the next page and back when totalCount exceeds the page size', async () => {
    const client = createMockClient();
    vi.mocked(client.get).mockResolvedValue({
      data: { versions: [version], totalCount: 5, skip: 0, take: 1 },
    });

    render(<VersionsTimeline documentId="doc-1" pageSize={1} />, {
      wrapper: createWrapper(client),
    });

    await waitFor(() => expect(screen.getByText('Initial upload')).toBeInTheDocument());

    const nextBtn = screen.getByRole('button', { name: 'Next' });
    expect(nextBtn).not.toBeDisabled();
    await userEvent.click(nextBtn);

    const prevBtn = screen.getByRole('button', { name: 'Previous' });
    expect(prevBtn).not.toBeDisabled();
    await userEvent.click(prevBtn);
  });

  it('opens a new window when the user clicks Download', async () => {
    const client = createMockClient();
    vi.mocked(client.get).mockImplementation(((url: string) => {
      if (url.includes('/download')) {
        return Promise.resolve({
          data: { url: 'https://blob.example/get', expiresAt: toISODateString('x') },
        });
      }
      return Promise.resolve({
        data: { versions: [version], totalCount: 1, skip: 0, take: 20 },
      });
    }) as AxiosInstance['get']);
    const openSpy = vi.spyOn(window, 'open').mockReturnValue(null);

    render(<VersionsTimeline documentId="doc-1" />, { wrapper: createWrapper(client) });
    await waitFor(() => expect(screen.getByText('Initial upload')).toBeInTheDocument());

    await userEvent.click(screen.getByRole('button', { name: 'Download' }));
    await waitFor(() => expect(openSpy).toHaveBeenCalled());
    expect(openSpy.mock.calls[0]?.[0]).toBe('https://blob.example/get');
  });
});
