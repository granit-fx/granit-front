import { render } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import i18next from 'i18next';
import { I18nextProvider, initReactI18next } from 'react-i18next';

import { errorBoundaryTranslationsEn } from '../locales';

import type { ReactElement, ReactNode } from 'react';

// Local render helper: the error pages only need the package's own flat
// Errors.* bundle in context (the host registers them with separators
// disabled, so dotted keys are looked up verbatim). Router-dependent cases
// build their own MemoryRouter; this just supplies i18n.
const testI18n = i18next.createInstance();
void testI18n.use(initReactI18next).init({
  lng: 'en',
  fallbackLng: 'en',
  ns: ['translation'],
  defaultNS: 'translation',
  nsSeparator: false,
  keySeparator: false,
  resources: {
    en: { translation: { ...errorBoundaryTranslationsEn } },
  },
  interpolation: { escapeValue: false },
});

export { testI18n };

export function renderWithI18n(ui: ReactElement) {
  return {
    ...render(ui, {
      wrapper: ({ children }: { readonly children: ReactNode }) => (
        <I18nextProvider i18n={testI18n}>{children}</I18nextProvider>
      ),
    }),
    user: userEvent.setup({ delay: null }),
  };
}
