import { createTestQueryClient } from '@granit/react-testing';
import { createMockClient } from '@granit/testing';
import { QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react';
import * as React from 'react';
import { describe, expect, it, vi } from 'vitest';

import {
  backgroundJobKeys,
  useBackgroundJobs,
  usePauseJob,
  useResumeJob,
  useTriggerJob,
} from '../hooks/use-background-jobs.js';

import type { BackgroundJobStatus } from '@granit/background-jobs';
import type { PagedResult } from '@granit/query-engine';

function createWrapper() {
  const queryClient = createTestQueryClient();
  return {
    wrapper: ({ children }: { children: React.ReactNode }) => (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    ),
    queryClient,
  };
}

const mockJob: BackgroundJobStatus = {
  jobName: 'InvoiceSync',
  cronExpression: '0 */1 * * *',
  isEnabled: true,
  lastExecutedAt: '2026-03-12T10:00:00Z',
  nextExecutionAt: '2026-03-12T11:00:00Z',
  consecutiveFailures: 0,
  deadLetterCount: 0,
  lastError: null,
};

const mockPage: PagedResult<BackgroundJobStatus> = {
  items: [mockJob],
  totalCount: 1,
  hasMore: false,
};

describe('backgroundJobKeys', () => {
  it('should produce stable list key without params', () => {
    expect(backgroundJobKeys.list()).toEqual(['background-jobs', 'list', {}]);
  });

  it('should produce stable list key with params', () => {
    expect(backgroundJobKeys.list({ page: 2, pageSize: 10 })).toEqual([
      'background-jobs',
      'list',
      { page: 2, pageSize: 10 },
    ]);
  });

  it('should produce stable job key', () => {
    expect(backgroundJobKeys.job('InvoiceSync')).toEqual(['background-jobs', 'job', 'InvoiceSync']);
  });
});

describe('useBackgroundJobs', () => {
  it('should fetch jobs with default basePath', async () => {
    const client = createMockClient();
    vi.mocked(client.get).mockResolvedValueOnce({ data: mockPage });

    const { wrapper } = createWrapper();
    const { result } = renderHook(() => useBackgroundJobs({ client }), { wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(client.get).toHaveBeenCalledWith('/api/v1/background-jobs', { params: undefined });
    expect(result.current.data).toEqual(mockPage);
  });

  it('should fetch jobs with custom basePath', async () => {
    const client = createMockClient();
    vi.mocked(client.get).mockResolvedValueOnce({ data: mockPage });

    const { wrapper } = createWrapper();
    const { result } = renderHook(() => useBackgroundJobs({ client, basePath: '/api/v2/jobs' }), {
      wrapper,
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(client.get).toHaveBeenCalledWith('/api/v2/jobs', { params: undefined });
  });

  it('should pass pagination params to the request', async () => {
    const client = createMockClient();
    vi.mocked(client.get).mockResolvedValueOnce({ data: mockPage });

    const { wrapper } = createWrapper();
    const { result } = renderHook(
      () => useBackgroundJobs({ client, params: { page: 2, pageSize: 10 } }),
      { wrapper }
    );

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(client.get).toHaveBeenCalledWith('/api/v1/background-jobs', {
      params: { page: 2, pageSize: 10 },
    });
  });

  it('should handle fetch error', async () => {
    const client = createMockClient();
    vi.mocked(client.get).mockRejectedValueOnce(new Error('Unauthorized'));

    const { wrapper } = createWrapper();
    const { result } = renderHook(() => useBackgroundJobs({ client }), { wrapper });

    await waitFor(() => expect(result.current.isError).toBe(true));

    expect(result.current.error?.message).toBe('Unauthorized');
  });
});

describe('usePauseJob', () => {
  it('should send POST to correct URL and invalidate on success', async () => {
    const client = createMockClient();
    vi.mocked(client.post).mockResolvedValueOnce({ data: undefined });

    const { wrapper, queryClient } = createWrapper();
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');

    const { result } = renderHook(() => usePauseJob({ client }), { wrapper });

    result.current.mutate('InvoiceSync');

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(client.post).toHaveBeenCalledWith('/api/v1/background-jobs/InvoiceSync/pause');
    expect(invalidateSpy).toHaveBeenCalledWith({
      queryKey: backgroundJobKeys.all,
    });
  });

  it('should use custom basePath', async () => {
    const client = createMockClient();
    vi.mocked(client.post).mockResolvedValueOnce({ data: undefined });

    const { wrapper } = createWrapper();
    const { result } = renderHook(() => usePauseJob({ client, basePath: '/api/v2/jobs' }), {
      wrapper,
    });

    result.current.mutate('InvoiceSync');

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(client.post).toHaveBeenCalledWith('/api/v2/jobs/InvoiceSync/pause');
  });

  it('should handle pause error', async () => {
    const client = createMockClient();
    vi.mocked(client.post).mockRejectedValueOnce(new Error('Forbidden'));

    const { wrapper } = createWrapper();
    const { result } = renderHook(() => usePauseJob({ client }), { wrapper });

    result.current.mutate('InvoiceSync');

    await waitFor(() => expect(result.current.isError).toBe(true));

    expect(result.current.error?.message).toBe('Forbidden');
  });
});

describe('useResumeJob', () => {
  it('should send POST to correct URL and invalidate on success', async () => {
    const client = createMockClient();
    vi.mocked(client.post).mockResolvedValueOnce({ data: undefined });

    const { wrapper, queryClient } = createWrapper();
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');

    const { result } = renderHook(() => useResumeJob({ client }), { wrapper });

    result.current.mutate('InvoiceSync');

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(client.post).toHaveBeenCalledWith('/api/v1/background-jobs/InvoiceSync/resume');
    expect(invalidateSpy).toHaveBeenCalledWith({
      queryKey: backgroundJobKeys.all,
    });
  });

  it('should use custom basePath', async () => {
    const client = createMockClient();
    vi.mocked(client.post).mockResolvedValueOnce({ data: undefined });

    const { wrapper } = createWrapper();
    const { result } = renderHook(() => useResumeJob({ client, basePath: '/api/v2/jobs' }), {
      wrapper,
    });

    result.current.mutate('InvoiceSync');

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(client.post).toHaveBeenCalledWith('/api/v2/jobs/InvoiceSync/resume');
  });

  it('should handle resume error', async () => {
    const client = createMockClient();
    vi.mocked(client.post).mockRejectedValueOnce(new Error('Service Unavailable'));

    const { wrapper } = createWrapper();
    const { result } = renderHook(() => useResumeJob({ client }), { wrapper });

    result.current.mutate('InvoiceSync');

    await waitFor(() => expect(result.current.isError).toBe(true));

    expect(result.current.error?.message).toBe('Service Unavailable');
  });
});

describe('useTriggerJob', () => {
  it('should send POST to correct URL and invalidate on success', async () => {
    const client = createMockClient();
    vi.mocked(client.post).mockResolvedValueOnce({ data: undefined });

    const { wrapper, queryClient } = createWrapper();
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');

    const { result } = renderHook(() => useTriggerJob({ client }), { wrapper });

    result.current.mutate('InvoiceSync');

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(client.post).toHaveBeenCalledWith('/api/v1/background-jobs/InvoiceSync/trigger');
    expect(invalidateSpy).toHaveBeenCalledWith({
      queryKey: backgroundJobKeys.all,
    });
  });

  it('should use custom basePath', async () => {
    const client = createMockClient();
    vi.mocked(client.post).mockResolvedValueOnce({ data: undefined });

    const { wrapper } = createWrapper();
    const { result } = renderHook(() => useTriggerJob({ client, basePath: '/api/v2/jobs' }), {
      wrapper,
    });

    result.current.mutate('InvoiceSync');

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(client.post).toHaveBeenCalledWith('/api/v2/jobs/InvoiceSync/trigger');
  });

  it('should handle trigger error', async () => {
    const client = createMockClient();
    vi.mocked(client.post).mockRejectedValueOnce(new Error('Conflict'));

    const { wrapper } = createWrapper();
    const { result } = renderHook(() => useTriggerJob({ client }), { wrapper });

    result.current.mutate('InvoiceSync');

    await waitFor(() => expect(result.current.isError).toBe(true));

    expect(result.current.error?.message).toBe('Conflict');
  });
});
