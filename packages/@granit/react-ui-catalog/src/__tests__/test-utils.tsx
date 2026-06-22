import { render } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import i18next from 'i18next';
import { I18nextProvider, initReactI18next } from 'react-i18next';
import { MemoryRouter } from 'react-router-dom';

import { catalogTranslationsEn } from '../locales';

import type { ReactElement, ReactNode } from 'react';

// Local UI render helper. The page/component tests stub the data layer (vi.mock
// @granit/react-catalog in-workspace), so only i18n and a router are needed.
// The package's bundle owns the `Catalog.*` keys; the host normally supplies the
// shared `Common.*` / `Operators.*` keys, so the few used here are inlined.
const COMMON_TRANSLATIONS = {
  'Common.Cancel': 'Cancel',
  'Common.Create': 'Create',
  'Common.Edit': 'Edit',
  'Common.No': 'No',
  'Common.NotSet': 'Not set',
  'Common.Save': 'Save',
  'Common.SearchPlaceholder': 'Search or filter...',
  'Common.Yes': 'Yes',
  'Operators.Between': 'between',
  'Operators.Contains': 'contains',
  'Operators.EndsWith': 'ends with',
  'Operators.Eq': 'equals',
  'Operators.Gt': 'greater than',
  'Operators.Gte': 'greater or equal',
  'Operators.In': 'in',
  'Operators.Lt': 'less than',
  'Operators.Lte': 'less or equal',
  'Operators.StartsWith': 'starts with',
} as const;

export const testI18n = i18next.createInstance();
void testI18n.use(initReactI18next).init({
  lng: 'en',
  fallbackLng: 'en',
  ns: ['translation'],
  defaultNS: 'translation',
  nsSeparator: false,
  keySeparator: false,
  resources: {
    en: { translation: { ...catalogTranslationsEn, ...COMMON_TRANSLATIONS } },
  },
  interpolation: { escapeValue: false },
});

export function renderWithProviders(ui: ReactElement, { route = '/' }: { route?: string } = {}) {
  return {
    ...render(ui, {
      wrapper: ({ children }: { readonly children: ReactNode }) => (
        <I18nextProvider i18n={testI18n}>
          <MemoryRouter initialEntries={[route]}>{children}</MemoryRouter>
        </I18nextProvider>
      ),
    }),
    user: userEvent.setup(),
  };
}
