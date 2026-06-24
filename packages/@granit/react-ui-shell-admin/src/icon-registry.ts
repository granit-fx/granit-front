import { createIconRegistry } from '@granit/react-icons';
import { Square } from 'lucide-react';

import type { IconGlyph } from '@granit/react-icons';

/** @deprecated Use `IconGlyph` from `@granit/react-icons`. Kept for back-compat. */
export type WorkspaceIconComponent = IconGlyph;

/**
 * Open icon registry for the shell. Workspace icon names are assigned by the
 * backend (`WorkspaceDefinition.Icon(...)`), an open vocabulary the package
 * cannot enumerate — so the host registers exactly its set via
 * {@link registerWorkspaceIcons} (static lucide imports → tree-shaken).
 * Unregistered names render `Square`. See `@granit/react-icons`'s `createIconRegistry`.
 */
const workspaceIcons = createIconRegistry({ fallback: Square });

export const registerWorkspaceIcons = workspaceIcons.register;
export const setWorkspaceIconFallback = workspaceIcons.setFallback;
export const resolveWorkspaceIcon = workspaceIcons.resolve;

/** Internal: the bound renderer re-exported as `WorkspaceIcon`. */
export const workspaceIconRenderer = workspaceIcons.Icon;
