import { LOCALE_STORAGE_KEY } from '@granit/localization';
import { createStorage } from '@granit/storage';
import { useCallback, useMemo } from 'react';
import { useTranslation } from 'react-i18next';

import { logger } from './logger';

export interface UseLocaleOptions {
  /** Called after locale is changed — use to persist to backend (e.g. settings API). */
  onLocaleChange?: (locale: string) => void;
}

/**
 * Hook for locale management (language switchers).
 *
 * Returns the current locale and a setter that persists to localStorage,
 * updates the i18next language, and optionally calls `onLocaleChange`.
 *
 * @example
 * ```tsx
 * const { update } = useUpdateSetting('user');
 *
 * function LanguageSwitcher() {
 *   const { locale, setLocale } = useLocale({
 *     onLocaleChange: (l) => update(SETTING_NAMES.PREFERRED_CULTURE, l),
 *   });
 *   return <button onClick={() => setLocale('en')}>{locale}</button>;
 * }
 * ```
 */
export function useLocale(options?: UseLocaleOptions): {
  locale: string;
  setLocale: (locale: string) => void;
} {
  const { i18n } = useTranslation();
  const storage = useMemo(() => createStorage<string>(LOCALE_STORAGE_KEY), []);
  const onLocaleChange = options?.onLocaleChange;

  const setLocale = useCallback(
    (nextLocale: string) => {
      storage.set(nextLocale);
      i18n.changeLanguage(nextLocale).catch((err: unknown) => {
        logger.warn('Failed to change i18next language', { locale: nextLocale, err });
      });
      onLocaleChange?.(nextLocale);
    },
    [i18n, storage, onLocaleChange]
  );

  return {
    locale: i18n.language ?? 'fr',
    setLocale,
  };
}
