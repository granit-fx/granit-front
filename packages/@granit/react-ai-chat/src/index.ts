// Provider
export { AIChatProvider, useAIChatConfig } from './providers/ai-chat-provider';
export type {
  AIChatConfig,
  AIChatProviderProps,
  ResolvedAIChatConfig,
} from './providers/ai-chat-provider';

// Query keys
export { conversationKeys } from './hooks/query-keys';

// Hooks — conversations
export { useConversations } from './hooks/use-conversations';
export { useConversation } from './hooks/use-conversation';
export { useChatWorkspaces } from './hooks/use-chat-workspaces';
export { useCreateConversation } from './hooks/use-create-conversation';
export type { UseCreateConversationReturn } from './hooks/use-create-conversation';
export { useRenameConversation } from './hooks/use-rename-conversation';
export type {
  RenameConversationVariables,
  UseRenameConversationReturn,
} from './hooks/use-rename-conversation';
export { useDeleteConversation } from './hooks/use-delete-conversation';
export type { UseDeleteConversationReturn } from './hooks/use-delete-conversation';

// Hooks — streaming
export { useChatStream } from './hooks/use-chat-stream';
export type { ChatStreamUsage, UseChatStreamReturn } from './hooks/use-chat-stream';
