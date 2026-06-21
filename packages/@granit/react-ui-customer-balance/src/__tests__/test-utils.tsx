import { render } from '@testing-library/react';
import i18next from 'i18next';
import { I18nextProvider, initReactI18next } from 'react-i18next';

import { customerBalanceTranslationsEn } from '../locales';

import type { ReactElement, ReactNode } from 'react';

// Local UI render helper. The page test stubs the data layer (vi.mock
// @granit/react-customer-balance in-workspace), so only i18n is needed: the
// package's own flat bundle plus the few app-global Common.* keys the page
// renders. No router/client/QueryClient required.
const testI18n = i18next.createInstance();
void testI18n.use(initReactI18next).init({
  lng: 'en',
  fallbackLng: 'en',
  ns: ['translation'],
  defaultNS: 'translation',
  nsSeparator: false,
  keySeparator: false,
  resources: {
    en: {
      translation: {
        ...customerBalanceTranslationsEn,
        'Common.NoResults': 'No results found',
        'Common.Previous': 'Previous',
        'Common.Next': 'Next',
        'Common.Page': 'Page',
      },
    },
  },
  interpolation: { escapeValue: false },
});

export function renderCustomerBalance(ui: ReactElement) {
  return render(ui, {
    wrapper: ({ children }: { readonly children: ReactNode }) => (
      <I18nextProvider i18n={testI18n}>{children}</I18nextProvider>
    ),
  });
}
