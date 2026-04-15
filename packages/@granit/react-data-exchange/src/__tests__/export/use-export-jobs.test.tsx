import { createTestQueryClient } from '@granit/react-testing';
import { QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react';
import axios from 'axios';
import { describe, expect, it, vi } from 'vitest';

import { useExportJobs } from '../../export/hooks/use-export-jobs.js';
import { ExportProvider } from '../../export/providers/export-provider.js';

import type { ExportConfig } from '../../export/providers/export-provider.js';
import type { ReactNode } from 'react';

const mockClient = axios.create();

const mockConfig: ExportConfig = {
  client: mockClient,
  basePath: '/api/v1/data-exchange',
};

function createWrapper() {
  const queryClient = createTestQueryClient();
  return function Wrapper({ children }: { children: ReactNode }) {
    return (
      <QueryClientProvider client={queryClient}>
        <ExportProvider config={mockConfig}>{children}</ExportProvider>
      </QueryClientProvider>
    );
  };
}

describe('useExportJobs', () => {
  it('fetches export jobs without params', async () => {
    const paginatedResponse = {
      items: [
        {
          id: 'job-1',
          definitionName: 'Test',
          format: 'xlsx',
          status: 'Completed',
          rowCount: 100,
          fileName: 'export.xlsx',
          errorMessage: null,
          createdAt: '2026-03-17T10:00:00Z',
          completedAt: '2026-03-17T10:01:00Z',
        },
      ],
      totalCount: 1,
    };
    vi.spyOn(mockClient, 'get').mockResolvedValueOnce({ data: paginatedResponse });

    const { result } = renderHook(() => useExportJobs(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data?.items).toHaveLength(1);
    expect(result.current.data?.totalCount).toBe(1);
    expect(mockClient.get).toHaveBeenCalledWith('/api/v1/data-exchange/export/jobs', {
      params: undefined,
    });
  });

  it('passes filtering params to the API', async () => {
    vi.spyOn(mockClient, 'get').mockResolvedValueOnce({
      data: { items: [], totalCount: 0 },
    });

    const { result } = renderHook(
      () => useExportJobs({ status: 'Failed', page: 2, pageSize: 10 }),
      { wrapper: createWrapper() }
    );

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockClient.get).toHaveBeenCalledWith('/api/v1/data-exchange/export/jobs', {
      params: { status: 'Failed', page: 2, pageSize: 10 },
    });
  });

  it('handles fetch error', async () => {
    vi.spyOn(mockClient, 'get').mockRejectedValueOnce(new Error('Server Error'));

    const { result } = renderHook(() => useExportJobs(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(result.current.error?.message).toBe('Server Error');
  });
});
