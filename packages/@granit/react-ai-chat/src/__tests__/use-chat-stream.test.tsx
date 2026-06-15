import { createMockClient } from '@granit/testing';
import { act, renderHook, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { useChatStream } from '../hooks/use-chat-stream';

import { createSSEStream, createWrapper } from './test-utils';

const CONV_ID = '11111111-1111-1111-1111-111111111111';

afterEach(() => {
  vi.restoreAllMocks();
});

describe('useChatStream', () => {
  it('accumulates delta content and captures the conversation id', async () => {
    const client = createMockClient();
    const stream = createSSEStream([
      `data: {"type":"conversation","conversationId":"${CONV_ID}"}\n\n`,
      'data: {"type":"delta","content":"Hello"}\n\n',
      'data: {"type":"delta","content":" world"}\n\n',
      'data: {"type":"usage","inputTokens":12,"outputTokens":8}\n\n',
    ]);
    vi.spyOn(client, 'post').mockResolvedValue({ data: stream });

    const { result } = renderHook(() => useChatStream(), { wrapper: createWrapper(client) });

    expect(result.current.isStreaming).toBe(false);

    act(() => {
      result.current.send({ message: 'Hi' });
    });

    await waitFor(() => expect(result.current.isStreaming).toBe(false));

    expect(result.current.content).toBe('Hello world');
    expect(result.current.conversationId).toBe(CONV_ID);
    expect(result.current.usage).toEqual({ inputTokens: 12, outputTokens: 8 });
    expect(result.current.error).toBeNull();
  });

  it('surfaces suggested actions without auto-invoking them', async () => {
    const client = createMockClient();
    const stream = createSSEStream([
      'data: {"type":"delta","content":"See:"}\n\n',
      'data: {"type":"suggestions","suggestedActions":[{"type":"open","label":"Open invoice 42","deepLink":"/invoices/42"}]}\n\n',
    ]);
    vi.spyOn(client, 'post').mockResolvedValue({ data: stream });

    const { result } = renderHook(() => useChatStream(), { wrapper: createWrapper(client) });

    act(() => {
      result.current.send({ message: 'Show invoice 42' });
    });

    await waitFor(() => expect(result.current.isStreaming).toBe(false));

    expect(result.current.suggestedActions).toHaveLength(1);
    expect(result.current.suggestedActions[0]?.deepLink).toBe('/invoices/42');
  });

  it('exposes a clarification that blocks the turn', async () => {
    const client = createMockClient();
    const stream = createSSEStream([
      'data: {"type":"clarification","clarification":{"question":"Which invoice?","options":[{"label":"#42","value":"42"}],"allowOther":true}}\n\n',
    ]);
    vi.spyOn(client, 'post').mockResolvedValue({ data: stream });

    const { result } = renderHook(() => useChatStream(), { wrapper: createWrapper(client) });

    act(() => {
      result.current.send({ message: 'Show the invoice' });
    });

    await waitFor(() => expect(result.current.clarification).not.toBeNull());

    expect(result.current.clarification?.question).toBe('Which invoice?');
    expect(result.current.clarification?.options[0]?.value).toBe('42');
  });

  it('resets per-turn state on a new send()', async () => {
    const client = createMockClient();
    const first = createSSEStream(['data: {"type":"delta","content":"First"}\n\n']);
    const second = createSSEStream(['data: {"type":"delta","content":"Second"}\n\n']);
    vi.spyOn(client, 'post')
      .mockResolvedValueOnce({ data: first })
      .mockResolvedValueOnce({ data: second });

    const { result } = renderHook(() => useChatStream(), { wrapper: createWrapper(client) });

    act(() => {
      result.current.send({ message: 'A' });
    });
    await waitFor(() => expect(result.current.content).toBe('First'));

    act(() => {
      result.current.send({ message: 'B' });
    });
    await waitFor(() => expect(result.current.content).toBe('Second'));
  });

  it('posts the SendMessageRequest to {basePath}/messages with the fetch adapter', async () => {
    const client = createMockClient();
    const stream = createSSEStream(['data: {"type":"usage","inputTokens":1,"outputTokens":1}\n\n']);
    const postSpy = vi.spyOn(client, 'post').mockResolvedValue({ data: stream });

    const { result } = renderHook(() => useChatStream(), { wrapper: createWrapper(client) });

    const request = { message: 'Hi', promptRefs: [] };
    act(() => {
      result.current.send(request);
    });
    await waitFor(() => expect(result.current.isStreaming).toBe(false));

    expect(postSpy).toHaveBeenCalledWith(
      '/api/v1/conversations/messages',
      request,
      expect.objectContaining({
        adapter: 'fetch',
        responseType: 'stream',
        headers: { Accept: 'text/event-stream' },
      })
    );
  });

  it('sets error on a failed request', async () => {
    const client = createMockClient();
    vi.spyOn(client, 'post').mockRejectedValue(new Error('Request failed with status 403'));

    const { result } = renderHook(() => useChatStream(), { wrapper: createWrapper(client) });

    act(() => {
      result.current.send({ message: 'Hi' });
    });

    await waitFor(() => expect(result.current.error).not.toBeNull());
    expect(result.current.error?.message).toContain('403');
    expect(result.current.isStreaming).toBe(false);
  });
});
