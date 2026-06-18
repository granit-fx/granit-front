import { setConversationFavorite } from '@granit/ai-chat';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useCallback } from 'react';

import { useAIChatConfig } from '../providers/ai-chat-provider';

import { conversationKeys } from './query-keys';

import type { ConversationId } from '@granit/ai-chat';

export interface SetConversationFavoriteVariables {
  readonly id: ConversationId;
  /** Desired favorite state — explicit, not a toggle. */
  readonly isFavorite: boolean;
}

export interface UseSetConversationFavoriteReturn {
  readonly setFavorite: (variables: SetConversationFavoriteVariables) => void;
  readonly setFavoriteAsync: (variables: SetConversationFavoriteVariables) => Promise<void>;
  readonly isPending: boolean;
  readonly error: Error | null;
}

/**
 * Mutation to set a conversation's favorite flag to an explicit state.
 * Invalidates the list and the affected detail on success. Requires
 * `AIChat.Conversations.Manage`.
 */
export function useSetConversationFavorite(): UseSetConversationFavoriteReturn {
  const config = useAIChatConfig();
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: ({ id, isFavorite }: SetConversationFavoriteVariables) =>
      setConversationFavorite(config.client, config.basePath, id, isFavorite),
    onSuccess: (_data, { id }) => {
      queryClient
        .invalidateQueries({ queryKey: conversationKeys.list(config.queryKeyPrefix) })
        .catch(() => undefined);
      queryClient
        .invalidateQueries({ queryKey: conversationKeys.detail(config.queryKeyPrefix, id) })
        .catch(() => undefined);
    },
  });

  const setFavorite = useCallback(
    (variables: SetConversationFavoriteVariables) => {
      mutation.mutate(variables);
    },
    [mutation]
  );

  const setFavoriteAsync = useCallback(
    async (variables: SetConversationFavoriteVariables) => {
      await mutation.mutateAsync(variables);
    },
    [mutation]
  );

  return { setFavorite, setFavoriteAsync, isPending: mutation.isPending, error: mutation.error };
}
