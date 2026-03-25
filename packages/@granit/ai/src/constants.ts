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
  WORKSPACES_VIEW: 'AI.Workspaces.View',
  WORKSPACES_CREATE: 'AI.Workspaces.Create',
  WORKSPACES_UPDATE: 'AI.Workspaces.Update',
  WORKSPACES_DELETE: 'AI.Workspaces.Delete',
  USAGES_VIEW: 'AI.Usages.View',
  CHATS_EXECUTE: 'AI.Chats.Execute',
  EMBEDDINGS_EXECUTE: 'AI.Embeddings.Execute',
} as const;

/** SSE stream termination marker. */
export const AI_STREAM_DONE_MARKER = '[DONE]';
