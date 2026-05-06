import { useCallback, useMemo, useState, type ReactNode } from 'react';

import {
  EntityActionModalContext,
  type EntityActionOverlayContextValue,
  type EntityActionOverlayState,
} from '../actions/entity-action-overlay-context.js';

export interface EntityActionModalHostProps {
  readonly children: ReactNode;
}

/**
 * Mounts the modal overlay context for `OpenModal` actions. Symmetric
 * counterpart of {@link EntityActionDrawerHost} for the form-style
 * surface.
 *
 * Per the wire contract, the modal body depends on
 * `action.urlTemplate`:
 *
 * - **`urlTemplate === null`** — render the entity's `forms["default"]`
 *   for the row (inline-edit flow). Apps mount
 *   `<EntityForm variant="default" entityId={rowId} />` inside their
 *   modal when this branch is active.
 * - **`urlTemplate !== null`** — fetch the URL (with `{id}` substituted
 *   from `rowId`) and render the response in the modal (Import /
 *   Export wizards, custom server-rendered overlays).
 *
 * The selection-bar's bulk actions also dispatch through this host —
 * fan-out targets either an `ApiCall` or an `OpenModal` per action;
 * the modal variant pre-fills the dialog with `?ids=…` so the body
 * can act on every selected row in one go.
 */
export function EntityActionModalHost({ children }: EntityActionModalHostProps): ReactNode {
  const [current, setCurrent] = useState<EntityActionOverlayState | null>(null);
  const open = useCallback((state: EntityActionOverlayState) => setCurrent(state), []);
  const close = useCallback(() => setCurrent(null), []);
  const value = useMemo<EntityActionOverlayContextValue>(
    () => ({ current, open, close }),
    [current, open, close]
  );
  return (
    <EntityActionModalContext.Provider value={value}>
      {children}
    </EntityActionModalContext.Provider>
  );
}
