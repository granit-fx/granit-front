import { createTestQueryClient } from '@granit/react-testing';
import { createMockClient } from '@granit/testing';
import { QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react';
import * as React from 'react';
import { describe, expect, it, vi } from 'vitest';

import { useCleanupOrphans } from '../hooks/use-blob-cleanup.js';

import type { BlobCleanupOrphansResponse } from '@granit/blob-storage';

function createWrapper() {
  const queryClient = createTestQueryClient();
  return {
    wrapper: ({ children }: { children: React.ReactNode }) => (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    ),
    queryClient,
  };
}

describe('useCleanupOrphans', () => {
  it('should send POST to /cleanup-orphans', async () => {
    const client = createMockClient();
    const response: BlobCleanupOrphansResponse = { cleanedCount: 3 };
    vi.mocked(client.post).mockResolvedValueOnce({ data: response });

    const { wrapper } = createWrapper();
    const { result } = renderHook(() => useCleanupOrphans({ client }), { wrapper });

    result.current.mutate();

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(client.post).toHaveBeenCalledWith('/api/v1/blob-storage/blobs/cleanup-orphans');
    expect(result.current.data).toEqual(response);
  });

  it('should use custom basePath', async () => {
    const client = createMockClient();
    vi.mocked(client.post).mockResolvedValueOnce({ data: { cleanedCount: 0 } });

    const { wrapper } = createWrapper();
    const { result } = renderHook(() => useCleanupOrphans({ client, basePath: '/api/v2/blob-storage' }), {
      wrapper,
    });

    result.current.mutate();

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(client.post).toHaveBeenCalledWith('/api/v2/blob-storage/blobs/cleanup-orphans');
  });

  it('should handle error', async () => {
    const client = createMockClient();
    vi.mocked(client.post).mockRejectedValueOnce(new Error('Forbidden'));

    const { wrapper } = createWrapper();
    const { result } = renderHook(() => useCleanupOrphans({ client }), { wrapper });

    result.current.mutate();

    await waitFor(() => expect(result.current.isError).toBe(true));

    expect(result.current.error?.message).toBe('Forbidden');
  });
});
