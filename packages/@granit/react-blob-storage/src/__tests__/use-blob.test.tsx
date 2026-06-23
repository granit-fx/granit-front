import { createTestQueryClient } from '@granit/react-testing';
import { createMockClient } from '@granit/testing';
import { QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react';
import * as React from 'react';
import { describe, expect, it, vi } from 'vitest';

import { mockBlobs } from '@granit/react-blob-storage/testing';

import { useBlob } from '../hooks/use-blob';
import { BlobStorageProvider } from '../providers/blob-storage-provider';

import type { AxiosInstance } from '@granit/api-client';

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

const mockDescriptor = mockBlobs[0];

describe('useBlob', () => {
  it('should fetch blob descriptor with default basePath', async () => {
    const client = createMockClient();
    vi.mocked(client.get).mockResolvedValueOnce({ data: mockDescriptor });

    const { wrapper } = createWrapper(client);
    const { result } = renderHook(() => useBlob('abc-123', 'medical-images'), { wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(client.get).toHaveBeenCalledWith('/api/v1/blob-storage/blobs/abc-123', {
      params: { containerName: 'medical-images' },
    });
    expect(result.current.data).toEqual(mockDescriptor);
  });

  it('should fetch blob descriptor with custom basePath', async () => {
    const client = createMockClient();
    vi.mocked(client.get).mockResolvedValueOnce({ data: mockDescriptor });

    const { wrapper } = createWrapper(client, '/api/v2/blob-storage');
    const { result } = renderHook(() => useBlob('abc-123', 'docs'), { wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(client.get).toHaveBeenCalledWith('/api/v2/blob-storage/blobs/abc-123', {
      params: { containerName: 'docs' },
    });
  });

  it('should be disabled when id is empty', () => {
    const client = createMockClient();

    const { wrapper } = createWrapper(client);
    const { result } = renderHook(() => useBlob('', 'docs'), { wrapper });

    expect(result.current.fetchStatus).toBe('idle');
    expect(client.get).not.toHaveBeenCalled();
  });

  it('should be disabled when containerName is empty', () => {
    const client = createMockClient();

    const { wrapper } = createWrapper(client);
    const { result } = renderHook(() => useBlob('abc-123', ''), { wrapper });

    expect(result.current.fetchStatus).toBe('idle');
    expect(client.get).not.toHaveBeenCalled();
  });

  it('should handle fetch error', async () => {
    const client = createMockClient();
    vi.mocked(client.get).mockRejectedValueOnce(new Error('Not Found'));

    const { wrapper } = createWrapper(client);
    const { result } = renderHook(() => useBlob('abc-123', 'docs'), { wrapper });

    await waitFor(() => expect(result.current.isError).toBe(true));

    expect(result.current.error?.message).toBe('Not Found');
  });
});
