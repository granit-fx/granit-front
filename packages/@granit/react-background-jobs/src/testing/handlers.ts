import { accepted, noContent, notFound, pagedResponse } from '@granit/testing/msw';
import { toISODateString } from '@granit/types';
import { http, HttpResponse } from 'msw';

import { DEFAULT_BASE_PATH } from '../constants';

import { mockBackgroundJobs } from './data';

import type { BackgroundJobStatus } from '@granit/background-jobs';

/**
 * Create stateful MSW handlers for background job endpoints.
 * Handlers mutate the in-memory `mockBackgroundJobs` array — pause/resume/trigger
 * calls update state that subsequent GET calls reflect.
 *
 * Mirrors the five `Granit.BackgroundJobs.Endpoints` routes (paginated list,
 * detail, pause, resume, trigger). Background jobs are NOT a query-engine
 * resource: the backend exposes plain `page`/`pageSize` pagination with no
 * `/meta`, filtering, or sorting endpoint.
 *
 * @param baseUrl - Module base path (default: `/api/v1/background-jobs`)
 */
export function createBackgroundJobHandlers(baseUrl = DEFAULT_BASE_PATH) {
  const jobsUrl = `${baseUrl}/jobs`;

  return [
    // GET list — sorted, paginated
    http.get(jobsUrl, ({ request }) => {
      const url = new URL(request.url);
      const page = Number(url.searchParams.get('page') ?? 1);
      const pageSize = Number(url.searchParams.get('pageSize') ?? 20);

      const sorted = [...mockBackgroundJobs].sort((a, b) => a.jobName.localeCompare(b.jobName));

      const start = (page - 1) * pageSize;
      return pagedResponse<BackgroundJobStatus>(
        sorted.slice(start, start + pageSize),
        sorted.length
      );
    }),

    // GET single job
    http.get(`${jobsUrl}/:name`, ({ params }) => {
      const job = mockBackgroundJobs.find((j) => j.jobName === params.name);
      if (!job) return notFound();
      return HttpResponse.json(job);
    }),

    // POST pause
    http.post(`${jobsUrl}/:name/pause`, ({ params }) => {
      const job = mockBackgroundJobs.find((j) => j.jobName === params.name);
      if (!job) return notFound();
      job.isEnabled = false;
      job.nextExecutionAt = null;
      return noContent();
    }),

    // POST resume
    http.post(`${jobsUrl}/:name/resume`, ({ params }) => {
      const job = mockBackgroundJobs.find((j) => j.jobName === params.name);
      if (!job) return notFound();
      job.isEnabled = true;
      job.nextExecutionAt = toISODateString(new Date(Date.now() + 60_000).toISOString());
      return noContent();
    }),

    // POST trigger
    http.post(`${jobsUrl}/:name/trigger`, ({ params }) => {
      const job = mockBackgroundJobs.find((j) => j.jobName === params.name);
      if (!job) return notFound();
      job.lastExecutedAt = toISODateString(new Date().toISOString());
      job.consecutiveFailures = 0;
      job.lastError = null;
      return accepted();
    }),
  ];
}
