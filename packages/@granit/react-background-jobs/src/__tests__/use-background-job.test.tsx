import { createQueryWrapper } from '@granit/react-testing';
import { createMockClient } from '@granit/testing';
import { toISODateString } from '@granit/types';
import { renderHook, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { useBackgroundJob } from '../hooks/use-background-jobs.js';

import type { BackgroundJobStatus } from '@granit/background-jobs';

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

    const wrapper = createQueryWrapper();
    const { result } = renderHook(() => useBackgroundJob('InvoiceSync', { client }), { wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(client.get).toHaveBeenCalledWith('/api/v1/background-jobs/InvoiceSync');
    expect(result.current.data).toEqual(mockJob);
  });

  it('should fetch a single job with custom basePath', async () => {
    const client = createMockClient();
    vi.mocked(client.get).mockResolvedValueOnce({ data: mockJob });

    const wrapper = createQueryWrapper();
    const { result } = renderHook(
      () => useBackgroundJob('InvoiceSync', { client, basePath: '/api/v2/jobs' }),
      { wrapper }
    );

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(client.get).toHaveBeenCalledWith('/api/v2/jobs/InvoiceSync');
  });

  it('should not fetch when name is empty', () => {
    const client = createMockClient();

    const wrapper = createQueryWrapper();
    const { result } = renderHook(() => useBackgroundJob('', { client }), { wrapper });

    expect(result.current.fetchStatus).toBe('idle');
    expect(client.get).not.toHaveBeenCalled();
  });

  it('should handle fetch error', async () => {
    const client = createMockClient();
    vi.mocked(client.get).mockRejectedValueOnce(new Error('Not Found'));

    const wrapper = createQueryWrapper();
    const { result } = renderHook(() => useBackgroundJob('MissingJob', { client }), { wrapper });

    await waitFor(() => expect(result.current.isError).toBe(true));

    expect(result.current.error?.message).toBe('Not Found');
  });

  it('should encode special characters in job name', async () => {
    const client = createMockClient();
    vi.mocked(client.get).mockResolvedValueOnce({ data: mockJob });

    const wrapper = createQueryWrapper();
    const { result } = renderHook(() => useBackgroundJob('job/with spaces', { client }), {
      wrapper,
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(client.get).toHaveBeenCalledWith('/api/v1/background-jobs/job%2Fwith%20spaces');
  });
});
