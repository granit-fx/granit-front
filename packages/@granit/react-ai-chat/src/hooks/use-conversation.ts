import { getConversation } from '@granit/ai-chat';
import { useQuery } from '@tanstack/react-query';

import { useAIChatConfig } from '../providers/ai-chat-provider';

import { conversationKeys } from './query-keys';

import type { ConversationId, ConversationResponse } from '@granit/ai-chat';
import type { UseQueryResult } from '@tanstack/react-query';

/**
 * Fetch one of the current user's conversations (metadata only — title,
 * favorite, timestamps). The message thread is loaded separately via
 * {@link useConversationMessages}.
 *
 * @param id - the conversation id, or `null` to disable the query (e.g. before
 *   the first turn of a brand-new conversation).
 */
export function useConversation(
  id: ConversationId | null,
  options?: { enabled?: boolean }
): UseQueryResult<ConversationResponse> {
  const config = useAIChatConfig();
  return useQuery({
    queryKey: conversationKeys.detail(config.queryKeyPrefix, id ?? ('' as ConversationId)),
    queryFn: () => getConversation(config.client, config.basePath, id as ConversationId),
    enabled: (options?.enabled ?? true) && id !== null,
  });
}
