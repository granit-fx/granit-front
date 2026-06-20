// Provider
export {
  AIChatProvider,
  useAIChatConfig,
  useOptionalAIChatConfig,
} from './providers/ai-chat-provider';
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
export { useConversationMessages } from './hooks/use-conversation-messages';
export type {
  MessagesPageParam,
  UseConversationMessagesOptions,
  UseConversationMessagesResult,
} from './hooks/use-conversation-messages';
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
export { useSetConversationFavorite } from './hooks/use-set-conversation-favorite';
export type {
  SetConversationFavoriteVariables,
  UseSetConversationFavoriteReturn,
} from './hooks/use-set-conversation-favorite';
export { useReportMessage } from './hooks/use-report-message';
export type { ReportMessageVariables, UseReportMessageReturn } from './hooks/use-report-message';

// Hooks — mentions
export { useDefaultMentionSearch } from './hooks/use-default-mention-search';

// Re-exports from @granit/ai-chat — the report contract the showcase dialog needs.
export { MESSAGE_REPORT_CATEGORIES } from '@granit/ai-chat';
export type { MessageReportCategory, ReportMessageRequest } from '@granit/ai-chat';

// Hooks — streaming
export { useChatStream } from './hooks/use-chat-stream';
export type {
  ChatErrorKind,
  ChatStreamUsage,
  ChatTurnMetrics,
  ToolCallActivity,
  ToolCallStatus,
  UseChatStreamReturn,
} from './hooks/use-chat-stream';

// Hooks — scrolling
export { useStickToBottom } from './hooks/use-stick-to-bottom';
export type { UseStickToBottomOptions, UseStickToBottomReturn } from './hooks/use-stick-to-bottom';
export { useReverseInfiniteScroll } from './hooks/use-reverse-infinite-scroll';
export type { UseReverseInfiniteScrollParams } from './hooks/use-reverse-infinite-scroll';

// Components
export { ChatMessage } from './components/chat-message';
export type { ChatMessageProps } from './components/chat-message';
export { ChatMarkdown } from './components/chat-markdown';
export type { ChatMarkdownProps } from './components/chat-markdown';
export { MessageMetrics } from './components/message-metrics';
export type { MessageMetricsProps } from './components/message-metrics';
export { ConversationThread } from './components/conversation-thread';
export type { ConversationThreadProps } from './components/conversation-thread';
export { ConversationScrollArea } from './components/conversation-scroll-area';
export type { ConversationScrollAreaProps } from './components/conversation-scroll-area';
export { ScrollToBottomButton } from './components/scroll-to-bottom-button';
export type { ScrollToBottomButtonProps } from './components/scroll-to-bottom-button';
export { SystemMessage } from './components/system-message';
export type { SystemMessageProps, SystemMessageVariant } from './components/system-message';
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
