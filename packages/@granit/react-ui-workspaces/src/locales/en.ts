/**
 * English strings for the workspaces UI. Flat `Workspace.*` keys in the
 * `translation` namespace (the host registers them with separators disabled, so
 * the dotted keys are looked up verbatim).
 */
export const workspacesTranslationsEn = {
  'Workspace.App.Subtitle': 'Pick an item from the sidebar to get started.',
  'Workspace.NotFound.Body': 'No workspace named ',
  'Workspace.NotFound.BodySuffix': ' is registered for the current user.',
  'Workspace.NotFound.Title': 'Workspace not found',
  'Workspace.Shell.Subtitle': 'Framework shell — populated by module contributions.',
} as const;
