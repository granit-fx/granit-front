import { createContext, useContext } from 'react';

/**
 * Selection state exposed by `<SelectionProvider>` and consumed by
 * `<EntitySelectionBar>` (and any custom row-level checkbox the host
 * wires up).
 *
 * Mode 1 ('explicit') is the only mode shipped today — `selectedIds`
 * carries every id the user has individually toggled. Mode 2
 * ('all-matching-filter') is reserved for the bulk-on-large-result-set
 * case and lands in a follow-up Story; the field is exposed in the
 * shape today so host-side checkbox UIs can pre-emptively branch on
 * it without breaking on a future bump.
 */
export interface SelectionContextValue {
  readonly selectedIds: ReadonlySet<string>;
  /**
   * Mode 1 — `selectedIds` is the literal set of ids the user picked.
   * Mode 2 — `selectedIds` is the explicit *override* set under the
   * "all matching filter" bulk-mode (NOT YET SHIPPED — reserved).
   */
  readonly mode: 'explicit' | 'all-matching-filter';
  /** Number of selected rows. In `'all-matching-filter'` mode this returns the override-set size. */
  readonly size: number;
  /** Toggle a row's selection. */
  readonly toggle: (id: string) => void;
  /** Replace the selection set with the supplied ids. */
  readonly setSelected: (ids: Iterable<string>) => void;
  /** Clear every selected id. */
  readonly clear: () => void;
}

export const SelectionContext = createContext<SelectionContextValue | null>(null);

/**
 * Returns a no-op default when the consumer isn't wrapped in
 * `<SelectionProvider>` so renderers that read selection state for
 * an optional checkbox UI don't blow up in scenarios where selection
 * isn't wired (e.g. embedded list previews, drilldown drawers). The
 * `<EntitySelectionBar>` itself short-circuits to render `null` when
 * the size is 0, so the no-op default keeps it inert by design.
 */
const NO_OP_SELECTION: SelectionContextValue = Object.freeze({
  selectedIds: new Set<string>(),
  mode: 'explicit' as const,
  size: 0,
  toggle: () => undefined,
  setSelected: () => undefined,
  clear: () => undefined,
});

/**
 * Read the selection state from the nearest `<SelectionProvider>`.
 * Returns a no-op default outside the provider so renderers stay
 * safe to mount in embed scenarios where selection isn't wired.
 */
export function useSelection(): SelectionContextValue {
  return useContext(SelectionContext) ?? NO_OP_SELECTION;
}
