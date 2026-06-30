import { createMockClient } from '@granit/testing';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { chatStream } from '../api/ai-chat-api';

import type { AIChatCompletionEvent } from '../types/index';

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

  it('should yield content chunks from delta frames', async () => {
    const client = createMockClient();
    const stream = createSSEStream([
      'data: {"type":"delta","content":"Hello"}\n\n',
      'data: {"type":"delta","content":" world"}\n\n',
    ]);
    vi.spyOn(client, 'post').mockResolvedValue({ data: stream });

    const events: AIChatCompletionEvent[] = [];
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

  it('should handle frames split across reads', async () => {
    const client = createMockClient();
    const stream = createSSEStream(['data: {"type":"delta","cont', 'ent":"split"}\n\n']);
    vi.spyOn(client, 'post').mockResolvedValue({ data: stream });

    const events: AIChatCompletionEvent[] = [];
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

  it('should throw on an error frame, after yielding prior content', async () => {
    const client = createMockClient();
    const stream = createSSEStream([
      'data: {"type":"delta","content":"partial"}\n\n',
      'data: {"type":"error","error":"provider unavailable"}\n\n',
    ]);
    vi.spyOn(client, 'post').mockResolvedValue({ data: stream });

    const events: AIChatCompletionEvent[] = [];
    await expect(async () => {
      for await (const event of chatStream(client, '', 'default', {
        messages: [{ role: 'user', content: 'Hi' }],
      })) {
        events.push(event);
      }
    }).rejects.toThrow('provider unavailable');

    expect(events).toEqual([{ type: 'chunk', content: 'partial' }]);
  });

  it('should skip malformed SSE frames', async () => {
    const client = createMockClient();
    const stream = createSSEStream([
      'data: not-json\n\n',
      'data: {"type":"delta","content":"valid"}\n\n',
    ]);
    vi.spyOn(client, 'post').mockResolvedValue({ data: stream });

    const events: AIChatCompletionEvent[] = [];
    for await (const event of chatStream(client, '', 'default', {
      messages: [{ role: 'user', content: 'Hi' }],
    })) {
      events.push(event);
    }

    expect(events).toEqual([{ type: 'chunk', content: 'valid' }]);
  });

  it('should call axios with correct URL and options', async () => {
    const client = createMockClient();
    const stream = createSSEStream([]);
    const postSpy = vi.spyOn(client, 'post').mockResolvedValue({ data: stream });

    const request = { messages: [{ role: 'user' as const, content: 'Hi' }] };
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    for await (const _ of chatStream(client, '/api/v1/ai', 'default', request)) {
      // consume stream
    }

    expect(postSpy).toHaveBeenCalledWith(
      '/api/v1/ai/chat/default/stream',
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

    const events: AIChatCompletionEvent[] = [];
    for await (const event of chatStream(client, '', 'default', {
      messages: [{ role: 'user', content: 'Hi' }],
    })) {
      events.push(event);
    }

    expect(events).toEqual([]);
  });

  it('should yield usage from a usage frame', async () => {
    const client = createMockClient();
    const stream = createSSEStream([
      'data: {"type":"delta","content":"Hello"}\n\n',
      'data: {"type":"usage","inputTokens":150,"outputTokens":42}\n\n',
    ]);
    vi.spyOn(client, 'post').mockResolvedValue({ data: stream });

    const events: AIChatCompletionEvent[] = [];
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

  it('should handle a usage frame split across reads', async () => {
    const client = createMockClient();
    const stream = createSSEStream([
      'data: {"type":"delta","content":"Hi"}\n\ndata: {"type":"usage","inp',
      'utTokens":10,"outputTokens":5}\n\n',
    ]);
    vi.spyOn(client, 'post').mockResolvedValue({ data: stream });

    const events: AIChatCompletionEvent[] = [];
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
