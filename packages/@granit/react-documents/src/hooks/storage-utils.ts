/**
 * Thin localStorage helpers used by the document-bookmark and view-preference
 * hooks. These are SSR-safe: all reads return null when localStorage is absent.
 */

import { logger } from '../logger';

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
  } catch (err) {
    // Quota exceeded or storage disabled — the preference is simply not
    // persisted; the app keeps working with the in-memory value.
    logger.warn('Failed to persist value to localStorage', { key, err });
  }
}
