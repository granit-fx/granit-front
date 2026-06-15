import { deleteConversation } from '@granit/ai-chat';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useCallback } from 'react';

import { useAIChatConfig } from '../providers/ai-chat-provider';

import { conversationKeys } from './query-keys';

import type { ConversationId } from '@granit/ai-chat';

export interface UseDeleteConversationReturn {
  readonly remove: (id: ConversationId) => void;
  readonly removeAsync: (id: ConversationId) => Promise<void>;
  readonly isPending: boolean;
  readonly error: Error | null;
}

/**
 * Mutation to delete a conversation. Invalidates the list on success.
 * Requires `AIChat.Conversations.Delete`.
 */
export function useDeleteConversation(): UseDeleteConversationReturn {
  const config = useAIChatConfig();
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: (id: ConversationId) => deleteConversation(config.client, config.basePath, id),
    onSuccess: () => {
      queryClient
        .invalidateQueries({ queryKey: conversationKeys.list(config.queryKeyPrefix) })
        .catch(() => undefined);
    },
  });

  const remove = useCallback(
    (id: ConversationId) => {
      mutation.mutate(id);
    },
    [mutation]
  );

  const removeAsync = useCallback(
    async (id: ConversationId) => {
      await mutation.mutateAsync(id);
    },
    [mutation]
  );

  return { remove, removeAsync, isPending: mutation.isPending, error: mutation.error };
}
