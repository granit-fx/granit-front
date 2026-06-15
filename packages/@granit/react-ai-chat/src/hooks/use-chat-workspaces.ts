import { listChatWorkspaces } from '@granit/ai-chat';
import { useQuery } from '@tanstack/react-query';

import { useAIChatConfig } from '../providers/ai-chat-provider';

import { conversationKeys } from './query-keys';

import type { ChatWorkspacesResponse } from '@granit/ai-chat';
import type { UseQueryResult } from '@tanstack/react-query';

/**
 * List the workspaces a user may set as their default chat workspace
 * (`Auto` first, then the chat-capable workspaces). Backs the workspace
 * dropdown in the composer and the chat settings screen.
 */
export function useChatWorkspaces(options?: {
  enabled?: boolean;
}): UseQueryResult<ChatWorkspacesResponse> {
  const config = useAIChatConfig();
  return useQuery({
    queryKey: conversationKeys.workspaces(config.queryKeyPrefix),
    queryFn: () => listChatWorkspaces(config.client, config.basePath),
    enabled: options?.enabled ?? true,
  });
}
