/** Permission constants for the AI module. Mirrors `Granit.AI.Endpoints.Permissions.AIPermissions`. */
export const AIPermissions = {
  Workspaces: {
    Read: 'AI.Workspaces.Read',
    /** Grants management access to AI workspaces (create, update, delete). */
    Manage: 'AI.Workspaces.Manage',
  },
  Usage: {
    Read: 'AI.Usage.Read',
  },
  Chat: {
    Execute: 'AI.Chat.Execute',
  },
  Embeddings: {
    Execute: 'AI.Embeddings.Execute',
  },
} as const;
