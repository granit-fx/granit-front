import { createStorage } from '@granit/storage';

import { LOCALE_STORAGE_KEY } from './constants.js';

import type { LanguageInfo } from './types/index.js';

/**
 * Resolve the initial locale before backend data is available.
 *
 * Detection cascade:
 * 1. Read `dd:locale` from localStorage → if present, return it
 * 2. `userLocale` from user settings (backend) → if provided, return it
 * 3. Read `navigator.language` → try exact match (e.g. "pt-BR"), then base code (e.g. "pt")
 * 4. If `languages` provided → return the one with `isDefault === true`
 * 5. Fallback → `'fr'`
 *
 * This function is called **before** the first backend fetch. It returns
 * the locale to use for `GET /api/v1/localization?cultureName=...`.
 */
export function resolveInitialLocale(
  languages?: LanguageInfo[],
  storageKey?: string,
  userLocale?: string | null
): string {
  const storage = createStorage<string>(storageKey ?? LOCALE_STORAGE_KEY);

  // 1. localStorage (explicit user choice in this browser)
  const stored = storage.get();
  if (stored) return stored;

  // 2. User setting from backend (persisted on account)
  if (userLocale) return userLocale;

  // 3. navigator.language — try exact match first (e.g. "pt-BR"), then base code (e.g. "pt")
  if (typeof navigator !== 'undefined' && navigator.language) {
    const fullLocale = navigator.language;
    const baseLocale = fullLocale.split('-')[0]!;

    if (!languages) {
      return fullLocale;
    }

    if (languages.some((l) => l.cultureName === fullLocale)) {
      return fullLocale;
    }

    if (languages.some((l) => l.cultureName === baseLocale)) {
      return baseLocale;
    }
  }

  // 4. isDefault from backend languages
  if (languages) {
    const defaultLang = languages.find((l) => l.isDefault);
    if (defaultLang) return defaultLang.cultureName;
  }

  // 5. Fallback
  return 'fr';
}
