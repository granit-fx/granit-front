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
export { useReportMessage } from './hooks/use-report-message';
export type { ReportMessageVariables, UseReportMessageReturn } from './hooks/use-report-message';

// Re-exports from @granit/ai-chat — the report contract the showcase dialog needs.
export { MESSAGE_REPORT_CATEGORIES } from '@granit/ai-chat';
export type { MessageReportCategory, ReportMessageRequest } from '@granit/ai-chat';

// Hooks — streaming
export { useChatStream } from './hooks/use-chat-stream';
export type {
  ChatStreamUsage,
  ToolCallActivity,
  ToolCallStatus,
  UseChatStreamReturn,
} from './hooks/use-chat-stream';

// Components
export { ChatMessage } from './components/chat-message';
export type { ChatMessageProps } from './components/chat-message';
export { ConversationThread } from './components/conversation-thread';
export type { ConversationThreadProps } from './components/conversation-thread';
export { SuggestedActions } from './components/suggested-actions';
export type { SuggestedActionsProps } from './components/suggested-actions';
export { ClarificationPrompt } from './components/clarification-prompt';
export type { ClarificationPromptProps } from './components/clarification-prompt';
export { ToolActivity } from './components/tool-activity';
export type { ToolActivityProps } from './components/tool-activity';
export { AttachmentChips } from './components/attachment-chips';
export type {
  AttachmentChipsProps,
  AttachmentStatus,
  ComposerAttachment,
} from './components/attachment-chips';
export { ChatComposer } from './components/chat-composer';
export type { ChatComposerProps } from './components/chat-composer';
export { WorkspaceSelector } from './components/workspace-selector';
export type { WorkspaceSelectorProps } from './components/workspace-selector';
export { ComposerSuggestions } from './components/composer-suggestions';
export type { ComposerSuggestionsProps } from './components/composer-suggestions';
export { detectTrigger } from './components/detect-trigger';
export type { ActiveTrigger } from './components/detect-trigger';
export type {
  MentionOption,
  PromptOption,
  SearchMentions,
  StagedMention,
  UploadAttachment,
  WorkspaceOption,
} from './components/composer-types';

// i18n
export { aiChatTranslationsEn, aiChatTranslationsFr, defaultChatLabels } from './locales/index';
export type { ChatTranslations } from './locales/index';
