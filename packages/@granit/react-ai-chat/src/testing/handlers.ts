import { DEFAULT_LOOKUP_BASE_PATH } from '@granit/data-lookup';
import { http, HttpResponse } from 'msw';

import { DEFAULT_BASE_PATH } from '../constants';

import {
  mockChatWorkspaces,
  mockConversation,
  mockConversationMessages,
  mockConversationSummaries,
  mockLongConversationId,
  mockLongConversationMessages,
  mockMentionLookupItems,
} from './data';

import type {
  ConversationResponse,
  ConversationSummaryResponse,
  CreateConversationRequest,
  MessageResponse,
  RenameConversationRequest,
  SetConversationFavoriteRequest,
} from '@granit/ai-chat';
import type { LookupItemResponse, LookupResultResponse } from '@granit/data-lookup';
import type { PagedResult } from '@granit/query-engine';
import type { Mutable } from '@granit/testing';

/** One SSE frame line for the conversations stream (flat ChatStreamEvent JSON). */
function frame(event: Record<string, unknown>): string {
  return `data: ${JSON.stringify(event)}\n\n`;
}

/**
 * Create stateful MSW handlers for the agentic chat endpoints. Create / rename /
 * delete mutate an in-memory list reflected by subsequent GETs. The
 * `POST /messages` handler streams flat `ChatStreamEvent` frames
 * (conversation → delta → delta → usage) and closes — no `[DONE]` sentinel.
 *
 * @param baseUrl - API base path (default: `/api/v1/conversations`).
 */
export function createAIChatHandlers(baseUrl = DEFAULT_BASE_PATH) {
  let summaries: Mutable<ConversationSummaryResponse>[] = [...mockConversationSummaries];

  return [
    // GET /conversations/workspaces — before /:id so it is not swallowed.
    http.get(`${baseUrl}/workspaces`, () => HttpResponse.json({ workspaces: mockChatWorkspaces })),

    // GET /conversations — list summaries, newest first.
    http.get(baseUrl, () => HttpResponse.json(summaries)),

    // GET /conversations/:id/messages — one keyset page (generic PagedResult +
    // cursor contract). Server sorts -createdAt → items returned newest-first;
    // `nextCursor` (the opaque id of the page's oldest item) walks OLDER, null at
    // the start of history. Declared before `/:id` so it is not shadowed.
    http.get(`${baseUrl}/:id/messages`, ({ params, request }) => {
      const id = params.id as string;
      // Source fixture is ascending (oldest-first).
      const all: readonly MessageResponse[] =
        id === mockLongConversationId ? mockLongConversationMessages : mockConversationMessages;

      const url = new URL(request.url);
      const pageSize = Math.min(Math.max(Number(url.searchParams.get('pageSize')) || 30, 1), 100);
      const cursor = url.searchParams.get('cursor');

      let end = all.length;
      if (cursor) {
        const idx = all.findIndex((m) => m.id === cursor);
        if (idx !== -1) end = idx;
      }
      const start = Math.max(0, end - pageSize);
      const items = [...all.slice(start, end)].reverse(); // newest-first
      const nextCursor = start > 0 ? (all[start]?.id ?? null) : null;
      return HttpResponse.json<PagedResult<MessageResponse>>({
        items,
        totalCount: null,
        nextCursor,
      });
    }),

    // GET /conversations/:id — full conversation.
    http.get(`${baseUrl}/:id`, ({ params }) => {
      const id = params.id as string;
      const summary = summaries.find((c) => c.id === id);
      if (!summary) return new HttpResponse(null, { status: 404 });
      return HttpResponse.json<ConversationResponse>({
        ...mockConversation,
        id: summary.id,
        title: summary.title,
        isFavorite: summary.isFavorite,
      });
    }),

    // POST /conversations — create.
    http.post(baseUrl, async ({ request }) => {
      const body = (await request.json()) as CreateConversationRequest;
      const created: ConversationResponse = {
        ...mockConversation,
        id: mockConversation.id,
        title: body.title,
      };
      summaries = [
        {
          id: created.id,
          title: created.title,
          isFavorite: created.isFavorite,
          createdAt: created.createdAt,
          modifiedAt: created.modifiedAt,
          workspaceKey: created.workspaceKey,
        },
        ...summaries,
      ];
      return HttpResponse.json(created, { status: 201 });
    }),

    // PUT /conversations/:id/title — rename.
    http.put(`${baseUrl}/:id/title`, async ({ params, request }) => {
      const id = params.id as string;
      const body = (await request.json()) as RenameConversationRequest;
      const index = summaries.findIndex((c) => c.id === id);
      if (index === -1) return new HttpResponse(null, { status: 404 });
      summaries = summaries.map((c) => (c.id === id ? { ...c, title: body.title } : c));
      return new HttpResponse(null, { status: 204 });
    }),

    // PUT /conversations/:id/favorite — set the favorite flag (idempotent).
    http.put(`${baseUrl}/:id/favorite`, async ({ params, request }) => {
      const id = params.id as string;
      const body = (await request.json()) as SetConversationFavoriteRequest;
      const index = summaries.findIndex((c) => c.id === id);
      if (index === -1) return new HttpResponse(null, { status: 404 });
      summaries = summaries.map((c) => (c.id === id ? { ...c, isFavorite: body.isFavorite } : c));
      return new HttpResponse(null, { status: 204 });
    }),

    // DELETE /conversations/:id — delete.
    http.delete(`${baseUrl}/:id`, ({ params }) => {
      const id = params.id as string;
      const before = summaries.length;
      summaries = summaries.filter((c) => c.id !== id);
      if (summaries.length === before) return new HttpResponse(null, { status: 404 });
      return new HttpResponse(null, { status: 204 });
    }),

    // POST /conversations/messages/:messageId/report — flag a message (ADR-071), 202.
    http.post(
      `${baseUrl}/messages/:messageId/report`,
      () => new HttpResponse(null, { status: 202 })
    ),

    // POST /conversations/messages — SSE stream (no [DONE] sentinel).
    http.post(`${baseUrl}/messages`, async ({ request }) => {
      const body = (await request.json()) as { message: string; conversationId?: string | null };
      const conversationId = body.conversationId ?? mockConversation.id;
      const answer = `Mock answer to: "${body.message.slice(0, 50)}"`;

      const encoder = new TextEncoder();
      const stream = new ReadableStream({
        start(controller) {
          controller.enqueue(encoder.encode(frame({ type: 'conversation', conversationId })));
          controller.enqueue(encoder.encode(frame({ type: 'delta', content: answer })));
          controller.enqueue(encoder.encode(frame({ type: 'delta', content: ' Done.' })));
          controller.enqueue(
            encoder.encode(frame({ type: 'usage', inputTokens: 12, outputTokens: 8 }))
          );
          controller.close();
        },
      });

      return new HttpResponse(stream, { headers: { 'Content-Type': 'text/event-stream' } });
    }),
  ];
}

