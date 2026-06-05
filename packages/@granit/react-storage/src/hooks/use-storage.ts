import { createStorage } from '@granit/storage';
import { useCallback, useMemo, useRef, useSyncExternalStore } from 'react';

import type { StorageOptions } from '@granit/storage';

/**
 * React hook that synchronizes component state with localStorage (or sessionStorage).
 *
 * Uses `useSyncExternalStore` for tear-free reads and automatic re-renders
 * when the stored value changes (including cross-tab via the `storage` event).
 *
 * @remarks `serialize` and `deserialize` options must be referentially stable
 * (defined outside the component or memoized). Changing them between renders
 * without also changing the `storage` type will have no effect.
 *
 * @example
 * ```tsx
 * function Sidebar() {
 *   const [open, setOpen] = useStorage('sidebar-open', false);
 *   return <nav data-open={open}>...</nav>;
 * }
 * ```
 */
export function useStorage<T>(
  key: string,
  defaultValue: T,
  options?: StorageOptions<T>
): [T, (value: T) => void] {
  const storage = useMemo(() => createStorage<T>(key, options), [key, options?.storage]);

  // Cache the raw string + parsed value to keep referential stability.
  // useSyncExternalStore requires getSnapshot to return the same reference
  // when the underlying data has not changed.
  // `undefined` is used as the initial sentinel: getItem() never returns undefined,
  // so the first call always populates the cache.
  const cacheRef = useRef<{ raw: string | null | undefined; value: T }>({
    raw: undefined,
    value: defaultValue,
  });

  const subscribe = useCallback(
    (onStoreChange: () => void) => {
      const handler = (e: StorageEvent) => {
        if (e.key === storage.key) onStoreChange();
      };
      globalThis.addEventListener('storage', handler);
      return () => globalThis.removeEventListener('storage', handler);
    },
    [storage.key]
  );

  const getSnapshot = useCallback((): T => {
    const backend = options?.storage === 'session' ? sessionStorage : localStorage;
    const raw = backend.getItem(storage.key);

    if (raw === cacheRef.current.raw) {
      return cacheRef.current.value;
    }

    const value = storage.get() ?? defaultValue;
    cacheRef.current = { raw, value };
    return value;
  }, [storage, defaultValue, options?.storage]);

  const value = useSyncExternalStore(subscribe, getSnapshot, () => defaultValue);

  const setValue = useCallback(
    (next: T) => {
      storage.set(next);
      globalThis.dispatchEvent(new StorageEvent('storage', { key: storage.key }));
    },
    [storage]
  );

  return [value, setValue];
}
