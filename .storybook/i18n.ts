import { createReactLocalization } from '@granit/react-localization';

/**
 * Minimal i18n instance for Storybook. `createReactLocalization` registers it as
 * the default react-i18next instance (via `initReactI18next`), so package
 * components calling `useTranslation()` resolve against it without each story
 * mounting its own provider.
 *
 * Keys are flat literals with both separators disabled — mirroring how consuming
 * apps configure i18next so a missing key renders the raw key rather than
 * traversing a nested object.
 */
export const i18n = createReactLocalization();

i18n.options.nsSeparator = false;
i18n.options.keySeparator = false;
i18n.options.fallbackLng = ['en'];
i18n.addResourceBundle('en', 'translation', {}, true, true);

/**
 * Auto-register every UI package's flat translation bundle — no per-module list
 * to maintain. The backfill convention is that each `@granit/react-ui-*` package
 * ships `src/locales/index.ts` exporting `<module>TranslationsEn` /
 * `<module>TranslationsFr` (flat keys, "translation" ns). Vite's `import.meta.glob`
 * discovers them at build time; we register every matching export.
 */
const localeModules = import.meta.glob('../packages/@granit/react-ui-*/src/locales/index.ts', {
  eager: true,
}) as Record<string, Record<string, unknown>>;

for (const mod of Object.values(localeModules)) {
  for (const [exportName, bundle] of Object.entries(mod)) {
    if (!bundle || typeof bundle !== 'object') continue;
    const lng = /TranslationsEn$/.test(exportName)
      ? 'en'
      : /TranslationsFr$/.test(exportName)
        ? 'fr'
        : null;
    if (lng) i18n.addResourceBundle(lng, 'translation', bundle, true, true);
  }
}

void i18n.changeLanguage('en');
