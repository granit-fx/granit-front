/**
 * Permission constants for the agentic chat module.
 * Mirrors `Granit.AI.Chat.Endpoints.Permissions.AIChatPermissions`.
 *
 * The server enforces these; the client only gates affordances. Conversations
 * are owner-private — never build cross-user views.
 */
export const AIChatPermissions = {
  Conversations: {
    /** List/read the caller's own conversations. */
    Read: 'AIChat.Conversations.Read',
    /** Send a message and stream an answer. */
    Send: 'AIChat.Conversations.Send',
    /** Create or rename a conversation. */
    Manage: 'AIChat.Conversations.Manage',
    /** Delete a conversation. */
    Delete: 'AIChat.Conversations.Delete',
    /** Report (flag) a message in one's own conversations for review. */
    Report: 'AIChat.Conversations.Report',
  },
} as const;
