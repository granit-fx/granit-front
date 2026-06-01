import { createTestQueryClient } from '@granit/react-testing';
import { createMockClient } from '@granit/testing';
import { QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react';
import * as React from 'react';
import { describe, expect, it, vi } from 'vitest';

import { useCleanupOrphans } from '../hooks/use-blob-cleanup';
import { BlobStorageProvider } from '../providers/blob-storage-provider';

import type { AxiosInstance } from '@granit/api-client';
import type { BlobCleanupOrphansResponse } from '@granit/blob-storage';

function createWrapper(client: AxiosInstance, basePath?: string) {
  const queryClient = createTestQueryClient();
  return {
    wrapper: ({ children }: { children: React.ReactNode }) => (
      <QueryClientProvider client={queryClient}>
        <BlobStorageProvider config={{ client, basePath }}>{children}</BlobStorageProvider>
      </QueryClientProvider>
    ),
    queryClient,
  };
}

describe('useCleanupOrphans', () => {
  it('should send POST to /cleanup-orphans', async () => {
    const client = createMockClient();
    const response: BlobCleanupOrphansResponse = { cleanedCount: 3 };
    vi.mocked(client.post).mockResolvedValueOnce({ data: response });

    const { wrapper } = createWrapper(client);
    const { result } = renderHook(() => useCleanupOrphans(), { wrapper });

    result.current.mutate();

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(client.post).toHaveBeenCalledWith('/api/v1/blob-storage/blobs/cleanup-orphans');
    expect(result.current.data).toEqual(response);
  });

  it('should use custom basePath', async () => {
    const client = createMockClient();
    vi.mocked(client.post).mockResolvedValueOnce({ data: { cleanedCount: 0 } });

    const { wrapper } = createWrapper(client, '/api/v2/blob-storage');
    const { result } = renderHook(() => useCleanupOrphans(), { wrapper });

    result.current.mutate();

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(client.post).toHaveBeenCalledWith('/api/v2/blob-storage/blobs/cleanup-orphans');
  });

  it('should handle error', async () => {
    const client = createMockClient();
    vi.mocked(client.post).mockRejectedValueOnce(new Error('Forbidden'));

    const { wrapper } = createWrapper(client);
    const { result } = renderHook(() => useCleanupOrphans(), { wrapper });

    result.current.mutate();

    await waitFor(() => expect(result.current.isError).toBe(true));

    expect(result.current.error?.message).toBe('Forbidden');
  });
});
