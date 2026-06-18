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

  it('tracks tool calls keyed by toolCallId and resolves them', async () => {
    const client = createMockClient();
    const stream = createSSEStream([
      'data: {"type":"tool_call","toolName":"query_data","toolCallId":"c1"}\n\n',
      'data: {"type":"tool_call","toolName":"search","toolCallId":"c2"}\n\n',
      'data: {"type":"tool_result","toolName":"query_data","toolCallId":"c1","succeeded":true}\n\n',
      'data: {"type":"tool_result","toolName":"search","toolCallId":"c2","succeeded":false}\n\n',
      'data: {"type":"delta","content":"Answer"}\n\n',
    ]);
    vi.spyOn(client, 'post').mockResolvedValue({ data: stream });

    const { result } = renderHook(() => useChatStream(), { wrapper: createWrapper(client) });

    act(() => {
      result.current.send({ message: 'Find it' });
    });

    await waitFor(() => expect(result.current.isStreaming).toBe(false));

    expect(result.current.toolCalls).toEqual([
      { toolCallId: 'c1', toolName: 'query_data', status: 'succeeded' },
      { toolCallId: 'c2', toolName: 'search', status: 'failed' },
    ]);
    expect(result.current.content).toBe('Answer');
  });

  it('derives isThinking after a tool_result until the next delta arrives', async () => {
    const client = createMockClient();
    // Hold the stream open after the tool_result so we can observe the thinking
    // state before any delta is emitted.
    let resolveDelta!: () => void;
    const gate = new Promise<void>((r) => {
      resolveDelta = r;
    });
    const encoder = new TextEncoder();
    const stream = new ReadableStream<Uint8Array>({
      async start(controller) {
        controller.enqueue(
          encoder.encode('data: {"type":"tool_call","toolName":"query_data","toolCallId":"c1"}\n\n')
        );
        controller.enqueue(
          encoder.encode(
            'data: {"type":"tool_result","toolName":"query_data","toolCallId":"c1","succeeded":true}\n\n'
          )
        );
        await gate;
        controller.enqueue(encoder.encode('data: {"type":"delta","content":"Now answering"}\n\n'));
        controller.close();
      },
    });
    vi.spyOn(client, 'post').mockResolvedValue({ data: stream });

    const { result } = renderHook(() => useChatStream(), { wrapper: createWrapper(client) });

    act(() => {
      result.current.send({ message: 'Go' });
    });

    await waitFor(() => expect(result.current.isThinking).toBe(true));

    act(() => {
      resolveDelta();
    });

    await waitFor(() => expect(result.current.content).toBe('Now answering'));
    expect(result.current.isThinking).toBe(false);
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

  it('classifies a 429 pre-stream failure as rate-limit', async () => {
    const client = createMockClient();
    vi.spyOn(client, 'post').mockRejectedValue(
      Object.assign(new Error('Too Many Requests'), { response: { status: 429 } })
    );

    const { result } = renderHook(() => useChatStream(), { wrapper: createWrapper(client) });
    act(() => {
      result.current.send({ message: 'Hi' });
    });

    await waitFor(() => expect(result.current.errorKind).toBe('rate-limit'));
  });

  it('classifies a response-less failure as a network error', async () => {
    const client = createMockClient();
    vi.spyOn(client, 'post').mockRejectedValue(new Error('Network Error'));

    const { result } = renderHook(() => useChatStream(), { wrapper: createWrapper(client) });
    act(() => {
      result.current.send({ message: 'Hi' });
    });

    await waitFor(() => expect(result.current.errorKind).toBe('network'));
  });

  it('surfaces a terminal mid-stream error frame and keeps the partial answer', async () => {
    const client = createMockClient();
    const stream = createSSEStream([
      `data: {"type":"conversation","conversationId":"${CONV_ID}"}\n\n`,
      'data: {"type":"delta","content":"Partial"}\n\n',
      'data: {"type":"error","code":"rate_limit"}\n\n',
    ]);
    vi.spyOn(client, 'post').mockResolvedValue({ data: stream });

    const { result } = renderHook(() => useChatStream(), { wrapper: createWrapper(client) });
    act(() => {
      result.current.send({ message: 'Hi' });
    });

    await waitFor(() => expect(result.current.isStreaming).toBe(false));
    expect(result.current.errorKind).toBe('rate-limit');
    expect(result.current.error).not.toBeNull();
    // The answer streamed before the failure stays rendered.
    expect(result.current.content).toBe('Partial');
    expect(result.current.isThinking).toBe(false);
  });

  it('maps a provider_unavailable error frame to the server kind', async () => {
    const client = createMockClient();
    const stream = createSSEStream(['data: {"type":"error","code":"provider_unavailable"}\n\n']);
    vi.spyOn(client, 'post').mockResolvedValue({ data: stream });

    const { result } = renderHook(() => useChatStream(), { wrapper: createWrapper(client) });
    act(() => {
      result.current.send({ message: 'Hi' });
    });

    await waitFor(() => expect(result.current.errorKind).toBe('server'));
  });
});
