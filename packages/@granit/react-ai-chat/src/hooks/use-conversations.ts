import { listConversations } from '@granit/ai-chat';
import { useQuery } from '@tanstack/react-query';

import { useAIChatConfig } from '../providers/ai-chat-provider';

import { conversationKeys } from './query-keys';

import type { ConversationSummaryResponse } from '@granit/ai-chat';
import type { UseQueryResult } from '@tanstack/react-query';

/**
 * List the current user's conversations, newest first (owner-private).
 *
 * @example
 * ```tsx
 * const { data } = useConversations();
 * data?.map((c) => <li key={c.id}>{c.title}</li>);
 * ```
 */
export function useConversations(options?: {
  enabled?: boolean;
}): UseQueryResult<readonly ConversationSummaryResponse[]> {
  const config = useAIChatConfig();
  return useQuery({
    queryKey: conversationKeys.list(config.queryKeyPrefix),
    queryFn: () => listConversations(config.client, config.basePath),
    enabled: options?.enabled ?? true,
  });
}
