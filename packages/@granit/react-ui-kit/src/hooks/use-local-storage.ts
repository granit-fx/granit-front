import { useCallback, useEffect, useState } from 'react';

import { logger } from '../logger';

/**
 * Persists a value in localStorage under `key` and keeps it in sync across
 * tabs via the `storage` event.  Falls back to `defaultValue` when running
 * outside a browser (SSR/Node) or when the key has never been written.
 */
export function useLocalStorage<T>(
  key: string,
  defaultValue: T
): [T, (value: T | ((prev: T) => T)) => void] {
  const [storedValue, setStoredValue] = useState<T>(() => {
    if (globalThis.localStorage === undefined) return defaultValue;
    try {
      const raw = globalThis.localStorage.getItem(key);
      return raw === null ? defaultValue : (JSON.parse(raw) as T);
    } catch {
      return defaultValue;
    }
  });

  // Keep in sync when another tab writes the same key.
  useEffect(() => {
    const handler = (event: StorageEvent) => {
      if (event.key !== key) return;
      if (event.newValue === null) {
        setStoredValue(defaultValue);
      } else {
        try {
          setStoredValue(JSON.parse(event.newValue) as T);
        } catch {
          setStoredValue(defaultValue);
        }
      }
    };
    globalThis.addEventListener?.('storage', handler);
    return () => globalThis.removeEventListener?.('storage', handler);
  }, [key, defaultValue]);

  const setValue = useCallback(
    (value: T | ((prev: T) => T)) => {
      setStoredValue((prev) => {
        const next = typeof value === 'function' ? (value as (prev: T) => T)(prev) : value;
        if (globalThis.localStorage !== undefined) {
          try {
            globalThis.localStorage.setItem(key, JSON.stringify(next));
          } catch (err) {
            // Quota exceeded or storage disabled — keep the in-memory value;
            // persistence is best-effort and must not break the UI.
            logger.warn('Failed to persist value to localStorage', { key, err });
          }
        }
        return next;
      });
    },
    [key]
  );

  return [storedValue, setValue];
}
