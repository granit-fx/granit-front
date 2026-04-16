import { createTestQueryClient } from '@granit/react-testing';
import { QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react';
import axios from 'axios';
import { describe, expect, it, vi } from 'vitest';

import { useImportJobs } from '../../import/hooks/use-import-jobs.js';
import { ImportProvider } from '../../import/providers/import-provider.js';

import type { ImportConfig } from '../../import/providers/import-provider.js';
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

describe('useImportJobs', () => {
  it('fetches import jobs without params', async () => {
    const paginatedResponse = {
      items: [
        {
          id: 'import-1',
          definitionName: 'Users',
          originalFileName: 'users.csv',
          mimeType: 'text/csv',
          fileSizeBytes: 1024,
          status: 'Completed',
          createdAt: '2026-03-17T10:00:00Z',
          completedAt: '2026-03-17T10:01:00Z',
        },
      ],
      totalCount: 1,
    };
    vi.spyOn(mockClient, 'get').mockResolvedValueOnce({ data: paginatedResponse });

    const { result } = renderHook(() => useImportJobs(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data?.items).toHaveLength(1);
    expect(result.current.data?.totalCount).toBe(1);
    expect(mockClient.get).toHaveBeenCalledWith('/api/v1/data-exchange/import/jobs', {
      params: undefined,
    });
  });

  it('passes filtering params to the API', async () => {
    vi.spyOn(mockClient, 'get').mockResolvedValueOnce({
      data: { items: [], totalCount: 0 },
    });

    const { result } = renderHook(
      () => useImportJobs({ status: 'Failed', page: 3, pageSize: 10 }),
      { wrapper: createWrapper() }
    );

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockClient.get).toHaveBeenCalledWith('/api/v1/data-exchange/import/jobs', {
      params: { status: 'Failed', page: 3, pageSize: 10 },
    });
  });

  it('handles fetch error', async () => {
    vi.spyOn(mockClient, 'get').mockRejectedValueOnce(new Error('Network Error'));

    const { result } = renderHook(() => useImportJobs(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(result.current.error?.message).toBe('Network Error');
  });
});
