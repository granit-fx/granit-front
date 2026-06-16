import { DATE_OPERATORS, STRING_OPERATORS } from '@granit/query-engine';
import { createQueryMetaHandler } from '@granit/react-query-engine/testing';
import { ScheduledActionStatus } from '@granit/scheduling';
import {
  applyDateFilter,
  applyStringFilter,
  paginate,
  parseFilters,
  parseSort,
  sortItems,
} from '@granit/testing/msw';
import { toISODateString } from '@granit/types';
import { http, HttpResponse } from 'msw';

import { DEFAULT_BASE_PATH } from '../constants';

import { mockScheduledActions } from './data';

import type { PagedResult, QueryMetadata } from '@granit/query-engine';
import type { ScheduledActionResponse } from '@granit/scheduling';

/** Mock /meta payload for the scheduled-actions resource. */
export const scheduledActionQueryMetadata: QueryMetadata = {
  columns: [
    {
      name: 'id',
      label: 'ID',
      type: 'Guid',
      order: 0,
      isSortable: false,
      isFilterable: false,
      isVisible: false,
    },
    {
      name: 'payloadType',
      label: 'Payload type',
      type: 'String',
      order: 1,
      isSortable: true,
      isFilterable: true,
      isVisible: true,
    },
    {
      name: 'status',
      label: 'Status',
      type: 'String',
      order: 2,
      isSortable: true,
      isFilterable: true,
      isVisible: true,
    },
    {
      name: 'executeAt',
      label: 'Execute at',
      type: 'DateTime',
      order: 3,
      isSortable: true,
      isFilterable: true,
      isVisible: true,
    },
    {
      name: 'executedAt',
      label: 'Executed at',
      type: 'DateTime',
      order: 4,
      isSortable: true,
      isFilterable: true,
      isVisible: true,
    },
    {
      name: 'correlationId',
      label: 'Correlation ID',
      type: 'String',
      order: 5,
      isSortable: false,
      isFilterable: true,
      isVisible: false,
    },
    {
      name: 'cancelledBy',
      label: 'Cancelled by',
      type: 'String',
      order: 6,
      isSortable: false,
      isFilterable: true,
      isVisible: false,
    },
    {
      name: 'failureReason',
      label: 'Failure reason',
      type: 'String',
      order: 7,
      isSortable: false,
      isFilterable: true,
      isVisible: false,
    },
    {
      name: 'createdAt',
      label: 'Created at',
      type: 'DateTime',
      order: 8,
      isSortable: true,
      isFilterable: true,
      isVisible: false,
    },
  ],
  filterableFields: [
    { name: 'payloadType', type: 'String', operators: STRING_OPERATORS },
    { name: 'status', type: 'String', operators: STRING_OPERATORS },
    { name: 'executeAt', type: 'DateTime', operators: DATE_OPERATORS },
    { name: 'executedAt', type: 'DateTime', operators: DATE_OPERATORS },
    { name: 'correlationId', type: 'String', operators: STRING_OPERATORS },
    { name: 'cancelledBy', type: 'String', operators: STRING_OPERATORS },
    { name: 'failureReason', type: 'String', operators: STRING_OPERATORS },
    { name: 'createdAt', type: 'DateTime', operators: DATE_OPERATORS },
  ],
  sortableFields: [
    { name: 'payloadType' },
    { name: 'status' },
    { name: 'executeAt' },
    { name: 'executedAt' },
    { name: 'createdAt' },
  ],
  presetFilterGroups: [
    {
      name: 'status',
      label: 'Status',
      presets: [
        { name: 'pending', label: 'Pending', isDefault: true },
        { name: 'processing', label: 'Processing', isDefault: false },
        { name: 'executed', label: 'Executed', isDefault: false },
        { name: 'cancelled', label: 'Cancelled', isDefault: false },
        { name: 'failed', label: 'Failed', isDefault: false },
      ],
    },
  ],
  quickFilters: [
    { name: 'pending', label: 'Pending', isDefault: true },
    { name: 'failed', label: 'Failed', isDefault: false },
  ],
  dateFilters: [
    {
      name: 'executeAt',
      defaultPeriod: 'ThisMonth',
      availablePeriods: [
        'Today',
        'ThisWeek',
        'ThisMonth',
        'LastMonth',
        'ThisQuarter',
        'ThisYear',
        'Custom',
      ],
    },
  ],
  groupByFields: [
    { name: 'status', type: 'String' },
    { name: 'payloadType', type: 'String' },
  ],
  pagination: {
    defaultPageSize: 25,
    maxPageSize: 100,
    maxStreamSize: 50_000,
    supportsCursor: false,
  },
  defaultSort: '-executeAt',
};

