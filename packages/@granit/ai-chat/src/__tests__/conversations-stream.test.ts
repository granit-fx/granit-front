import { createMockClient } from '@granit/testing';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { streamConversationMessage } from '../api/conversations-api';

import type { ChatStreamEvent, SendMessageRequest } from '../types/index';

function createSSEStream(chunks: readonly string[]): ReadableStream<Uint8Array> {
  const encoder = new TextEncoder();
  return new ReadableStream({
    start(controller) {
      for (const chunk of chunks) {
        controller.enqueue(encoder.encode(chunk));
      }
      controller.close();
    },
  });
}

const REQUEST: SendMessageRequest = { message: 'Hi' };

async function collect(stream: AsyncGenerator<ChatStreamEvent>): Promise<ChatStreamEvent[]> {
  const events: ChatStreamEvent[] = [];
  for await (const event of stream) events.push(event);
  return events;
}

describe('streamConversationMessage', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('yields each flat ChatStreamEvent frame in order', async () => {
    const client = createMockClient();
    const stream = createSSEStream([
      'data: {"type":"conversation","conversationId":"11111111-1111-1111-1111-111111111111"}\n\n',
      'data: {"type":"delta","content":"Hello"}\n\n',
      'data: {"type":"delta","content":" world"}\n\n',
      'data: {"type":"usage","inputTokens":12,"outputTokens":3}\n\n',
    ]);
    vi.spyOn(client, 'post').mockResolvedValue({ data: stream });

    const events = await collect(
      streamConversationMessage(client, '/api/v1/conversations', REQUEST)
    );

    expect(events).toEqual([
      { type: 'conversation', conversationId: '11111111-1111-1111-1111-111111111111' },
      { type: 'delta', content: 'Hello' },
      { type: 'delta', content: ' world' },
      { type: 'usage', inputTokens: 12, outputTokens: 3 },
    ]);
  });

  it('reassembles a frame split across reads', async () => {
    const client = createMockClient();
    const stream = createSSEStream(['data: {"type":"del', 'ta","content":"split"}\n\n']);
    vi.spyOn(client, 'post').mockResolvedValue({ data: stream });

    const events = await collect(streamConversationMessage(client, '', REQUEST));

    expect(events).toEqual([{ type: 'delta', content: 'split' }]);
  });

  it('flushes a final frame with no trailing newline (no [DONE] sentinel)', async () => {
    const client = createMockClient();
    const stream = createSSEStream(['data: {"type":"delta","content":"tail"}']);
    vi.spyOn(client, 'post').mockResolvedValue({ data: stream });

    const events = await collect(streamConversationMessage(client, '', REQUEST));

    expect(events).toEqual([{ type: 'delta', content: 'tail' }]);
  });

  it('surfaces suggestions and clarification frames', async () => {
    const client = createMockClient();
    const stream = createSSEStream([
      'data: {"type":"suggestions","suggestedActions":[{"type":"open","label":"Open invoice","deepLink":"/invoices/42"}]}\n\n',
      'data: {"type":"clarification","clarification":{"question":"Which one?","options":[{"label":"A","value":null}],"allowOther":true}}\n\n',
    ]);
    vi.spyOn(client, 'post').mockResolvedValue({ data: stream });

    const events = await collect(streamConversationMessage(client, '', REQUEST));

    expect(events[0]?.suggestedActions?.[0]?.deepLink).toBe('/invoices/42');
    expect(events[1]?.clarification?.question).toBe('Which one?');
  });

  it('skips malformed frames without aborting the stream', async () => {
    const client = createMockClient();
    const stream = createSSEStream([
      'data: not-json\n\n',
      'data: {"type":"delta","content":"valid"}\n\n',
    ]);
    vi.spyOn(client, 'post').mockResolvedValue({ data: stream });

    const events = await collect(streamConversationMessage(client, '', REQUEST));

    expect(events).toEqual([{ type: 'delta', content: 'valid' }]);
  });

  it('posts to {basePath}/messages with the fetch streaming adapter', async () => {
    const client = createMockClient();
    const stream = createSSEStream(['data: {"type":"usage","inputTokens":1,"outputTokens":1}\n\n']);
    const postSpy = vi.spyOn(client, 'post').mockResolvedValue({ data: stream });

    await collect(streamConversationMessage(client, '/api/v1/conversations', REQUEST));

    expect(postSpy).toHaveBeenCalledWith(
      '/api/v1/conversations/messages',
      REQUEST,
      expect.objectContaining({
        adapter: 'fetch',
        responseType: 'stream',
        headers: { Accept: 'text/event-stream' },
      })
    );
  });

  it('returns no events for an empty body', async () => {
    const client = createMockClient();
    vi.spyOn(client, 'post').mockResolvedValue({ data: null });

    const events = await collect(streamConversationMessage(client, '', REQUEST));

    expect(events).toEqual([]);
  });

  it('propagates axios errors (e.g. 403 before streaming)', async () => {
    const client = createMockClient();
    vi.spyOn(client, 'post').mockRejectedValue(new Error('Request failed with status 403'));

    const generator = streamConversationMessage(client, '', REQUEST);

    await expect(generator.next()).rejects.toThrow('Request failed with status 403');
  });
});
