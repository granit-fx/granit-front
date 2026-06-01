import { BlobStatus } from '@granit/blob-storage';
import { createTestQueryClient } from '@granit/react-testing';
import { createMockClient } from '@granit/testing';
import { QueryClientProvider } from '@tanstack/react-query';
import { act, renderHook, waitFor } from '@testing-library/react';
import * as React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { useBlobUpload } from '../hooks/use-blob-upload';
import { BlobStorageProvider } from '../providers/blob-storage-provider';

import type { AxiosInstance } from '@granit/api-client';
import type { BlobConfirmUploadResponse, BlobUploadInitiateResponse } from '@granit/blob-storage';

function createWrapper(client: AxiosInstance) {
  const queryClient = createTestQueryClient();
  return {
    wrapper: ({ children }: { children: React.ReactNode }) => (
      <QueryClientProvider client={queryClient}>
        <BlobStorageProvider config={{ client }}>{children}</BlobStorageProvider>
      </QueryClientProvider>
    ),
    queryClient,
  };
}

const mockTicket: BlobUploadInitiateResponse = {
  blobId: 'blob-456',
  uploadUrl: 'https://s3.example.com/presigned',
  httpMethod: 'PUT',
  expiresAt: '2026-03-20T12:00:00Z',
  requiredHeaders: { 'Content-Type': 'image/png', 'x-amz-meta-tenant': 'tenant-1' },
};

const mockConfirmation: BlobConfirmUploadResponse = {
  blobId: 'blob-456',
  isValid: true,
  status: BlobStatus.Valid,
  verifiedContentType: 'image/png',
  sizeBytes: 1024,
  rejectionReason: null,
};

let xhrInstances: MockXHR[];

class MockXHR {
  status = 200;
  readyState = 0;
  uploadListeners: Record<string, (e: unknown) => void> = {};
  listeners: Record<string, (e: unknown) => void> = {};
  upload = {
    addEventListener: (event: string, handler: (e: unknown) => void) => {
      this.uploadListeners[event] = handler;
    },
  };
  addEventListener = (event: string, handler: (e: unknown) => void) => {
    this.listeners[event] = handler;
  };
  open = vi.fn();
  setRequestHeader = vi.fn();
  send = vi.fn();
  abort = vi.fn();

  constructor() {
    xhrInstances.push(this);
  }

  simulateSuccess() {
    this.listeners['load']?.({});
  }

  simulateError() {
    this.listeners['error']?.({});
  }
}

beforeEach(() => {
  xhrInstances = [];
  vi.stubGlobal('XMLHttpRequest', MockXHR);
});

describe('useBlobUpload', () => {
  it('should start in idle state', () => {
    const client = createMockClient();
    const { wrapper } = createWrapper(client);
    const { result } = renderHook(() => useBlobUpload(), { wrapper });

    expect(result.current.state.phase).toBe('idle');
    expect(result.current.state.progress).toBe(0);
    expect(result.current.state.blobId).toBeNull();
    expect(result.current.state.result).toBeNull();
    expect(result.current.state.error).toBeNull();
  });

  it('should complete the full upload flow', async () => {
    const client = createMockClient();
    vi.mocked(client.post)
      .mockResolvedValueOnce({ data: mockTicket })
      .mockResolvedValueOnce({ data: mockConfirmation });

    const { wrapper } = createWrapper(client);
    const { result } = renderHook(() => useBlobUpload(), { wrapper });

    const file = new File(['test content'], 'test.png', { type: 'image/png' });

    let uploadPromise: Promise<BlobConfirmUploadResponse>;

    await act(async () => {
      uploadPromise = result.current.upload({ file, containerName: 'docs' });

      // Wait for initiation POST to complete and XHR to be created
      await waitFor(() => expect(xhrInstances).toHaveLength(1));
    });

    const xhr = xhrInstances[0]!;

    expect(xhr.open).toHaveBeenCalledWith('PUT', 'https://s3.example.com/presigned');
    expect(xhr.setRequestHeader).toHaveBeenCalledWith('Content-Type', 'image/png');
    expect(xhr.setRequestHeader).toHaveBeenCalledWith('x-amz-meta-tenant', 'tenant-1');
    expect(xhr.send).toHaveBeenCalledWith(file);

    // Simulate successful S3 upload + wait for confirm
    await act(async () => {
      xhr.simulateSuccess();
      await uploadPromise!;
    });

    expect(result.current.state.phase).toBe('complete');
    expect(result.current.state.blobId).toBe('blob-456');
    expect(result.current.state.result).toEqual(mockConfirmation);

    expect(client.post).toHaveBeenCalledWith('/api/v1/blob-storage/blobs/upload', {
      containerName: 'docs',
      fileName: 'test.png',
      contentType: 'image/png',
      sizeBytes: 12,
    });
  });

  it('should handle initiation error', async () => {
    const client = createMockClient();
    vi.mocked(client.post).mockRejectedValueOnce(new Error('Unauthorized'));

    const { wrapper } = createWrapper(client);
    const { result } = renderHook(() => useBlobUpload(), { wrapper });

    const file = new File(['content'], 'test.txt', { type: 'text/plain' });

    await act(async () => {
      await expect(result.current.upload({ file, containerName: 'docs' })).rejects.toThrow(
        'Unauthorized'
      );
    });

    expect(result.current.state.phase).toBe('error');
    expect(result.current.state.error?.message).toBe('Unauthorized');
  });

  it('should handle XHR upload error', async () => {
    const client = createMockClient();
    vi.mocked(client.post).mockResolvedValueOnce({ data: mockTicket });

    const { wrapper } = createWrapper(client);
    const { result } = renderHook(() => useBlobUpload(), { wrapper });

    const file = new File(['content'], 'test.txt', { type: 'text/plain' });

    let uploadPromise: Promise<BlobConfirmUploadResponse>;

    await act(async () => {
      uploadPromise = result.current.upload({ file, containerName: 'docs' });
      await waitFor(() => expect(xhrInstances).toHaveLength(1));
    });

    await act(async () => {
      xhrInstances[0]!.simulateError();
      await expect(uploadPromise!).rejects.toThrow('network error');
    });

    expect(result.current.state.phase).toBe('error');
  });

  it('should reset state', async () => {
    const client = createMockClient();
    vi.mocked(client.post).mockRejectedValueOnce(new Error('fail'));

    const { wrapper } = createWrapper(client);
    const { result } = renderHook(() => useBlobUpload(), { wrapper });

    const file = new File(['x'], 'x.txt', { type: 'text/plain' });

    await act(async () => {
      await expect(result.current.upload({ file, containerName: 'docs' })).rejects.toThrow();
    });

    expect(result.current.state.phase).toBe('error');

    act(() => {
      result.current.reset();
    });

    expect(result.current.state.phase).toBe('idle');
    expect(result.current.state.progress).toBe(0);
    expect(result.current.state.error).toBeNull();
  });

  it('should use application/octet-stream when file type is empty', async () => {
    const client = createMockClient();
    vi.mocked(client.post).mockResolvedValueOnce({ data: mockTicket });

    const { wrapper } = createWrapper(client);
    const { result } = renderHook(() => useBlobUpload(), { wrapper });

    const file = new File(['data'], 'unknown', { type: '' });

    await act(async () => {
      result.current.upload({ file, containerName: 'docs' });
      await waitFor(() => expect(xhrInstances).toHaveLength(1));
    });

    expect(client.post).toHaveBeenCalledWith('/api/v1/blob-storage/blobs/upload', {
      containerName: 'docs',
      fileName: 'unknown',
      contentType: 'application/octet-stream',
      sizeBytes: 4,
    });
  });
});
