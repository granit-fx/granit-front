import { getConversationMessages } from '@granit/ai-chat';
import { usePagedInfiniteQuery } from '@granit/react-query-engine';
import { useMemo } from 'react';

import { useAIChatConfig } from '../providers/ai-chat-provider';

import { conversationKeys } from './query-keys';

import type { ConversationId, MessageResponse } from '@granit/ai-chat';
import type { PagedResult } from '@granit/query-engine';

/** Default page size; mirrors the endpoint's server-side default. */
const DEFAULT_PAGE_SIZE = 30;

/**
 * Page cursor threaded through the infinite query: an opaque keyset string, or
 * `undefined` for the first (newest) page.
 */
export type MessagesPageParam = string | undefined;

/** Options for {@link useConversationMessages}. */
export interface UseConversationMessagesOptions {
  /** Messages per page (server caps at 100). Default `30`. */
  readonly pageSize?: number;
  /** Force-disable the query (composes with the automatic `id !== null` gate). */
  readonly enabled?: boolean;
}

/** Shape returned by {@link useConversationMessages}. */
export interface UseConversationMessagesResult {
  /**
   * Every loaded message flattened **oldest-first** for top-to-bottom rendering.
   * ⚠️ Each message's `content` is untrusted model output for assistant rows —
   * render as plain text or sanitize before any HTML sink.
   */
  readonly messages: readonly MessageResponse[];
  /** Whether an older page can still be loaded (drives the scroll-up sentinel). */
  readonly hasMoreOlder: boolean;
  /** Load the next OLDER page. No-op while one is already loading or none remain. */
  readonly loadOlder: () => void;
  /** Whether an older page is currently being fetched. */
  readonly isLoadingOlder: boolean;
  /** First page is loading (no data yet). */
  readonly isLoading: boolean;
  /** Any fetch (initial or background) is in flight. */
  readonly isFetching: boolean;
  /** The query errored. */
  readonly isError: boolean;
  /** The error, if any. */
  readonly error: unknown;
  /** Refetch every loaded page from the newest. */
  readonly refetch: () => void;
}

/**
 * Reverse (keyset) infinite query for a conversation's messages. Loads the
 * newest page first, then OLDER pages on demand (scroll-up), over the
 * framework's generic {@link usePagedInfiniteQuery} + `PagedResult` cursor
 * contract — the same machinery `useLookup` rides. Pair it with
 * {@link useReverseInfiniteScroll} to keep the viewport anchored on prepend.
 *
 * The server sorts newest-first (`-createdAt`), so pages arrive newest → older;
 * `messages` is reversed to oldest-first for natural top-to-bottom rendering.
 *
 * This is the thread's source of truth — `useConversation` is left for
 * conversation METADATA (title, favorite, dates); `getConversation` no longer
 * embeds the message thread.
 *
 * @param id - the conversation id, or `null` to disable the query (e.g. before
 *   the first turn of a brand-new conversation resolves an id).
 */
export function useConversationMessages(
  id: ConversationId | null,
  options: UseConversationMessagesOptions = {}
): UseConversationMessagesResult {
  const config = useAIChatConfig();
  const pageSize = options.pageSize ?? DEFAULT_PAGE_SIZE;

  const paged = usePagedInfiniteQuery<
    MessageResponse,
    PagedResult<MessageResponse>,
    MessagesPageParam
  >({
    queryKey: conversationKeys.messages(config.queryKeyPrefix, id ?? ('' as ConversationId)),
    fetchPage: ({ pageParam, signal }) =>
      getConversationMessages(
        config.client,
        config.basePath,
        id as ConversationId,
        { cursor: pageParam, pageSize },
        signal
      ),
    initialPageParam: undefined,
    getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
    enabled: (options.enabled ?? true) && id !== null,
  });

  // Pages arrive newest-first (server sorts `-createdAt`); reverse the flattened
  // accumulation so the oldest message renders at the top.
  const messages = useMemo<readonly MessageResponse[]>(
    () => [...paged.items].reverse(),
    [paged.items]
  );

  return {
    messages,
    hasMoreOlder: paged.hasNextPage,
    loadOlder: paged.fetchNextPage,
    isLoadingOlder: paged.isFetchingNextPage,
    isLoading: paged.isLoading,
    isFetching: paged.isFetching,
    isError: paged.isError,
    error: paged.error,
    refetch: paged.refetch,
  };
}
