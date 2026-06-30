import { createTestQueryClient } from '@granit/react-testing';
import { createMockClient } from '@granit/testing';
import { QueryClientProvider } from '@tanstack/react-query';
import { act, renderHook, waitFor } from '@testing-library/react';
import * as React from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { useAIChatStream } from '../hooks/use-ai-chat-stream';
import { AIProvider } from '../providers/ai-provider';

import type { AIConfig } from '../providers/ai-provider';
import type { AxiosInstance } from '@granit/api-client';
import type { ReactNode } from 'react';

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

function createWrapper(client: AxiosInstance) {
  return function Wrapper({ children }: { children: ReactNode }) {
    const queryClient = createTestQueryClient();
    const config: AIConfig = {
      client,
      basePath: '/api/v1/ai',
    };
    return React.createElement(
      QueryClientProvider,
      { client: queryClient },
      <AIProvider config={config}>{children}</AIProvider>
    );
  };
}

afterEach(() => {
  vi.restoreAllMocks();
});

describe('useAIChatStream', () => {
  it('should accumulate content from SSE chunks', async () => {
    const client = createMockClient();
    const stream = createSSEStream([
      'data: {"type":"delta","content":"Hello"}\n\n',
      'data: {"type":"delta","content":" world"}\n\n',
    ]);
    vi.spyOn(client, 'post').mockResolvedValue({ data: stream });

    const { result } = renderHook(() => useAIChatStream(), {
      wrapper: createWrapper(client),
    });

    expect(result.current.isStreaming).toBe(false);
    expect(result.current.content).toBe('');
    expect(result.current.usage).toBeNull();

    act(() => {
      result.current.send('default', { messages: [{ role: 'user', content: 'Hi' }] });
    });

    await waitFor(() => expect(result.current.isStreaming).toBe(false));

    expect(result.current.content).toBe('Hello world');
    expect(result.current.error).toBeNull();
  });

  it('should set error on request failure', async () => {
    const client = createMockClient();
    vi.spyOn(client, 'post').mockRejectedValue(new Error('Request failed with status 500'));

    const { result } = renderHook(() => useAIChatStream(), {
      wrapper: createWrapper(client),
    });

    act(() => {
      result.current.send('default', { messages: [{ role: 'user', content: 'Hi' }] });
    });

    await waitFor(() => expect(result.current.error).not.toBeNull());

    expect(result.current.error?.message).toContain('500');
    expect(result.current.isStreaming).toBe(false);
  });

  it('should set error from an error frame, keeping prior content', async () => {
    const client = createMockClient();
    const stream = createSSEStream([
      'data: {"type":"delta","content":"partial"}\n\n',
      'data: {"type":"error","error":"provider unavailable"}\n\n',
    ]);
    vi.spyOn(client, 'post').mockResolvedValue({ data: stream });

    const { result } = renderHook(() => useAIChatStream(), {
      wrapper: createWrapper(client),
    });

    act(() => {
      result.current.send('default', { messages: [{ role: 'user', content: 'Hi' }] });
    });

    await waitFor(() => expect(result.current.error).not.toBeNull());

    expect(result.current.error?.message).toContain('provider unavailable');
    expect(result.current.content).toBe('partial');
    expect(result.current.isStreaming).toBe(false);
  });

  it('should reset content on new send()', async () => {
    const client = createMockClient();

    const stream1 = createSSEStream(['data: {"type":"delta","content":"First"}\n\n']);
    const stream2 = createSSEStream(['data: {"type":"delta","content":"Second"}\n\n']);
    vi.spyOn(client, 'post')
      .mockResolvedValueOnce({ data: stream1 })
      .mockResolvedValueOnce({ data: stream2 });

    const { result } = renderHook(() => useAIChatStream(), {
      wrapper: createWrapper(client),
    });

    act(() => {
      result.current.send('default', { messages: [{ role: 'user', content: 'A' }] });
    });
    await waitFor(() => expect(result.current.isStreaming).toBe(false));
    expect(result.current.content).toBe('First');

    act(() => {
      result.current.send('default', { messages: [{ role: 'user', content: 'B' }] });
    });
    await waitFor(() => expect(result.current.content).toBe('Second'));
  });

  it('should call axios with correct URL and options', async () => {
    const client = createMockClient();
    const stream = createSSEStream([]);
    const postSpy = vi.spyOn(client, 'post').mockResolvedValue({ data: stream });

    const { result } = renderHook(() => useAIChatStream(), {
      wrapper: createWrapper(client),
    });

    act(() => {
      result.current.send('default', { messages: [{ role: 'user', content: 'Hi' }] });
    });

    await waitFor(() => expect(result.current.isStreaming).toBe(false));

    expect(postSpy).toHaveBeenCalledWith(
      '/api/v1/ai/chat/default/stream',
      { messages: [{ role: 'user', content: 'Hi' }] },
      expect.objectContaining({
        adapter: 'fetch',
        responseType: 'stream',
        headers: { Accept: 'text/event-stream' },
      })
    );
  });

  it('should expose usage from a usage frame', async () => {
    const client = createMockClient();
    const stream = createSSEStream([
      'data: {"type":"delta","content":"Hi"}\n\n',
      'data: {"type":"usage","inputTokens":150,"outputTokens":42}\n\n',
    ]);
    vi.spyOn(client, 'post').mockResolvedValue({ data: stream });

    const { result } = renderHook(() => useAIChatStream(), {
      wrapper: createWrapper(client),
    });

    act(() => {
      result.current.send('default', { messages: [{ role: 'user', content: 'Hi' }] });
    });

    await waitFor(() => expect(result.current.isStreaming).toBe(false));

    expect(result.current.content).toBe('Hi');
    expect(result.current.usage).toEqual({ inputTokens: 150, outputTokens: 42 });
  });

  it('should reset usage on new send()', async () => {
    const client = createMockClient();

    const stream1 = createSSEStream([
      'data: {"type":"delta","content":"A"}\n\n',
      'data: {"type":"usage","inputTokens":10,"outputTokens":5}\n\n',
    ]);
    const stream2 = createSSEStream(['data: {"type":"delta","content":"B"}\n\n']);
    vi.spyOn(client, 'post')
      .mockResolvedValueOnce({ data: stream1 })
      .mockResolvedValueOnce({ data: stream2 });

    const { result } = renderHook(() => useAIChatStream(), {
      wrapper: createWrapper(client),
    });

    act(() => {
      result.current.send('default', { messages: [{ role: 'user', content: 'A' }] });
    });
    await waitFor(() => expect(result.current.isStreaming).toBe(false));
    expect(result.current.usage).toEqual({ inputTokens: 10, outputTokens: 5 });

    act(() => {
      result.current.send('default', { messages: [{ role: 'user', content: 'B' }] });
    });
    await waitFor(() => expect(result.current.content).toBe('B'));
    expect(result.current.usage).toBeNull();
  });
});
