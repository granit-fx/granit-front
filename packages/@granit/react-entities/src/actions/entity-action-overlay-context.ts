import { createContext, useContext } from 'react';

import type { EntityActionManifest } from '@granit/entities';

/**
 * Snapshot of the action that triggered an overlay (drawer or modal).
 * Stored in `<EntityActionDrawerHost>` / `<EntityActionModalHost>`
 * context so the host's UI (Radix Dialog, shadcn Sheet, …) can read
 * the active action and render the right body — typically
 * `<EntityDetail variant="default" />` for `OpenDrawer` with a null
 * `urlTemplate`, or `<EntityForm variant="default" />` for `OpenModal`
 * with a null `urlTemplate`.
 */
export interface EntityActionOverlayState {
  readonly action: EntityActionManifest;
  /** Row id substituted into the action's URL template via `{id}`. */
  readonly rowId: string | null;
  /** Optional row context — passed through for custom renderers. */
  readonly row: Readonly<Record<string, unknown>> | null;
}

/**
 * Shape exposed by `<EntityActionDrawerHost>` / `<EntityActionModalHost>`
 * via context. The dispatcher calls `open()` when the matching
 * `EntityActionKind` fires; the host's UI reads `current` to know what
 * to render and calls `close()` when the user dismisses.
 */
export interface EntityActionOverlayContextValue {
  readonly current: EntityActionOverlayState | null;
  readonly open: (state: EntityActionOverlayState) => void;
  readonly close: () => void;
}

export const EntityActionDrawerContext =
  createContext<EntityActionOverlayContextValue | null>(null);

export const EntityActionModalContext =
  createContext<EntityActionOverlayContextValue | null>(null);

/**
 * Read the drawer host's context inside an app component (typically
 * the host's actual drawer UI). Throws when the component tree is not
 * wrapped in `<EntityActionDrawerHost>` — apps that don't surface a
 * drawer simply don't mount the host, and the dispatcher falls back to
 * a `console.warn` for `OpenDrawer` actions instead.
 */
export function useEntityActionDrawer(): EntityActionOverlayContextValue {
  const ctx = useContext(EntityActionDrawerContext);
  if (!ctx) {
    throw new Error(
      'useEntityActionDrawer must be used within <EntityActionDrawerHost>'
    );
  }
  return ctx;
}

/**
 * Symmetric counterpart of {@link useEntityActionDrawer} for the
 * modal host.
 */
export function useEntityActionModal(): EntityActionOverlayContextValue {
  const ctx = useContext(EntityActionModalContext);
  if (!ctx) {
    throw new Error(
      'useEntityActionModal must be used within <EntityActionModalHost>'
    );
  }
  return ctx;
}
