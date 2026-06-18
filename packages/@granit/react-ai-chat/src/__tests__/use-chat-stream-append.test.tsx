import { createTestQueryClient } from '@granit/react-testing';
import { createMockClient } from '@granit/testing';
import { QueryClientProvider } from '@tanstack/react-query';
import { act, renderHook, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { DEFAULT_QUERY_KEY_PREFIX } from '../constants';
import { conversationKeys } from '../hooks/query-keys';
import { useChatStream } from '../hooks/use-chat-stream';
import { AIChatProvider } from '../providers/ai-chat-provider';

import { createSSEStream, TEST_BASE_PATH } from './test-utils';

import type { MessagesPageParam } from '../hooks/use-conversation-messages';
import type { ConversationId, MessageResponse } from '@granit/ai-chat';
import type { PagedResult } from '@granit/query-engine';
import type { InfiniteData } from '@tanstack/react-query';
import type { ReactNode } from 'react';

const CONV_ID = '11111111-1111-1111-1111-111111111111' as ConversationId;

const seed: MessageResponse = {
  id: 'c0000000-0000-0000-0000-000000000000' as MessageResponse['id'],
  role: 'assistant',
  content: 'earlier reply',
  createdAt: '2026-06-15T08:59:00.000Z' as MessageResponse['createdAt'],
};

afterEach(() => {
  vi.restoreAllMocks();
});

describe('useChatStream — optimistic message append', () => {
  it('appends the finished turn to the newest page without resetting loaded pages', async () => {
    const client = createMockClient();
    const stream = createSSEStream([
      `data: {"type":"conversation","conversationId":"${CONV_ID}"}\n\n`,
      'data: {"type":"delta","content":"Hi there"}\n\n',
      'data: {"type":"usage","inputTokens":3,"outputTokens":2}\n\n',
    ]);
    vi.spyOn(client, 'post').mockResolvedValue({ data: stream });

    const queryClient = createTestQueryClient();
    const messagesKey = conversationKeys.messages(DEFAULT_QUERY_KEY_PREFIX, CONV_ID);
    queryClient.setQueryData<InfiniteData<PagedResult<MessageResponse>, MessagesPageParam>>(
      messagesKey,
      {
        pages: [{ items: [seed], totalCount: null, nextCursor: null }],
        pageParams: [undefined],
      }
    );

    function wrapper({ children }: { readonly children: ReactNode }) {
      return (
        <QueryClientProvider client={queryClient}>
          <AIChatProvider config={{ client, basePath: TEST_BASE_PATH }}>{children}</AIChatProvider>
        </QueryClientProvider>
      );
    }

    const { result } = renderHook(() => useChatStream(), { wrapper });

    act(() => {
      result.current.send({ message: 'Hello', conversationId: CONV_ID });
    });

    await waitFor(() => expect(result.current.isStreaming).toBe(false));

    const data =
      queryClient.getQueryData<InfiniteData<PagedResult<MessageResponse>, MessagesPageParam>>(
        messagesKey
      );
    expect(data?.pages).toHaveLength(1);
    const items = data?.pages[0]?.items ?? [];
    // Newest page is stored newest-first: the new turn (assistant, then user) is
    // prepended ahead of the seed. The display hook reverses this to oldest-first.
    expect(items.map((m) => m.content)).toEqual(['Hi there', 'Hello', 'earlier reply']);
    expect(items.map((m) => m.role)).toEqual(['assistant', 'user', 'assistant']);
  });

  it('appends the real persisted rows (ids + createdAt) when the persisted frame arrives', async () => {
    const userId = 'd1111111-1111-1111-1111-111111111111';
    const assistantId = 'd2222222-2222-2222-2222-222222222222';
    const client = createMockClient();
    const stream = createSSEStream([
      `data: {"type":"conversation","conversationId":"${CONV_ID}"}\n\n`,
      'data: {"type":"delta","content":"Hi there"}\n\n',
      `data: {"type":"persisted","messages":[{"id":"${userId}","role":"user","content":"Hello","createdAt":"2026-06-18T10:00:00.000Z"},{"id":"${assistantId}","role":"assistant","content":"Hi there","createdAt":"2026-06-18T10:00:01.000Z"}]}\n\n`,
      'data: {"type":"usage","inputTokens":3,"outputTokens":2}\n\n',
    ]);
    vi.spyOn(client, 'post').mockResolvedValue({ data: stream });

    const queryClient = createTestQueryClient();
    const messagesKey = conversationKeys.messages(DEFAULT_QUERY_KEY_PREFIX, CONV_ID);
    queryClient.setQueryData<InfiniteData<PagedResult<MessageResponse>, MessagesPageParam>>(
      messagesKey,
      { pages: [{ items: [seed], totalCount: null, nextCursor: null }], pageParams: [undefined] }
    );

    function wrapper({ children }: { readonly children: ReactNode }) {
      return (
        <QueryClientProvider client={queryClient}>
          <AIChatProvider config={{ client, basePath: TEST_BASE_PATH }}>{children}</AIChatProvider>
        </QueryClientProvider>
      );
    }

    const { result } = renderHook(() => useChatStream(), { wrapper });
    act(() => {
      result.current.send({ message: 'Hello', conversationId: CONV_ID });
    });
    await waitFor(() => expect(result.current.isStreaming).toBe(false));

    const data =
      queryClient.getQueryData<InfiniteData<PagedResult<MessageResponse>, MessagesPageParam>>(
        messagesKey
      );
    const items = data?.pages[0]?.items ?? [];
    // Real backend ids (not synthesized) → the just-streamed message is reportable.
    expect(items.map((m) => m.id)).toEqual([assistantId, userId, seed.id]);
    expect(items[0]?.createdAt).toBe('2026-06-18T10:00:01.000Z');
  });

  it('no-ops when the messages query is not loaded', async () => {
    const client = createMockClient();
    const stream = createSSEStream([
      `data: {"type":"conversation","conversationId":"${CONV_ID}"}\n\n`,
      'data: {"type":"delta","content":"Hi"}\n\n',
    ]);
    vi.spyOn(client, 'post').mockResolvedValue({ data: stream });

    const queryClient = createTestQueryClient();
    const messagesKey = conversationKeys.messages(DEFAULT_QUERY_KEY_PREFIX, CONV_ID);

    function wrapper({ children }: { readonly children: ReactNode }) {
      return (
        <QueryClientProvider client={queryClient}>
          <AIChatProvider config={{ client, basePath: TEST_BASE_PATH }}>{children}</AIChatProvider>
        </QueryClientProvider>
      );
    }

    const { result } = renderHook(() => useChatStream(), { wrapper });
    act(() => {
      result.current.send({ message: 'Hello', conversationId: CONV_ID });
    });
    await waitFor(() => expect(result.current.isStreaming).toBe(false));

    // Nothing was seeded, so the append leaves the cache empty (the next mount
    // of useConversationMessages will fetch the turn from the server instead).
    expect(queryClient.getQueryData(messagesKey)).toBeUndefined();
  });
});
