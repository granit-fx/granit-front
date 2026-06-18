import { axiosResponse, createMockClient } from '@granit/testing';
import { useQueryClient } from '@tanstack/react-query';
import { act, renderHook, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { useChatWorkspaces } from '../hooks/use-chat-workspaces';
import { useConversations } from '../hooks/use-conversations';
import { useCreateConversation } from '../hooks/use-create-conversation';
import { useDeleteConversation } from '../hooks/use-delete-conversation';
import { useReportMessage } from '../hooks/use-report-message';
import { useSetConversationFavorite } from '../hooks/use-set-conversation-favorite';
import { mockConversation, mockConversationSummaries } from '../testing/data';

import { createWrapper, TEST_BASE_PATH } from './test-utils';

import type { ConversationId, MessageId } from '@granit/ai-chat';

afterEach(() => {
  vi.restoreAllMocks();
});

describe('conversation hooks', () => {
  it('useConversations returns the list, newest first', async () => {
    const client = createMockClient();
    vi.mocked(client.get).mockResolvedValue(axiosResponse(mockConversationSummaries));

    const { result } = renderHook(() => useConversations(), { wrapper: createWrapper(client) });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.data).toHaveLength(2);
    expect(client.get).toHaveBeenCalledWith(TEST_BASE_PATH);
  });

  it('useChatWorkspaces returns workspaces with Auto first', async () => {
    const client = createMockClient();
    vi.mocked(client.get).mockResolvedValue(axiosResponse({ workspaces: ['Auto', 'default'] }));

    const { result } = renderHook(() => useChatWorkspaces(), { wrapper: createWrapper(client) });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.data?.workspaces[0]).toBe('Auto');
    expect(client.get).toHaveBeenCalledWith(`${TEST_BASE_PATH}/workspaces`);
  });

  it('useCreateConversation POSTs the title and resolves the new conversation', async () => {
    const client = createMockClient();
    vi.mocked(client.post).mockResolvedValue(axiosResponse(mockConversation));

    const { result } = renderHook(() => useCreateConversation(), {
      wrapper: createWrapper(client),
    });

    let created: unknown;
    await act(async () => {
      created = await result.current.createAsync({ title: 'New chat' });
    });

    expect(client.post).toHaveBeenCalledWith(TEST_BASE_PATH, { title: 'New chat' });
    expect(created).toEqual(mockConversation);
  });

  it('useDeleteConversation DELETEs the conversation by id', async () => {
    const client = createMockClient();
    vi.mocked(client.delete).mockResolvedValue(axiosResponse(undefined));

    const { result } = renderHook(() => useDeleteConversation(), {
      wrapper: createWrapper(client),
    });

    const id = mockConversation.id as ConversationId;
    await act(async () => {
      await result.current.removeAsync(id);
    });

    expect(client.delete).toHaveBeenCalledWith(`${TEST_BASE_PATH}/${id}`);
  });

  it('useSetConversationFavorite PUTs {id, isFavorite} and invalidates list + detail', async () => {
    const client = createMockClient();
    vi.mocked(client.put).mockResolvedValue(axiosResponse(undefined));

    const wrapper = createWrapper(client);
    const { result } = renderHook(
      () => {
        const queryClient = useQueryClient();
        return { favorite: useSetConversationFavorite(), queryClient };
      },
      { wrapper }
    );
    const invalidateSpy = vi.spyOn(result.current.queryClient, 'invalidateQueries');

    const id = mockConversation.id as ConversationId;
    await act(async () => {
      await result.current.favorite.setFavoriteAsync({ id, isFavorite: true });
    });

    expect(client.put).toHaveBeenCalledWith(`${TEST_BASE_PATH}/${id}/favorite`, {
      isFavorite: true,
    });
    const invalidatedKeys = invalidateSpy.mock.calls.map(([arg]) => arg?.queryKey);
    expect(invalidatedKeys).toContainEqual(expect.arrayContaining(['conversations', 'list']));
    expect(invalidatedKeys).toContainEqual(expect.arrayContaining(['conversations', 'detail', id]));
  });

  it('useReportMessage POSTs the reason and category to the message report endpoint', async () => {
    const client = createMockClient();
    vi.mocked(client.post).mockResolvedValue(axiosResponse(undefined));

    const { result } = renderHook(() => useReportMessage(), {
      wrapper: createWrapper(client),
    });

    const messageId = 'c3333333-3333-3333-3333-333333333333' as MessageId;
    await act(async () => {
      await result.current.reportAsync({
        messageId,
        reason: 'Inaccurate answer',
        category: 'Inaccurate',
      });
    });

    expect(client.post).toHaveBeenCalledWith(`${TEST_BASE_PATH}/messages/${messageId}/report`, {
      reason: 'Inaccurate answer',
      category: 'Inaccurate',
    });
  });
});
