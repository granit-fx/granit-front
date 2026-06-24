/**
 * Thin localStorage helpers used by the document-bookmark and view-preference
 * hooks. These are SSR-safe: all reads return null when localStorage is absent.
 */

export function readJsonFromStorage<T>(key: string): T | null {
  if (globalThis.localStorage === undefined) return null;
  try {
    const raw = globalThis.localStorage.getItem(key);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as T;
    return parsed && typeof parsed === 'object' ? parsed : null;
  } catch {
    return null;
  }
}

export function writeJsonToStorage<T>(key: string, value: T): void {
  if (globalThis.localStorage === undefined) return;
  try {
    globalThis.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // quota exceeded or storage disabled — silently ignore
  }
}
