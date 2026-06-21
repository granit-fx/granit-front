import { createReactLocalization } from '@granit/react-localization';

/**
 * Minimal i18n instance for Storybook. `createReactLocalization` registers it as
 * the default react-i18next instance (via `initReactI18next`), so package
 * components calling `useTranslation()` resolve against it without each story
 * mounting its own provider.
 *
 * Keys are flat literals with both separators disabled — mirroring how consuming
 * apps configure i18next so a missing key renders the raw key rather than
 * traversing a nested object. Package-shipped bundles can be registered here as
 * they land (e.g. `i18n.addResourceBundle('en', 'auditing', auditingTranslationsEn)`).
 */
export const i18n = createReactLocalization();

i18n.options.nsSeparator = false;
i18n.options.keySeparator = false;
i18n.options.fallbackLng = ['en'];

i18n.addResourceBundle('en', 'translation', {}, true, true);

void i18n.changeLanguage('en');
