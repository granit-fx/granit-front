import { createMockClient, createTestQueryClient } from '@granit/react-testing';
import { toISODateString } from '@granit/types';
import { QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import {
  useCreateDocumentPublicLink,
  useDocumentPublicLinks,
  useRevokeDocumentPublicLink,
} from '../hooks/use-public-links';
import { DocumentsProvider } from '../providers/documents-provider';

import type { AxiosInstance } from '@granit/api-client';
import type { CreatePublicLinkResponse, PublicLinkResponse } from '@granit/documents';
import type { ReactNode } from 'react';

const sampleLink: PublicLinkResponse = {
  id: 'lnk-1',
  documentId: 'doc-1',
  scope: 'Download',
  expiresAt: toISODateString('2026-07-01T00:00:00Z'),
  maxUses: null,
  concurrencyStamp: 'stamp-1',
  currentUses: 0,
  revokedAt: null,
  revocationReason: null,
  createdAt: toISODateString('2026-06-01T00:00:00Z'),
};

const createResponse: CreatePublicLinkResponse = {
  id: 'lnk-2',
  documentId: 'doc-1',
  token: 'tok-abc',
  url: 'https://example.com/dl/tok-abc',
  scope: 'Download',
  expiresAt: toISODateString('2026-07-01T00:00:00Z'),
  maxUses: null,
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

describe('useDocumentPublicLinks', () => {
  afterEach(() => vi.restoreAllMocks());

  it('GETs /documents/{id}/public-links', async () => {
    const client = createMockClient();
    vi.mocked(client.get).mockResolvedValue({ data: [sampleLink] });

    const { result } = renderHook(() => useDocumentPublicLinks('doc-1'), {
      wrapper: createWrapper(client),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(client.get).toHaveBeenCalledWith('/api/v1/documents/documents/doc-1/public-links');
    expect(result.current.data).toEqual([sampleLink]);
  });

  it('does not fire when documentId is empty', () => {
    const client = createMockClient();
    const { result } = renderHook(() => useDocumentPublicLinks(''), {
      wrapper: createWrapper(client),
    });
    expect(result.current.fetchStatus).toBe('idle');
    expect(client.get).not.toHaveBeenCalled();
  });

  it('honours enabled: false', () => {
    const client = createMockClient();
    const { result } = renderHook(() => useDocumentPublicLinks('doc-1', { enabled: false }), {
      wrapper: createWrapper(client),
    });
    expect(result.current.fetchStatus).toBe('idle');
    expect(client.get).not.toHaveBeenCalled();
  });
});

describe('useCreateDocumentPublicLink', () => {
  afterEach(() => vi.restoreAllMocks());

  it('POSTs /documents/{id}/public-links and invalidates the list', async () => {
    const client = createMockClient();
    vi.mocked(client.post).mockResolvedValue({ data: createResponse });

    const { result } = renderHook(() => useCreateDocumentPublicLink(), {
      wrapper: createWrapper(client),
    });

    await result.current.mutateAsync({
      documentId: 'doc-1',
      request: { scope: 'Download', ttlDays: 7, maxUses: null },
    });

    expect(client.post).toHaveBeenCalledWith(
      '/api/v1/documents/documents/doc-1/public-links',
      expect.any(Object)
    );
  });
});

describe('useRevokeDocumentPublicLink', () => {
  afterEach(() => vi.restoreAllMocks());

  it('DELETEs /public-links/{id}', async () => {
    const client = createMockClient();
    vi.mocked(client.delete).mockResolvedValue({ data: undefined });

    const { result } = renderHook(() => useRevokeDocumentPublicLink(), {
      wrapper: createWrapper(client),
    });

    await result.current.mutateAsync({
      id: 'lnk-1',
      documentId: 'doc-1',
      request: { reason: null },
    });

    expect(client.delete).toHaveBeenCalledWith(
      '/api/v1/documents/public-links/lnk-1',
      expect.any(Object)
    );
  });
});
