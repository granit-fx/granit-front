import { getConversationMessages } from '@granit/ai-chat';
import { useInfiniteQuery } from '@tanstack/react-query';
import { useMemo } from 'react';

import { useAIChatConfig } from '../providers/ai-chat-provider';

import { conversationKeys } from './query-keys';

import type { ConversationId, MessagePage, MessageResponse } from '@granit/ai-chat';
import type { InfiniteData } from '@tanstack/react-query';

/** Default page size; mirrors the endpoint's server-side default. */
const DEFAULT_LIMIT = 30;

/** Page cursor threaded through the infinite query. `before: undefined` = newest page. */
export interface MessagesPageParam {
  readonly before?: string;
}

/** Options for {@link useConversationMessages}. */
export interface UseConversationMessagesOptions {
  /** Messages per page (server caps at 100). Default `30`. */
  readonly limit?: number;
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
 * Reverse (keyset) infinite query for a conversation's messages, backed by
 * `GET {basePath}/{id}/messages`. Loads the newest page first, then OLDER pages
 * on demand (scroll-up). Pair it with {@link useReverseInfiniteScroll} to keep
 * the viewport anchored when an older page is prepended.
 *
 * This is the thread's source of truth — `useConversation` is left for
 * conversation METADATA (title, favorite, dates) only. `getConversation` still
 * returns its `messages` for backward compatibility, but the thread no longer
 * relies on them.
 *
 * @param id - the conversation id, or `null` to disable the query (e.g. before
 *   the first turn of a brand-new conversation resolves an id).
 */
export function useConversationMessages(
  id: ConversationId | null,
  options: UseConversationMessagesOptions = {}
): UseConversationMessagesResult {
  const config = useAIChatConfig();
  const limit = options.limit ?? DEFAULT_LIMIT;

  const query = useInfiniteQuery<
    MessagePage,
    unknown,
    InfiniteData<MessagePage, MessagesPageParam>,
    readonly unknown[],
    MessagesPageParam
  >({
    queryKey: conversationKeys.messages(config.queryKeyPrefix, id ?? ('' as ConversationId)),
    queryFn: ({ pageParam, signal }) =>
      getConversationMessages(
        config.client,
        config.basePath,
        id as ConversationId,
        { limit, before: pageParam.before },
        signal
      ),
    initialPageParam: { before: undefined },
    getNextPageParam: (lastPage) =>
      lastPage.nextCursor != null ? { before: lastPage.nextCursor } : undefined,
    enabled: (options.enabled ?? true) && id !== null,
  });

  // Pages arrive newest-block → older-block, ascending within each block, so the
  // display order is the pages reversed and then flattened.
  const messages = useMemo<readonly MessageResponse[]>(
    () => (query.data ? [...query.data.pages].reverse().flatMap((page) => page.items) : []),
    [query.data]
  );

  return {
    messages,
    hasMoreOlder: query.hasNextPage,
    loadOlder: () => {
      if (query.hasNextPage && !query.isFetchingNextPage) query.fetchNextPage();
    },
    isLoadingOlder: query.isFetchingNextPage,
    isLoading: query.isLoading,
    isFetching: query.isFetching,
    isError: query.isError,
    error: query.error,
    refetch: () => {
      query.refetch();
    },
  };
}
