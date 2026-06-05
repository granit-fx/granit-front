'use client';

import { useEffect, useState } from 'react';

/**
 * Returns a debounced copy of `value` that only updates after `delayMs` have
 * elapsed without a change. The initial value is returned synchronously (no
 * artificial delay on mount), so the first lookup fires immediately and only
 * subsequent keystrokes are coalesced.
 *
 * Used by {@link useLookup} to throttle the typeahead `search` term before it
 * reaches the network (~250–300 ms is the recommended range).
 */
export function useDebouncedValue<T>(value: T, delayMs: number): T {
  const [debounced, setDebounced] = useState<T>(value);

  useEffect(() => {
    if (delayMs <= 0) {
      setDebounced(value);
      return;
    }
    const timer = setTimeout(() => setDebounced(value), delayMs);
    return () => clearTimeout(timer);
  }, [value, delayMs]);

  return debounced;
}
