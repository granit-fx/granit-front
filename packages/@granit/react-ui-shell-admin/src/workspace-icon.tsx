import { workspaceIconRenderer } from './icon-registry';

/**
 * Renders a workspace icon by its kebab-case name as emitted by the backend
 * workspace tree (`shield-user`, `users-round`, …). Resolves against the
 * host-provided registry (see `registerWorkspaceIcons`); falls back to `Square`
 * when the name is null or unregistered.
 */
export const WorkspaceIcon = workspaceIconRenderer;
