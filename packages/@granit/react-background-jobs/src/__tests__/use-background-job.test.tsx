import { createTestQueryClient } from '@granit/react-testing';
import { createMockClient } from '@granit/testing';
import { toISODateString } from '@granit/types';
import { QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react';
import * as React from 'react';
import { describe, expect, it, vi } from 'vitest';

import { useBackgroundJob } from '../hooks/use-background-jobs';
import { BackgroundJobsProvider } from '../providers/background-jobs-provider';

import type { BackgroundJobsConfig } from '../providers/background-jobs-provider';
import type { BackgroundJobStatus } from '@granit/background-jobs';
import type { AxiosInstance } from 'axios';

function createWrapper(client: AxiosInstance, basePath?: string) {
  const queryClient = createTestQueryClient();
  const config: BackgroundJobsConfig = { client, basePath };
  return {
    wrapper: ({ children }: { children: React.ReactNode }) => (
      <QueryClientProvider client={queryClient}>
        <BackgroundJobsProvider config={config}>{children}</BackgroundJobsProvider>
      </QueryClientProvider>
    ),
    queryClient,
  };
}

const mockJob: BackgroundJobStatus = {
  jobName: 'InvoiceSync',
  cronExpression: '0 */1 * * *',
  isEnabled: true,
  lastExecutedAt: toISODateString('2026-03-12T10:00:00Z'),
  nextExecutionAt: toISODateString('2026-03-12T11:00:00Z'),
  consecutiveFailures: 0,
  deadLetterCount: 0,
  lastError: null,
};

describe('useBackgroundJob', () => {
  it('should fetch a single job by name with default basePath', async () => {
    const client = createMockClient();
    vi.mocked(client.get).mockResolvedValueOnce({ data: mockJob });

    const { wrapper } = createWrapper(client);
    const { result } = renderHook(() => useBackgroundJob('InvoiceSync'), { wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(client.get).toHaveBeenCalledWith('/api/v1/background-jobs/jobs/InvoiceSync');
    expect(result.current.data).toEqual(mockJob);
  });

  it('should fetch a single job with custom basePath', async () => {
    const client = createMockClient();
    vi.mocked(client.get).mockResolvedValueOnce({ data: mockJob });

    const { wrapper } = createWrapper(client, '/api/v2/bg');
    const { result } = renderHook(() => useBackgroundJob('InvoiceSync'), { wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(client.get).toHaveBeenCalledWith('/api/v2/bg/jobs/InvoiceSync');
  });

  it('should not fetch when name is empty', () => {
    const client = createMockClient();

    const { wrapper } = createWrapper(client);
    const { result } = renderHook(() => useBackgroundJob(''), { wrapper });

    expect(result.current.fetchStatus).toBe('idle');
    expect(client.get).not.toHaveBeenCalled();
  });

  it('should handle fetch error', async () => {
    const client = createMockClient();
    vi.mocked(client.get).mockRejectedValueOnce(new Error('Not Found'));

    const { wrapper } = createWrapper(client);
    const { result } = renderHook(() => useBackgroundJob('MissingJob'), { wrapper });

    await waitFor(() => expect(result.current.isError).toBe(true));

    expect(result.current.error?.message).toBe('Not Found');
  });

  it('should encode special characters in job name', async () => {
    const client = createMockClient();
    vi.mocked(client.get).mockResolvedValueOnce({ data: mockJob });

    const { wrapper } = createWrapper(client);
    const { result } = renderHook(() => useBackgroundJob('job/with spaces'), {
      wrapper,
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(client.get).toHaveBeenCalledWith('/api/v1/background-jobs/jobs/job%2Fwith%20spaces');
  });
});
