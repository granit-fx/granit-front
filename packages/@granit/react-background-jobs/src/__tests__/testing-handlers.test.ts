import { setupServer } from 'msw/node';
import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';

import { createBackgroundJobHandlers } from '../testing/index';

import type { BackgroundJobStatus } from '@granit/background-jobs';
import type { PagedResult } from '@granit/query-engine';

const BASE = 'http://api.test/api/v1/background-jobs';
const JOBS = `${BASE}/jobs`;
const server = setupServer(...createBackgroundJobHandlers(BASE));

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
afterEach(() => server.resetHandlers(...createBackgroundJobHandlers(BASE)));
afterAll(() => server.close());

describe('createBackgroundJobHandlers — list', () => {
  it('returns a paginated PagedResult of jobs', async () => {
    const response = await fetch(`${JOBS}?page=1&pageSize=20`);
    expect(response.status).toBe(200);

    const body = (await response.json()) as PagedResult<BackgroundJobStatus>;
    expect(body.items.length).toBeGreaterThan(0);
    expect(body.totalCount).toBe(body.items.length);
    // sorted by jobName ascending
    expect(body.items[0].jobName).toBe('audit-log-archival');
  });

  it('honors page/pageSize', async () => {
    const response = await fetch(`${JOBS}?page=1&pageSize=2`);
    const body = (await response.json()) as PagedResult<BackgroundJobStatus>;
    expect(body.items).toHaveLength(2);
    expect(body.totalCount).toBeGreaterThan(body.items.length);
  });
});

describe('createBackgroundJobHandlers — detail', () => {
  it('returns a single job by name', async () => {
    const response = await fetch(`${JOBS}/vault-credential-renewal`);
    expect(response.status).toBe(200);
    const job = (await response.json()) as BackgroundJobStatus;
    expect(job.jobName).toBe('vault-credential-renewal');
  });

  it('returns 404 for an unknown job', async () => {
    const response = await fetch(`${JOBS}/does-not-exist`);
    expect(response.status).toBe(404);
  });
});

describe('createBackgroundJobHandlers — mutations', () => {
  it('pause disables the job and clears its next execution', async () => {
    const pause = await fetch(`${JOBS}/vault-credential-renewal/pause`, { method: 'POST' });
    expect(pause.status).toBe(204);

    const job = (await (
      await fetch(`${JOBS}/vault-credential-renewal`)
    ).json()) as BackgroundJobStatus;
    expect(job.isEnabled).toBe(false);
    expect(job.nextExecutionAt).toBeNull();
  });

  it('resume re-enables the job and schedules a next execution', async () => {
    await fetch(`${JOBS}/vault-credential-renewal/pause`, { method: 'POST' });
    const resume = await fetch(`${JOBS}/vault-credential-renewal/resume`, { method: 'POST' });
    expect(resume.status).toBe(204);

    const job = (await (
      await fetch(`${JOBS}/vault-credential-renewal`)
    ).json()) as BackgroundJobStatus;
    expect(job.isEnabled).toBe(true);
    expect(job.nextExecutionAt).not.toBeNull();
  });

  it('trigger returns 202 and resets failure tracking', async () => {
    const trigger = await fetch(`${JOBS}/keycloak-user-sync/trigger`, { method: 'POST' });
    expect(trigger.status).toBe(202);

    const job = (await (await fetch(`${JOBS}/keycloak-user-sync`)).json()) as BackgroundJobStatus;
    expect(job.consecutiveFailures).toBe(0);
    expect(job.lastError).toBeNull();
  });

  it('returns 404 when mutating an unknown job', async () => {
    const response = await fetch(`${JOBS}/does-not-exist/pause`, { method: 'POST' });
    expect(response.status).toBe(404);
  });
});
