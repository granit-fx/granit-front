// ---------------------------------------------------------------------------
// AI module constants. Mirrors Granit.AI.Endpoints permission and kind values.
// ---------------------------------------------------------------------------

/** Workspace kind constants. Mirrors `AIWorkspaceKind` enum. */
export const AI_WORKSPACE_KINDS = {
  SYSTEM: 'System',
  DYNAMIC: 'Dynamic',
} as const;

/** AI permission strings. Mirrors `AIPermissions` in Granit.AI.Endpoints. */
export const AI_PERMISSIONS = {
  WORKSPACES_READ: 'AI.Workspaces.Read',
  WORKSPACES_MANAGE: 'AI.Workspaces.Manage',
  USAGE_READ: 'AI.Usage.Read',
  CHAT_EXECUTE: 'AI.Chat.Execute',
  EMBEDDINGS_EXECUTE: 'AI.Embeddings.Execute',
} as const;

/** Well-known capability extension identifiers. Mirrors `WellKnownAICapabilities`. */
export const AI_CAPABILITY_EXTENSIONS = {
  WEB_SEARCH: 'web-search',
  CODE_INTERPRETER: 'code-interpreter',
  FILE_UPLOAD: 'file-upload',
  FILE_CONTEXT: 'file-context',
  CITATIONS: 'citations',
  STATUS_UPDATES: 'status-updates',
  BUILTIN_TOOLS: 'builtin-tools',
} as const;

/** SSE stream termination marker. */
export const AI_STREAM_DONE_MARKER = '[DONE]';
