import type { ConversationId } from '@granit/ai-chat';

/**
 * Query-key factory for chat queries. All keys are namespaced under the
 * provider's `queryKeyPrefix` so multiple chat instances stay isolated.
 */
export const conversationKeys = {
  /** Root key for every chat query. */
  all: (prefix: readonly string[]): readonly unknown[] => [...prefix],
  /** The conversation list. */
  list: (prefix: readonly string[]): readonly unknown[] => [...prefix, 'conversations', 'list'],
  /** A single conversation's metadata (title, favorite, dates). */
  detail: (prefix: readonly string[], id: ConversationId): readonly unknown[] => [
    ...prefix,
    'conversations',
    'detail',
    id,
  ],
  /**
   * The conversation's paginated message thread (reverse infinite query). Nested
   * under `detail` so a prefix invalidation of the conversation also covers its
   * messages — but stream-completion uses `detail` with `exact: true` to refresh
   * metadata WITHOUT triggering a full re-fetch of every loaded message page.
   */
  messages: (prefix: readonly string[], id: ConversationId): readonly unknown[] => [
    ...prefix,
    'conversations',
    'detail',
    id,
    'messages',
  ],
  /** The selectable default workspaces. */
  workspaces: (prefix: readonly string[]): readonly unknown[] => [
    ...prefix,
    'conversations',
    'workspaces',
  ],
} as const;
