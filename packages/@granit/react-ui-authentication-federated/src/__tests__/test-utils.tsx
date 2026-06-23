import i18next from 'i18next';
import { initReactI18next } from 'react-i18next';

import { authFederatedTranslationsEn } from '../locales';

export const testI18n = i18next.createInstance();
void testI18n.use(initReactI18next).init({
  lng: 'en',
  fallbackLng: 'en',
  ns: ['translation'],
  defaultNS: 'translation',
  nsSeparator: false,
  keySeparator: false,
  resources: { en: { translation: { ...authFederatedTranslationsEn } } },
  interpolation: { escapeValue: false },
});
