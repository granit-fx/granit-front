import { useCallback, useEffect, useRef, useState } from 'react';

export interface MultiSelectApi {
  readonly selected: ReadonlySet<string>;
  readonly isSelected: (id: string) => boolean;
  readonly toggle: (id: string) => void;
  readonly select: (id: string) => void;
  readonly selectRange: (id: string) => void;
  readonly selectOnly: (id: string) => void;
  readonly selectAll: (ids: readonly string[]) => void;
  readonly clear: () => void;
  readonly remove: (ids: readonly string[]) => void;
}

/**
 * Selection state with anchor-based range support (shift-click). Range is
 * computed against `orderedIds`, so callers must keep this list in the same
 * order the rows are rendered.
 */
export function useMultiSelect(orderedIds: readonly string[]): MultiSelectApi {
  const [selected, setSelected] = useState<ReadonlySet<string>>(() => new Set());
  const anchorRef = useRef<string | null>(null);
  const orderRef = useRef<readonly string[]>(orderedIds);

  // Keep the latest ordered list in a ref so range selection always picks
  // the row order at click-time, not at hook-init time.
  useEffect(() => {
    orderRef.current = orderedIds;
  }, [orderedIds]);

  // Drop ids that have left the listing (page change, trash, folder switch).
  useEffect(() => {
    setSelected((prev) => {
      const valid = new Set<string>();
      for (const id of prev) if (orderedIds.includes(id)) valid.add(id);
      return valid.size === prev.size ? prev : valid;
    });
  }, [orderedIds]);

  const isSelected = useCallback((id: string) => selected.has(id), [selected]);

  const toggle = useCallback((id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
    anchorRef.current = id;
  }, []);

  const select = useCallback((id: string) => {
    setSelected((prev) => {
      if (prev.has(id)) return prev;
      const next = new Set(prev);
      next.add(id);
      return next;
    });
    anchorRef.current = id;
  }, []);

  const selectOnly = useCallback((id: string) => {
    setSelected(new Set([id]));
    anchorRef.current = id;
  }, []);

  const selectRange = useCallback((id: string) => {
    const order = orderRef.current;
    const anchor = anchorRef.current;
    if (!anchor || !order.includes(anchor)) {
      setSelected(new Set([id]));
      anchorRef.current = id;
      return;
    }
    const from = order.indexOf(anchor);
    const to = order.indexOf(id);
    if (to === -1) return;
    const [start, end] = from <= to ? [from, to] : [to, from];
    const range = order.slice(start, end + 1);
    setSelected(new Set(range));
  }, []);

  const selectAll = useCallback((ids: readonly string[]) => {
    setSelected(new Set(ids));
    anchorRef.current = ids.at(-1) ?? null;
  }, []);

  const clear = useCallback(() => {
    setSelected(new Set());
    anchorRef.current = null;
  }, []);

  const remove = useCallback((ids: readonly string[]) => {
    setSelected((prev) => {
      const next = new Set(prev);
      for (const id of ids) next.delete(id);
      return next;
    });
  }, []);

  return {
    selected,
    isSelected,
    toggle,
    select,
    selectRange,
    selectOnly,
    selectAll,
    clear,
    remove,
  };
}
