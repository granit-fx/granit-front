import { ScheduledActionStatus } from '@granit/scheduling';
import { toISODateString } from '@granit/types';
import { http, HttpResponse } from 'msw';

import { mockScheduledActions } from './data.js';

import type { PagedResult } from '@granit/query-engine';
import type { ScheduledActionResponse } from '@granit/scheduling';

// ---------------------------------------------------------------------------
// Helpers — parse @granit/query-engine serialized query params
// ---------------------------------------------------------------------------

function parseFilters(url: URL): { field: string; operator: string; value: string }[] {
  const filters: { field: string; operator: string; value: string }[] = [];
  const filterRegex = /^filter\[(.+)\.(\w+)\]$/;
  for (const [key, value] of url.searchParams.entries()) {
    const match = filterRegex.exec(key);
    if (match?.[1] && match[2]) {
      filters.push({ field: match[1], operator: match[2], value });
    }
  }
  return filters;
}

function parseSort(url: URL): { field: string; desc: boolean }[] {
  const sortStr = url.searchParams.get('sort');
  if (!sortStr) return [];
  return sortStr.split(',').map((part) => {
    if (part.startsWith('-')) {
      return { field: part.slice(1), desc: true };
    }
    return { field: part, desc: false };
  });
}

function applyStringFilter(value: string, operator: string, filterValue: string): boolean {
  const v = value.toLowerCase();
  const f = filterValue.toLowerCase();
  switch (operator) {
    case 'Eq':
      return v === f;
    case 'Contains':
      return v.includes(f);
    default:
      return true;
  }
}

function applyNumberFilter(value: number, operator: string, filterValue: string): boolean {
  const f = Number(filterValue);
  switch (operator) {
    case 'Eq':
      return value === f;
    case 'In':
      return filterValue.split(',').map(Number).includes(value);
    default:
      return true;
  }
}

function applyDateFilter(value: string, operator: string, filterValue: string): boolean {
  const d = new Date(value).getTime();
  switch (operator) {
    case 'Gte':
      return d >= new Date(filterValue).getTime();
    case 'Lte':
      return d <= new Date(filterValue).getTime();
    case 'Between': {
      const parts = filterValue.split(',');
      const from = parts[0] ?? '';
      const to = parts[1] ?? '';
      return d >= new Date(from).getTime() && d <= new Date(to).getTime();
    }
    default:
      return true;
  }
}

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
 * @param baseUrl - API base path (default: `/api/granit/scheduling`)
 */
export function createSchedulingHandlers(baseUrl = '/api/granit/scheduling') {
  return [
    // GET list — supports @granit/query-engine serialized params
    http.get(`${baseUrl}/query`, ({ request }) => {
      const url = new URL(request.url);
      const search = url.searchParams.get('search') ?? '';
      const page = Number(url.searchParams.get('page') ?? 1);
      const pageSize = Number(url.searchParams.get('pageSize') ?? 20);

      const filters = parseFilters(url);
      const sortEntries = parseSort(url);
      const presetStatus = url.searchParams.get('presets[status]');

      let filtered = [...mockScheduledActions];

      // Apply preset filters
      if (presetStatus) {
        const presetNames = presetStatus.split(',');
        const allowedStatuses = presetNames
          .map((name) => statusPresetMap[name])
          .filter((s) => s !== undefined);
        filtered = filtered.filter((a) => allowedStatuses.includes(a.status));
      }

      // Apply advanced filters
      for (const f of filters) {
        filtered = filtered.filter((action) => {
          const fieldValue = action[f.field as keyof ScheduledActionResponse];
          if (f.field === 'status') {
            return applyNumberFilter(fieldValue as number, f.operator, f.value);
          }
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

      // Sort
      const firstSort = sortEntries[0];
      if (firstSort) {
        const { field, desc } = firstSort;
        filtered.sort((a, b) => {
          const aVal = a[field as keyof ScheduledActionResponse];
          const bVal = b[field as keyof ScheduledActionResponse];
          let cmp: number;
          if (typeof aVal === 'number' && typeof bVal === 'number') {
            cmp = aVal - bVal;
          } else {
            cmp = String(aVal ?? '').localeCompare(String(bVal ?? ''));
          }
          return desc ? -cmp : cmp;
        });
      } else {
        filtered.sort((a, b) => b.executeAt.localeCompare(a.executeAt));
      }

      const start = (page - 1) * pageSize;
      const response: PagedResult<ScheduledActionResponse> = {
        items: filtered.slice(start, start + pageSize),
        totalCount: filtered.length,
        nextCursor: undefined,
      };

      return HttpResponse.json(response);
    }),

    // GET by ID
    http.get(`${baseUrl}/:id`, ({ params }) => {
      const action = mockScheduledActions.find((a) => a.id === params.id);
      if (!action) return new HttpResponse(null, { status: 404 });
      return HttpResponse.json(action);
    }),

    // DELETE — cancel a pending action
    http.delete(`${baseUrl}/:id`, ({ params }) => {
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

    // PUT — reschedule a pending action
    http.put(`${baseUrl}/:id/reschedule`, async ({ params, request }) => {
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
      return HttpResponse.json(action);
    }),
  ];
}