const statusPresetMap: Record<string, ScheduledActionStatus> = {
  pending: ScheduledActionStatus.Pending,
  executed: ScheduledActionStatus.Executed,
  cancelled: ScheduledActionStatus.Cancelled,
  failed: ScheduledActionStatus.Failed,
  processing: ScheduledActionStatus.Processing,
};

/**
 * Create stateful MSW handlers for scheduled action endpoints.
 * Cancel and reschedule calls mutate the in-memory `mockScheduledActions` array.
 *
 * @param baseUrl - API base path (default: `/api/v1/scheduling`)
 */
export function createSchedulingHandlers(baseUrl = DEFAULT_BASE_PATH) {
  const actionsUrl = `${baseUrl}/scheduled-actions`;

  return [
    // GET /scheduled-actions/meta — query metadata
    createQueryMetaHandler(actionsUrl, scheduledActionQueryMetadata),

    // GET list — supports @granit/query-engine serialized params
    http.get(actionsUrl, ({ request }) => {
      const url = new URL(request.url);
      const search = url.searchParams.get('search') ?? '';

      const filters = parseFilters(url);
      const sortEntries = parseSort(url);
      const presetStatus = url.searchParams.get('presets[status]');

      let filtered = [...mockScheduledActions];

      // Apply preset filters
      if (presetStatus) {
        const presetNames = presetStatus.split(',');
        const allowedStatuses = new Set(
          presetNames.map((name) => statusPresetMap[name]).filter((s) => s !== undefined)
        );
        filtered = filtered.filter((a) => allowedStatuses.has(a.status));
      }

      // Apply advanced filters
      for (const f of filters) {
        filtered = filtered.filter((action) => {
          const fieldValue = action[f.field as keyof ScheduledActionResponse];
          if (f.field === 'executeAt') {
            return applyDateFilter(fieldValue as string, f.operator, f.value);
          }
          return applyStringFilter(String(fieldValue ?? ''), f.operator, f.value);
        });
      }

      // Full-text search
      if (search) {
        const q = search.toLowerCase();
        filtered = filtered.filter(
          (a) =>
            a.payloadType.toLowerCase().includes(q) ||
            (a.correlationId?.toLowerCase().includes(q) ?? false)
        );
      }

      // Sort — fall back to executeAt desc when no explicit sort is given
      sortItems(filtered as unknown as Record<string, unknown>[], sortEntries, '-executeAt');

      const paged = paginate(filtered, url);
      const response: PagedResult<ScheduledActionResponse> = {
        ...paged,
        nextCursor: undefined,
      };

      return HttpResponse.json(response);
    }),

    // GET by ID
    http.get(`${actionsUrl}/:id`, ({ params }) => {
      const action = mockScheduledActions.find((a) => a.id === params.id);
      if (!action) return new HttpResponse(null, { status: 404 });
      return HttpResponse.json(action);
    }),

    // DELETE — cancel a pending action
    http.delete(`${actionsUrl}/:id`, ({ params }) => {
      const action = mockScheduledActions.find((a) => a.id === params.id);
      if (!action) {
        return HttpResponse.json(
          { type: 'https://tools.ietf.org/html/rfc7807', title: 'Not Found', status: 404 },
          { status: 404 }
        );
      }
      if (action.status !== ScheduledActionStatus.Pending) {
        return HttpResponse.json(
          {
            type: 'https://tools.ietf.org/html/rfc7807',
            title: 'Conflict',
            status: 409,
            detail: 'This action has already been processed and cannot be cancelled.',
          },
          { status: 409 }
        );
      }
      action.status = ScheduledActionStatus.Cancelled;
      action.cancelledBy = 'admin@example.com';
      return new HttpResponse(null, { status: 204 });
    }),

    // PUT — reschedule a pending action (200 with no body, matching the backend contract)
    http.put(`${actionsUrl}/:id/reschedule`, async ({ params, request }) => {
      const action = mockScheduledActions.find((a) => a.id === params.id);
      if (!action) {
        return HttpResponse.json(
          { type: 'https://tools.ietf.org/html/rfc7807', title: 'Not Found', status: 404 },
          { status: 404 }
        );
      }
      if (action.status !== ScheduledActionStatus.Pending) {
        return HttpResponse.json(
          {
            type: 'https://tools.ietf.org/html/rfc7807',
            title: 'Conflict',
            status: 409,
            detail: 'This action has already been processed and cannot be rescheduled.',
          },
          { status: 409 }
        );
      }
      const body = (await request.json()) as { newExecuteAt: string };
      action.executeAt = toISODateString(body.newExecuteAt);
      action.modifiedAt = toISODateString(new Date().toISOString());
      return new HttpResponse(null, { status: 200 });
    }),
  ];
}
