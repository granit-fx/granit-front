import i18next from 'i18next';
import { initReactI18next } from 'react-i18next';

import { iotTranslationsEn } from './locales';

// Shared i18next instance for Storybook stories. Mirrors the runtime flat-key
// setup (separators disabled) and bundles the host-owned Common.* keys these
// components reference alongside the package's own IoT.* bundle.
const Common = {
  'Common.Back': 'Back',
  'Common.Cancel': 'Cancel',
  'Common.Save': 'Save',
  'Common.SearchPlaceholder': 'Search or filter...',
  'Validation:Builtin:NotEmpty': "'{{PropertyName}}' must not be empty.",
} as const;

export const storyI18n = i18next.createInstance();
await storyI18n.use(initReactI18next).init({
  lng: 'en',
  fallbackLng: 'en',
  ns: ['translation'],
  defaultNS: 'translation',
  nsSeparator: false,
  keySeparator: false,
  resources: { en: { translation: { ...iotTranslationsEn, ...Common } } },
  interpolation: { escapeValue: false },
});
