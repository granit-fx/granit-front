import { renameConversation } from '@granit/ai-chat';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useCallback } from 'react';

import { useAIChatConfig } from '../providers/ai-chat-provider';

import { conversationKeys } from './query-keys';

import type { ConversationId, RenameConversationRequest } from '@granit/ai-chat';

export interface RenameConversationVariables {
  readonly id: ConversationId;
  readonly request: RenameConversationRequest;
}

export interface UseRenameConversationReturn {
  readonly rename: (variables: RenameConversationVariables) => void;
  readonly renameAsync: (variables: RenameConversationVariables) => Promise<void>;
  readonly isPending: boolean;
  readonly error: Error | null;
}

/**
 * Mutation to rename a conversation. Invalidates the list and the affected
 * detail on success. Requires `AIChat.Conversations.Manage`.
 */
export function useRenameConversation(): UseRenameConversationReturn {
  const config = useAIChatConfig();
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: ({ id, request }: RenameConversationVariables) =>
      renameConversation(config.client, config.basePath, id, request),
    onSuccess: (_data, { id }) => {
      queryClient
        .invalidateQueries({ queryKey: conversationKeys.list(config.queryKeyPrefix) })
        .catch(() => undefined);
      queryClient
        .invalidateQueries({ queryKey: conversationKeys.detail(config.queryKeyPrefix, id) })
        .catch(() => undefined);
    },
  });

  const rename = useCallback(
    (variables: RenameConversationVariables) => {
      mutation.mutate(variables);
    },
    [mutation]
  );

  const renameAsync = useCallback(
    async (variables: RenameConversationVariables) => {
      await mutation.mutateAsync(variables);
    },
    [mutation]
  );

  return { rename, renameAsync, isPending: mutation.isPending, error: mutation.error };
}
