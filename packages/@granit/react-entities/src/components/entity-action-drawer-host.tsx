import { useCallback, useMemo, useState, type ReactNode } from 'react';

import {
  EntityActionDrawerContext,
  type EntityActionOverlayContextValue,
  type EntityActionOverlayState,
} from '../actions/entity-action-overlay-context';

export interface EntityActionDrawerHostProps {
  readonly children: ReactNode;
}

/**
 * Mounts the side-drawer overlay context for `OpenDrawer` actions.
 * The provider stores which action is currently driving the drawer
 * (or `null` when none); the dispatcher calls `open()` when an
 * `EntityActionKind === 'OpenDrawer'` action fires, and the host's
 * actual UI (Radix Dialog, shadcn Sheet, custom drawer …) reads
 * `useEntityActionDrawer()` to know what to render.
 *
 * Per the wire contract, the drawer body depends on
 * `action.urlTemplate`:
 *
 * - **`urlTemplate === null`** — render the entity's
 *   `details["default"]` for the row (typical inline-detail flow).
 *   Apps mount `<EntityDetail variant="default" entityId={rowId} />`
 *   inside their drawer when this branch is active.
 * - **`urlTemplate !== null`** — fetch the URL (with `{id}` substituted
 *   from `rowId`) and render the response in the drawer (wizards,
 *   custom server-rendered overlays). Apps' drawer bodies handle the
 *   fetch + rendering via the URL surfaced through context.
 *
 * Mount once at the top of the tree (typically alongside
 * `<EntityActionModalHost>`); the framework supports a single drawer
 * at a time — stacked side-peeks belong to a follow-up Story.
 */
export function EntityActionDrawerHost({ children }: EntityActionDrawerHostProps): ReactNode {
  const [current, setCurrent] = useState<EntityActionOverlayState | null>(null);
  const open = useCallback((state: EntityActionOverlayState) => setCurrent(state), []);
  const close = useCallback(() => setCurrent(null), []);
  const value = useMemo<EntityActionOverlayContextValue>(
    () => ({ current, open, close }),
    [current, open, close]
  );
  return (
    <EntityActionDrawerContext.Provider value={value}>
      {children}
    </EntityActionDrawerContext.Provider>
  );
}
