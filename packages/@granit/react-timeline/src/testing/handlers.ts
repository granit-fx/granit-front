import { noContent } from '@granit/testing/msw';
import { toEntityId, toISODateString } from '@granit/types';
import { http, HttpResponse } from 'msw';

import { mockTimelineEntries } from './data.js';

import type { TimelineEntry, TimelineEntryPage } from '@granit/timeline';

/**
 * Create stateful MSW handlers for timeline endpoints.
 *
 * @param baseUrl - API base path (default: `/api/v1/timeline`)
 */
export function createTimelineHandlers(baseUrl = '/api/v1/timeline') {
  let entries: TimelineEntry[] = [...mockTimelineEntries];

  return [
    // GET /:entityType/:entityId — paginated stream
    http.get(`${baseUrl}/:entityType/:entityId`, ({ request }) => {
      const url = new URL(request.url);
      const page = Number(url.searchParams.get('page') ?? 1);
      const pageSize = Number(url.searchParams.get('pageSize') ?? 20);
      const start = (page - 1) * pageSize;

      const result: TimelineEntryPage = {
        items: entries.slice(start, start + pageSize),
        totalCount: entries.length,
        nextCursor: null,
      };

      return HttpResponse.json(result);
    }),

    // POST /:entityType/:entityId/entries — add a new entry
    http.post(`${baseUrl}/:entityType/:entityId/entries`, async ({ request }) => {
      const body = (await request.json()) as {
        entryType: number;
        body: string;
        parentEntryId?: string;
      };

      const entry: TimelineEntry = {
        id: toEntityId<'TimelineEntry'>(`tl-${Date.now()}`),
        entryType: body.entryType as TimelineEntry['entryType'],
        body: body.body,
        authorId: toEntityId<'User'>('admin-001'),
        authorName: 'System Admin',
        parentEntryId: body.parentEntryId ? toEntityId<'TimelineEntry'>(body.parentEntryId) : null,
        occurredAt: toISODateString(new Date().toISOString()),
        attachments: [],
      };

      entries = [entry, ...entries];
      return HttpResponse.json(entry, { status: 201 });
    }),

    // DELETE /:entityType/:entityId/entries/:entryId — remove an entry
    http.delete(`${baseUrl}/:entityType/:entityId/entries/:entryId`, ({ params }) => {
      entries = entries.filter((e) => e.id !== params.entryId);
      return noContent();
    }),

    // POST /:entityType/:entityId/follow — follow entity
    http.post(`${baseUrl}/:entityType/:entityId/follow`, () => noContent()),

    // DELETE /:entityType/:entityId/follow — unfollow entity
    http.delete(`${baseUrl}/:entityType/:entityId/follow`, () => noContent()),

    // GET /:entityType/:entityId/followers — list followers
    http.get(`${baseUrl}/:entityType/:entityId/followers`, () => {
      return HttpResponse.json(['admin-001']);
    }),
  ];
}
