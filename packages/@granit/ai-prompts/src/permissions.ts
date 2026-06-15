/**
 * Permission constants for the AI prompt catalogue.
 * Mirrors `Granit.AI.Prompts.Endpoints.Permissions.AIPromptsPermissions`.
 *
 * The server enforces these; the client only gates affordances. User prompts
 * are owner-private — never build cross-user views.
 */
export const AIPromptsPermissions = {
  Templates: {
    /** List/read prompts (system + the caller's own) and the picker. */
    Read: 'AIPrompts.Templates.Read',
    /** Create, update, and customise prompts. */
    Manage: 'AIPrompts.Templates.Manage',
    /** Delete the caller's own prompts. */
    Delete: 'AIPrompts.Templates.Delete',
  },
} as const;
