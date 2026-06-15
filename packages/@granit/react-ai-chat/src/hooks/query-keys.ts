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
  /** A single conversation and its messages. */
  detail: (prefix: readonly string[], id: ConversationId): readonly unknown[] => [
    ...prefix,
    'conversations',
    'detail',
    id,
  ],
  /** The selectable default workspaces. */
  workspaces: (prefix: readonly string[]): readonly unknown[] => [
    ...prefix,
    'conversations',
    'workspaces',
  ],
} as const;
