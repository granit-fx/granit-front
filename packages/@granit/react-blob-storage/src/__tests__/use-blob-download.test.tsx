import { createTestQueryClient } from '@granit/react-testing';
import { createMockClient } from '@granit/testing';
import { QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react';
import * as React from 'react';
import { describe, expect, it, vi } from 'vitest';

import { useDownloadUrl } from '../hooks/use-blob-download';
import { BlobStorageProvider } from '../providers/blob-storage-provider';

import type { AxiosInstance } from '@granit/api-client';
import type { BlobDownloadUrlResponse } from '@granit/blob-storage';

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

describe('useDownloadUrl', () => {
  it('should send POST to /{id}/download-url', async () => {
    const client = createMockClient();
    const response: BlobDownloadUrlResponse = {
      downloadUrl: 'https://s3.example.com/download',
      expiresAt: '2026-03-20T12:05:00Z',
    };
    vi.mocked(client.post).mockResolvedValueOnce({ data: response });

    const { wrapper } = createWrapper(client);
    const { result } = renderHook(() => useDownloadUrl(), { wrapper });

    result.current.mutate({
      id: 'abc-123',
      request: { containerName: 'docs', fileName: 'report.pdf' },
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(client.post).toHaveBeenCalledWith('/api/v1/blob-storage/blobs/abc-123/download-url', {
      containerName: 'docs',
      fileName: 'report.pdf',
    });
    expect(result.current.data).toEqual(response);
  });

  it('should use custom basePath', async () => {
    const client = createMockClient();
    vi.mocked(client.post).mockResolvedValueOnce({ data: {} });

    const { wrapper } = createWrapper(client, '/api/v2/blob-storage');
    const { result } = renderHook(() => useDownloadUrl(), { wrapper });

    result.current.mutate({
      id: 'abc-123',
      request: { containerName: 'docs' },
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(client.post).toHaveBeenCalledWith(
      '/api/v2/blob-storage/blobs/abc-123/download-url',
      expect.any(Object)
    );
  });

  it('should handle error', async () => {
    const client = createMockClient();
    vi.mocked(client.post).mockRejectedValueOnce(new Error('Not Found'));

    const { wrapper } = createWrapper(client);
    const { result } = renderHook(() => useDownloadUrl(), { wrapper });

    result.current.mutate({
      id: 'abc-123',
      request: { containerName: 'docs' },
    });

    await waitFor(() => expect(result.current.isError).toBe(true));

    expect(result.current.error?.message).toBe('Not Found');
  });
});
