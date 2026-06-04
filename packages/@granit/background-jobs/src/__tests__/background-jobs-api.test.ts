import { createMockClient } from '@granit/testing';
import { toISODateString } from '@granit/types';
import { describe, expect, it, vi } from 'vitest';

import {
  getBackgroundJob,
  listBackgroundJobs,
  pauseJob,
  resumeJob,
  triggerJob,
} from '../api/background-jobs-api';

import type { BackgroundJobStatus } from '../types/index';
import type { PagedResult } from '@granit/query-engine';

const BASE = '/api/v1/background-jobs/jobs';

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

describe('listBackgroundJobs', () => {
  it('calls GET basePath without params', async () => {
    const client = createMockClient();
    const page: PagedResult<BackgroundJobStatus> = {
      items: [mockJob],
      totalCount: 1,
      hasMore: false,
    };
    vi.mocked(client.get).mockResolvedValueOnce({ data: page });

    const result = await listBackgroundJobs(client, BASE);
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

    const result = await listBackgroundJobs(client, BASE, { page: 2, pageSize: 10 });
    expect(client.get).toHaveBeenCalledWith(BASE, { params: { page: 2, pageSize: 10 } });
    expect(result.totalCount).toBe(5);
    expect(result.hasMore).toBe(true);
  });
});

describe('getBackgroundJob', () => {
  it('calls GET /{name}', async () => {
    const client = createMockClient();
    vi.mocked(client.get).mockResolvedValueOnce({ data: mockJob });

    const result = await getBackgroundJob(client, BASE, 'SendEmails');
    expect(client.get).toHaveBeenCalledWith(`${BASE}/SendEmails`);
    expect(result).toEqual(mockJob);
  });

  it('encodes job name with special characters', async () => {
    const client = createMockClient();
    vi.mocked(client.get).mockResolvedValueOnce({ data: {} });

    await getBackgroundJob(client, BASE, 'Send Emails');
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

    const result = await getBackgroundJob(client, BASE, 'CleanUp');
    expect(result.isEnabled).toBe(false);
    expect(result.lastError).toBe('Timeout');
    expect(result.consecutiveFailures).toBe(3);
  });
});

describe('pauseJob', () => {
  it('POSTs to /{name}/pause', async () => {
    const client = createMockClient();
    vi.mocked(client.post).mockResolvedValueOnce({ data: undefined });

    await pauseJob(client, BASE, 'SendEmails');
    expect(client.post).toHaveBeenCalledWith(`${BASE}/SendEmails/pause`);
  });

  it('encodes the job name', async () => {
    const client = createMockClient();
    vi.mocked(client.post).mockResolvedValueOnce({ data: undefined });

    await pauseJob(client, BASE, 'Send Emails');
    expect(client.post).toHaveBeenCalledWith(`${BASE}/Send%20Emails/pause`);
  });
});

describe('resumeJob', () => {
  it('POSTs to /{name}/resume', async () => {
    const client = createMockClient();
    vi.mocked(client.post).mockResolvedValueOnce({ data: undefined });

    await resumeJob(client, BASE, 'SendEmails');
    expect(client.post).toHaveBeenCalledWith(`${BASE}/SendEmails/resume`);
  });
});

describe('triggerJob', () => {
  it('POSTs to /{name}/trigger', async () => {
    const client = createMockClient();
    vi.mocked(client.post).mockResolvedValueOnce({ data: undefined });

    await triggerJob(client, BASE, 'SendEmails');
    expect(client.post).toHaveBeenCalledWith(`${BASE}/SendEmails/trigger`);
  });
});
