import { createTestQueryClient } from '@granit/react-testing';
import { QueryClientProvider } from '@tanstack/react-query';
import { act, renderHook, waitFor } from '@testing-library/react';
import axios from 'axios';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { useImportJob } from '../../import/hooks/use-import-job';
import { ImportProvider } from '../../import/providers/import-provider';

import type { ImportConfig } from '../../import/providers/import-provider';
import type { ReactNode } from 'react';

const mockClient = axios.create();

const mockConfig: ImportConfig = {
  client: mockClient,
  basePath: '/api/v1/data-exchange',
};

function createWrapper() {
  const queryClient = createTestQueryClient();
  return function Wrapper({ children }: { children: ReactNode }) {
    return (
      <QueryClientProvider client={queryClient}>
        <ImportProvider config={mockConfig}>{children}</ImportProvider>
      </QueryClientProvider>
    );
  };
}

describe('useImportJob', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('starts with null job and no errors', () => {
    const { result } = renderHook(() => useImportJob(), {
      wrapper: createWrapper(),
    });

    expect(result.current.job).toBeNull();
    expect(result.current.isTerminal).toBe(false);
    expect(result.current.isUploading).toBe(false);
    expect(result.current.isConfirming).toBe(false);
    expect(result.current.isExecuting).toBe(false);
    expect(result.current.isPolling).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it('uploads a file and sets job', async () => {
    const jobResponse = {
      id: 'job-1',
      status: 'Created' as const,
      definitionName: 'Test',
      originalFileName: 'data.csv',
    };
    vi.spyOn(mockClient, 'post').mockResolvedValueOnce({ data: jobResponse });

    const { result } = renderHook(() => useImportJob(), {
      wrapper: createWrapper(),
    });

    act(() => {
      result.current.upload(new File(['data'], 'data.csv'), 'Test');
    });

    await waitFor(() => expect(result.current.job).not.toBeNull());
    expect(result.current.job?.id).toBe('job-1');
    expect(result.current.job?.status).toBe('Created');
  });

  it('confirms mappings and updates job', async () => {
    const jobResponse = {
      id: 'job-2',
      status: 'Created' as const,
      definitionName: 'Test',
      originalFileName: 'data.csv',
    };
    const mappedJob = { ...jobResponse, status: 'Mapped' as const };

    const postSpy = vi.spyOn(mockClient, 'post');
    postSpy.mockResolvedValueOnce({ data: jobResponse });

    const { result } = renderHook(() => useImportJob(), {
      wrapper: createWrapper(),
    });

    // Upload first
    act(() => {
      result.current.upload(new File(['data'], 'data.csv'), 'Test');
    });
    await waitFor(() => expect(result.current.job?.id).toBe('job-2'));

    // Confirm mappings — the hook fetches the current job (for the concurrency
    // stamp) before the PUT, then refetches it again in onSuccess.
    vi.spyOn(mockClient, 'put').mockResolvedValueOnce({ data: undefined });
    const getSpy = vi.spyOn(mockClient, 'get');
    getSpy.mockResolvedValueOnce({ data: { ...jobResponse, concurrencyStamp: 'stamp-1' } });
    getSpy.mockResolvedValueOnce({ data: mappedJob });

    act(() => {
      result.current.confirmMap([]);
    });

    await waitFor(() => expect(result.current.job?.status).toBe('Mapped'));
  });

  it('executes import and sets dispatched state', async () => {
    const jobResponse = {
      id: 'job-3',
      status: 'Mapped' as const,
      definitionName: 'Test',
      originalFileName: 'data.csv',
    };

    vi.spyOn(mockClient, 'post').mockResolvedValueOnce({ data: jobResponse });

    const { result } = renderHook(() => useImportJob(), {
      wrapper: createWrapper(),
    });

    act(() => {
      result.current.upload(new File(['data'], 'data.csv'), 'Test');
    });
    await waitFor(() => expect(result.current.job).not.toBeNull());

    // Execute
    const postSpy = vi.spyOn(mockClient, 'post');
    postSpy.mockResolvedValueOnce({ data: undefined });
    // Mock the polling query
    vi.spyOn(mockClient, 'get').mockReturnValue(new Promise(() => {}));

    act(() => {
      result.current.execute();
    });

    await waitFor(() => expect(result.current.isExecuting).toBe(true));
  });

  it('cancels import job', async () => {
    const jobResponse = {
      id: 'job-4',
      status: 'Mapped' as const,
      definitionName: 'Test',
      originalFileName: 'data.csv',
    };
    const cancelledJob = { ...jobResponse, status: 'Cancelled' as const };

    vi.spyOn(mockClient, 'post').mockResolvedValueOnce({ data: jobResponse });

    const { result } = renderHook(() => useImportJob(), {
      wrapper: createWrapper(),
    });

    act(() => {
      result.current.upload(new File(['data'], 'data.csv'), 'Test');
    });
    await waitFor(() => expect(result.current.job).not.toBeNull());

    vi.spyOn(mockClient, 'delete').mockResolvedValueOnce({ data: undefined });
    vi.spyOn(mockClient, 'get').mockResolvedValueOnce({ data: cancelledJob });

    act(() => {
      result.current.cancel();
    });

    await waitFor(() => expect(result.current.job?.status).toBe('Cancelled'));
    expect(result.current.isTerminal).toBe(true);
  });

  it('resets state completely', async () => {
    const jobResponse = {
      id: 'job-5',
      status: 'Created' as const,
      definitionName: 'Test',
      originalFileName: 'data.csv',
    };
    vi.spyOn(mockClient, 'post').mockResolvedValueOnce({ data: jobResponse });

    const { result } = renderHook(() => useImportJob(), {
      wrapper: createWrapper(),
    });

    act(() => {
      result.current.upload(new File(['data'], 'data.csv'), 'Test');
    });
    await waitFor(() => expect(result.current.job).not.toBeNull());

    act(() => {
      result.current.reset();
    });

    await waitFor(() => expect(result.current.job).toBeNull());
    expect(result.current.isTerminal).toBe(false);
    expect(result.current.isUploading).toBe(false);
    expect(result.current.isPolling).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it('propagates upload error', async () => {
    vi.spyOn(mockClient, 'post').mockRejectedValueOnce(new Error('Upload failed'));

    const { result } = renderHook(() => useImportJob(), {
      wrapper: createWrapper(),
    });

    act(() => {
      result.current.upload(new File(['data'], 'data.csv'), 'Test');
    });

    await waitFor(() => expect(result.current.error).not.toBeNull());
    expect(result.current.error?.message).toBe('Upload failed');
  });

  it('detects terminal statuses correctly', async () => {
    const jobResponse = {
      id: 'job-6',
      status: 'Completed' as const,
      definitionName: 'Test',
      originalFileName: 'data.csv',
    };
    vi.spyOn(mockClient, 'post').mockResolvedValueOnce({ data: jobResponse });

    const { result } = renderHook(() => useImportJob(), {
      wrapper: createWrapper(),
    });

    act(() => {
      result.current.upload(new File(['data'], 'data.csv'), 'Test');
    });

    await waitFor(() => expect(result.current.isTerminal).toBe(true));
    expect(result.current.isPolling).toBe(false);
  });
});
