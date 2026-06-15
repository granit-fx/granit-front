import { createConversation } from '@granit/ai-chat';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useCallback } from 'react';

import { useAIChatConfig } from '../providers/ai-chat-provider';

import { conversationKeys } from './query-keys';

import type { ConversationResponse, CreateConversationRequest } from '@granit/ai-chat';

export interface UseCreateConversationReturn {
  readonly create: (request: CreateConversationRequest) => void;
  readonly createAsync: (request: CreateConversationRequest) => Promise<ConversationResponse>;
  readonly isPending: boolean;
  readonly error: Error | null;
}

/**
 * Mutation to create an empty conversation. Invalidates the conversation list
 * on success. Requires `AIChat.Conversations.Manage`.
 */
export function useCreateConversation(): UseCreateConversationReturn {
  const config = useAIChatConfig();
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: (request: CreateConversationRequest) =>
      createConversation(config.client, config.basePath, request),
    onSuccess: () => {
      queryClient
        .invalidateQueries({ queryKey: conversationKeys.list(config.queryKeyPrefix) })
        .catch(() => undefined);
    },
  });

  const create = useCallback(
    (request: CreateConversationRequest) => {
      mutation.mutate(request);
    },
    [mutation]
  );

  const createAsync = useCallback(
    async (request: CreateConversationRequest) => mutation.mutateAsync(request),
    [mutation]
  );

  return { create, createAsync, isPending: mutation.isPending, error: mutation.error };
}