/**
 * MSW handlers for the unified `@`-mention picker, served by `Granit.DataLookup`'s
 * `mentions` facade source (NOT the conversations base path). Mirrors the live
 * contract:
 *   - `GET {baseUrl}/mentions?search=&scope.type=` — multi-type typeahead over the
 *     fixture (filters by `label`/`value`, case-insensitive; optional `scope.type`).
 *   - `GET {baseUrl}/mentions/resolve?value=<type>:<id>` — single-item rehydration,
 *     or `null` when unknown.
 *
 * Compose alongside {@link createAIChatHandlers} when exercising the composer picker.
 *
 * @param baseUrl - Lookup base path (default: `/lookups`).
 * @param items - Fixture served by the source (default: {@link mockMentionLookupItems}).
 */
export function createMentionLookupHandlers(
  baseUrl: string = DEFAULT_LOOKUP_BASE_PATH,
  items: readonly LookupItemResponse[] = mockMentionLookupItems
) {
  return [
    http.get(`${baseUrl}/mentions/resolve`, ({ request }) => {
      const value = new URL(request.url).searchParams.get('value') ?? '';
      const item = items.find((i) => String(i.value) === value) ?? null;
      return HttpResponse.json(item);
    }),

    http.get(`${baseUrl}/mentions`, ({ request }) => {
      const url = new URL(request.url);
      const search = (url.searchParams.get('search') ?? '').trim().toLowerCase();
      const type = url.searchParams.get('scope.type');
      const matched = items
        .filter((i) => (type ? i.extra?.type === type : true))
        .filter((i) =>
          search
            ? i.label.toLowerCase().includes(search) ||
              String(i.value).toLowerCase().includes(search)
            : true
        );
      return HttpResponse.json<LookupResultResponse>({
        items: matched,
        totalCount: null,
        continuationToken: null,
      });
    }),
  ];
}
