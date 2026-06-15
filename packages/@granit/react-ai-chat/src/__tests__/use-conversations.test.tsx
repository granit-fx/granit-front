import { axiosResponse, createMockClient } from '@granit/testing';
import { act, renderHook, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { useChatWorkspaces } from '../hooks/use-chat-workspaces';
import { useConversations } from '../hooks/use-conversations';
import { useCreateConversation } from '../hooks/use-create-conversation';
import { useDeleteConversation } from '../hooks/use-delete-conversation';
import { mockConversation, mockConversationSummaries } from '../testing/data';

import { createWrapper, TEST_BASE_PATH } from './test-utils';

import type { ConversationId } from '@granit/ai-chat';

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
});
