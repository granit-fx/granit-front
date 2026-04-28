import {
  BOOLEAN_OPERATORS,
  DATE_OPERATORS,
  NUMBER_OPERATORS,
  STRING_OPERATORS,
} from '@granit/query-engine';
import { createQueryMetaHandler } from '@granit/react-query-engine/testing';
import { accepted, noContent, notFound, pagedResponse } from '@granit/testing/msw';
import { toISODateString } from '@granit/types';
import { http, HttpResponse } from 'msw';

import { DEFAULT_BASE_PATH } from '../constants.js';

import { mockBackgroundJobs } from './data.js';

import type { BackgroundJobStatus } from '@granit/background-jobs';
import type { QueryMetadata } from '@granit/query-engine';

/** Mock /meta payload for the background jobs resource. */
export const backgroundJobQueryMetadata: QueryMetadata = {
  columns: [
    {
      name: 'jobName',
      label: 'Job name',
      type: 'String',
      order: 0,
      isSortable: true,
      isFilterable: true,
      isVisible: true,
    },
    {
      name: 'cronExpression',
      label: 'Schedule',
      type: 'String',
      order: 1,
      isSortable: false,
      isFilterable: true,
      isVisible: true,
    },
    {
      name: 'isEnabled',
      label: 'Enabled',
      type: 'Boolean',
      order: 2,
      isSortable: true,
      isFilterable: true,
      isVisible: true,
    },
    {
      name: 'lastExecutedAt',
      label: 'Last executed',
      type: 'DateTime',
      order: 3,
      isSortable: true,
      isFilterable: true,
      isVisible: true,
    },
    {
      name: 'nextExecutionAt',
      label: 'Next execution',
      type: 'DateTime',
      order: 4,
      isSortable: true,
      isFilterable: true,
      isVisible: true,
    },
    {
      name: 'consecutiveFailures',
      label: 'Failures',
      type: 'Int32',
      order: 5,
      isSortable: true,
      isFilterable: true,
      isVisible: true,
    },
    {
      name: 'deadLetterCount',
      label: 'Dead-lettered',
      type: 'Int32',
      order: 6,
      isSortable: true,
      isFilterable: true,
      isVisible: true,
    },
    {
      name: 'lastError',
      label: 'Last error',
      type: 'String',
      order: 7,
      isSortable: false,
      isFilterable: true,
      isVisible: true,
    },
  ],
  filterableFields: [
    { name: 'jobName', type: 'String', operators: STRING_OPERATORS },
    { name: 'cronExpression', type: 'String', operators: STRING_OPERATORS },
    { name: 'isEnabled', type: 'Boolean', operators: BOOLEAN_OPERATORS },
    { name: 'lastExecutedAt', type: 'DateTime', operators: DATE_OPERATORS },
    { name: 'nextExecutionAt', type: 'DateTime', operators: DATE_OPERATORS },
    { name: 'consecutiveFailures', type: 'Int32', operators: NUMBER_OPERATORS },
    { name: 'deadLetterCount', type: 'Int32', operators: NUMBER_OPERATORS },
    { name: 'lastError', type: 'String', operators: STRING_OPERATORS },
  ],
  sortableFields: [
    { name: 'jobName' },
    { name: 'isEnabled' },
    { name: 'lastExecutedAt' },
    { name: 'nextExecutionAt' },
    { name: 'consecutiveFailures' },
    { name: 'deadLetterCount' },
  ],
  presetFilterGroups: [],
  quickFilters: [
    { name: 'enabled', label: 'Enabled', isDefault: true },
    { name: 'paused', label: 'Paused', isDefault: false },
    { name: 'failing', label: 'Failing', isDefault: false },
  ],
  dateFilters: [],
  groupByFields: [],
  pagination: {
    defaultPageSize: 20,
    maxPageSize: 100,
    maxStreamSize: 10_000,
    supportsCursor: false,
  },
  defaultSort: 'jobName',
};

/**
 * Create stateful MSW handlers for background job endpoints.
 * Handlers mutate the in-memory `mockBackgroundJobs` array — pause/resume/trigger
 * calls update state that subsequent GET calls reflect.
 *
 * @param baseUrl - Module base path (default: `/api/v1/background-jobs`)
 */
export function createBackgroundJobHandlers(baseUrl = DEFAULT_BASE_PATH) {
  const jobsUrl = `${baseUrl}/jobs`;

  return [
    // GET /jobs/meta — query metadata
    createQueryMetaHandler(jobsUrl, backgroundJobQueryMetadata),

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
