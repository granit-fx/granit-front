import { createMockClient } from '@granit/testing';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { chatStream } from '../api/ai-chat-api.js';

import type { ChatStreamEvent } from '../api/ai-chat-api.js';

function createSSEStream(chunks: string[]): ReadableStream<Uint8Array> {
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

describe('chatStream', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should yield content chunks from SSE events', async () => {
    const client = createMockClient();
    const stream = createSSEStream([
      'data: {"content":"Hello"}\n\n',
      'data: {"content":" world"}\n\n',
      'data: [DONE]\n\n',
    ]);
    vi.spyOn(client, 'post').mockResolvedValue({ data: stream });

    const events: ChatStreamEvent[] = [];
    for await (const event of chatStream(client, '', 'default', {
      messages: [{ role: 'user', content: 'Hi' }],
    })) {
      events.push(event);
    }

    expect(events).toEqual([
      { type: 'chunk', content: 'Hello' },
      { type: 'chunk', content: ' world' },
    ]);
  });

  it('should handle chunks split across reads', async () => {
    const client = createMockClient();
    const stream = createSSEStream(['data: {"cont', 'ent":"split"}\n\ndata: [DONE]\n\n']);
    vi.spyOn(client, 'post').mockResolvedValue({ data: stream });

    const events: ChatStreamEvent[] = [];
    for await (const event of chatStream(client, '', 'default', {
      messages: [{ role: 'user', content: 'Hi' }],
    })) {
      events.push(event);
    }

    expect(events).toEqual([{ type: 'chunk', content: 'split' }]);
  });

  it('should propagate axios errors', async () => {
    const client = createMockClient();
    vi.spyOn(client, 'post').mockRejectedValue(new Error('Request failed with status 401'));

    const generator = chatStream(client, '', 'default', {
      messages: [{ role: 'user', content: 'Hi' }],
    });

    await expect(generator.next()).rejects.toThrow('Request failed with status 401');
  });

  it('should skip malformed SSE events', async () => {
    const client = createMockClient();
    const stream = createSSEStream([
      'data: not-json\n\n',
      'data: {"content":"valid"}\n\n',
      'data: [DONE]\n\n',
    ]);
    vi.spyOn(client, 'post').mockResolvedValue({ data: stream });

    const events: ChatStreamEvent[] = [];
    for await (const event of chatStream(client, '', 'default', {
      messages: [{ role: 'user', content: 'Hi' }],
    })) {
      events.push(event);
    }

    expect(events).toEqual([{ type: 'chunk', content: 'valid' }]);
  });

  it('should call axios with correct URL and options', async () => {
    const client = createMockClient();
    const stream = createSSEStream(['data: [DONE]\n\n']);
    const postSpy = vi.spyOn(client, 'post').mockResolvedValue({ data: stream });

    const request = { messages: [{ role: 'user' as const, content: 'Hi' }] };
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    for await (const _ of chatStream(client, '/api', 'default', request)) {
      // consume stream
    }

    expect(postSpy).toHaveBeenCalledWith(
      '/api/ai/chat/default/stream',
      request,
      expect.objectContaining({
        adapter: 'fetch',
        responseType: 'stream',
        headers: { Accept: 'text/event-stream' },
      })
    );
  });

  it('should handle empty body gracefully', async () => {
    const client = createMockClient();
    vi.spyOn(client, 'post').mockResolvedValue({ data: null });

    const events: ChatStreamEvent[] = [];
    for await (const event of chatStream(client, '', 'default', {
      messages: [{ role: 'user', content: 'Hi' }],
    })) {
      events.push(event);
    }

    expect(events).toEqual([]);
  });

  it('should yield usage event from SSE event: usage', async () => {
    const client = createMockClient();
    const stream = createSSEStream([
      'data: {"content":"Hello"}\n\n',
      'event: usage\n',
      'data: {"inputTokens":150,"outputTokens":42}\n\n',
      'data: [DONE]\n\n',
    ]);
    vi.spyOn(client, 'post').mockResolvedValue({ data: stream });

    const events: ChatStreamEvent[] = [];
    for await (const event of chatStream(client, '', 'default', {
      messages: [{ role: 'user', content: 'Hi' }],
    })) {
      events.push(event);
    }

    expect(events).toEqual([
      { type: 'chunk', content: 'Hello' },
      { type: 'usage', usage: { inputTokens: 150, outputTokens: 42 } },
    ]);
  });

  it('should handle usage event split across reads', async () => {
    const client = createMockClient();
    const stream = createSSEStream([
      'data: {"content":"Hi"}\n\nevent: us',
      'age\ndata: {"inputTokens":10,"outputTokens":5}\n\ndata: [DONE]\n\n',
    ]);
    vi.spyOn(client, 'post').mockResolvedValue({ data: stream });

    const events: ChatStreamEvent[] = [];
    for await (const event of chatStream(client, '', 'default', {
      messages: [{ role: 'user', content: 'Hi' }],
    })) {
      events.push(event);
    }

    expect(events).toEqual([
      { type: 'chunk', content: 'Hi' },
      { type: 'usage', usage: { inputTokens: 10, outputTokens: 5 } },
    ]);
  });
});
