import { http, HttpResponse } from 'msw';

import { DEFAULT_BASE_PATH } from '../constants';

import { mockChatWorkspaces, mockConversation, mockConversationSummaries } from './data';

import type {
  ConversationResponse,
  ConversationSummaryResponse,
  CreateConversationRequest,
  RenameConversationRequest,
} from '@granit/ai-chat';
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

    // GET /conversations/:id — full conversation.
    http.get(`${baseUrl}/:id`, ({ params }) => {
      const id = params.id as string;
      const summary = summaries.find((c) => c.id === id);
      if (!summary) return new HttpResponse(null, { status: 404 });
      return HttpResponse.json<ConversationResponse>({
        ...mockConversation,
        id: summary.id,
        title: summary.title,
      });
    }),

    // POST /conversations — create.
    http.post(baseUrl, async ({ request }) => {
      const body = (await request.json()) as CreateConversationRequest;
      const created: ConversationResponse = {
        ...mockConversation,
        id: mockConversation.id,
        title: body.title,
        messages: [],
      };
      summaries = [
        {
          id: created.id,
          title: created.title,
          createdAt: created.createdAt,
          modifiedAt: created.modifiedAt,
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

    // DELETE /conversations/:id — delete.
    http.delete(`${baseUrl}/:id`, ({ params }) => {
      const id = params.id as string;
      const before = summaries.length;
      summaries = summaries.filter((c) => c.id !== id);
      if (summaries.length === before) return new HttpResponse(null, { status: 404 });
      return new HttpResponse(null, { status: 204 });
    }),

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
