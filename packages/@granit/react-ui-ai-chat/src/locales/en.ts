/**
 * English admin strings for the AI Chat UI. Flat `AiChat.*` keys in the
 * `translation` namespace (the host registers them with separators disabled, so
 * the dotted keys are looked up verbatim). Named `aiChatAdminTranslationsEn` to
 * avoid colliding with the headless `aiChatTranslationsEn` from
 * `@granit/react-ai-chat`.
 */
export const aiChatAdminTranslationsEn = {
  'AiChat.Actions.Category.Harmful': 'Harmful or unsafe',
  'AiChat.Actions.Category.Inaccurate': 'Inaccurate',
  'AiChat.Actions.Category.Other': 'Other',
  'AiChat.Actions.Copied': 'Message copied',
  'AiChat.Actions.Copy': 'Copy',
  'AiChat.Actions.CopyAsHtml': 'Copy with HTML formatting',
  'AiChat.Actions.CopyAsHtmlHint': 'Ideal for Docs and Emails',
  'AiChat.Actions.CopyAsMarkdown': 'Copy with Markdown formatting',
  'AiChat.Actions.CopyAsMarkdownHint': 'Ideal for Notion',
  'AiChat.Actions.CopyAsPlain': 'Copy as plain text',
  'AiChat.Actions.CopyAsPlainHint': 'Remove all formatting',
  'AiChat.Actions.CopyFailed': "Couldn't copy the message",
  'AiChat.Actions.Regenerate': 'Regenerate response',
  'AiChat.Actions.Report': 'Report',
  'AiChat.Actions.ReportCategoryLabel': 'Category',
  'AiChat.Actions.ReportCategoryPlaceholder': 'Select a category (optional)',
  'AiChat.Actions.ReportDialogDescription':
    "Tell us what's wrong with this response. Your report helps improve the assistant.",
  'AiChat.Actions.ReportDialogTitle': 'Report this message',
  'AiChat.Actions.ReportFailed': "Couldn't send the report",
  'AiChat.Actions.ReportReasonLabel': 'Reason',
  'AiChat.Actions.ReportReasonPlaceholder': 'Describe the problem…',
  'AiChat.Actions.ReportSubmit': 'Send report',
  'AiChat.Actions.ReportSubmitted': 'Message reported',
  'AiChat.Capability.Documents': 'Reads documents',
  'AiChat.Capability.Reasoning': 'Advanced reasoning',
  'AiChat.Capability.Tools': 'Uses tools',
  'AiChat.Capability.Vision': 'Understands images',
  'AiChat.Conversation.Actions': 'Conversation options',
  'AiChat.Conversation.Delete': 'Delete',
  'AiChat.Conversation.DeleteDescription':
    '"{{title}}" and all of its messages will be permanently deleted. This action cannot be undone.',
  'AiChat.Conversation.DeleteTitle': 'Delete conversation',
  'AiChat.Conversation.Favorites': 'Favorites',
  'AiChat.Conversation.Pin': 'Pin',
  'AiChat.Conversation.Recent': 'Recent',
  'AiChat.Conversation.Rename': 'Rename',
  'AiChat.Conversation.RenameDescription': 'Enter a new name for this conversation.',
  'AiChat.Conversation.RenameLabel': 'Name',
  'AiChat.Conversation.RenameTitle': 'Rename conversation',
  'AiChat.Conversation.Unpin': 'Unpin',
  'AiChat.Settings.CustomContext': 'Custom context',
  'AiChat.Settings.CustomContextPlaceholder':
    'Extra context to inject into every chat (e.g. your role, tone).',
  'AiChat.Settings.DefaultWorkspace': 'Default workspace',
  'AiChat.Settings.Defaults': 'Defaults',
  'AiChat.Settings.SaveFailed': "Couldn't save your preferences",
  'AiChat.Settings.Saved': 'Preferences saved',
  'AiChat.Settings.Subtitle': 'Your personal defaults for the agentic chat.',
  'AiChat.Settings.Title': 'Chat preferences',
  'AiChat.Settings.WebSearch': 'Web search',
  'AiChat.Settings.WebSearchHint':
    'Web search is coming in a later phase — this captures your preference now.',
  'AiChat.Settings.WebSearchPolicy.Allow': 'Allow',
  'AiChat.Settings.WebSearchPolicy.AlwaysAsk': 'Always ask',
  'AiChat.Settings.WebSearchPolicy.Deny': 'Deny',
  'AiChat.Thinking': 'Assistant is thinking…',
  'AiChat.Workspace.GroupAvailable': 'Available',
} as const;
