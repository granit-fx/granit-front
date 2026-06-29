'use client';

import { useEffect, useState } from 'react';

/**
 * Returns a debounced copy of `value` that only updates after `delayMs` have
 * elapsed without a change. The initial value is returned synchronously (no
 * artificial delay on mount), so only subsequent updates are coalesced.
 *
 * Used by {@link useAddressSuggestions} to throttle the typeahead term before it
 * reaches the (shared, rate-limited) geocoding provider.
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
