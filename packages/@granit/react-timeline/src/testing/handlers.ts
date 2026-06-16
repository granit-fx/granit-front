import { created, noContent } from '@granit/testing/msw';
import { toEntityId, toISODateString } from '@granit/types';
import { http, HttpResponse } from 'msw';

import { DEFAULT_BASE_PATH } from '../constants';

import { mockTimelineEntries } from './data';

import type {
  ReactionAggregateResponse,
  ReactionEmoji,
  TimelineStreamEntryResponse,
  TimelineEntryPage,
} from '@granit/timeline';

/**
 * Create stateful MSW handlers for timeline endpoints.
 *
 * @param baseUrl - API base path (default: `/api/v1/timeline`)
 */
export function createTimelineHandlers(baseUrl = DEFAULT_BASE_PATH) {
  let entries: TimelineStreamEntryResponse[] = [...mockTimelineEntries];

  return [
    // GET /:entityType/:entityId — paginated stream
    http.get(`${baseUrl}/:entityType/:entityId`, ({ request }) => {
      const url = new URL(request.url);
      const page = Number(url.searchParams.get('page') ?? 1);
      const pageSize = Number(url.searchParams.get('pageSize') ?? 20);
      const start = (page - 1) * pageSize;
      const slice = entries.slice(start, start + pageSize);

      const result: TimelineEntryPage = {
        items: slice,
        totalCount: entries.length,
        hasMore: start + slice.length < entries.length,
        nextCursor: null,
      };

      return HttpResponse.json(result);
    }),

    // POST /:entityType/:entityId/entries — add a new entry
    http.post(`${baseUrl}/:entityType/:entityId/entries`, async ({ request }) => {
      const body = (await request.json()) as {
        entryType: TimelineStreamEntryResponse['entryType'];
        body: string;
        parentEntryId?: string;
      };

      const entry: TimelineStreamEntryResponse = {
        id: toEntityId<'TimelineStreamEntryResponse'>(`tl-${Date.now()}`),
        entryType: body.entryType,
        body: body.body,
        authorId: toEntityId<'User'>('admin-001'),
        authorName: 'System Admin',
        parentEntryId: body.parentEntryId
          ? toEntityId<'TimelineStreamEntryResponse'>(body.parentEntryId)
          : null,
        occurredAt: toISODateString(new Date().toISOString()),
        attachments: [],
      };

      entries = [entry, ...entries];
      return created(entry);
    }),

    // PATCH /:entityType/:entityId/entries/:entryId — edit entry body
    http.patch(`${baseUrl}/:entityType/:entityId/entries/:entryId`, async ({ params, request }) => {
      const { body: newBody } = (await request.json()) as { body: string };
      const now = toISODateString(new Date().toISOString());
      entries = entries.map((e) =>
        e.id === params.entryId ? { ...e, body: newBody, editedAt: now } : e
      );
      return noContent();
    }),

    // DELETE /:entityType/:entityId/entries/:entryId — remove an entry
    http.delete(`${baseUrl}/:entityType/:entityId/entries/:entryId`, ({ params }) => {
      entries = entries.filter((e) => e.id !== params.entryId);
      return noContent();
    }),

    // POST /:entityType/:entityId/anchor — materialise shadow row for external entry
    http.post(`${baseUrl}/:entityType/:entityId/anchor`, async ({ request }) => {
      const { sourceKey, sourceId } = (await request.json()) as {
        sourceKey: string;
        sourceId: string;
      };
      // Deterministic stub id — real backend derives a v5 GUID from tenant+coords.
      const stubId = toEntityId<'TimelineStreamEntryResponse'>(`anchor-${sourceKey}-${sourceId}`);
      return HttpResponse.json({ entryId: stubId });
    }),

    // POST /entries/:entryId/reactions/:emoji — toggle reaction
    http.post(`${baseUrl}/entries/:entryId/reactions/:emoji`, ({ params }) => {
      const entryId = params.entryId as string;
      const emojiRaw = decodeURIComponent(params.emoji as string);
      const emoji = emojiRaw as ReactionEmoji;

      let count = 0;
      let currentUserHasReacted = false;

      entries = entries.map((e) => {
        if (e.id !== entryId) return e;
        const reactions: Partial<Record<ReactionEmoji, ReactionAggregateResponse>> = {
          ...(e.reactions ?? {}),
        };
        const existing = reactions[emoji];
        if (existing?.byCurrentUser) {
          // Toggle off
          count = existing.count - 1;
          currentUserHasReacted = false;
          if (count <= 0) {
            delete (reactions as Record<string, unknown>)[emoji];
          } else {
            reactions[emoji] = { count, byCurrentUser: false, displayEmoji: emojiRaw };
          }
        } else {
          // Toggle on
          count = (existing?.count ?? 0) + 1;
          currentUserHasReacted = true;
          reactions[emoji] = { count, byCurrentUser: true, displayEmoji: emojiRaw };
        }
        return { ...e, reactions };
      });

      return HttpResponse.json({ entryId, emoji, count, currentUserHasReacted });
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
