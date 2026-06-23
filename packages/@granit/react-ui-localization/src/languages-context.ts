import { createContext, useContext } from 'react';

import type { LanguageInfo } from '@granit/localization';

/**
 * Holds the list of languages available in the application, populated by the
 * host from `GET /localization` (`ApplicationLocalizationResponse.languages`).
 * The host renders `<LanguagesContext.Provider value={languages}>` around the
 * localization pages; the package reads it via {@link useLanguages}.
 */
export const LanguagesContext = createContext<LanguageInfo[]>([]);

/** Access the list of available languages from the backend. */
export function useLanguages(): LanguageInfo[] {
  return useContext(LanguagesContext);
}
