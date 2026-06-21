import { render } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import i18next from 'i18next';
import { I18nextProvider, initReactI18next } from 'react-i18next';

import { settingsTranslationsEn } from '../locales';

import type { ReactElement, ReactNode } from 'react';

// Local UI render helper. The settings tests stub the data layer (vi.mock
// @granit/react-settings in-workspace), so only i18n is needed: the package's
// own flat bundle plus the few app-global Common.* keys the panel renders
// (Save/Reset/Saving). No router/client/QueryClient required.
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
        ...settingsTranslationsEn,
        'Common.Save': 'Save',
        'Common.Reset': 'Reset',
        'Common.Saving': 'Saving',
      },
    },
  },
  interpolation: { escapeValue: false },
});

export function renderSettings(ui: ReactElement) {
  return {
    ...render(ui, {
      wrapper: ({ children }: { readonly children: ReactNode }) => (
        <I18nextProvider i18n={testI18n}>{children}</I18nextProvider>
      ),
    }),
    user: userEvent.setup(),
  };
}
