import type { ApplicationLocalizationDto } from './types/index.js';
import type { i18n } from 'i18next';

/**
 * Apply backend localization response to the i18next instance.
 *
 * The backend returns resources grouped by module (e.g. `{ "Granit": {...}, "Guava": {...} }`).
 * This function merges all modules into the single `translation` namespace
 * expected by i18next, then switches the active language if needed.
 *
 * @example
 * ```typescript
 * const { data } = useGetLocalization({ cultureName: locale });
 * useEffect(() => {
 *   if (data) applyTranslations(i18n, data);
 * }, [data]);
 * ```
 */
export function applyTranslations(instance: i18n, data: ApplicationLocalizationDto): void {
  if (!data.resources) return;

  const merged: Record<string, string> = {};
  for (const translations of Object.values(data.resources)) {
    Object.assign(merged, translations);
  }

  instance.addResourceBundle(data.cultureName, 'translation', merged, true, true);

  if (instance.language !== data.cultureName) {
    instance.changeLanguage(data.cultureName).catch(() => undefined);
  }
}
