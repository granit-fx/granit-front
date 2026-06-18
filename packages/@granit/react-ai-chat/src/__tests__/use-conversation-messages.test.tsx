import { createMockClient } from '@granit/testing';
import { act, renderHook, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { useConversationMessages } from '../hooks/use-conversation-messages';

import { createWrapper } from './test-utils';

import type { ConversationId, MessageResponse } from '@granit/ai-chat';
import type { PagedResult } from '@granit/query-engine';

const ID = 'a1111111-1111-1111-1111-111111111111' as ConversationId;

function msg(n: number, role: 'user' | 'assistant'): MessageResponse {
  return {
    id: `c3333333-3333-3333-3333-${String(n).padStart(12, '0')}` as MessageResponse['id'],
    role,
    content: `m${n}`,
    createdAt: `2026-06-15T09:00:0${n}.000Z` as MessageResponse['createdAt'],
  };
}

afterEach(() => {
  vi.restoreAllMocks();
});

describe('useConversationMessages', () => {
  it('reverses newest-first pages to oldest-first and walks older until nextCursor is null', async () => {
    const client = createMockClient();
    // Server sorts -createdAt → pages are newest-first within and across.
    const newest: PagedResult<MessageResponse> = {
      items: [msg(3, 'assistant'), msg(2, 'user')],
      totalCount: null,
      nextCursor: 'cur-older',
    };
    const older: PagedResult<MessageResponse> = {
      items: [msg(1, 'assistant'), msg(0, 'user')],
      totalCount: null,
      nextCursor: null,
    };
    vi.spyOn(client, 'get')
      .mockResolvedValueOnce({ data: newest })
      .mockResolvedValueOnce({ data: older });

    const { result } = renderHook(() => useConversationMessages(ID), {
      wrapper: createWrapper(client),
    });

    // Newest page, reversed to oldest-first for display.
    await waitFor(() => expect(result.current.messages).toHaveLength(2));
    expect(result.current.messages.map((m) => m.content)).toEqual(['m2', 'm3']);
    expect(result.current.hasMoreOlder).toBe(true);

    act(() => {
      result.current.loadOlder();
    });

    // Older page prepended → fully oldest-first, and pagination stops.
    await waitFor(() => expect(result.current.messages).toHaveLength(4));
    expect(result.current.messages.map((m) => m.content)).toEqual(['m0', 'm1', 'm2', 'm3']);
    expect(result.current.hasMoreOlder).toBe(false);
  });

  it('requests the newest page with no cursor, then the older page with cursor=nextCursor', async () => {
    const client = createMockClient();
    const get = vi
      .spyOn(client, 'get')
      .mockResolvedValueOnce({
        data: { items: [msg(2, 'user')], totalCount: null, nextCursor: 'cur-older' },
      })
      .mockResolvedValueOnce({
        data: { items: [msg(0, 'user')], totalCount: null, nextCursor: null },
      });

    const { result } = renderHook(() => useConversationMessages(ID, { pageSize: 1 }), {
      wrapper: createWrapper(client),
    });

    await waitFor(() => expect(result.current.messages).toHaveLength(1));
    expect(get.mock.calls[0]?.[0]).toBe(`/api/v1/conversations/${ID}/messages?pageSize=1`);

    act(() => {
      result.current.loadOlder();
    });
    await waitFor(() => expect(result.current.messages).toHaveLength(2));
    expect(get.mock.calls[1]?.[0]).toBe(
      `/api/v1/conversations/${ID}/messages?pageSize=1&cursor=cur-older`
    );
  });

  it('issues no request while id is null', () => {
    const client = createMockClient();
    const get = vi
      .spyOn(client, 'get')
      .mockResolvedValue({ data: { items: [], totalCount: null, nextCursor: null } });

    renderHook(() => useConversationMessages(null), { wrapper: createWrapper(client) });

    expect(get).not.toHaveBeenCalled();
  });
});
