import i18next from 'i18next';
import { initReactI18next } from 'react-i18next';

import { documentsAdminTranslationsEn } from './locales';

// Shared i18next instance for Storybook stories. Mirrors the runtime flat-key
// setup (separators disabled) and bundles this package's flat `documents:*` map
// alongside the host-owned Common.* keys these components reference.
//
// The page components only ever call `t('documents:…')` (resolved verbatim from
// the admin bundle below) and `t('taxonomy:…', '<fallback>')` (no taxonomy
// bundle is registered, so those resolve to their inline fallback string).
// None of the eight pages reference a `Common.*` key, so the block stays empty —
// it is kept to mirror the api-keys template and document that fact.
const Common = {} as const;

export const storyI18n = i18next.createInstance();
await storyI18n.use(initReactI18next).init({
  lng: 'en',
  fallbackLng: 'en',
  ns: ['translation'],
  defaultNS: 'translation',
  nsSeparator: false,
  keySeparator: false,
  resources: { en: { translation: { ...documentsAdminTranslationsEn, ...Common } } },
  interpolation: { escapeValue: false },
});
