import i18next from 'i18next';
import { initReactI18next } from 'react-i18next';

import { aiPromptsAdminTranslationsEn } from '../locales';

// Shared i18next instance for Storybook stories. Mirrors the runtime flat-key
// setup (separators disabled) and bundles the package's own AiPrompts.* admin
// strings. The page references no Common.* keys (the host-owned Common.* block
// stays empty), so only the package bundle is registered here.
const Common = {} as const;

export const storyI18n = i18next.createInstance();
await storyI18n.use(initReactI18next).init({
  lng: 'en',
  fallbackLng: 'en',
  ns: ['translation'],
  defaultNS: 'translation',
  nsSeparator: false,
  keySeparator: false,
  resources: { en: { translation: { ...aiPromptsAdminTranslationsEn, ...Common } } },
  interpolation: { escapeValue: false },
});
