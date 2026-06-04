// ---------------------------------------------------------------------------
// AI module constants. Mirrors Granit.AI.Endpoints permission and kind values.
// ---------------------------------------------------------------------------

import { AIPermissions } from './permissions';

/** Workspace kind constants. Mirrors `AIWorkspaceKind` enum. */
export const AI_WORKSPACE_KINDS = {
  SYSTEM: 'System',
  DYNAMIC: 'Dynamic',
} as const;

/**
 * AI permission strings (flat map). Derived from the canonical nested
 * {@link AIPermissions} (in `permissions.ts`) so the two representations share a
 * single source of truth and cannot drift apart.
 */
export const AI_PERMISSIONS = {
  WORKSPACES_READ: AIPermissions.Workspaces.Read,
  WORKSPACES_MANAGE: AIPermissions.Workspaces.Manage,
  USAGE_READ: AIPermissions.Usage.Read,
  CHAT_EXECUTE: AIPermissions.Chat.Execute,
  EMBEDDINGS_EXECUTE: AIPermissions.Embeddings.Execute,
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
