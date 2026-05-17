import { createInstance } from 'i18next';

import type { LocalizationConfig } from './types/index.js';
import type { i18n } from 'i18next';

/**
 * Create an isolated i18next instance with Digital Dynamics defaults.
 *
 * Uses `createInstance()` instead of the global singleton to avoid
 * side effects at module import time.
 *
 * The instance is initialized **without** a `lng` option — the initial
 * locale is resolved by `resolveInitialLocale()` and applied later via
 * `applyTranslations()` once the backend responds.
 *
 * Plugins (e.g. `initReactI18next`) can be injected via `config.plugins`.
 *
 * @example
 * ```typescript
 * // Pure i18next (no React)
 * import { createLocalization } from '@granit/localization';
 * export const i18n = createLocalization();
 *
 * // With React integration
 * import { createLocalization } from '@granit/localization';
 * import { initReactI18next } from 'react-i18next';
 * export const i18n = createLocalization({ plugins: [initReactI18next] });
 * ```
 */
export function createLocalization(config?: LocalizationConfig): i18n {
  const instance = createInstance();

  for (const plugin of config?.plugins ?? []) {
    instance.use(plugin);
  }

  instance
    .init({
      defaultNS: config?.defaultNS ?? 'translation',
      interpolation: {
        escapeValue: false,
      },
      // react-i18next v16 defaults bindI18nStore to '' — useTranslation hooks
      // no longer re-render when addResourceBundle fires 'added' events.
      // We load translations asynchronously via applyTranslations (addResourceBundle),
      // so hooks must listen for store changes to pick up the new resources.
      react: {
        bindI18nStore: 'added removed',
      },
      resources: {},
    })
    .catch(() => undefined);

  return instance;
}
