import { createMockClient } from '@granit/testing';
import { toISODateString } from '@granit/types';
import { describe, expect, it, vi } from 'vitest';

import { fetchBackgroundJob, fetchBackgroundJobs } from '../api/background-jobs-api.js';

import type { BackgroundJobStatus } from '../types/index.js';
import type { PagedResult } from '@granit/query-engine';

const BASE = '/api/v1/background-jobs';

const mockJob: BackgroundJobStatus = {
  jobName: 'SendEmails',
  cronExpression: '0 */5 * * *',
  isEnabled: true,
  lastExecutedAt: toISODateString('2026-03-17T10:00:00Z'),
  nextExecutionAt: toISODateString('2026-03-17T10:05:00Z'),
  consecutiveFailures: 0,
  deadLetterCount: 0,
  lastError: null,
};

describe('fetchBackgroundJobs', () => {
  it('calls GET basePath without params', async () => {
    const client = createMockClient();
    const page: PagedResult<BackgroundJobStatus> = {
      items: [mockJob],
      totalCount: 1,
      hasMore: false,
    };
    vi.mocked(client.get).mockResolvedValueOnce({ data: page });

    const result = await fetchBackgroundJobs(client, BASE);
    expect(client.get).toHaveBeenCalledWith(BASE, { params: undefined });
    expect(result).toEqual(page);
  });

  it('passes pagination params to the request', async () => {
    const client = createMockClient();
    const page: PagedResult<BackgroundJobStatus> = {
      items: [mockJob],
      totalCount: 5,
      hasMore: true,
    };
    vi.mocked(client.get).mockResolvedValueOnce({ data: page });

    const result = await fetchBackgroundJobs(client, BASE, { page: 2, pageSize: 10 });
    expect(client.get).toHaveBeenCalledWith(BASE, { params: { page: 2, pageSize: 10 } });
    expect(result.totalCount).toBe(5);
    expect(result.hasMore).toBe(true);
  });
});

describe('fetchBackgroundJob', () => {
  it('calls GET /{name}', async () => {
    const client = createMockClient();
    vi.mocked(client.get).mockResolvedValueOnce({ data: mockJob });

    const result = await fetchBackgroundJob(client, BASE, 'SendEmails');
    expect(client.get).toHaveBeenCalledWith(`${BASE}/SendEmails`);
    expect(result).toEqual(mockJob);
  });

  it('encodes job name with special characters', async () => {
    const client = createMockClient();
    vi.mocked(client.get).mockResolvedValueOnce({ data: {} });

    await fetchBackgroundJob(client, BASE, 'Send Emails');
    expect(client.get).toHaveBeenCalledWith(`${BASE}/Send%20Emails`);
  });

  it('returns the response data directly', async () => {
    const client = createMockClient();
    const job: BackgroundJobStatus = {
      jobName: 'CleanUp',
      cronExpression: '0 0 * * *',
      isEnabled: false,
      lastExecutedAt: null,
      nextExecutionAt: null,
      consecutiveFailures: 3,
      deadLetterCount: 1,
      lastError: 'Timeout',
    };
    vi.mocked(client.get).mockResolvedValueOnce({ data: job });

    const result = await fetchBackgroundJob(client, BASE, 'CleanUp');
    expect(result.isEnabled).toBe(false);
    expect(result.lastError).toBe('Timeout');
    expect(result.consecutiveFailures).toBe(3);
  });
});
