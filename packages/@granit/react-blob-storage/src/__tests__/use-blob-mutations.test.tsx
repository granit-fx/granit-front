import { BlobStatus } from '@granit/blob-storage';
import { createTestQueryClient } from '@granit/react-testing';
import { createMockClient } from '@granit/testing';
import { QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react';
import * as React from 'react';
import { describe, expect, it, vi } from 'vitest';

import { blobStorageKeys } from '../hooks/query-keys';
import { useConfirmUpload, useDeleteBlob, useInitiateUpload } from '../hooks/use-blob-mutations';
import { BlobStorageProvider } from '../providers/blob-storage-provider';

import type { AxiosInstance } from '@granit/api-client';
import type { BlobConfirmUploadResponse, BlobUploadInitiateResponse } from '@granit/blob-storage';

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

describe('useInitiateUpload', () => {
  it('should send POST to /upload', async () => {
    const client = createMockClient();
    const response: BlobUploadInitiateResponse = {
      blobId: 'abc-123',
      uploadUrl: 'https://s3.example.com/presigned',
      httpMethod: 'PUT',
      expiresAt: '2026-03-20T12:00:00Z',
      requiredHeaders: { 'Content-Type': 'image/png' },
    };
    vi.mocked(client.post).mockResolvedValueOnce({ data: response });

    const { wrapper } = createWrapper(client);
    const { result } = renderHook(() => useInitiateUpload(), { wrapper });

    result.current.mutate({
      containerName: 'docs',
      fileName: 'report.pdf',
      contentType: 'application/pdf',
      sizeBytes: 4096,
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(client.post).toHaveBeenCalledWith('/api/v1/blob-storage/blobs/upload', {
      containerName: 'docs',
      fileName: 'report.pdf',
      contentType: 'application/pdf',
      sizeBytes: 4096,
    });
    expect(result.current.data).toEqual(response);
  });

  it('should use custom basePath', async () => {
    const client = createMockClient();
    vi.mocked(client.post).mockResolvedValueOnce({ data: {} });

    const { wrapper } = createWrapper(client, '/api/v2/blob-storage');
    const { result } = renderHook(() => useInitiateUpload(), { wrapper });

    result.current.mutate({
      containerName: 'docs',
      fileName: 'file.txt',
      contentType: 'text/plain',
      sizeBytes: 100,
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(client.post).toHaveBeenCalledWith(
      '/api/v2/blob-storage/blobs/upload',
      expect.any(Object)
    );
  });

  it('should handle error', async () => {
    const client = createMockClient();
    vi.mocked(client.post).mockRejectedValueOnce(new Error('Forbidden'));

    const { wrapper } = createWrapper(client);
    const { result } = renderHook(() => useInitiateUpload(), { wrapper });

    result.current.mutate({
      containerName: 'docs',
      fileName: 'file.txt',
      contentType: 'text/plain',
      sizeBytes: 100,
    });

    await waitFor(() => expect(result.current.isError).toBe(true));

    expect(result.current.error?.message).toBe('Forbidden');
  });
});

describe('useConfirmUpload', () => {
  it('should send POST to /{id}/confirm and invalidate on success', async () => {
    const client = createMockClient();
    const response: BlobConfirmUploadResponse = {
      blobId: 'abc-123',
      isValid: true,
      status: BlobStatus.Valid,
      verifiedContentType: 'image/png',
      sizeBytes: 1024,
      rejectionReason: null,
    };
    vi.mocked(client.post).mockResolvedValueOnce({ data: response });

    const { wrapper, queryClient } = createWrapper(client);
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');

    const { result } = renderHook(() => useConfirmUpload(), { wrapper });

    result.current.mutate({ id: 'abc-123', request: { containerName: 'docs' } });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(client.post).toHaveBeenCalledWith('/api/v1/blob-storage/blobs/abc-123/confirm', {
      containerName: 'docs',
    });
    expect(invalidateSpy).toHaveBeenCalledWith({
      queryKey: blobStorageKeys.blobs(),
    });
  });

  it('should handle confirmation error', async () => {
    const client = createMockClient();
    vi.mocked(client.post).mockRejectedValueOnce(new Error('Bad Request'));

    const { wrapper } = createWrapper(client);
    const { result } = renderHook(() => useConfirmUpload(), { wrapper });

    result.current.mutate({ id: 'abc-123', request: { containerName: 'docs' } });

    await waitFor(() => expect(result.current.isError).toBe(true));

    expect(result.current.error?.message).toBe('Bad Request');
  });
});

describe('useDeleteBlob', () => {
  it('should send DELETE to /{id} and invalidate on success', async () => {
    const client = createMockClient();
    vi.mocked(client.delete).mockResolvedValueOnce({ data: undefined });

    const { wrapper, queryClient } = createWrapper(client);
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');

    const { result } = renderHook(() => useDeleteBlob(), { wrapper });

    result.current.mutate({
      id: 'abc-123',
      request: { containerName: 'docs', deletionReason: 'RGPD Art. 17' },
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(client.delete).toHaveBeenCalledWith('/api/v1/blob-storage/blobs/abc-123', {
      data: { containerName: 'docs', deletionReason: 'RGPD Art. 17' },
    });
    expect(invalidateSpy).toHaveBeenCalledWith({
      queryKey: blobStorageKeys.blobs(),
    });
  });

  it('should handle delete error', async () => {
    const client = createMockClient();
    vi.mocked(client.delete).mockRejectedValueOnce(new Error('Conflict'));

    const { wrapper } = createWrapper(client);
    const { result } = renderHook(() => useDeleteBlob(), { wrapper });

    result.current.mutate({ id: 'abc-123', request: { containerName: 'docs' } });

    await waitFor(() => expect(result.current.isError).toBe(true));

    expect(result.current.error?.message).toBe('Conflict');
  });
});
