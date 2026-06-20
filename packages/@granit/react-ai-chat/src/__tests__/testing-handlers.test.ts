import { createMswServer } from '@granit/testing/msw-server';
import { describe, expect, it } from 'vitest';

import { createAIChatHandlers } from '../testing/index';

import type { ChatStreamEvent, ConversationSummaryResponse } from '@granit/ai-chat';
import type { PagedResult } from '@granit/query-engine';

const LONG_ID = 'a1111111-1111-1111-1111-1111111110ff';

const BASE = 'http://api.test/api/v1/conversations';
const server = createMswServer();

/** Read an SSE response body into parsed ChatStreamEvent frames. */
async function readEvents(body: ReadableStream<Uint8Array> | null): Promise<ChatStreamEvent[]> {
  if (!body) return [];
  const reader = body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';
  const events: ChatStreamEvent[] = [];
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split('\n');
    buffer = lines.pop() ?? '';
    for (const line of lines) {
      if (line.startsWith('data:'))
        events.push(JSON.parse(line.slice(5).trim()) as ChatStreamEvent);
    }
  }
  return events;
}

describe('createAIChatHandlers', () => {
  it('lists conversation summaries, newest first', async () => {
    server.use(...createAIChatHandlers(BASE));
    const response = await fetch(BASE);
    expect(response.status).toBe(200);
    const list = (await response.json()) as ConversationSummaryResponse[];
    expect(list).toHaveLength(2);
  });

  it('returns workspaces with Auto first (not swallowed by /:id)', async () => {
    server.use(...createAIChatHandlers(BASE));
    const response = await fetch(`${BASE}/workspaces`);
    const body = (await response.json()) as { workspaces: string[] };
    expect(body.workspaces[0]).toBe('Auto');
  });

  it('searches mentions by query and filters by type (not swallowed by /:id)', async () => {
    server.use(...createAIChatHandlers(BASE));

    const byQuery = (await (await fetch(`${BASE}/mentions?q=acme&limit=8`)).json()) as {
      items: { label: string }[];
    };
    expect(byQuery.items).toHaveLength(1);
    expect(byQuery.items[0]?.label).toBe('Acme Corp');

    const byType = (await (await fetch(`${BASE}/mentions?q=&type=invoice`)).json()) as {
      items: { type: string }[];
    };
    expect(byType.items.length).toBeGreaterThan(0);
    expect(byType.items.every((item) => item.type === 'invoice')).toBe(true);
  });

  it('create then list reflects the new conversation', async () => {
    server.use(...createAIChatHandlers(BASE));
    const created = await fetch(BASE, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: 'Fresh' }),
    });
    expect(created.status).toBe(201);

    const list = (await (await fetch(BASE)).json()) as ConversationSummaryResponse[];
    expect(list[0]?.title).toBe('Fresh');
  });

  it('sets the favorite flag (204) and reflects it on the next read', async () => {
    server.use(...createAIChatHandlers(BASE));
    const id = 'a1111111-1111-1111-1111-111111111111';

    const put = await fetch(`${BASE}/${id}/favorite`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ isFavorite: true }),
    });
    expect(put.status).toBe(204);

    const detail = (await (await fetch(`${BASE}/${id}`)).json()) as { isFavorite: boolean };
    expect(detail.isFavorite).toBe(true);

    const list = (await (await fetch(BASE)).json()) as ConversationSummaryResponse[];
    expect(list.find((c) => c.id === id)?.isFavorite).toBe(true);
  });

  it('returns 404 when favoriting an unknown conversation', async () => {
    server.use(...createAIChatHandlers(BASE));
    const response = await fetch(`${BASE}/00000000-0000-0000-0000-000000000000/favorite`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ isFavorite: true }),
    });
    expect(response.status).toBe(404);
  });

  it('accepts a message report with 202', async () => {
    server.use(...createAIChatHandlers(BASE));
    const response = await fetch(`${BASE}/messages/c3333333-3333-3333-3333-333333333333/report`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ reason: 'Inaccurate answer', category: 'Inaccurate' }),
    });
    expect(response.status).toBe(202);
  });

  it('paginates messages backwards: newest page first (newest-first), then older via cursor', async () => {
    server.use(...createAIChatHandlers(BASE));

    // Newest page (no cursor): the last `pageSize` messages, newest-first.
    const first = (await (
      await fetch(`${BASE}/${LONG_ID}/messages?pageSize=30`)
    ).json()) as PagedResult<{ content: string }>;
    expect(first.items).toHaveLength(30);
    expect(first.items[0]?.content).toBe('Answer 40'); // 80 msgs → newest is #79
    expect(first.totalCount).toBeNull(); // cursor mode skips the count
    expect(first.nextCursor).not.toBeNull();

    // Older page: the 30 messages immediately older than the cursor — no overlap.
    const second = (await (
      await fetch(`${BASE}/${LONG_ID}/messages?pageSize=30&cursor=${first.nextCursor}`)
    ).json()) as PagedResult<{ content: string }>;
    expect(second.items).toHaveLength(30);
    expect(second.items[0]?.content).toBe('Answer 25'); // index 49, newest-first
    expect(second.items.at(-1)?.content).toBe('Question 11'); // index 20
  });

  it('returns nextCursor=null once the oldest message is reached', async () => {
    server.use(...createAIChatHandlers(BASE));
    // 80 messages, 30 per page → third page has the remaining 20 and ends history.
    const p1 = (await (
      await fetch(`${BASE}/${LONG_ID}/messages?pageSize=30`)
    ).json()) as PagedResult<unknown>;
    const p2 = (await (
      await fetch(`${BASE}/${LONG_ID}/messages?pageSize=30&cursor=${p1.nextCursor}`)
    ).json()) as PagedResult<unknown>;
    const p3 = (await (
      await fetch(`${BASE}/${LONG_ID}/messages?pageSize=30&cursor=${p2.nextCursor}`)
    ).json()) as PagedResult<unknown>;
    expect(p3.items).toHaveLength(20);
    expect(p3.nextCursor).toBeNull();
  });

  it('streams flat ChatStreamEvent frames ending without a [DONE] sentinel', async () => {
    server.use(...createAIChatHandlers(BASE));
    const response = await fetch(`${BASE}/messages`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: 'Hello there' }),
    });
    expect(response.headers.get('Content-Type')).toContain('text/event-stream');

    const events = await readEvents(response.body);
    expect(events.map((e) => e.type)).toEqual(['conversation', 'delta', 'delta', 'usage']);
    expect(events.at(-1)).toMatchObject({ type: 'usage', inputTokens: 12, outputTokens: 8 });
  });
});
