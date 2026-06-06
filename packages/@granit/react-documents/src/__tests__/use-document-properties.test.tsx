import { createMockClient, createTestQueryClient } from '@granit/react-testing';
import { QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import {
  useDocumentProperties,
  useDocumentVersionProperties,
} from '../hooks/use-document-properties';
import { DocumentsProvider } from '../providers/documents-provider';

import type { AxiosInstance } from '@granit/api-client';
import type { DocumentPropertiesResponse } from '@granit/documents';
import type { ReactNode } from 'react';

const sampleProperties: DocumentPropertiesResponse = {
  id: 'prop-1',
  documentId: 'doc-1',
  documentVersionId: 'ver-1',
  sourceContentType: 'application/pdf',
  status: 'Ready',
  createdAt: '2026-06-01T00:00:00Z',
  completedAt: '2026-06-01T00:01:00Z',
  failureReason: null,
  extractorCount: 2,
  width: null,
  height: null,
  cameraMake: null,
  cameraModel: null,
  lensModel: null,
  iso: null,
  fNumber: null,
  exposureTimeMs: null,
  takenAt: null,
  gpsLatitude: null,
  gpsLongitude: null,
  gpsAltitude: null,
  pageCount: 10,
  title: 'Contract',
  author: null,
  subject: null,
  keywords: null,
  producer: null,
  revision: null,
  lastModifiedBy: null,
  durationMs: null,
  codec: null,
  bitrate: null,
  artist: null,
  album: null,
  trackNumber: null,
  genre: null,
  rawMetadata: {},
};

function createWrapper(client: AxiosInstance) {
  return function Wrapper({ children }: { children: ReactNode }) {
    const queryClient = createTestQueryClient();
    return (
      <QueryClientProvider client={queryClient}>
        <DocumentsProvider config={{ client }}>{children}</DocumentsProvider>
      </QueryClientProvider>
    );
  };
}

describe('useDocumentProperties', () => {
  afterEach(() => vi.restoreAllMocks());

  it('GETs /documents/{id}/metadata', async () => {
    const client = createMockClient();
    vi.mocked(client.get).mockResolvedValue({ data: sampleProperties });

    const { result } = renderHook(() => useDocumentProperties('doc-1'), {
      wrapper: createWrapper(client),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(client.get).toHaveBeenCalledWith('/api/v1/documents/documents/doc-1/metadata');
    expect(result.current.data).toEqual(sampleProperties);
  });

  it('does not fire when id is empty', () => {
    const client = createMockClient();
    const { result } = renderHook(() => useDocumentProperties(''), {
      wrapper: createWrapper(client),
    });
    expect(result.current.fetchStatus).toBe('idle');
    expect(client.get).not.toHaveBeenCalled();
  });

  it('honours enabled: false', () => {
    const client = createMockClient();
    const { result } = renderHook(() => useDocumentProperties('doc-1', { enabled: false }), {
      wrapper: createWrapper(client),
    });
    expect(result.current.fetchStatus).toBe('idle');
    expect(client.get).not.toHaveBeenCalled();
  });
});

describe('useDocumentVersionProperties', () => {
  afterEach(() => vi.restoreAllMocks());

  it('GETs /documents/{id}/versions/{versionId}/metadata', async () => {
    const client = createMockClient();
    vi.mocked(client.get).mockResolvedValue({ data: sampleProperties });

    const { result } = renderHook(() => useDocumentVersionProperties('doc-1', 'ver-1'), {
      wrapper: createWrapper(client),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(client.get).toHaveBeenCalledWith(
      '/api/v1/documents/documents/doc-1/versions/ver-1/metadata'
    );
  });

  it('does not fire when id is empty', () => {
    const client = createMockClient();
    const { result } = renderHook(() => useDocumentVersionProperties('', 'ver-1'), {
      wrapper: createWrapper(client),
    });
    expect(result.current.fetchStatus).toBe('idle');
    expect(client.get).not.toHaveBeenCalled();
  });

  it('does not fire when versionId is empty', () => {
    const client = createMockClient();
    const { result } = renderHook(() => useDocumentVersionProperties('doc-1', ''), {
      wrapper: createWrapper(client),
    });
    expect(result.current.fetchStatus).toBe('idle');
    expect(client.get).not.toHaveBeenCalled();
  });

  it('honours enabled: false', () => {
    const client = createMockClient();
    const { result } = renderHook(
      () => useDocumentVersionProperties('doc-1', 'ver-1', { enabled: false }),
      { wrapper: createWrapper(client) }
    );
    expect(result.current.fetchStatus).toBe('idle');
    expect(client.get).not.toHaveBeenCalled();
  });
});
