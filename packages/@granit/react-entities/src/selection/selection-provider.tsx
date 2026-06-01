import { useCallback, useMemo, useState, type ReactNode } from 'react';

import { SelectionContext, type SelectionContextValue } from './selection-context';

export interface SelectionProviderProps {
  readonly children: ReactNode;
  /**
   * Optional initial selection — typically empty. Useful for tests and
   * for restoring state after a route change.
   */
  readonly initialSelectedIds?: Iterable<string>;
}

/**
 * Provides per-list row-selection state to `<EntitySelectionBar>` and
 * any custom row-level checkbox the host wires up. Mount once per
 * list scope (typically alongside `<QueryEndpointStateProvider>`);
 * mounting it deeper resets the selection on remount.
 *
 * The provider is intentionally minimal — toggle / replace / clear,
 * no master "select-all matching filter" mode yet (reserved on the
 * context shape; lands once the bulk-on-large-set Story is scheduled).
 *
 * ```tsx
 * <SelectionProvider>
 *   <QueryEndpointStateProvider initialParams={…}>
 *     <EntityList … />
 *     <EntitySelectionBar manifest={manifest} onComplete={…} />
 *   </QueryEndpointStateProvider>
 * </SelectionProvider>
 * ```
 */
export function SelectionProvider({
  children,
  initialSelectedIds,
}: SelectionProviderProps): ReactNode {
  const [selectedIds, setSelectedIds] = useState<ReadonlySet<string>>(
    () => new Set(initialSelectedIds ?? [])
  );

  const toggle = useCallback((id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }, []);

  const setSelected = useCallback((ids: Iterable<string>) => {
    setSelectedIds(new Set(ids));
  }, []);

  const clear = useCallback(() => {
    setSelectedIds(new Set());
  }, []);

  const value = useMemo<SelectionContextValue>(
    () => ({
      selectedIds,
      mode: 'explicit',
      size: selectedIds.size,
      toggle,
      setSelected,
      clear,
    }),
    [selectedIds, toggle, setSelected, clear]
  );

  return <SelectionContext.Provider value={value}>{children}</SelectionContext.Provider>;
}
